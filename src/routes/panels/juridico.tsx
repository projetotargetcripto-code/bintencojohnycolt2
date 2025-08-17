import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const juridicoRoutes = [
  {
    path: "/juridico",
    element: (
      <Protected allowedRoles={["juridico"]}>
        <PanelHomePage menuKey="juridico" title="Jurídico" />
      </Protected>
    ),
  },
  {
    path: "/juridico/relatorios",
    element: (
      <Protected allowedRoles={["juridico"]}>
        <PanelSectionPage menuKey="juridico" title="Jurídico" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/juridico/config",
    element: (
      <Protected allowedRoles={["juridico"]}>
        <PanelSectionPage menuKey="juridico" title="Jurídico" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/juridico/contratos",
    element: (
      <Protected allowedRoles={["juridico"]}>
        <PanelSectionPage menuKey="juridico" title="Jurídico" section="Contratos" />
      </Protected>
    ),
  },
  {
    path: "/juridico/processos",
    element: (
      <Protected allowedRoles={["juridico"]}>
        <PanelSectionPage menuKey="juridico" title="Jurídico" section="Processos" />
      </Protected>
    ),
  },
];

export default juridicoRoutes;
