import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComissaoRow {
  corretor_id: string;
  status: string;
  total_comissao: number;
}

export default function RelatorioComissoes() {
  const [rows, setRows] = useState<ComissaoRow[]>([]);

  useEffect(() => {
      const load = async () => {
        const { data, error } = await supabase.from("vw_comissoes").select("corretor_id, status, total_comissao");
        if (!error && data) {
          setRows(data as ComissaoRow[]);
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
                    <TableHead>Status</TableHead>
                    <TableHead>Total Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.corretor_id}>
                    <TableCell>{r.corretor_id}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{r.total_comissao.toFixed(2)}</TableCell>
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
