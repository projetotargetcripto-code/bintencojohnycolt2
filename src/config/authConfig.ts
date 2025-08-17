export const scopeRoutes = {
  superadmin: "/super-admin",
  admin: "/admin-filial",
  imobiliaria: "/imobiliaria",
  corretor: "/corretor",
  juridico: "/juridico",
  urbanismo: "/urbanismo",
  contabilidade: "/contabilidade",
  marketing: "/marketing",
  comercial: "/comercial",
  obras: "/obras",
  investidor: "/investidor",
  terrenista: "/terrenista",
} as const;

export type AuthScope = keyof typeof scopeRoutes;

const scopeLabels: Record<AuthScope, string> = {
  superadmin: "Super Admin",
  admin: "Admin Filial",
  imobiliaria: "Imobiliária",
  corretor: "Corretores",
  juridico: "Jurídico",
  urbanismo: "Urbanismo",
  contabilidade: "Contabilidade",
  marketing: "Marketing",
  comercial: "Comercial",
  obras: "Obras",
  investidor: "Investidor",
  terrenista: "Terrenista",
};

export function labelFromScope(scope?: string | null): string | undefined {
  if (!scope) return undefined;

  const key = scope.toLowerCase();
  if (key in scopeLabels) {
    return scopeLabels[key as AuthScope];
  }

  return undefined;
}

export function pathFromScope(scope?: string | null): string {
  if (!scope) return "/acesso";

  const key = scope.toLowerCase();
  if (key in scopeRoutes) {
    return scopeRoutes[key as AuthScope];
  }

  return "/acesso";
}
