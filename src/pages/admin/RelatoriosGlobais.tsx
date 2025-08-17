import { useEffect, useState } from "react"
import { supabase } from "@/lib/dataClient"
import { Protected } from "@/components/Protected"
import { AppShell } from "@/components/shell/AppShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface AuditLog {
  id: string
  action: string
  metadata: any
  created_at: string
}

interface KPI {
  filial_id: string | null
  total_logins: number
  total_criacoes: number
  total_atualizacoes: number
  calculated_at: string
}

export default function RelatoriosGlobais() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const { data: logData } = await supabase
      .from("audit_logs")
      .select("id, action, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
    setLogs(logData || [])

    const { data: kpiData } = await supabase.rpc("get_global_kpis")
    setKpis(kpiData || [])
  }

  return (
    <Protected>
      <AppShell breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Relatórios Globais" }]}>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kpis.map((k) => (
              <Card key={k.filial_id || "global"}>
                <CardHeader>
                  <CardTitle>{k.filial_id || "Global"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div>Logins: {k.total_logins}</div>
                  <div>Criações: {k.total_criacoes}</div>
                  <div>Alterações: {k.total_atualizacoes}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Últimos eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Quando</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.action}</TableCell>
                      <TableCell>
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(l.metadata)}
                        </pre>
                      </TableCell>
                      <TableCell>
                        {new Date(l.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </Protected>
  )
}

