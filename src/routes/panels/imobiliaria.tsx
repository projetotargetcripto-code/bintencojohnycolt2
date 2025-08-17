import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";

export const imobiliariaRoutes = [
  {
    path: "/imobiliaria",
    element: (
      <Protected allowedRoles={["imobiliaria"]}>
        <PanelHomePage menuKey="imobiliaria" title="Imobiliária" />
      </Protected>
    ),
  },
  {
    path: "/imobiliaria/relatorios",
    element: (
      <Protected allowedRoles={["imobiliaria"]}>
        <PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/imobiliaria/config",
    element: (
      <Protected allowedRoles={["imobiliaria"]}>
        <PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/imobiliaria/corretores",
    element: (
      <Protected allowedRoles={["imobiliaria"]}>
        <PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Corretores" />
      </Protected>
    ),
  },
  {
    path: "/imobiliaria/leads",
    element: (
      <Protected allowedRoles={["imobiliaria"]}>
        <PanelSectionPage menuKey="imobiliaria" title="Imobiliária" section="Leads" />
      </Protected>
    ),
  },
];

export default imobiliariaRoutes;
