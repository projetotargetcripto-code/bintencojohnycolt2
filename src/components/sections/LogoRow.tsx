import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";

export function LogoRowSection() {
  const partners = [
    "Exame", "Valor Econômico", "InfoMoney", "StartSe", "Estadão",
    "Gazeta do Povo", "MIT Tech Review", "NeoFeed", "Canal Tech", "Época Negócios",
    "Revista Infra", "Smart Cities", "TechTudo", "InvestNews", "PEGN"
  ];

  const loop = [...partners, ...partners];

  return (
    <Section id="logos">
      <div className="flex flex-col gap-6">
        <Heading as="h3" className="text-center text-xl sm:text-2xl">Parcerias e mídias</Heading>
        {/* TODO: Substituir por logos reais e links quando houver integrações oficiais */}
        <div className="marquee" aria-label="Logos de parcerias e mídias em rolagem contínua">
          <div className="marquee-track" style={{ ['--marquee-duration' as any]: '55s' }}>
            {loop.map((name, i) => (
              <div
                key={i}
                className="h-10 min-w-[140px] px-3 rounded-md border border-border bg-background/60 flex items-center justify-center text-xs text-muted-foreground"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
