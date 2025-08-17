import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Point {
  day: string;
  value: number;
}

export function PanelReportsChart() {
  const [data, setData] = useState<Point[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.rpc("superadmin_reports", {
        filial_ids: null,
        from_date: null,
        to_date: null,
      });
      const mapped = (data as any[])?.map(r => ({ day: r.day, value: r.lotes_vendidos })) ?? [];
      setData(mapped);
    };
    void load();
  }, []);

  return (
    <div className="rounded-[14px] border border-border bg-secondary/60 p-4">
      <h3 className="font-semibold">Lotes vendidos</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PanelReportsChart;
