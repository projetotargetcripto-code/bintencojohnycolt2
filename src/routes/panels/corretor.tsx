import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const corretorRoutes = [
  {
    path: "/corretor",
    element: (
      <Protected allowedRoles={["corretor"]}>
        <PanelHomePage menuKey="corretor" title="Corretor" />
      </Protected>
    ),
  },
  {
    path: "/corretor/relatorios",
    element: (
      <Protected allowedRoles={["corretor"]}>
        <PanelSectionPage menuKey="corretor" title="Corretor" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/corretor/config",
    element: (
      <Protected allowedRoles={["corretor"]}>
        <PanelSectionPage menuKey="corretor" title="Corretor" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/corretor/leads",
    element: (
      <Protected allowedRoles={["corretor"]}>
        <PanelSectionPage menuKey="corretor" title="Corretor" section="Leads" />
      </Protected>
    ),
  },
  {
    path: "/corretor/vendas",
    element: (
      <Protected allowedRoles={["corretor"]}>
        <PanelSectionPage menuKey="corretor" title="Corretor" section="Vendas" />
      </Protected>
    ),
  },
];

export default corretorRoutes;
