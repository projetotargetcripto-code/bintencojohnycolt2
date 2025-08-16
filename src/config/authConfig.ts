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

export function labelFromScope(scope?: string | null) {
  if (!scope) return undefined;
  const key = scope.toLowerCase() as AuthScope;
  return (scopeLabels as any)[key] as string | undefined;
}

export function pathFromScope(scope?: string | null) {
  if (!scope) return "/acessos";
  const key = scope.toLowerCase() as AuthScope;
  return (scopeRoutes as any)[key] ?? "/acessos";
}
