import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/providers/AuthProvider";
import { publicRoutes, panelRoutes } from "@/config/routes";
import { Protected } from "@/components/Protected";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ProgressBar />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {publicRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            <Route path="/:filialId/*" element={<Outlet />}>
              {panelRoutes.map(({ path, element, roles, panelKey }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    roles ? (
                      <Protected allowedRoles={roles} panelKey={panelKey}>
                        {element}
                      </Protected>
                    ) : (
                      element
                    )
                  }
                />
              ))}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
