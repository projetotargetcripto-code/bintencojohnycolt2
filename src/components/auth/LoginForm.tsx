import { useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Crown, User, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/dataClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface LoginFormProps {
  title: string;
  subtitle?: string;
  scope?: string | null;
  redirectPath?: string;
}

export function LoginForm({ title, subtitle, scope, redirectPath }: LoginFormProps) {
  const { register, handleSubmit, setValue } = useForm<{ email: string; password: string }>();
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    setLoading(true);
    
    try {
      const { data: res, error } = await supabase.auth.signInWithPassword({ 
        email: data.email, 
        password: data.password 
      });
      
      if (error) { 
        setError(error.message || "Falha ao entrar"); 
        return; 
      }
      
      if (res?.session) {
        navigate(redirectPath || "/admin");
      }
    } catch (err) {
      setError("Erro inesperado ao fazer login");
    } finally {
      setLoading(false);
    }
  });

  // Função para login rápido
  const quickLogin = async (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    setError(null);
    setLoading(true);
    
    try {
      const { data: res, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) { 
        setError(error.message || "Falha ao entrar"); 
        return; 
      }
      
      if (res?.session) {
        navigate(redirectPath || "/admin");
      }
    } catch (err) {
      setError("Erro inesperado ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const preserve = scope ? `?scope=${encodeURIComponent(scope)}` : '';

  // Credenciais de teste para desenvolvimento
  const getQuickLoginCredentials = () => {
    // Retorna a lista completa de todos os usuários, ignorando o 'scope' da página.
    return [
      { email: 'superadmin@blockurb.com', password: 'BlockUrb2024!', label: 'Super Admin', icon: Crown },
      { email: 'admin@blockurb.com', password: 'Admin2024!', label: 'Admin Filial', icon: User },
      { email: 'urbanista@blockurb.com', password: 'Urban2024!', label: 'Urbanista', icon: User },
      { email: 'juridico@blockurb.com', password: 'Legal2024!', label: 'Jurídico', icon: User },
      { email: 'contabilidade@blockurb.com', password: 'Conta2024!', label: 'Contabilidade', icon: User },
      { email: 'marketing@blockurb.com', password: 'Market2024!', label: 'Marketing', icon: User },
      { email: 'comercial@blockurb.com', password: 'Venda2024!', label: 'Comercial', icon: User },
      { email: 'imobiliaria@blockurb.com', password: 'Imob2024!', label: 'Imobiliária', icon: User },
      { email: 'corretor@blockurb.com', password: 'Corret2024!', label: 'Corretor', icon: User },
      { email: 'obras@blockurb.com', password: 'Obras2024!', label: 'Obras', icon: User },
      { email: 'investidor@blockurb.com', password: 'Invest2024!', label: 'Investidor', icon: User },
      { email: 'terrenista@blockurb.com', password: 'Terra2024!', label: 'Terrenista', icon: User },
    ];
  };

  const quickCredentials = getQuickLoginCredentials();

  return (
    <div className="space-y-6">
      {/* Botões de Login Rápido */}
      {quickCredentials.length > 0 && (
        <Card className="border-dashed border-2 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
              ⚡ Login Rápido (Desenvolvimento)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              {quickCredentials.map((cred, index) => {
                const IconComponent: LucideIcon = cred.icon;
                return (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin(cred.email, cred.password)}
                    disabled={loading}
                    className="w-full justify-start gap-2 h-auto py-2 px-3 border-amber-200 hover:border-amber-300 hover:bg-amber-100/50 dark:border-amber-800 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
                  >
                    <IconComponent className="h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{cred.label}</span>
                      <span className="text-xs text-muted-foreground">{cred.email}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
              Estes botões são apenas para desenvolvimento e testes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Formulário Normal */}
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              autoComplete="email" 
              placeholder="voce@empresa.com" 
              disabled={loading}
              {...register('email')} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={show ? 'text' : 'password'} 
                autoComplete="current-password" 
                placeholder="••••••••" 
                disabled={loading}
                {...register('password')} 
              />
              <button 
                type="button" 
                onClick={() => setShow((s) => !s)} 
                disabled={loading}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} 
                className="absolute inset-y-0 right-2 inline-flex items-center justify-center px-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          variant="cta" 
          size="lg" 
          className="w-full btn-glow active:scale-[0.99]"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        {error && <div className="text-sm text-destructive" role="alert" aria-live="assertive">{error}</div>}

        <div className="text-sm text-muted-foreground">
          Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <a href={`/signup${preserve}`} className="story-link">Criar conta</a>
          <a href={`/reset${preserve}`} className="story-link">Esqueci minha senha</a>
        </div>

        <div role="status" aria-live="polite" className="sr-only" />
      </form>
    </div>
  );
}
