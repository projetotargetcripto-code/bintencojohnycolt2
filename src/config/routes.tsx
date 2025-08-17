import React from "react";
import Index from "@/pages/Index";
import Whitepaper from "@/pages/Whitepaper";
import Acesso from "@/pages/Acesso";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Reset from "@/pages/Reset";
import LoginSuperAdmin from "@/pages/login/SuperAdmin";
import LoginAdmin from "@/pages/login/Admin";
import LoginImobiliaria from "@/pages/login/Imobiliaria";
import LoginCorretor from "@/pages/login/Corretor";
import LoginJuridico from "@/pages/login/Juridico";
import LoginUrbanismo from "@/pages/login/Urbanismo";
import LoginContabilidade from "@/pages/login/Contabilidade";
import LoginMarketing from "@/pages/login/Marketing";
import LoginComercial from "@/pages/login/Comercial";
import LoginObras from "@/pages/login/Obras";
import LoginInvestidor from "@/pages/login/Investidor";
import LoginTerrenista from "@/pages/login/Terrenista";
import Logout from "@/pages/Logout";
import AcessoNegado from "@/pages/AcessoNegado";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";
import EmpreendimentoNovo from "@/pages/admin/EmpreendimentoNovo";
import AdminMapa from "@/pages/admin/Mapa";
import MapaInterativo from "@/pages/admin/MapaInterativo";
import LotesVendas from "@/pages/admin/LotesVendas";
import AprovacaoEmpreendimentos from "@/pages/admin/AprovacaoEmpreendimentos";
import LotesPage from "@/pages/admin/Lotes";
import FiliaisInternasPage from "@/pages/admin/FiliaisInternas";
import ClientesSaasPage from "@/pages/admin/ClientesSaas";
import FiliaisAccessPage from "@/pages/admin/FiliaisAccess";
import UsuariosPage from "@/pages/admin/Usuarios";
import AdminsFiliaisPage from "@/pages/admin/AdminsFiliais";
import MapaSuperAdmin from "@/pages/admin/MapaSuperAdmin";

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  roles?: string[];
  panelKey?: string;
}

