import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Reset from "@/pages/Reset";
import LoginSuperAdmin from "@/pages/login/SuperAdmin";
import LoginAdmin from "@/pages/login/Admin";
import LoginImobiliaria from "@/pages/login/Imobiliaria";
import LoginCorretor from "@/pages/login/Corretor";
import LoginJuridico from "@/pages/login/Juridico";
import LoginUrbanismo from "@/pages/login/Urbanismo";
import LoginContabilidade from "@/pages/login/Contabilidade";
import LoginMarketing from "@/pages/login/Marketing";
import LoginComercial from "@/pages/login/Comercial";
import LoginObras from "@/pages/login/Obras";
import LoginInvestidor from "@/pages/login/Investidor";
import LoginTerrenista from "@/pages/login/Terrenista";
import Logout from "@/pages/Logout";
import AcessoNegado from "@/pages/AcessoNegado";

export const authRoutes = [
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/reset", element: <Reset /> },
  { path: "/login/super-admin", element: <LoginSuperAdmin /> },
  { path: "/login/admin", element: <LoginAdmin /> },
  { path: "/login/imobiliaria", element: <LoginImobiliaria /> },
  { path: "/login/corretor", element: <LoginCorretor /> },
  { path: "/login/juridico", element: <LoginJuridico /> },
  { path: "/login/urbanismo", element: <LoginUrbanismo /> },
  { path: "/login/contabilidade", element: <LoginContabilidade /> },
  { path: "/login/marketing", element: <LoginMarketing /> },
  { path: "/login/comercial", element: <LoginComercial /> },
  { path: "/login/obras", element: <LoginObras /> },
  { path: "/login/investidor", element: <LoginInvestidor /> },
  { path: "/login/terrenista", element: <LoginTerrenista /> },
  { path: "/logout", element: <Logout /> },
  { path: "/acesso-negado", element: <AcessoNegado /> },
];

export default authRoutes;
