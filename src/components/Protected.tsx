import { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";

interface ProtectedProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[]; // cargos permitidos
  panelKey?: string; // painel requerido para acessar a rota
  debugBypass?: boolean;
}

function useRequiresLogin(session: unknown, loading: boolean) {
  return useMemo(() => !loading && !session, [loading, session]);
}

function useRoleDenied(allowedRoles: string[] | undefined, profile: any) {
  return useMemo(() => {
    if (!allowedRoles?.length || !profile) return false;
    return !allowedRoles.includes(profile.role);
  }, [allowedRoles, profile]);
}

function usePanelDenied(panelKey: string | undefined, profile: any) {
  return useMemo(() => {
    if (!panelKey || !profile) return false;
    if (profile.role === "superadmin") return false;
    const allowed = Array.isArray(profile.panels) && profile.panels.includes(panelKey);
    return !allowed;
  }, [panelKey, profile]);
}

export function Protected({
  children,
  redirectTo = "/login",
  allowedRoles,
  panelKey,
  debugBypass = false,
}: PropsWithChildren<ProtectedProps>) {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: authzLoading } = useAuthorization();
  const loading = authLoading || authzLoading;
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = useRef(false);

  const requiresLogin = useRequiresLogin(session, loading);
  const roleDenied = useRoleDenied(allowedRoles, profile);
  const panelDenied = usePanelDenied(panelKey, profile);

  const loginTarget = useMemo(() => {
    const next = encodeURIComponent(location.pathname + location.search);
    return `${redirectTo}?next=${next}`;
  }, [redirectTo, location.pathname, location.search]);

  const redirectToLogin = useCallback(() => {
    if (location.pathname !== redirectTo) {
      navigate(loginTarget, { replace: true, state: { from: location } });
    }
  }, [navigate, loginTarget, location, redirectTo]);

  const redirectToDenied = useCallback(() => {
    navigate("/acesso-negado", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (debugBypass || redirected.current) return;

    if (requiresLogin) {
      redirected.current = true;
      redirectToLogin();
    } else if (roleDenied || panelDenied) {
      redirected.current = true;
      redirectToDenied();
    }
  }, [requiresLogin, roleDenied, panelDenied, redirectToLogin, redirectToDenied, debugBypass]);

  if (debugBypass) return <>{children}</>;

  // Enquanto carrega, ou enquanto esperamos o profile aparecer (quando a rota exige role/panel)
  if (loading || ((allowedRoles && allowedRoles.length > 0 || panelKey) && session && !profile)) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent/40 border-t-accent animate-spin" aria-label="Carregando" />
      </div>
    );
  }

  if (!session || roleDenied || panelDenied) return null;

  return <>{children}</>;
}

