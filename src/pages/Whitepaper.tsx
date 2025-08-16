import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  { id: "introducao", title: "Introdução", body: "A BlockURB propõe um novo modelo para criar bairros planejados conectando urbanismo, tecnologia e tokenização parcial. Este whitepaper descreve a visão, os pilares técnicos e o modelo operacional." },
  { id: "visao", title: "Visão e Objetivos", body: "Acelerar a implantação de bairros inteligentes com governança clara, padronização de processos e acesso democratizado ao investimento imobiliário." },
  { id: "arquitetura", title: "Arquitetura da Solução", body: "Camadas modulares: dados e integrações, operação (painéis), experiência (portais), e liquidez (tokenização parcial). Cada camada é independente, mas interoperável." },
  { id: "modelo", title: "Modelo de Negócio", body: "Franquia territorial com suporte 360°, receitas recorrentes por operação e participação em resultados. Tokenização parcial amplia captação e reduz risco de capital próprio." },
  { id: "governanca", title: "Governança e Compliance", body: "Processos auditáveis, trilhas de aprovação e segregação de funções. Documentação e relatórios oferecem transparência a parceiros e investidores." },
  { id: "roadmap", title: "Roadmap", body: "Fases: implantação do hub de operação, padronização de projetos, expansão territorial e marketplace local, com integração de serviços e comunidade." },
];

const Whitepaper = () => {
  const [active, setActive] = useState<string>(sections[0].id);

  useEffect(() => {
    document.title = "Whitepaper | BlockURB";
    const meta = (document.querySelector('meta[name="description"]') as HTMLMetaElement) ?? (() => {
      const m = document.createElement('meta');
      m.name = 'description';
      document.head.appendChild(m);
      return m as HTMLMetaElement;
    })();
    meta.content = "Whitepaper do projeto BlockURB: visão, arquitetura e modelo.";

    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.href;
    document.head.appendChild(canonical);

    // JSON-LD (TechArticle)
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": "Whitepaper BlockURB",
      "description": meta.content,
      "inLanguage": "pt-BR",
      "author": { "@type": "Organization", "name": "BlockURB" },
      "publisher": {
        "@type": "Organization",
        "name": "BlockURB",
        "logo": { "@type": "ImageObject", "url": "/lovable-uploads/69c3ca3e-8a72-4b83-8f97-2ffdd18f9508.png" }
      },
      "url": window.location.href
    });
    document.head.appendChild(ld);

    return () => {
      document.head.removeChild(canonical);
      document.head.removeChild(ld);
    };
  }, []);

  // Scrollspy simples
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-wp-section]')) as HTMLElement[];
    const obs = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target) setActive((visible.target as HTMLElement).id);
    }, { rootMargin: "-40% 0px -50% 0px", threshold: [0.1, 0.25, 0.5, 0.75] });

    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="story-link inline-flex items-center gap-1" aria-label="Voltar para a página inicial">
              <ArrowLeft className="opacity-80" />
              <span>Voltar</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 font-bold">
            <img src="/lovable-uploads/69c3ca3e-8a72-4b83-8f97-2ffdd18f9508.png" alt="Logo BlockURB" className="h-6 w-6 rounded-sm" loading="lazy" decoding="async" />
            <span><span className="text-primary">Block</span>URB</span>
          </div>
        </div>
      </header>

      <main>
        <section className="container py-10">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold">Whitepaper BlockURB</h1>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            Documento técnico com a visão, arquitetura e modelo operacional da BlockURB. Acesse o sumário ao lado e navegue pelas seções.
          </p>
        </section>

        <section className="container pb-16">
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            {/* Sidebar */}
            <aside className="md:sticky md:top-20 h-max">
              <nav aria-label="Sumário do whitepaper" className="rounded-lg border border-border bg-card/80 p-2">
                {sections.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${active === s.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-current={active === s.id ? 'page' : undefined}
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="space-y-8">
              {sections.map(s => (
                <article key={s.id} id={s.id} data-wp-section className="rounded-lg border border-border bg-card/80 p-6">
                  <h2 className="text-xl sm:text-2xl font-semibold">{s.title}</h2>
                  <div className="title-accent" />
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                    {s.body} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus commodo, nisl non porta posuere, risus arcu congue risus, in
                    sollicitudin neque libero vel justo. Integer ut nibh at neque rutrum finibus. Proin a augue mi. Fusce tempus, ligula in iaculis
                    faucibus, ipsum augue tincidunt est, nec facilisis leo risus ut massa.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Whitepaper;
