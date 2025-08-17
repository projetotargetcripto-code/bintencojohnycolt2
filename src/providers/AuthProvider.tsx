import { createContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/dataClient';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (tokens: { access_token: string; refresh_token: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add('bg-background', 'text-foreground');
    const fetchSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSessionState(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    };
    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSessionState(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const applySession = async (tokens: { access_token: string; refresh_token: string }) => {
    const {
      data: { session: newSession },
    } = await supabase.auth.setSession(tokens);
    setSessionState(newSession);
    setUser(newSession?.user ?? null);
  };

  const value = useMemo(() => ({ session, user, loading, setSession: applySession }), [session, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
