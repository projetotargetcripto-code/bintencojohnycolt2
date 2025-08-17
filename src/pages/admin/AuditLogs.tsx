import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [userFilter, setUserFilter] = useState("");
  const [filialFilter, setFilialFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [userAgentFilter, setUserAgentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    document.title = "Auditoria | BlockURB";
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("id, actor, action, target, metadata, created_at, ip_address, user_agent", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (userFilter.trim()) {
      query = query.eq("actor", userFilter.trim());
    }
    if (filialFilter.trim()) {
      query = query.contains("metadata", { filial_id: filialFilter.trim() });
    }
    if (actionFilter.trim()) {
      query = query.eq("action", actionFilter.trim());
    }
    if (ipFilter.trim()) {
      query = query.eq("ip_address", ipFilter.trim());
    }
    if (userAgentFilter.trim()) {
      query = query.ilike("user_agent", `%${userAgentFilter.trim()}%`);
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }
    const { data, count } = await query;
    setLogs((data as any) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, userFilter, filialFilter, actionFilter, startDate, endDate, ipFilter, userAgentFilter]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(0);
  }, [userFilter, filialFilter, actionFilter, startDate, endDate, ipFilter, userAgentFilter]);

  const exportCsv = () => {
    const header = ["id", "actor", "action", "target", "filial_id", "ip_address", "user_agent", "created_at"];
    const rows = logs.map((l) => [
      l.id,
      l.actor,
      l.action,
      l.target ?? "",
      l.metadata?.filial_id ?? "",
      l.ip_address ?? "",
      l.user_agent ?? "",
      l.created_at
    ]);
    const csv = [header.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: "Super Admin" }, { label: "Auditoria" }]}>
        <Card>
          <CardHeader>
            <CardTitle>Auditoria de Ações</CardTitle>
            <CardDescription>Histórico de operações realizadas na plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Usuário (ID)</label>
                <Input value={userFilter} onChange={e => setUserFilter(e.target.value)} placeholder="ID do usuário" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Filial</label>
                <Input value={filialFilter} onChange={e => setFilialFilter(e.target.value)} placeholder="ID da filial" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Ação</label>
                <Input value={actionFilter} onChange={e => setActionFilter(e.target.value)} placeholder="Tipo de ação" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">IP</label>
                <Input value={ipFilter} onChange={e => setIpFilter(e.target.value)} placeholder="IP" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">User Agent</label>
                <Input value={userAgentFilter} onChange={e => setUserAgentFilter(e.target.value)} placeholder="User Agent" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">De</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Até</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Button variant="secondary" onClick={() => { setUserFilter(""); setFilialFilter(""); setActionFilter(""); setIpFilter(""); setUserAgentFilter(""); setStartDate(""); setEndDate(""); }}>Limpar filtros</Button>
              <Button onClick={exportCsv}>Exportar CSV</Button>
            </div>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Alvo</TableHead>
                      <TableHead>Filial</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-mono">{log.actor}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="font-mono">{log.target ?? "—"}</TableCell>
                        <TableCell className="font-mono">{log.metadata?.filial_id ?? "—"}</TableCell>
                        <TableCell className="font-mono">{log.ip_address ?? "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.user_agent ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center pt-2 text-sm">
                  <span>Página {page + 1} de {totalPages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Próxima</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AppShell>
    </Protected>
  );
}
