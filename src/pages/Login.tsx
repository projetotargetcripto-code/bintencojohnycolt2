import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { labelFromScope, pathFromScope } from "@/config/authConfig";

export default function LoginPage() {
  const [params] = useSearchParams();
  const routeParams = useParams();
  const rawScope = params.get("scope") || routeParams.scope || undefined;
  const scopeParam = rawScope?.toLowerCase().replace(/-/g, "") || undefined;
  const msg = params.get("msg");
  const [defaultScope, setDefaultScope] = useState<string | null>(null);
  const [allowedPanels, setAllowedPanels] = useState<string[] | undefined>();
  const [brand, setBrand] = useState<string | null>(null);
  const scope = scopeParam || defaultScope;
  const label = labelFromScope(scope);
  const redirectPath = pathFromScope(scope);
  const title = label ? `Entrar — ${label}` : brand ? `Entrar — ${brand}` : "Entrar na plataforma";

    useEffect(() => {
      document.title = `${title} | ${brand || 'BlockURB'}`;
    const meta = (document.querySelector('meta[name="description"]') as HTMLMetaElement) ?? (() => {
      const m = document.createElement('meta');
      m.name = 'description';
      document.head.appendChild(m);
      return m as HTMLMetaElement;
    })();
    meta.content = 'Acesse sua conta com segurança na plataforma BlockURB.';
    }, [title, brand]);

    useEffect(() => {
      const host = window.location.host;
      const mapPanelToScope = (p: string) => p.toLowerCase().replace(/-/g, "");
      const mapPanelToPath = (p: string) => pathFromScope(mapPanelToScope(p));
      fetch(`/resolve-domain?domain=${host}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setBrand(data.nome || null);
            if (Array.isArray(data.panels)) {
              setAllowedPanels(data.panels.map(mapPanelToPath));
              if (!scopeParam && data.panels.length > 0) {
                setDefaultScope(mapPanelToScope(data.panels[0]));
              }
            }
          }
        })
        .catch(() => {});
    }, [scopeParam]);

  return (
    <AuthLayout>
      <div className="space-y-6">
        {msg === "check-email" && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Verifique seu e-mail para confirmar o cadastro.
          </div>
        )}
          <LoginForm
            title={title}
            subtitle={label ? `Área: ${label}` : undefined}
            scope={scope}
            redirectPath={redirectPath}
            allowedPanels={scope ? [redirectPath] : undefined}
          />
      </div>
    </AuthLayout>
  );
}
