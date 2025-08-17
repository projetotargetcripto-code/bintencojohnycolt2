import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const investidorRoutes = [
  {
    path: "/investidor",
    element: (
      <Protected allowedRoles={["investidor"]}>
        <PanelHomePage menuKey="investidor" title="Investidor" />
      </Protected>
    ),
  },
  {
    path: "/investidor/relatorios",
    element: (
      <Protected allowedRoles={["investidor"]}>
        <PanelSectionPage menuKey="investidor" title="Investidor" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/investidor/config",
    element: (
      <Protected allowedRoles={["investidor"]}>
        <PanelSectionPage menuKey="investidor" title="Investidor" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/investidor/carteira",
    element: (
      <Protected allowedRoles={["investidor"]}>
        <PanelSectionPage menuKey="investidor" title="Investidor" section="Carteira" />
      </Protected>
    ),
  },
  {
    path: "/investidor/suporte",
    element: (
      <Protected allowedRoles={["investidor"]}>
        <PanelSectionPage menuKey="investidor" title="Investidor" section="Suporte" />
      </Protected>
    ),
  },
];

export default investidorRoutes;
