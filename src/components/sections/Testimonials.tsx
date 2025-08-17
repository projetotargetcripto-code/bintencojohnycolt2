import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";

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
  const [testimonials, setTestimonials] = useState<TestimonialProps[]>([]);

  useEffect(() => {
    supabase
      .from('testemunhos')
      .select('quote, name, role')
      .then(({ data }) => {
        if (data) setTestimonials(data);
      });
  }, []);

  const loop = [...testimonials, ...testimonials];

  if (testimonials.length === 0) return null;

  return (
    <Section id="testemunhos">
      <Heading as="h3" className="text-xl sm:text-2xl">O que dizem os parceiros</Heading>
        <div className="mt-6 marquee" aria-label="Depoimentos de parceiros em rolagem contínua">
          <div className="marquee-track" style={{ ['--marquee-duration' as string]: '65s' }}>
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
