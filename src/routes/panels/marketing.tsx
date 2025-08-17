import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const marketingRoutes = [
  {
    path: "/marketing",
    element: (
      <Protected allowedRoles={["marketing"]}>
        <PanelHomePage menuKey="marketing" title="Marketing" />
      </Protected>
    ),
  },
  {
    path: "/marketing/relatorios",
    element: (
      <Protected allowedRoles={["marketing"]}>
        <PanelSectionPage menuKey="marketing" title="Marketing" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/marketing/config",
    element: (
      <Protected allowedRoles={["marketing"]}>
        <PanelSectionPage menuKey="marketing" title="Marketing" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/marketing/campanhas",
    element: (
      <Protected allowedRoles={["marketing"]}>
        <PanelSectionPage menuKey="marketing" title="Marketing" section="Campanhas" />
      </Protected>
    ),
  },
  {
    path: "/marketing/materiais",
    element: (
      <Protected allowedRoles={["marketing"]}>
        <PanelSectionPage menuKey="marketing" title="Marketing" section="Materiais" />
      </Protected>
    ),
  },
];

export default marketingRoutes;
