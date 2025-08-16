import { MessageCircle } from "lucide-react";

interface WhatsAppFloatProps {
  href?: string;
  className?: string;
  label?: string;
}

export function WhatsAppFloat({
  href = "https://wa.me/5500000000000?text=Quero%20falar%20com%20um%20especialista%20da%20BlockURB",
  className,
  label = "Falar com Especialista",
}: WhatsAppFloatProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com Especialista no WhatsApp"
      className={
        "inline-flex fixed bottom-6 right-6 z-50 items-center gap-2 h-12 px-4 rounded-full bg-accent text-accent-foreground shadow-lg transition-transform duration-200 hover:scale-105 " +
        (className ?? "")
      }
    >
      <MessageCircle />
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
