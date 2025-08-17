import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const comercialRoutes = [
  {
    path: "/comercial",
    element: (
      <Protected allowedRoles={["comercial"]}>
        <PanelHomePage menuKey="comercial" title="Comercial" />
      </Protected>
    ),
  },
  {
    path: "/comercial/relatorios",
    element: (
      <Protected allowedRoles={["comercial"]}>
        <PanelSectionPage menuKey="comercial" title="Comercial" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/comercial/config",
    element: (
      <Protected allowedRoles={["comercial"]}>
        <PanelSectionPage menuKey="comercial" title="Comercial" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/comercial/leads",
    element: (
      <Protected allowedRoles={["comercial"]}>
        <PanelSectionPage menuKey="comercial" title="Comercial" section="Leads" />
      </Protected>
    ),
  },
  {
    path: "/comercial/propostas",
    element: (
      <Protected allowedRoles={["comercial"]}>
        <PanelSectionPage menuKey="comercial" title="Comercial" section="Propostas" />
      </Protected>
    ),
  },
];

export default comercialRoutes;
