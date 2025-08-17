import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";

export function LogoRowSection() {
  const partners = [
    { src: "/placeholder.svg", alt: "Exame", href: "#" },
    { src: "/placeholder.svg", alt: "Valor Econômico", href: "#" },
    { src: "/placeholder.svg", alt: "InfoMoney", href: "#" },
    { src: "/placeholder.svg", alt: "StartSe", href: "#" },
    { src: "/placeholder.svg", alt: "Estadão", href: "#" },
    { src: "/placeholder.svg", alt: "Gazeta do Povo", href: "#" },
    { src: "/placeholder.svg", alt: "MIT Tech Review", href: "#" },
    { src: "/placeholder.svg", alt: "NeoFeed", href: "#" },
    { src: "/placeholder.svg", alt: "Canal Tech", href: "#" },
    { src: "/placeholder.svg", alt: "Época Negócios", href: "#" },
    { src: "/placeholder.svg", alt: "Revista Infra", href: "#" },
    { src: "/placeholder.svg", alt: "Smart Cities", href: "#" },
    { src: "/placeholder.svg", alt: "TechTudo", href: "#" },
    { src: "/placeholder.svg", alt: "InvestNews", href: "#" },
    { src: "/placeholder.svg", alt: "PEGN", href: "#" }
  ];

  const loop = [...partners, ...partners];

  return (
    <Section id="logos">
      <div className="flex flex-col gap-6">
        <Heading as="h3" className="text-center text-xl sm:text-2xl">Parcerias e mídias</Heading>
        <div className="marquee" aria-label="Logos de parcerias e mídias em rolagem contínua">
          <div className="marquee-track" style={{ ['--marquee-duration' as any]: '55s' }}>
            {loop.map(({ src, alt, href }, i) => (
              <a
                key={i}
                href={href}
                aria-label={alt}
                className="h-10 min-w-[140px] px-3 rounded-md border border-border bg-background/60 flex items-center justify-center"
              >
                <img src={src} alt={alt} className="max-h-full w-auto" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
