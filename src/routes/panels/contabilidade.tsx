import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const contabilidadeRoutes = [
  {
    path: "/contabilidade",
    element: (
      <Protected allowedRoles={["contabilidade"]}>
        <PanelHomePage menuKey="contabilidade" title="Contabilidade" />
      </Protected>
    ),
  },
  {
    path: "/contabilidade/relatorios",
    element: (
      <Protected allowedRoles={["contabilidade"]}>
        <PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/contabilidade/config",
    element: (
      <Protected allowedRoles={["contabilidade"]}>
        <PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/contabilidade/financeiro",
    element: (
      <Protected allowedRoles={["contabilidade"]}>
        <PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Financeiro" />
      </Protected>
    ),
  },
  {
    path: "/contabilidade/fiscal",
    element: (
      <Protected allowedRoles={["contabilidade"]}>
        <PanelSectionPage menuKey="contabilidade" title="Contabilidade" section="Fiscal" />
      </Protected>
    ),
  },
];

export default contabilidadeRoutes;
