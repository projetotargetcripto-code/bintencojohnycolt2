import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";

interface StatRow {
  evento: string;
  total: number;
}

export default function WidgetTelemetryPage() {
  const [rows, setRows] = useState<StatRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .rpc("widget_telemetry_stats")
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setRows((data as StatRow[]) || []);
        }
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Widget Telemetry</h1>
      {error && <p className="text-red-500">{error}</p>}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.evento} className="flex justify-between">
            <span>{row.evento}</span>
            <span>{row.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
