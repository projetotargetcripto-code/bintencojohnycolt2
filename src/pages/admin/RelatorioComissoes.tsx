import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComissaoRow {
  corretor_id: string;
  total: number;
}

export default function RelatorioComissoes() {
  const [rows, setRows] = useState<ComissaoRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("vendas").select("corretor_id, comissao");
      if (!error && data) {
        const grouped: Record<string, number> = {};
        data.forEach(v => {
          grouped[v.corretor_id] = (grouped[v.corretor_id] || 0) + Number(v.comissao);
        });
        const list = Object.entries(grouped).map(([corretor_id, total]) => ({ corretor_id, total }));
        setRows(list);
      }
    };
    load();
  }, []);

  return (
    <Protected>
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Comissões por Corretor</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Total Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.corretor_id}>
                    <TableCell>{r.corretor_id}</TableCell>
                    <TableCell>{r.total.toFixed(2)}</TableCell>
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
