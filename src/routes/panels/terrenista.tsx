import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const terrenistaRoutes = [
  {
    path: "/terrenista",
    element: (
      <Protected allowedRoles={["terrenista"]}>
        <PanelHomePage menuKey="terrenista" title="Terrenista" />
      </Protected>
    ),
  },
  {
    path: "/terrenista/relatorios",
    element: (
      <Protected allowedRoles={["terrenista"]}>
        <PanelSectionPage menuKey="terrenista" title="Terrenista" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/terrenista/config",
    element: (
      <Protected allowedRoles={["terrenista"]}>
        <PanelSectionPage menuKey="terrenista" title="Terrenista" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/terrenista/status",
    element: (
      <Protected allowedRoles={["terrenista"]}>
        <PanelSectionPage menuKey="terrenista" title="Terrenista" section="Status" />
      </Protected>
    ),
  },
  {
    path: "/terrenista/pagamentos",
    element: (
      <Protected allowedRoles={["terrenista"]}>
        <PanelSectionPage menuKey="terrenista" title="Terrenista" section="Pagamentos" />
      </Protected>
    ),
  },
];

export default terrenistaRoutes;
