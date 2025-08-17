import { Crown, User, type LucideIcon } from "lucide-react";

export interface QuickLoginCredential {
  email: string;
  password: string;
  label: string;
  role: string;
  panel: string;
  icon: LucideIcon;
}

export const quickLoginCredentials: QuickLoginCredential[] = [
  { email: 'superadmin@blockurb.com', password: 'BlockUrb2024!', label: 'Super Admin', role: 'superadmin', panel: '/super-admin', icon: Crown },
  { email: 'admin@blockurb.com', password: 'Admin2024!', label: 'Admin Filial', role: 'adminfilial', panel: '/admin-filial', icon: User },
  { email: 'urbanista@blockurb.com', password: 'Urban2024!', label: 'Urbanista', role: 'urbanista', panel: '/urbanista', icon: User },
  { email: 'juridico@blockurb.com', password: 'Legal2024!', label: 'Jurídico', role: 'juridico', panel: '/juridico', icon: User },
  { email: 'contabilidade@blockurb.com', password: 'Conta2024!', label: 'Contabilidade', role: 'contabilidade', panel: '/contabilidade', icon: User },
  { email: 'marketing@blockurb.com', password: 'Market2024!', label: 'Marketing', role: 'marketing', panel: '/marketing', icon: User },
  { email: 'comercial@blockurb.com', password: 'Venda2024!', label: 'Comercial', role: 'comercial', panel: '/comercial', icon: User },
  { email: 'imobiliaria@blockurb.com', password: 'Imob2024!', label: 'Imobiliária', role: 'imobiliaria', panel: '/imobiliaria', icon: User },
  { email: 'corretor@blockurb.com', password: 'Corret2024!', label: 'Corretor', role: 'corretor', panel: '/corretor', icon: User },
  { email: 'obras@blockurb.com', password: 'Obras2024!', label: 'Obras', role: 'obras', panel: '/obras', icon: User },
  { email: 'investidor@blockurb.com', password: 'Invest2024!', label: 'Investidor', role: 'investidor', panel: '/investidor', icon: User },
  { email: 'terrenista@blockurb.com', password: 'Terra2024!', label: 'Terrenista', role: 'terrenista', panel: '/terrenista', icon: User },
];

