import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/dataClient";
import type { Session, User } from "@supabase/supabase-js";

interface UserProfile {
  user_id: string; // Mantido para referência
  full_name: string | null;
  role: string; // obtido via app_metadata/RPC
  panels: string[] | null; // retornado por get_my_profile
  is_active: boolean;
  filial_id: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add("bg-background", "text-foreground");

    const fetchSessionAndProfile = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const userRole = currentUser.app_metadata?.role || 'user';
        // Preenche imediatamente um perfil mínimo para evitar corrida no Protected
        setProfile({
          role: userRole,
          user_id: currentUser.id,
          full_name: currentUser.email,
          panels: [],
          is_active: true,
          filial_id: null,
        });
        const { data: profileData } = await supabase.rpc('get_my_profile').single();

        if (profileData?.filial_id && currentSession?.user?.user_metadata?.filial_id !== profileData.filial_id) {
          await supabase.auth.updateUser({ data: { filial_id: profileData.filial_id } });
        }

        if (profileData) {
          setProfile(prev => ({
            role: profileData.role || userRole,
            user_id: currentUser.id,
            full_name: prev?.full_name || currentUser.email,
            panels: (profileData.panels ?? []) as string[],
            is_active: (profileData.is_active ?? prev?.is_active ?? true) as boolean,
            filial_id: (profileData.filial_id ?? prev?.filial_id ?? null) as string | null,
          }));
        }

      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (newUser) {
        const userRole = newUser.app_metadata?.role || 'user';
        // Preenche imediatamente o perfil mínimo
        setProfile({
          role: userRole,
          user_id: newUser.id,
          full_name: newUser.email,
          panels: [],
          is_active: true,
          filial_id: null,
        });

        setLoading(true);
        try {
          const { data: profileData } = await supabase.rpc('get_my_profile').single();

          if (profileData?.filial_id && newUser.user_metadata?.filial_id !== profileData.filial_id) {
            await supabase.auth.updateUser({ data: { filial_id: profileData.filial_id } });
          }

          if (profileData) {
            setProfile(prev => ({
              role: profileData.role || userRole,
              user_id: newUser.id,
              full_name: prev?.full_name || newUser.email,
              panels: (profileData.panels ?? []) as string[],
              is_active: (profileData.is_active ?? prev?.is_active ?? true) as boolean,
              filial_id: (profileData.filial_id ?? prev?.filial_id ?? null) as string | null,
            }));
          }
        } catch (error) {
          console.error('Error loading secondary auth data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, user, profile, loading }), [session, user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
