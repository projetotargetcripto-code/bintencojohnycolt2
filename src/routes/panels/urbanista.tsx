import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const urbanistaRoutes = [
  {
    path: "/urbanista",
    element: (
      <Protected allowedRoles={["urbanista"]}>
        <PanelHomePage menuKey="urbanista" title="Urbanista" />
      </Protected>
    ),
  },
  {
    path: "/urbanista/relatorios",
    element: (
      <Protected allowedRoles={["urbanista"]}>
        <PanelSectionPage menuKey="urbanista" title="Urbanista" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/urbanista/config",
    element: (
      <Protected allowedRoles={["urbanista"]}>
        <PanelSectionPage menuKey="urbanista" title="Urbanista" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/urbanista/mapas",
    element: (
      <Protected allowedRoles={["urbanista"]}>
        <PanelSectionPage menuKey="urbanista" title="Urbanista" section="Mapas" />
      </Protected>
    ),
  },
  {
    path: "/urbanista/projetos",
    element: (
      <Protected allowedRoles={["urbanista"]}>
        <PanelSectionPage menuKey="urbanista" title="Urbanista" section="Projetos" />
      </Protected>
    ),
  },
];

export default urbanistaRoutes;
