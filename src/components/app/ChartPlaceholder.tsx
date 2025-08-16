import { Button } from "@/components/ui/button";

export function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-secondary/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Button variant="outline" size="sm">Exportar</Button>
      </div>
      <div className="mt-4 h-56 rounded-md pattern-grid opacity-[0.35]" />
      <p className="mt-2 text-xs text-muted-foreground">Placeholder visual — futuro gráfico</p>
    </div>
  );
}
