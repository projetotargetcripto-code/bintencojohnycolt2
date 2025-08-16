import { useEffect } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { labelFromScope, pathFromScope } from "@/config/authConfig";

const SCOPE = "investidor" as const;

export default function LoginInvestidor() {
  const TITLE = `Entrar — ${labelFromScope(SCOPE)}`;
  const REDIRECT = pathFromScope(SCOPE);

  useEffect(() => {
    document.title = `${TITLE} | BlockURB`;
  }, []);

  return (
    <AuthLayout>
      <LoginForm title={TITLE} scope={SCOPE} redirectPath={REDIRECT} />
    </AuthLayout>
  );
}
