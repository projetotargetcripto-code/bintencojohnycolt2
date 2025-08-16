import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { SignupForm } from "@/components/auth/SignupForm";
import { labelFromScope } from "@/config/authConfig";

export default function SignupPage() {
  const [params] = useSearchParams();
  const scope = params.get('scope');
  const label = labelFromScope(scope);
  const title = label ? `Criar conta — ${label}` : 'Criar conta';

  useEffect(() => {
    document.title = `${title} | BlockURB`;
    const meta = (document.querySelector('meta[name="description"]') as HTMLMetaElement) ?? (() => {
      const m = document.createElement('meta');
      m.name = 'description';
      document.head.appendChild(m);
      return m as HTMLMetaElement;
    })();
    meta.content = 'Crie sua conta para acessar os painéis exclusivos da BlockURB.';
  }, [title]);

  return (
    <AuthLayout>
      <SignupForm title={title} scope={scope} />
    </AuthLayout>
  );
}
