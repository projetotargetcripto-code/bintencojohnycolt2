import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { ResetForm } from "@/components/auth/ResetForm";

export default function ResetPage() {
  const [params] = useSearchParams();
  const scope = params.get('scope');

  useEffect(() => {
    document.title = `Recuperar senha | BlockURB`;
    const meta = (document.querySelector('meta[name="description"]') as HTMLMetaElement) ?? (() => {
      const m = document.createElement('meta');
      m.name = 'description';
      document.head.appendChild(m);
      return m as HTMLMetaElement;
    })();
    meta.content = 'Receba um link para redefinir sua senha da plataforma BlockURB.';
  }, []);

  return (
    <AuthLayout>
      <ResetForm scope={scope} />
    </AuthLayout>
  );
}
