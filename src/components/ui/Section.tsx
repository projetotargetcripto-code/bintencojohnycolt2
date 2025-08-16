import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

interface SectionProps {
  id?: string;
  className?: string;
  container?: boolean;
}

export function Section({ id, className, container = true, children }: PropsWithChildren<SectionProps>) {
  const { ref } = useRevealOnScroll<HTMLElement>();
  const Inner = (
    <div className={cn(container && "container", className)}>
      {children}
    </div>
  );

  return (
    <section id={id} ref={ref as any} className="opacity-0 py-16">
      {container ? <div className="container">{children}</div> : Inner}
    </section>
  );
}
