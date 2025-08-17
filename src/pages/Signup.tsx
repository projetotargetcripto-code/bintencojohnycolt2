import { useEffect } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  const title = 'Criar conta';

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
      <SignupForm title={title} />
    </AuthLayout>
  );
}
