import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AuthProvider } from "@/providers/AuthProvider";
import NotFound from "@/pages/NotFound";

import publicRoutes from "@/routes/public";
import authRoutes from "@/routes/auth";
import superAdminRoutes from "@/routes/panels/superAdmin";
import adminFilialRoutes from "@/routes/panels/adminFilial";
import urbanistaRoutes from "@/routes/panels/urbanista";
import juridicoRoutes from "@/routes/panels/juridico";
import contabilidadeRoutes from "@/routes/panels/contabilidade";
import marketingRoutes from "@/routes/panels/marketing";
import comercialRoutes from "@/routes/panels/comercial";
import imobiliariaRoutes from "@/routes/panels/imobiliaria";
import corretorRoutes from "@/routes/panels/corretor";
import obrasRoutes from "@/routes/panels/obras";
import investidorRoutes from "@/routes/panels/investidor";
import terrenistaRoutes from "@/routes/panels/terrenista";

const queryClient = new QueryClient();

const renderRoutes = (routes: { path: string; element: JSX.Element }[]) =>
  routes.map(({ path, element }) => <Route key={path} path={path} element={element} />);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ProgressBar />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {renderRoutes(publicRoutes)}
            {renderRoutes(authRoutes)}
            {renderRoutes(superAdminRoutes)}
            {renderRoutes(adminFilialRoutes)}
            {renderRoutes(urbanistaRoutes)}
            {renderRoutes(juridicoRoutes)}
            {renderRoutes(contabilidadeRoutes)}
            {renderRoutes(marketingRoutes)}
            {renderRoutes(comercialRoutes)}
            {renderRoutes(imobiliariaRoutes)}
            {renderRoutes(corretorRoutes)}
            {renderRoutes(obrasRoutes)}
            {renderRoutes(investidorRoutes)}
            {renderRoutes(terrenistaRoutes)}
            <Route
              path="/debug/connection"
              lazy={async () => {
                const Component = (await import("./app/debug/connection/page")).default;
                return { Component };
              }}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
