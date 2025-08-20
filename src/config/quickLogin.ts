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
  { envPrefix: "URBANISTA", label: "Urbanista", role: "urbanista", panel: "/urbanista", icon: User },
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

const devDefaults: Record<string, { email: string; password: string }> = {
  ADMIN: { email: "filial@blockurb.com", password: "123" },
  URBANISTA: { email: "urbanista@blockurb.com", password: "123" },
  JURIDICO: { email: "juridico@blockurb.com", password: "123" },
  CONTABILIDADE: { email: "contabilidade@blockurb.com", password: "123" },
  MARKETING: { email: "marketing@blockurb.com", password: "123" },
  COMERCIAL: { email: "comercial@blockurb.com", password: "123" },
  IMOBILIARIA: { email: "imobiliaria@blockurb.com", password: "123" },
  CORRETOR: { email: "corretor@blockurb.com", password: "123" },
  TERRENISTA: { email: "terrenista@blockurb.com", password: "123" },
  OBRAS: { email: "obras@blockurb.com", password: "123" }
};

export const quickLoginCredentials: QuickLoginCredential[] = configs
  .map((cfg) => {
    const defaults = devDefaults[cfg.envPrefix];
    const email = env[`VITE_${cfg.envPrefix}_EMAIL`] ?? defaults?.email;
    const password = env[`VITE_${cfg.envPrefix}_PASSWORD`] ?? defaults?.password;

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

