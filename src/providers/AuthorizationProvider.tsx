import { createContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/dataClient';
import { useAuth } from '@/hooks/useAuth';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { AuthorizationProfile } from '@/types';
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
    const load = async () => {
      if (authLoading || !user) {
        setProfile(null);
        setLoading(authLoading);
        return;
      }
      setLoading(true);
      try {
        let data: AuthorizationProfile | null = null;

        // Primeiro tenta via RPC que ignora RLS
        try {
          const res: PostgrestSingleResponse<AuthorizationProfile> = await supabase
            .rpc('get_my_profile')
            .maybeSingle();
          data = res.data;
          if (res.error) {
            console.error('Erro ao chamar get_my_profile:', res.error);
          }
        } catch (rpcErr) {
          console.error('Erro ao chamar get_my_profile:', rpcErr);
        }

        // Se a RPC falhar ou não retornar dados, busca direto na tabela
        if (!data) {
          const { data: fallback, error: fbErr }: PostgrestSingleResponse<AuthorizationProfile> = await supabase
            .from<AuthorizationProfile>('user_profiles')
            .select('role, panels, filial_id')
            .eq('user_id', user.id)
            .maybeSingle();
          data = fallback;
          if (fbErr) {
            console.error('Erro ao buscar user_profiles:', fbErr);
          }
        }

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
      } catch (err) {
        console.error('Erro inesperado ao obter perfil:', err);
        setProfile({
          role: user.app_metadata?.role || 'user',
          panels: [],
          filial_id: null,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, authLoading]);

  const value = useMemo(() => ({ profile, loading }), [profile, loading]);
  return <AuthorizationContext.Provider value={value}>{children}</AuthorizationContext.Provider>;
}
