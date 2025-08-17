import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";
import EmpreendimentoNovo from "@/pages/admin/EmpreendimentoNovo";
import AdminMapa from "@/pages/admin/Mapa";
import MapaInterativo from "@/pages/admin/MapaInterativo";
import LotesVendas from "@/pages/admin/LotesVendas";
import LotesPage from "@/pages/admin/Lotes";

export const adminFilialRoutes = [
  {
    path: "/admin-filial",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <PanelHomePage menuKey="adminfilial" title="Admin Filial" />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/relatorios",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/config",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/equipe",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Equipe" />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/empreendimentos",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <PanelSectionPage menuKey="adminfilial" title="Admin Filial" section="Empreendimentos" />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/empreendimentos/novo",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <EmpreendimentoNovo />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/empreendimentos/editar/:id",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <EmpreendimentoNovo />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/mapa",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <AdminMapa />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/mapa-interativo",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <MapaInterativo />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/lotes",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <LotesPage />
      </Protected>
    ),
  },
  {
    path: "/admin-filial/lotes-vendas",
    element: (
      <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
        <LotesVendas />
      </Protected>
    ),
  },
];

export default adminFilialRoutes;
