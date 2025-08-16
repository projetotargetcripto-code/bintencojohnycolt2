import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FAQSection() {
  return (
    <Section id="faq">
      <Heading as="h3" className="text-xl sm:text-2xl">Perguntas frequentes</Heading>
      <Accordion type="single" collapsible className="mt-4">
        <AccordionItem value="item-1">
          <AccordionTrigger>O que é tokenização parcial?</AccordionTrigger>
          <AccordionContent>
            É a divisão do ativo em cotas digitais para democratizar o investimento sem eliminar a compra tradicional de lotes.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Como funciona a franquia BlockURB?</AccordionTrigger>
          <AccordionContent>
            Licença exclusiva por território, com suporte em urbanismo, jurídico, marketing e plataforma tecnológica.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Qual o investimento inicial?</AccordionTrigger>
          <AccordionContent>
            Varia por território e escopo. Iniciamos com diagnóstico e plano de viabilidade.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>Vocês oferecem suporte contínuo?</AccordionTrigger>
          <AccordionContent>
            Sim, do lançamento à operação, incluindo captação via tokenização parcial.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Section>
  );
}
