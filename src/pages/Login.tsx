import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { labelFromScope, pathFromScope } from "@/config/authConfig";
import { QuickLoginWidget } from "@/components/QuickLoginWidget";

export default function LoginPage() {
  const [params] = useSearchParams();
  const scope = params.get('scope');
  const label = labelFromScope(scope);
  const redirectPath = pathFromScope(scope);
  const title = label ? `Entrar — ${label}` : 'Entrar na plataforma';

  useEffect(() => {
    document.title = `${title} | BlockURB`;
    const meta = (document.querySelector('meta[name="description"]') as HTMLMetaElement) ?? (() => {
      const m = document.createElement('meta');
      m.name = 'description';
      document.head.appendChild(m);
      return m as HTMLMetaElement;
    })();
    meta.content = 'Acesse sua conta com segurança na plataforma BlockURB.';
  }, [title]);

  return (
    <AuthLayout>
      <div className="space-y-6">
        <LoginForm title={title} subtitle={label ? `Área: ${label}` : undefined} scope={scope} redirectPath={redirectPath} />
        
        {/* Widget de Login Rápido na página de login sem scope específico */}
        {!scope && (
          <div className="border-t pt-6">
            <QuickLoginWidget />
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