export const publicRoutes: RouteConfig[] = [
  { path: "/", element: <Index /> },
  { path: "/whitepaper", element: <Whitepaper /> },
  { path: "/acesso", element: <Acesso /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/reset", element: <Reset /> },
  { path: "/login/super-admin", element: <LoginSuperAdmin /> },
  { path: "/login/admin", element: <LoginAdmin /> },
  { path: "/login/imobiliaria", element: <LoginImobiliaria /> },
  { path: "/login/corretor", element: <LoginCorretor /> },
  { path: "/login/juridico", element: <LoginJuridico /> },
  { path: "/login/urbanismo", element: <LoginUrbanismo /> },
  { path: "/login/contabilidade", element: <LoginContabilidade /> },
  { path: "/login/marketing", element: <LoginMarketing /> },
  { path: "/login/comercial", element: <LoginComercial /> },
  { path: "/login/obras", element: <LoginObras /> },
  { path: "/login/investidor", element: <LoginInvestidor /> },
  { path: "/login/terrenista", element: <LoginTerrenista /> },
  { path: "/logout", element: <Logout /> },
  { path: "/acesso-negado", element: <AcessoNegado /> },
  { path: "/debug/connection", element: <div style={{ all: 'initial' }}><div id="debug-connection-root"></div></div> },
];

export const panelRoutes: RouteConfig[] = [
  // Super Admin
  { path: "super-admin", element: <PanelHomePage menuKey="superadmin" title="Super Admin" />, roles: ["superadmin"] },
  { path: "super-admin/admins-filiais", element: <AdminsFiliaisPage />, roles: ["superadmin"] },
  { path: "super-admin/filiais-internas", element: <FiliaisInternasPage />, roles: ["superadmin"] },
  { path: "super-admin/clientes-saas", element: <ClientesSaasPage />, roles: ["superadmin"] },
  { path: "super-admin/filiais-acessos", element: <FiliaisAccessPage />, roles: ["superadmin"] },
  { path: "super-admin/mapa", element: <MapaSuperAdmin />, roles: ["superadmin"] },
  { path: "super-admin/relatorios", element: <PanelSectionPage menuKey="superadmin" title="Super Admin" section="Relatórios" />, roles: ["superadmin"] },
  { path: "super-admin/config", element: <PanelSectionPage menuKey="superadmin" title="Super Admin" section="Configurações" />, roles: ["superadmin"] },
  { path: "super-admin/organizacoes", element: <PanelSectionPage menuKey="superadmin" title="Super Admin" section="Organizações" />, roles: ["superadmin"] },
  { path: "super-admin/usuarios", element: <UsuariosPage />, roles: ["superadmin"] },
  { path: "super-admin/aprovacao", element: <AprovacaoEmpreendimentos />, roles: ["superadmin"] },

  // Admin Filial
  { path: "admin-filial", element: <PanelHomePage menuKey="adminfilial" title="Admin Filial" />, roles: ["adminfilial", "superadmin"], panelKey: "adminfilial" },
  { path: "admin-filial/relatorios", element: <PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Relatórios" />, roles: ["adminfilial", "superadmin"], panelKey: "adminfilial" },
  { path: "admin-filial/config", element: <PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Configurações" />, roles: ["adminfilial", "superadmin"], panelKey: "adminfilial" },
  { path: "admin-filial/equipe", element: <PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Equipe" />, roles: ["adminfilial", "superadmin"], panelKey: "adminfilial" },
  { path: "admin-filial/empreendimentos", element: <PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Empreendimentos" />, roles: ["adminfilial", "superadmin"], panelKey: "adminfilial" },
  { path: "admin-filial/empreendimentos/novo", element: <EmpreendimentoNovo />, roles: ["adminfilial", "superadmin"], panelKey: "adminfilial" },
  { path: "admin-filial/empreendimentos/editar/:id", element: <EmpreendimentoNovo />, roles: ["adminfilial", "superadmin"], panelKey: "adminfilial" },
  { path: "admin-filial/mapa", element: <AdminMapa />, roles: ["adminfilial", "superadmin"], panelKey: "urbanista" },
  { path: "admin-filial/mapa-interativo", element: <MapaInterativo />, roles: ["adminfilial", "superadmin"], panelKey: "urbanista" },
  { path: "admin-filial/lotes", element: <LotesPage />, roles: ["adminfilial", "superadmin"], panelKey: "adminfilial" },
  { path: "admin-filial/lotes-vendas", element: <LotesVendas />, roles: ["adminfilial", "superadmin"], panelKey: "comercial" },

  // Urbanista
  { path: "urbanista", element: <PanelHomePage menuKey="urbanista" title="Urbanista" />, roles: ["urbanista"] },
  { path: "urbanista/relatorios", element: <PanelSectionPage menuKey="urbanista" title="Urbanista" section="Relatórios" />, roles: ["urbanista"] },
  { path: "urbanista/config", element: <PanelSectionPage menuKey="urbanista" title="Urbanista" section="Configurações" />, roles: ["urbanista"] },
  { path: "urbanista/mapas", element: <PanelSectionPage menuKey="urbanista" title="Urbanista" section="Mapas" />, roles: ["urbanista"] },
  { path: "urbanista/projetos", element: <PanelSectionPage menuKey="urbanista" title="Urbanista" section="Projetos" />, roles: ["urbanista"] },

  // Jurídico
  { path: "juridico", element: <PanelHomePage menuKey="juridico" title="Jurídico" />, roles: ["juridico"] },
  { path: "juridico/relatorios", element: <PanelSectionPage menuKey="juridico" title="Jurídico" section="Relatórios" />, roles: ["juridico"] },
  { path: "juridico/config", element: <PanelSectionPage menuKey="juridico" title="Jurídico" section="Configurações" />, roles: ["juridico"] },
  { path: "juridico/contratos", element: <PanelSectionPage menuKey="juridico" title="Jurídico" section="Contratos" />, roles: ["juridico"] },
  { path: "juridico/processos", element: <PanelSectionPage menuKey="juridico" title="Jurídico" section="Processos" />, roles: ["juridico"] },

  // Contabilidade
  { path: "contabilidade", element: <PanelHomePage menuKey="contabilidade" title="Contabilidade" />, roles: ["contabilidade"] },
  { path: "contabilidade/relatorios", element: <PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Relatórios" />, roles: ["contabilidade"] },
  { path: "contabilidade/config", element: <PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Configurações" />, roles: ["contabilidade"] },
  { path: "contabilidade/financeiro", element: <PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Financeiro" />, roles: ["contabilidade"] },
  { path: "contabilidade/fiscal", element: <PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Fiscal" />, roles: ["contabilidade"] },

  // Marketing
  { path: "marketing", element: <PanelHomePage menuKey="marketing" title="Marketing" />, roles: ["marketing"] },
  { path: "marketing/relatorios", element: <PanelSectionPage menuKey="marketing" title="Marketing" section="Relatórios" />, roles: ["marketing"] },
  { path: "marketing/config", element: <PanelSectionPage menuKey="marketing" title="Marketing" section="Configurações" />, roles: ["marketing"] },
  { path: "marketing/campanhas", element: <PanelSectionPage menuKey="marketing" title="Marketing" section="Campanhas" />, roles: ["marketing"] },
  { path: "marketing/materiais", element: <PanelSectionPage menuKey="marketing" title="Marketing" section="Materiais" />, roles: ["marketing"] },

  // Comercial
  { path: "comercial", element: <PanelHomePage menuKey="comercial" title="Comercial" />, roles: ["comercial"] },
  { path: "comercial/relatorios", element: <PanelSectionPage menuKey="comercial" title="Comercial" section="Relatórios" />, roles: ["comercial"] },
  { path: "comercial/config", element: <PanelSectionPage menuKey="comercial" title="Comercial" section="Configurações" />, roles: ["comercial"] },
  { path: "comercial/leads", element: <PanelSectionPage menuKey="comercial" title="Comercial" section="Leads" />, roles: ["comercial"] },
  { path: "comercial/propostas", element: <PanelSectionPage menuKey="comercial" title="Comercial" section="Propostas" />, roles: ["comercial"] },

  // Imobiliária
  { path: "imobiliaria", element: <PanelHomePage menuKey="imobiliaria" title="Imobiliária" />, roles: ["imobiliaria"] },
  { path: "imobiliaria/relatorios", element: <PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Relatórios" />, roles: ["imobiliaria"] },
  { path: "imobiliaria/config", element: <PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Configurações" />, roles: ["imobiliaria"] },
  { path: "imobiliaria/corretores", element: <PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Corretores" />, roles: ["imobiliaria"] },
  { path: "imobiliaria/leads", element: <PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Leads" />, roles: ["imobiliaria"] },

  // Corretor
  { path: "corretor", element: <PanelHomePage menuKey="corretor" title="Corretor" />, roles: ["corretor"] },
  { path: "corretor/relatorios", element: <PanelSectionPage menuKey="corretor" title="Corretor" section="Relatórios" />, roles: ["corretor"] },
  { path: "corretor/config", element: <PanelSectionPage menuKey="corretor" title="Corretor" section="Configurações" />, roles: ["corretor"] },
  { path: "corretor/leads", element: <PanelSectionPage menuKey="corretor" title="Corretor" section="Leads" />, roles: ["corretor"] },
  { path: "corretor/vendas", element: <PanelSectionPage menuKey="corretor" title="Corretor" section="Vendas" />, roles: ["corretor"] },

  // Obras
  { path: "obras", element: <PanelHomePage menuKey="obras" title="Obras" />, roles: ["obras"] },
  { path: "obras/relatorios", element: <PanelSectionPage menuKey="obras" title="Obras" section="Relatórios" />, roles: ["obras"] },
  { path: "obras/config", element: <PanelSectionPage menuKey="obras" title="Obras" section="Configurações" />, roles: ["obras"] },
  { path: "obras/cronograma", element: <PanelSectionPage menuKey="obras" title="Obras" section="Cronograma" />, roles: ["obras"] },
  { path: "obras/andamento", element: <PanelSectionPage menuKey="obras" title="Obras" section="Andamento" />, roles: ["obras"] },

  // Investidor
  { path: "investidor", element: <PanelHomePage menuKey="investidor" title="Investidor" />, roles: ["investidor"] },
  { path: "investidor/relatorios", element: <PanelSectionPage menuKey="investidor" title="Investidor" section="Relatórios" />, roles: ["investidor"] },
  { path: "investidor/config", element: <PanelSectionPage menuKey="investidor" title="Investidor" section="Configurações" />, roles: ["investidor"] },
  { path: "investidor/carteira", element: <PanelSectionPage menuKey="investidor" title="Investidor" section="Carteira" />, roles: ["investidor"] },
  { path: "investidor/suporte", element: <PanelSectionPage menuKey="investidor" title="Investidor" section="Suporte" />, roles: ["investidor"] },

  // Terrenista
  { path: "terrenista", element: <PanelHomePage menuKey="terrenista" title="Terrenista" />, roles: ["terrenista"] },
  { path: "terrenista/relatorios", element: <PanelSectionPage menuKey="terrenista" title="Terrenista" section="Relatórios" />, roles: ["terrenista"] },
  { path: "terrenista/config", element: <PanelSectionPage menuKey="terrenista" title="Terrenista" section="Configurações" />, roles: ["terrenista"] },
  { path: "terrenista/status", element: <PanelSectionPage menuKey="terrenista" title="Terrenista" section="Status" />, roles: ["terrenista"] },
  { path: "terrenista/pagamentos", element: <PanelSectionPage menuKey="terrenista" title="Terrenista" section="Pagamentos" />, roles: ["terrenista"] },
];
