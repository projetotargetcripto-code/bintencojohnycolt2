import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthorization } from "@/providers/AuthorizationProvider";
import { supabase } from "@/lib/dataClient";
import { useEffect } from "react";

export default function AcessoNegado() {
  const navigate = useNavigate();
  const { profile } = useAuthorization();

  useEffect(() => {
    document.title = "Acesso Negado | BlockURB";
  }, []);

  const handleLogoutAndLogin = async () => {
    await supabase.auth.signOut();
    navigate('/acesso');
  };

  const handleGoBack = () => {
    // Tenta voltar para a página anterior. Se não houver histórico, vai para a home do perfil.
    if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
    } else {
        // Lógica simples para encontrar uma página inicial segura
        const homePath = profile?.role ? `/${profile.role}` : '/';
        navigate(homePath, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold">Acesso Negado</h1>
        <p className="mt-2 text-muted-foreground">
          Você está autenticado, mas não possui permissão para acessar esta página.
        </p>
        {profile && (
            <p className="mt-2 text-sm text-muted-foreground">
                Seu nível de acesso atual é: <span className="font-semibold text-foreground">{profile.role}</span>.
            </p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleGoBack} variant="outline">
                Voltar
            </Button>
            <Button onClick={handleLogoutAndLogin}>
                Fazer Login com Outro Usuário
            </Button>
        </div>
      </div>
    </div>
  );
}

