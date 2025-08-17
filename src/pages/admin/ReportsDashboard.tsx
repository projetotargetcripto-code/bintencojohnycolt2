import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format, subDays } from "date-fns";

type ReportRow = {
  day: string;
  filial_id: string;
  empreendimentos: number;
  usuarios: number;
  lotes_vendidos: number;
  ocupacao: number;
};

export default function ReportsDashboard() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filiais, setFiliais] = useState("");
  const [period, setPeriod] = useState("7");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Relatórios Operacionais | BlockURB";
  }, []);

  const filiaisArr = useMemo(() => filiais.split(",").map(f => f.trim()).filter(Boolean), [filiais]);
  const now = new Date();
  const computedFrom = period === "custom" ? from : format(subDays(now, period === "7" ? 7 : 30), "yyyy-MM-dd");
  const computedTo = period === "custom" ? to : format(now, "yyyy-MM-dd");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("superadmin_reports", {
      filial_ids: filiaisArr.length ? filiaisArr : null,
      from_date: computedFrom,
      to_date: computedTo,
    });
    setRows((data as any) || []);
    setLoading(false);
  }, [filiaisArr, computedFrom, computedTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    const header = ["day", "filial_id", "empreendimentos", "usuarios", "lotes_vendidos", "ocupacao"];
    const csv = [
      header.join(","),
      ...rows.map(r => [r.day, r.filial_id, r.empreendimentos, r.usuarios, r.lotes_vendidos, r.ocupacao].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorios.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio.png";
    a.click();
  };

  const exportPdf = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("relatorio.pdf");
  };

  const chartData = useMemo(() => {
    const map = new Map<string, any>();
    rows.forEach(r => {
      if (!map.has(r.day)) map.set(r.day, { date: r.day });
      map.get(r.day)[r.filial_id] = r.lotes_vendidos;
    });
    return Array.from(map.values());
  }, [rows]);

  const filiaisList = useMemo(() => Array.from(new Set(rows.map(r => r.filial_id))), [rows]);

  const COLORS = ["#8884d8", "#82ca9d", "#ff7300", "#ff0000", "#00c49f", "#0088fe"];

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: "Super Admin" }, { label: "Relatórios" }]}>
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Operacionais</CardTitle>
            <CardDescription>Métricas agregadas por filial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Filiais</label>
                <Input value={filiais} onChange={e => setFiliais(e.target.value)} placeholder="IDs separados por vírgula" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Período</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={period === "custom" ? "" : "hidden md:block"}>
                <label className="text-sm text-muted-foreground">De</label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className={period === "custom" ? "" : "hidden md:block"}>
                <label className="text-sm text-muted-foreground">Até</label>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={load} disabled={loading}>Aplicar</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFiliais("");
                    setFrom("");
                    setTo("");
                    setPeriod("7");
                    void load();
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
            <div ref={chartRef} className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {filiaisList.map((id, idx) => (
                    <Line key={id} type="monotone" dataKey={id} name={id} stroke={COLORS[idx % COLORS.length]} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Filial</TableHead>
                      <TableHead>Empreendimentos</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Lotes vendidos</TableHead>
                      <TableHead>Ocupação (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(r => (
                      <TableRow key={`${r.filial_id}-${r.day}`}>
                        <TableCell>{r.day}</TableCell>
                        <TableCell className="font-mono">{r.filial_id}</TableCell>
                        <TableCell>{r.empreendimentos}</TableCell>
                        <TableCell>{r.usuarios}</TableCell>
                        <TableCell>{r.lotes_vendidos}</TableCell>
                        <TableCell>{r.ocupacao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end pt-2 gap-2">
                  <Button onClick={exportCsv}>CSV</Button>
                  <Button variant="secondary" onClick={exportPng}>PNG</Button>
                  <Button variant="secondary" onClick={exportPdf}>PDF</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AppShell>
    </Protected>
  );
}

