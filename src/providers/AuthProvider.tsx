import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/dataClient";

interface UserProfile {
  user_id: string; // Mantido para referência, mas o role virá do app_metadata
  full_name: string | null;
  role: string; // Este virá do app_metadata e será adicionado ao perfil
  panels: string[] | null; // permitido pela filial (via RPC get_my_allowed_panels)
  is_active: boolean;
  filial_id: string | null;
}

interface AuthState {
  session: any | null;
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
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
        // Busca dados secundários e atualiza (sem alterar o role)
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, panels, is_active, filial_id')
          .eq('user_id', currentUser.id)
          .single();
        // Busca os painéis permitidos pela filial (via RPC segura)
        const { data: allowedPanelsData } = await supabase.rpc('get_my_allowed_panels');

        if (profileData || allowedPanelsData) {
          setProfile(prev => ({
            role: userRole,
            user_id: profileData?.user_id || currentUser.id,
            full_name: profileData?.full_name || prev?.full_name || currentUser.email,
            panels: (allowedPanelsData as string[] | null) ?? profileData?.panels ?? prev?.panels ?? [],
            is_active: (profileData?.is_active ?? prev?.is_active ?? true) as boolean,
            filial_id: (profileData?.filial_id ?? prev?.filial_id ?? null) as string | null,
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
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, panels, is_active, filial_id')
            .eq('user_id', newUser.id)
            .single();

          const { data: allowedPanelsData } = await supabase.rpc('get_my_allowed_panels');

          if (profileData || allowedPanelsData) {
            setProfile(prev => ({
              role: userRole,
              user_id: profileData?.user_id || newUser.id,
              full_name: profileData?.full_name || prev?.full_name || newUser.email,
              panels: (allowedPanelsData as string[] | null) ?? profileData?.panels ?? prev?.panels ?? [],
              is_active: (profileData?.is_active ?? prev?.is_active ?? true) as boolean,
              filial_id: (profileData?.filial_id ?? prev?.filial_id ?? null) as string | null,
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
