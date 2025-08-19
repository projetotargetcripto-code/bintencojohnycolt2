import type { NavItem } from "@/components/shell/Sidebar";

export const NAV: Record<string, NavItem[]> = {
  superadmin: [
    {
      title: 'Dashboard',
      href: '/super-admin/dashboard',
      icon: 'layout-dashboard'
    },
    { label: "Mapa Interativo", href: "/super-admin/mapa", icon: "map" },
    { label: "Mapa Real", href: "/super-admin/mapa-real", icon: "map-pin" },
    { label: 'Gestão de Filiais', href: '/super-admin/filiais', icon: 'building' },
    { label: 'Filiais Internas Cadastradas', href: '/super-admin/filiais-internas', icon: 'building' },
    { label: 'Gestão SaaS', href: '/super-admin/clientes-saas', icon: 'users' },
    { label: "Acessos por Filial", href: "/super-admin/filiais-acessos", icon: "shield" },
    {
      title: 'Contas Admin Filiais',
      href: '/super-admin/admins-filiais',
      icon: 'users'
    },
    { label: "Organizações", href: "/super-admin/organizacoes", icon: "building" },
    { label: "Usuários", href: "/super-admin/usuarios", icon: "user" },
    { label: "Aprovação", href: "/super-admin/aprovacao", icon: "check-circle" },
    { label: "Tokenização", href: "/super-admin/tokenizacao", icon: "key" },
    { label: "Auditoria", href: "/super-admin/auditoria", icon: "file-text" },
    { label: "Comissões", href: "/super-admin/comissoes", icon: "dollar-sign" },
    { label: "Relatórios", href: "/super-admin/relatorios", icon: "bar-chart-2" },
    { label: "Configurações", href: "/super-admin/config", icon: "settings" },
  ],
  adminfilial: [
    { label: "Home", href: "/admin-filial", icon: "layout", panelKey: "adminfilial" },
    { label: "Equipe", href: "/admin-filial/equipe", icon: "users", panelKey: "adminfilial" },
    { label: "Empreendimentos", href: "/admin-filial/empreendimentos", icon: "building-2", panelKey: "adminfilial" },
    { label: "Novo Empreendimento", href: "/admin-filial/empreendimentos/novo", icon: "plus-circle", panelKey: "adminfilial" },
    { label: "Mapa Interativo", href: "/admin-filial/mapa", icon: "map", panelKey: "urbanista" },
    { label: "Vendas de Lotes", href: "/admin-filial/lotes-vendas", icon: "dollar-sign", panelKey: "comercial" },
    { label: "Comissões", href: "/admin-filial/comissoes", icon: "dollar-sign", panelKey: "comercial" },
    { label: "Assinaturas", href: "/admin-filial/assinaturas", icon: "pen-line", panelKey: "adminfilial" },
    { label: "Auditoria", href: "/admin-filial/auditoria", icon: "file-text", panelKey: "adminfilial" },
    { label: "Relatórios", href: "/admin-filial/relatorios", icon: "chart", panelKey: "adminfilial" },
    { label: "Configurações", href: "/admin-filial/config", icon: "settings", panelKey: "adminfilial" },
  ],
  urbanista: [
    { title: "Urbanista", href: "/urbanista", icon: "map" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
  juridico: [
    { title: "Jurídico", href: "/juridico", icon: "scroll-text" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
  contabilidade: [
    { title: "Contabilidade", href: "/contabilidade", icon: "calculator" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
  marketing: [
    { title: "Marketing", href: "/marketing", icon: "megaphone" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
  comercial: [
    { title: "Comercial", href: "/comercial", icon: "briefcase" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
  imobiliaria: [
    { title: "Imobiliária", href: "/imobiliaria", icon: "home" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
  corretor: [
    { title: "Corretor", href: "/corretor", icon: "user" },
    { label: "Comissões", href: "/corretor/comissoes", icon: "dollar-sign" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
  obras: [
    { title: "Obras", href: "/obras", icon: "hammer" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
  investidor: [
    { title: "Investidor", href: "/investidor", icon: "line-chart" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
  terrenista: [
    { title: "Terrenista", href: "/terrenista", icon: "landmark" },
    { title: "Em Desenvolvimento", href: "#", icon: "wrench" },
  ],
};

export function inferMenuKey(pathname: string) {
  const key = (pathname.split("/")[1] || "adminfilial").toLowerCase();
  return key;
}
