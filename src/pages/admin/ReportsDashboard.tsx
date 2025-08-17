import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ReportRow = {
  filial_id: string;
  empreendimentos: number;
  usuarios: number;
  lotes_vendidos: number;
  ocupacao: number;
};

export default function ReportsDashboard() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filial, setFilial] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    document.title = "Relatórios Operacionais | BlockURB";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("superadmin_reports", {
      filial_id: filial || null,
      from_date: from || null,
      to_date: to || null,
    });
    setRows((data as any) || []);
    setLoading(false);
  }, [filial, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    const header = ["filial_id", "empreendimentos", "usuarios", "lotes_vendidos", "ocupacao"];
    const csv = [
      header.join(","),
      ...rows.map(r => [r.filial_id, r.empreendimentos, r.usuarios, r.lotes_vendidos, r.ocupacao].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorios.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: "Super Admin" }, { label: "Relatórios" }]}>
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Operacionais</CardTitle>
            <CardDescription>Métricas agregadas por filial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Filial</label>
                <Input value={filial} onChange={e => setFilial(e.target.value)} placeholder="ID da filial" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">De</label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Até</label>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={load} disabled={loading}>Aplicar</Button>
                <Button variant="secondary" onClick={() => { setFilial(""); setFrom(""); setTo(""); void load(); }}>Limpar</Button>
              </div>
            </div>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filial</TableHead>
                      <TableHead>Empreendimentos</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Lotes vendidos</TableHead>
                      <TableHead>Ocupação (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(r => (
                      <TableRow key={r.filial_id}>
                        <TableCell className="font-mono">{r.filial_id}</TableCell>
                        <TableCell>{r.empreendimentos}</TableCell>
                        <TableCell>{r.usuarios}</TableCell>
                        <TableCell>{r.lotes_vendidos}</TableCell>
                        <TableCell>{r.ocupacao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end pt-2">
                  <Button onClick={exportCsv}>Exportar CSV</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AppShell>
    </Protected>
  );
}

