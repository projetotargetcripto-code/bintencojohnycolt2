import Index from "@/pages/Index";
import Whitepaper from "@/pages/Whitepaper";
import Acesso from "@/pages/Acesso";

export const publicRoutes = [
  { path: "/", element: <Index /> },
  { path: "/whitepaper", element: <Whitepaper /> },
  { path: "/acesso", element: <Acesso /> },
];

export default publicRoutes;
