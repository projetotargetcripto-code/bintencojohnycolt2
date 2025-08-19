import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  evento: string;
  count: number;
};

export default function WidgetTelemetryPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    document.title = "Widget Telemetry | BlockURB";
    supabase
      .from("widget_telemetry")
      .select("evento, count:id", { group: "evento" })
      .then(({ data }) => setRows((data as any) || []));
  }, []);

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: "Super Admin" }, { label: "Widget Telemetry" }]}> 
        <Card>
          <CardHeader>
            <CardTitle>Widget Telemetry</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Contagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.evento}>
                    <TableCell>{r.evento}</TableCell>
                    <TableCell>{(r as any).count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AppShell>
    </Protected>
  );
}
