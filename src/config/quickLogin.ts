import { Crown, User, type LucideIcon } from "lucide-react";

export interface QuickLoginCredential {
  email: string;
  password: string;
  label: string;
  role: string;
  panel: string;
  icon: LucideIcon;
}

interface QuickLoginConfig {
  envPrefix: string;
  label: string;
  role: string;
  panel: string;
  icon: LucideIcon;
}

const configs: QuickLoginConfig[] = [
  { envPrefix: "SUPERADMIN", label: "Super Admin", role: "superadmin", panel: "/super-admin", icon: Crown },
  { envPrefix: "ADMIN", label: "Admin Filial", role: "adminfilial", panel: "/admin-filial", icon: User },
  { envPrefix: "URBANISTA", label: "Urbanista", role: "urbanismo", panel: "/urbanismo", icon: User },
  { envPrefix: "JURIDICO", label: "Jurídico", role: "juridico", panel: "/juridico", icon: User },
  { envPrefix: "CONTABILIDADE", label: "Contabilidade", role: "contabilidade", panel: "/contabilidade", icon: User },
  { envPrefix: "MARKETING", label: "Marketing", role: "marketing", panel: "/marketing", icon: User },
  { envPrefix: "COMERCIAL", label: "Comercial", role: "comercial", panel: "/comercial", icon: User },
  { envPrefix: "IMOBILIARIA", label: "Imobiliária", role: "imobiliaria", panel: "/imobiliaria", icon: User },
  { envPrefix: "CORRETOR", label: "Corretor", role: "corretor", panel: "/corretor", icon: User },
  { envPrefix: "OBRAS", label: "Obras", role: "obras", panel: "/obras", icon: User },
  { envPrefix: "INVESTIDOR", label: "Investidor", role: "investidor", panel: "/investidor", icon: User },
  { envPrefix: "TERRENISTA", label: "Terrenista", role: "terrenista", panel: "/terrenista", icon: User }
];
const env = import.meta.env as Record<string, string | undefined>;

export const quickLoginCredentials: QuickLoginCredential[] = configs
  .map((cfg) => {
    const email = env[`VITE_${cfg.envPrefix}_EMAIL`];
    const password = env[`VITE_${cfg.envPrefix}_PASSWORD`];

    if (!email || !password) return null;

    return {
      email,
      password,
      label: cfg.label,
      role: cfg.role,
      panel: cfg.panel,
      icon: cfg.icon
    } satisfies QuickLoginCredential;
  })
  .filter((cred): cred is QuickLoginCredential => cred !== null);

