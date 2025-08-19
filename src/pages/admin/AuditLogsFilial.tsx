import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthorization } from "@/hooks/useAuthorization";

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function AuditLogsFilialPage() {
  const { profile } = useAuthorization();
  const filialId = profile?.filial_id ?? null;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    document.title = "Auditoria | BlockURB";
  }, []);

  const loadLogs = useCallback(async () => {
    if (!filialId) return;
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("id, actor, action, target, metadata, ip_address, user_agent, created_at")
      .order("created_at", { ascending: false });

    query = query.contains("metadata", { filial_id: filialId });
    if (userFilter.trim()) {
      query = query.eq("actor", userFilter.trim());
    }
    if (actionFilter.trim()) {
      query = query.eq("action", actionFilter.trim());
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data } = await query;
    const allLogs = (data as AuditLog[] | null) || [];
    allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setTotal(allLogs.length);
    setLogs(allLogs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE));
    setLoading(false);
  }, [filialId, userFilter, actionFilter, startDate, endDate, page]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(0);
  }, [userFilter, actionFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Protected allowedRoles={["adminfilial", "superadmin"]} panelKey="adminfilial">
      <AppShell menuKey="adminfilial" breadcrumbs={[{ label: "Admin Filial" }, { label: "Auditoria" }]}>
        <Card>
          <CardHeader>
            <CardTitle>Auditoria da Filial</CardTitle>
            <CardDescription>Histórico de ações realizadas nesta filial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Usuário (ID)</label>
                <Input value={userFilter} onChange={(e) => setUserFilter(e.target.value)} placeholder="ID do usuário" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Ação</label>
                <Input value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="Tipo de ação" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">De</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Até</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setUserFilter("");
                  setActionFilter("");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Limpar filtros
              </Button>
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
                      <TableHead>IP</TableHead>
                      <TableHead>User Agent</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-mono">{log.actor}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="font-mono">{log.target ?? "—"}</TableCell>
                        <TableCell className="font-mono">{log.ip_address ?? "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.user_agent ?? "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{JSON.stringify(log.metadata ?? {})}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center pt-2 text-sm">
                  <span>Página {page + 1} de {totalPages}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Próxima
                    </Button>
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
