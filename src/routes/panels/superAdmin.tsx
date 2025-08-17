import { Protected } from "@/components/Protected";
import { PanelHomePage, PanelSectionPage } from "@/components/panels/PanelPages";
import AdminsFiliaisPage from "@/pages/admin/AdminsFiliais";
import FiliaisInternasPage from "@/pages/admin/FiliaisInternas";
import ClientesSaasPage from "@/pages/admin/ClientesSaas";
import FiliaisAccessPage from "@/pages/admin/FiliaisAccess";
import MapaSuperAdmin from "@/pages/admin/MapaSuperAdmin";
import UsuariosPage from "@/pages/admin/Usuarios";
import AprovacaoEmpreendimentos from "@/pages/admin/AprovacaoEmpreendimentos";

export const superAdminRoutes = [
  {
    path: "/super-admin",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <PanelHomePage menuKey="superadmin" title="Super Admin" />
      </Protected>
    ),
  },
  {
    path: "/super-admin/admins-filiais",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <AdminsFiliaisPage />
      </Protected>
    ),
  },
  {
    path: "/super-admin/filiais-internas",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <FiliaisInternasPage />
      </Protected>
    ),
  },
  {
    path: "/super-admin/clientes-saas",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <ClientesSaasPage />
      </Protected>
    ),
  },
  {
    path: "/super-admin/filiais-acessos",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <FiliaisAccessPage />
      </Protected>
    ),
  },
  {
    path: "/super-admin/mapa",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <MapaSuperAdmin />
      </Protected>
    ),
  },
  {
    path: "/super-admin/relatorios",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <PanelSectionPage menuKey="superadmin" title="Super Admin" section="Relatórios" />
      </Protected>
    ),
  },
  {
    path: "/super-admin/config",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <PanelSectionPage menuKey="superadmin" title="Super Admin" section="Configurações" />
      </Protected>
    ),
  },
  {
    path: "/super-admin/organizacoes",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <PanelSectionPage menuKey="superadmin" title="Super Admin" section="Organizações" />
      </Protected>
    ),
  },
  {
    path: "/super-admin/usuarios",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <UsuariosPage />
      </Protected>
    ),
  },
  {
    path: "/super-admin/tokenizacao",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <PanelSectionPage menuKey="superadmin" title="Super Admin" section="Tokenização" />
      </Protected>
    ),
  },
  {
    path: "/super-admin/aprovacao",
    element: (
      <Protected allowedRoles={["superadmin"]}>
        <AprovacaoEmpreendimentos />
      </Protected>
    ),
  },
];

export default superAdminRoutes;
