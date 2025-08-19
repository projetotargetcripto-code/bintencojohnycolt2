import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useFilialKpis } from "@/hooks/useFilialKpis";

export function VGVChart() {
  const { data } = useFilialKpis();
  const chartData = data?.map(d => ({ filial: d.filial_id, vgv: d.vgv })) ?? [];

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="filial" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="vgv" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

