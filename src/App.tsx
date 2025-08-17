import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Whitepaper from "./pages/Whitepaper";
import Acesso from "./pages/Acesso";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Reset from "./pages/Reset";
import LoginSuperAdmin from "./pages/login/SuperAdmin";
import LoginAdmin from "./pages/login/Admin";
import LoginImobiliaria from "./pages/login/Imobiliaria";
import LoginCorretor from "./pages/login/Corretor";
import LoginJuridico from "./pages/login/Juridico";
import LoginUrbanismo from "./pages/login/Urbanismo";
import LoginContabilidade from "./pages/login/Contabilidade";
import LoginMarketing from "./pages/login/Marketing";
import LoginComercial from "./pages/login/Comercial";
import LoginObras from "./pages/login/Obras";
import LoginInvestidor from "./pages/login/Investidor";
import LoginTerrenista from "./pages/login/Terrenista";
import { AuthProvider } from "@/providers/AuthProvider";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";
import EmpreendimentoNovo from "./pages/admin/EmpreendimentoNovo";
import AdminMapa from "./pages/admin/Mapa";
import MapaInterativo from "./pages/admin/MapaInterativo";
import LotesVendas from "./pages/admin/LotesVendas";
import AprovacaoEmpreendimentos from "./pages/admin/AprovacaoEmpreendimentos";
import Logout from "./pages/Logout";
import LotesPage from "./pages/admin/Lotes";
import FiliaisInternasPage from "./pages/admin/FiliaisInternas";
import ClientesSaasPage from "./pages/admin/ClientesSaas";
import FiliaisAccessPage from "./pages/admin/FiliaisAccess";
import UsuariosPage from "./pages/admin/Usuarios";
import AdminsFiliaisPage from "./pages/admin/AdminsFiliais";
import AcessoNegado from "./pages/AcessoNegado";
import { Protected } from "@/components/Protected";
import MapaSuperAdmin from "./pages/admin/MapaSuperAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ProgressBar />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/whitepaper" element={<Whitepaper />} />
            <Route path="/acesso" element={<Acesso />} />

            {/* Auth base routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset" element={<Reset />} />

            {/* Auth scoped routes */}
            <Route path="/login/super-admin" element={<LoginSuperAdmin />} />
            <Route path="/login/admin" element={<LoginAdmin />} />
            <Route path="/login/imobiliaria" element={<LoginImobiliaria />} />
            <Route path="/login/corretor" element={<LoginCorretor />} />
            <Route path="/login/juridico" element={<LoginJuridico />} />
            <Route path="/login/urbanismo" element={<LoginUrbanismo />} />
            <Route path="/login/contabilidade" element={<LoginContabilidade />} />
            <Route path="/login/marketing" element={<LoginMarketing />} />
            <Route path="/login/comercial" element={<LoginComercial />} />
            <Route path="/login/obras" element={<LoginObras />} />
            <Route path="/login/investidor" element={<LoginInvestidor />} />
            <Route path="/login/terrenista" element={<LoginTerrenista />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/acesso-negado" element={<AcessoNegado />} />

            {/* Panels - ROTAS PROTEGIDAS */}
            {/* Super Admin */}
            <Route path="/super-admin" element={<Protected allowedRoles={['superadmin']}><PanelHomePage menuKey="superadmin" title="Super Admin" /></Protected>} />
            <Route path="/super-admin/admins-filiais" element={<Protected allowedRoles={['superadmin']}><AdminsFiliaisPage /></Protected>} />
            <Route path="/super-admin/filiais-internas" element={<Protected allowedRoles={['superadmin']}><FiliaisInternasPage /></Protected>} />
<Route path="/super-admin/clientes-saas" element={<Protected allowedRoles={['superadmin']}><ClientesSaasPage /></Protected>} />
            <Route path="/super-admin/filiais-acessos" element={<Protected allowedRoles={['superadmin']}><FiliaisAccessPage /></Protected>} />
            <Route path="/super-admin/mapa" element={<Protected allowedRoles={['superadmin']}><MapaSuperAdmin /></Protected>} />
            <Route path="/super-admin/relatorios" element={<Protected allowedRoles={['superadmin']}><PanelSectionPage menuKey="superadmin" title="Super Admin" section="Relatórios" /></Protected>} />
            <Route path="/super-admin/config" element={<Protected allowedRoles={['superadmin']}><PanelSectionPage menuKey="superadmin" title="Super Admin" section="Configurações" /></Protected>} />
            <Route path="/super-admin/organizacoes" element={<Protected allowedRoles={['superadmin']}><PanelSectionPage menuKey="superadmin" title="Super Admin" section="Organizações" /></Protected>} />
            <Route path="/super-admin/usuarios" element={<Protected allowedRoles={['superadmin']}><UsuariosPage /></Protected>} />
            <Route path="/super-admin/tokenizacao" element={<Protected allowedRoles={['superadmin']}><PanelSectionPage menuKey="superadmin" title="Super Admin" section="Tokenização" /></Protected>} />

            {/* Admin Filial - Rotas padronizadas em /admin-filial */}
            <Route path="/admin-filial" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><PanelHomePage menuKey="adminfilial" title="Admin Filial" /></Protected>} />
            <Route path="/admin-filial/relatorios" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Relatórios" /></Protected>} />
            <Route path="/admin-filial/config" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Configurações" /></Protected>} />
            <Route path="/admin-filial/equipe" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Equipe" /></Protected>} />
            <Route path="/admin-filial/empreendimentos" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Empreendimentos" /></Protected>} />
            <Route path="/admin-filial/empreendimentos/novo" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><EmpreendimentoNovo /></Protected>} />
            <Route path="/admin-filial/empreendimentos/editar/:id" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><EmpreendimentoNovo /></Protected>} />
            <Route path="/admin-filial/mapa" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><AdminMapa /></Protected>} />
            <Route path="/admin-filial/mapa-interativo" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><MapaInterativo /></Protected>} />
            <Route path="/admin-filial/lotes" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><LotesPage /></Protected>} />
            <Route path="/admin-filial/lotes-vendas" element={<Protected allowedRoles={['adminfilial', 'superadmin']} panelKey="adminfilial"><LotesVendas /></Protected>} />

            {/* Super Admin - Aprovação */}
            <Route path="/super-admin/aprovacao" element={<Protected allowedRoles={['superadmin']}><AprovacaoEmpreendimentos /></Protected>} />

            {/* Urbanista */}
            <Route path="/urbanista" element={<Protected allowedRoles={['urbanista']}><PanelHomePage menuKey="urbanista" title="Urbanista" /></Protected>} />
            <Route path="/urbanista/relatorios" element={<Protected allowedRoles={['urbanista']}><PanelSectionPage menuKey="urbanista" title="Urbanista" section="Relatórios" /></Protected>} />
            <Route path="/urbanista/config" element={<Protected allowedRoles={['urbanista']}><PanelSectionPage menuKey="urbanista" title="Urbanista" section="Configurações" /></Protected>} />
            <Route path="/urbanista/mapas" element={<Protected allowedRoles={['urbanista']}><PanelSectionPage menuKey="urbanista" title="Urbanista" section="Mapas" /></Protected>} />
            <Route path="/urbanista/projetos" element={<Protected allowedRoles={['urbanista']}><PanelSectionPage menuKey="urbanista" title="Urbanista" section="Projetos" /></Protected>} />

            {/* Jurídico */}
            <Route path="/juridico" element={<Protected allowedRoles={['juridico']}><PanelHomePage menuKey="juridico" title="Jurídico" /></Protected>} />
            <Route path="/juridico/relatorios" element={<Protected allowedRoles={['juridico']}><PanelSectionPage menuKey="juridico" title="Jurídico" section="Relatórios" /></Protected>} />
            <Route path="/juridico/config" element={<Protected allowedRoles={['juridico']}><PanelSectionPage menuKey="juridico" title="Jurídico" section="Configurações" /></Protected>} />
            <Route path="/juridico/contratos" element={<Protected allowedRoles={['juridico']}><PanelSectionPage menuKey="juridico" title="Jurídico" section="Contratos" /></Protected>} />
            <Route path="/juridico/processos" element={<Protected allowedRoles={['juridico']}><PanelSectionPage menuKey="juridico" title="Jurídico" section="Processos" /></Protected>} />

            {/* Contabilidade */}
            <Route path="/contabilidade" element={<Protected allowedRoles={['contabilidade']}><PanelHomePage menuKey="contabilidade" title="Contabilidade" /></Protected>} />
            <Route path="/contabilidade/relatorios" element={<Protected allowedRoles={['contabilidade']}><PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Relatórios" /></Protected>} />
            <Route path="/contabilidade/config" element={<Protected allowedRoles={['contabilidade']}><PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Configurações" /></Protected>} />
            <Route path="/contabilidade/financeiro" element={<Protected allowedRoles={['contabilidade']}><PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Financeiro" /></Protected>} />
            <Route path="/contabilidade/fiscal" element={<Protected allowedRoles={['contabilidade']}><PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Fiscal" /></Protected>} />

            {/* Marketing */}
            <Route path="/marketing" element={<Protected allowedRoles={['marketing']}><PanelHomePage menuKey="marketing" title="Marketing" /></Protected>} />
            <Route path="/marketing/relatorios" element={<Protected allowedRoles={['marketing']}><PanelSectionPage menuKey="marketing" title="Marketing" section="Relatórios" /></Protected>} />
            <Route path="/marketing/config" element={<Protected allowedRoles={['marketing']}><PanelSectionPage menuKey="marketing" title="Marketing" section="Configurações" /></Protected>} />
            <Route path="/marketing/campanhas" element={<Protected allowedRoles={['marketing']}><PanelSectionPage menuKey="marketing" title="Marketing" section="Campanhas" /></Protected>} />
            <Route path="/marketing/materiais" element={<Protected allowedRoles={['marketing']}><PanelSectionPage menuKey="marketing" title="Marketing" section="Materiais" /></Protected>} />

            {/* Comercial */}
            <Route path="/comercial" element={<Protected allowedRoles={['comercial']}><PanelHomePage menuKey="comercial" title="Comercial" /></Protected>} />
            <Route path="/comercial/relatorios" element={<Protected allowedRoles={['comercial']}><PanelSectionPage menuKey="comercial" title="Comercial" section="Relatórios" /></Protected>} />
            <Route path="/comercial/config" element={<Protected allowedRoles={['comercial']}><PanelSectionPage menuKey="comercial" title="Comercial" section="Configurações" /></Protected>} />
            <Route path="/comercial/leads" element={<Protected allowedRoles={['comercial']}><PanelSectionPage menuKey="comercial" title="Comercial" section="Leads" /></Protected>} />
            <Route path="/comercial/propostas" element={<Protected allowedRoles={['comercial']}><PanelSectionPage menuKey="comercial" title="Comercial" section="Propostas" /></Protected>} />

            {/* Imobiliária */}
            <Route path="/imobiliaria" element={<Protected allowedRoles={['imobiliaria']}><PanelHomePage menuKey="imobiliaria" title="Imobiliária" /></Protected>} />
            <Route path="/imobiliaria/relatorios" element={<Protected allowedRoles={['imobiliaria']}><PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Relatórios" /></Protected>} />
            <Route path="/imobiliaria/config" element={<Protected allowedRoles={['imobiliaria']}><PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Configurações" /></Protected>} />
            <Route path="/imobiliaria/corretores" element={<Protected allowedRoles={['imobiliaria']}><PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Corretores" /></Protected>} />
            <Route path="/imobiliaria/leads" element={<Protected allowedRoles={['imobiliaria']}><PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Leads" /></Protected>} />

            {/* Corretor */}
            <Route path="/corretor" element={<Protected allowedRoles={['corretor']}><PanelHomePage menuKey="corretor" title="Corretor" /></Protected>} />
            <Route path="/corretor/relatorios" element={<Protected allowedRoles={['corretor']}><PanelSectionPage menuKey="corretor" title="Corretor" section="Relatórios" /></Protected>} />
            <Route path="/corretor/config" element={<Protected allowedRoles={['corretor']}><PanelSectionPage menuKey="corretor" title="Corretor" section="Configurações" /></Protected>} />
            <Route path="/corretor/leads" element={<Protected allowedRoles={['corretor']}><PanelSectionPage menuKey="corretor" title="Corretor" section="Leads" /></Protected>} />
            <Route path="/corretor/vendas" element={<Protected allowedRoles={['corretor']}><PanelSectionPage menuKey="corretor" title="Corretor" section="Vendas" /></Protected>} />

            {/* Obras */}
            <Route path="/obras" element={<Protected allowedRoles={['obras']}><PanelHomePage menuKey="obras" title="Obras" /></Protected>} />
            <Route path="/obras/relatorios" element={<Protected allowedRoles={['obras']}><PanelSectionPage menuKey="obras" title="Obras" section="Relatórios" /></Protected>} />
            <Route path="/obras/config" element={<Protected allowedRoles={['obras']}><PanelSectionPage menuKey="obras" title="Obras" section="Configurações" /></Protected>} />
            <Route path="/obras/cronograma" element={<Protected allowedRoles={['obras']}><PanelSectionPage menuKey="obras" title="Obras" section="Cronograma" /></Protected>} />
            <Route path="/obras/andamento" element={<Protected allowedRoles={['obras']}><PanelSectionPage menuKey="obras" title="Obras" section="Andamento" /></Protected>} />

            {/* Investidor */}
            <Route path="/investidor" element={<Protected allowedRoles={['investidor']}><PanelHomePage menuKey="investidor" title="Investidor" /></Protected>} />
            <Route path="/investidor/relatorios" element={<Protected allowedRoles={['investidor']}><PanelSectionPage menuKey="investidor" title="Investidor" section="Relatórios" /></Protected>} />
            <Route path="/investidor/config" element={<Protected allowedRoles={['investidor']}><PanelSectionPage menuKey="investidor" title="Investidor" section="Configurações" /></Protected>} />
            <Route path="/investidor/carteira" element={<Protected allowedRoles={['investidor']}><PanelSectionPage menuKey="investidor" title="Investidor" section="Carteira" /></Protected>} />
            <Route path="/investidor/suporte" element={<Protected allowedRoles={['investidor']}><PanelSectionPage menuKey="investidor" title="Investidor" section="Suporte" /></Protected>} />

            {/* Terrenista */}
            <Route path="/terrenista" element={<Protected allowedRoles={['terrenista']}><PanelHomePage menuKey="terrenista" title="Terrenista" /></Protected>} />
            <Route path="/terrenista/relatorios" element={<Protected allowedRoles={['terrenista']}><PanelSectionPage menuKey="terrenista" title="Terrenista" section="Relatórios" /></Protected>} />
            <Route path="/terrenista/config" element={<Protected allowedRoles={['terrenista']}><PanelSectionPage menuKey="terrenista" title="Terrenista" section="Configurações" /></Protected>} />
            <Route path="/terrenista/status" element={<Protected allowedRoles={['terrenista']}><PanelSectionPage menuKey="terrenista" title="Terrenista" section="Status" /></Protected>} />
            <Route path="/terrenista/pagamentos" element={<Protected allowedRoles={['terrenista']}><PanelSectionPage menuKey="terrenista" title="Terrenista" section="Pagamentos" /></Protected>} />
            
            {/* Debug route */}
              <Route
                path="/debug/connection"
                lazy={async () => {
                  const Component = (await import("./pages/debug/Connection")).default;
                  return { Component };
                }}
              />
            
            {/* Rota Catch-all no final */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
