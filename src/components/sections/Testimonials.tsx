import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
}

function TestimonialCard({ quote, name, role }: TestimonialProps) {
  return (
    <article className="p-6 rounded-lg border border-border bg-background card-hover h-full">
      <p className="text-sm">“{quote}”</p>
      <div className="mt-4 text-sm">
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground">{role}</div>
      </div>
    </article>
  );
}

export function TestimonialsSection() {
  const testimonials: TestimonialProps[] = [
    { quote: "Operação leve, processos claros e suporte 360°. Resultado em tempo recorde.", name: "Mariana S.", role: "Franqueada • MG" },
    { quote: "Tokenização parcial abriu um novo público e acelerou a captação.", name: "Rafael T.", role: "Investidor • SP" },
    { quote: "Transformamos a gleba em um projeto vendável com previsibilidade.", name: "João P.", role: "Terrenista • PR" },
    { quote: "Painéis claros. Consegui gerir equipe e funil sem planilhas.", name: "Carlos M.", role: "Admin Filial • RS" },
    { quote: "Relatórios confiáveis e auditoria facilitada reduziram retrabalho.", name: "Lívia A.", role: "Contabilidade • SP" },
  ];

  const loop = [...testimonials, ...testimonials];

  return (
    <Section id="testemunhos">
      <Heading as="h3" className="text-xl sm:text-2xl">O que dizem os parceiros</Heading>
      {/* TODO: Substituir por depoimentos reais vindos da base quando integrar Supabase */}
      <div className="mt-6 marquee" aria-label="Depoimentos de parceiros em rolagem contínua">
        <div className="marquee-track" style={{ ['--marquee-duration' as any]: '65s' }}>
          {loop.map((t, i) => (
            <div key={i} className="w-[320px]">
              <TestimonialCard {...t} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
