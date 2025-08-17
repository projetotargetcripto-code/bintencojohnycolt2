import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const obrasRoutes = [
  {
    path: "/obras",
    element: (
      <Protected allowedRoles={["obras"]}>
        <PanelHomePage menuKey="obras" title="Obras" />
      </Protected>
    ),
  },
  {
    path: "/obras/relatorios",
    element: (
      <Protected allowedRoles={["obras"]}>
        <PanelSectionPage menuKey="obras" title="Obras" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/obras/config",
    element: (
      <Protected allowedRoles={["obras"]}>
        <PanelSectionPage menuKey="obras" title="Obras" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/obras/cronograma",
    element: (
      <Protected allowedRoles={["obras"]}>
        <PanelSectionPage menuKey="obras" title="Obras" section="Cronograma" />
      </Protected>
    ),
  },
  {
    path: "/obras/andamento",
    element: (
      <Protected allowedRoles={["obras"]}>
        <PanelSectionPage menuKey="obras" title="Obras" section="Andamento" />
      </Protected>
    ),
  },
];

export default obrasRoutes;
