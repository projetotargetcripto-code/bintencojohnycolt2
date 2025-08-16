import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";

export function StatsSection() {
  return (
    <Section id="stats" className="">
      <div className="container">
        <div className="rounded-lg bg-muted/60 border border-border p-6">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <Heading as="h3" className="text-xl sm:text-2xl">Números que importam</Heading>
              <p className="text-muted-foreground mt-1">Resultados que reforçam confiança e velocidade</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto">
              <div className="text-center">
                <div className="text-2xl font-semibold">40%</div>
                <div className="text-xs text-muted-foreground">captação mais rápida</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">R$ 50M</div>
                <div className="text-xs text-muted-foreground">potencial tokenizado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">90 dias</div>
                <div className="text-xs text-muted-foreground">média para lançar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">NPS 86</div>
                <div className="text-xs text-muted-foreground">satisfação de parceiros</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
