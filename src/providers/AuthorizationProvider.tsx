import { createContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthorizationProfile } from '@/types';
import { loadAuthorizationProfile } from './loadAuthorizationProfile';
export type { AuthorizationProfile } from '@/types';

interface AuthorizationState {
  profile: AuthorizationProfile | null;
  loading: boolean;
}

export const AuthorizationContext = createContext<AuthorizationState>({ profile: null, loading: true });

export function AuthorizationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<AuthorizationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (authLoading || !user) {
        setProfile(null);
        setLoading(authLoading);
        return;
      }
      setLoading(true);
      try {
        const data = await loadAuthorizationProfile(user.id, controller.signal);
        if (data) {
          setProfile({
            role: data.role ?? user.app_metadata?.role ?? 'user',
            panels: Array.isArray(data.panels) ? data.panels : [],
            filial_id: data.filial_id ?? null,
          });
        } else {
          setProfile({
            role: user.app_metadata?.role || 'user',
            panels: [],
            filial_id: null,
          });
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Erro inesperado ao obter perfil:', err);
          setProfile({
            role: user.app_metadata?.role || 'user',
            panels: [],
            filial_id: null,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [user, authLoading]);

  const value = useMemo(() => ({ profile, loading }), [profile, loading]);
  return <AuthorizationContext.Provider value={value}>{children}</AuthorizationContext.Provider>;
}
