import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Shield,
  Building2,
  Map,
  ScrollText,
  Calculator,
  Megaphone,
  Briefcase,
  Home,
  User,
  LineChart,
  Landmark,
  Hammer
} from "lucide-react";

const cards = [
  { title: "Painel Super Admin", desc: "Controle total da plataforma e permissões.", href: "/login/super-admin", Icon: Shield },
  { title: "Painel Admin Filial", desc: "Gestão completa da filial e operações.", href: "/login/admin", Icon: Building2 },
  { title: "Painel Urbanismo", desc: "Projetos, mapas e integrações GIS.", href: "/login/urbanismo", Icon: Map },
  { title: "Painel Jurídico", desc: "Contratos e regularização fundiária.", href: "/login/juridico", Icon: ScrollText },
  { title: "Painel Contabilidade", desc: "Financeiro e relatórios fiscais.", href: "/login/contabilidade", Icon: Calculator },
  { title: "Painel Marketing", desc: "Campanhas e materiais de venda.", href: "/login/marketing", Icon: Megaphone },
  { title: "Painel Comercial", desc: "Negociações e fechamento de vendas.", href: "/login/comercial", Icon: Briefcase },
  { title: "Painel Imobiliária", desc: "Corretores, imóveis e leads.", href: "/login/imobiliaria", Icon: Home },
  { title: "Painel Corretores", desc: "Leads, agenda e vendas.", href: "/login/corretor", Icon: User },
  { title: "Painel Investidor", desc: "Investimentos e rentabilidade.", href: "/login/investidor", Icon: LineChart },
  { title: "Painel Terrenista", desc: "Projeto, retorno e status da gleba.", href: "/login/terrenista", Icon: Landmark },
  { title: "Painel Obras", desc: "Cronograma e andamento de obras.", href: "/login/obras", Icon: Hammer },
] as const;

const Acesso = () => {
  useEffect(() => {
    // SEO
    document.title = "Acessos BlockURB | Hub de Painéis";
    const meta = (document.querySelector('meta[name="description"]') as HTMLMetaElement) ?? (() => {
      const m = document.createElement('meta');
      m.name = 'description';
      document.head.appendChild(m);
      return m as HTMLMetaElement;
    })();
    meta.content = "Selecione o painel desejado para acessar sua área exclusiva.";

    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.href;
    document.head.appendChild(canonical);

    // Forçar tema escuro nesta página
    document.documentElement.classList.add('dark');

    return () => {
      document.head.removeChild(canonical);
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <section className="relative">
          <div className="absolute inset-0 pattern-grid opacity-[0.06] pointer-events-none" aria-hidden />
          <div className="container py-16">
            <h1 className="text-3xl sm:text-4xl font-extrabold">Acessos BlockURB</h1>
            <div className="title-accent" />
            <h2 className="mt-3 text-muted-foreground">Selecione o painel desejado para acessar sua área exclusiva</h2>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(({ title, desc, href, Icon }, idx) => (
                <a key={title} href={href} className="group relative block card-elevated bg-background/70 ring-1 ring-accent/20 hover:ring-primary/70 transition-all hover:scale-[1.03] hover:brightness-110 animate-enter overflow-hidden">
                  <div className="pointer-events-none absolute -inset-px rounded-lg bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col gap-3">
                    <Icon className="size-12 text-primary" />
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                    <div className="mt-2">
                      <Button variant="cta" size="sm" className="hover-scale">Acessar</Button>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Acesso;

