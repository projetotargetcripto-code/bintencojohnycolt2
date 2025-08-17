export const scopeRoutes = {
  superadmin: "/super-admin",
  adminfilial: "/admin-filial",
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

export function labelFromScope(scope?: string) {
  const map: Record<string, string> = {
    superadmin: "Super Admin",
    adminfilial: "Admin Filial",
    imobiliaria: "Imobiliária",
    corretor: "Corretor",
    juridico: "Jurídico",
    urbanismo: "Urbanismo",
    contabilidade: "Contabilidade",
    marketing: "Marketing",
    comercial: "Comercial",
    obras: "Obras",
    investidor: "Investidor",
    terrenista: "Terrenista",
  };
  const key = scope?.toLowerCase() || "";
  return (key && map[key]) || "Plataforma";
}

export const pathFromScope = (scope?: string) =>
  scope ? ((scopeRoutes as any)[scope.toLowerCase()] ?? "/acessos") : "/acessos";
