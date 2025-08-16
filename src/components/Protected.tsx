import { PropsWithChildren, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

interface ProtectedProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[]; // Nova propriedade para especificar cargos permitidos
  panelKey?: string; // painel requerido para acessar a rota
  debugBypass?: boolean;
}

export function Protected({ children, redirectTo = "/login", allowedRoles, panelKey, debugBypass = false }: PropsWithChildren<ProtectedProps>) {
	const { session, profile, loading } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		if (debugBypass || loading) return;

		// 1. Verifica se está logado
		if (!session) {
			const next = encodeURIComponent(location.pathname + location.search);
			const target = `${redirectTo}?next=${next}`;
			if (location.pathname !== redirectTo) {
				navigate(target, { replace: true, state: { from: location } });
			}
			return;
		}

		// 2. Se logado, verifica o cargo (se 'allowedRoles' foi especificado)
		if (allowedRoles && allowedRoles.length > 0) {
			// Evita redirecionar enquanto o profile ainda não carregou
			if (!profile) return;
			if (!allowedRoles.includes(profile.role)) {
				navigate('/acesso-negado', { replace: true });
			}
		}

		// 3. Se for exigido um panelKey, verifica se está permitido para a filial do usuário
		if (panelKey) {
			if (!profile) return; // aguardar o perfil carregar
			const isSuperAdmin = profile.role === 'superadmin';
			const allowed = Array.isArray(profile.panels) && profile.panels.includes(panelKey);
			if (!isSuperAdmin && !allowed) {
				navigate('/acesso-negado', { replace: true });
			}
		}
	}, [debugBypass, loading, session, profile, navigate, location, redirectTo, allowedRoles, panelKey]);

	if (debugBypass) return <>{children}</>;

	// Enquanto carrega, ou enquanto esperamos o profile aparecer (quando a rota exige role/panel)
	if (loading || ((allowedRoles && allowedRoles.length > 0 || panelKey) && session && !profile)) {
		return (
			<div className="min-h-[50vh] grid place-items-center">
				<div className="h-8 w-8 rounded-full border-2 border-accent/40 border-t-accent animate-spin" aria-label="Carregando" />
			</div>
		);
	}

	if (!session) return null; // Redirecionamento acontece no useEffect

	// Só bloqueia quando já temos profile e ele não está permitido
	if (allowedRoles && allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
		return null;
	}

	if (panelKey && profile && profile.role !== 'superadmin') {
		const allowed = Array.isArray(profile.panels) && profile.panels.includes(panelKey);
		if (!allowed) return null;
	}

	return <>{children}</>;
}