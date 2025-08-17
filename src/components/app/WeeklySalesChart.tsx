import { salesByWeek } from "@/mocks/charts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

export function WeeklySalesChart() {
  return (
    <div className="rounded-[14px] border border-border bg-secondary/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Vendas por semana</h3>
        <Button variant="outline" size="sm">Exportar</Button>
      </div>
      <ChartContainer
        className="mt-4 h-56"
        config={{
          value: {
            label: "Vendas",
            color: "hsl(var(--primary))",
          },
        }}
      >
        <LineChart data={salesByWeek}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
