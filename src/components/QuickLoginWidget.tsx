import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, User, Settings, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/dataClient";
import { scopeRoutes } from "@/config/authConfig";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface QuickLoginCredential {
  email: string;
  password: string;
  label: string;
  role: string;
  panel: string;
  icon: any;
}

const allCredentials: QuickLoginCredential[] = [
  {
    email: 'superadmin@blockurb.com',
    password: 'BlockUrb2024!',
    label: 'Super Admin',
    role: 'superadmin',
    panel: scopeRoutes.superadmin,
    icon: Crown,
  },
  {
    email: 'admin@blockurb.com',
    password: 'Admin2024!',
    label: 'Admin Filial',
    role: 'admin',
    panel: scopeRoutes.admin,
    icon: User,
  },
  {
    email: 'urbanista@blockurb.com',
    password: 'Urban2024!',
    label: 'Urbanista',
    role: 'urbanista',
    panel: '/urbanista',
    icon: User,
  },
  {
    email: 'juridico@blockurb.com',
    password: 'Legal2024!',
    label: 'Jurídico',
    role: 'juridico',
    panel: scopeRoutes.juridico,
    icon: User,
  },
  {
    email: 'contabilidade@blockurb.com',
    password: 'Conta2024!',
    label: 'Contabilidade',
    role: 'contabilidade',
    panel: scopeRoutes.contabilidade,
    icon: User,
  },
  {
    email: 'marketing@blockurb.com',
    password: 'Market2024!',
    label: 'Marketing',
    role: 'marketing',
    panel: scopeRoutes.marketing,
    icon: User,
  },
  {
    email: 'comercial@blockurb.com',
    password: 'Venda2024!',
    label: 'Comercial',
    role: 'comercial',
    panel: scopeRoutes.comercial,
    icon: User,
  },
  {
    email: 'imobiliaria@blockurb.com',
    password: 'Imob2024!',
    label: 'Imobiliária',
    role: 'imobiliaria',
    panel: scopeRoutes.imobiliaria,
    icon: User,
  },
  {
    email: 'corretor@blockurb.com',
    password: 'Corret2024!',
    label: 'Corretor',
    role: 'corretor',
    panel: scopeRoutes.corretor,
    icon: User,
  },
  {
    email: 'obras@blockurb.com',
    password: 'Obras2024!',
    label: 'Obras',
    role: 'obras',
    panel: scopeRoutes.obras,
    icon: User,
  },
  {
    email: 'investidor@blockurb.com',
    password: 'Invest2024!',
    label: 'Investidor',
    role: 'investidor',
    panel: scopeRoutes.investidor,
    icon: User,
  },
  {
    email: 'terrenista@blockurb.com',
    password: 'Terra2024!',
    label: 'Terrenista',
    role: 'terrenista',
    panel: scopeRoutes.terrenista,
    icon: User,
  },
];

interface QuickLoginWidgetProps {
  compact?: boolean;
  className?: string;
}

export function QuickLoginWidget({ compact = false, className = "" }: QuickLoginWidgetProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const quickLogin = async (cred: QuickLoginCredential) => {
    setError(null);
    setLoading(cred.email);
    
    try {
      const { data: res, error } = await supabase.auth.signInWithPassword({ 
        email: cred.email, 
        password: cred.password 
      });
      
      if (error) { 
        setError(error.message || "Falha ao entrar"); 
        return; 
      }
      
      if (res?.session) {
        navigate(cred.panel);
      }
    } catch (err) {
      setError("Erro inesperado ao fazer login");
    } finally {
      setLoading(null);
    }
  };

  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 border-amber-200 hover:border-amber-300 hover:bg-amber-100/50 dark:border-amber-800"
          >
            <Zap className="h-4 w-4" />
            Login Rápido
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="border-dashed border-2 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="p-3">
              <div className="grid gap-1 max-h-60 overflow-y-auto">
                {allCredentials.map((cred, index) => {
                  const IconComponent = cred.icon;
                  const isLoading = loading === cred.email;
                  
                  return (
                    <Button
                      key={index}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => quickLogin(cred)}
                      disabled={!!loading}
                      className="w-full justify-start gap-2 h-auto py-1.5 px-2 text-xs hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
                    >
                      <IconComponent className="h-3 w-3" />
                      <span className="font-medium">{cred.label}</span>
                      {isLoading && <span className="ml-auto">...</span>}
                    </Button>
                  );
                })}
              </div>
              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Card className={`border-dashed border-2 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Login Rápido (Desenvolvimento)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {allCredentials.map((cred, index) => {
            const IconComponent = cred.icon;
            const isLoading = loading === cred.email;
            
            return (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin(cred)}
                disabled={!!loading}
                className="w-full justify-start gap-2 h-auto py-2 px-3 border-amber-200 hover:border-amber-300 hover:bg-amber-100/50 dark:border-amber-800 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
              >
                <IconComponent className="h-4 w-4" />
                <div className="flex flex-col items-start flex-1">
                  <span className="font-medium">{cred.label}</span>
                  <span className="text-xs text-muted-foreground">{cred.email}</span>
                </div>
                {isLoading && <Settings className="h-4 w-4 animate-spin" />}
              </Button>
            );
          })}
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
          Clique em qualquer usuário para fazer login automático.
        </p>
      </CardContent>
    </Card>
  );
}
