import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { supabase } from "@/lib/dataClient";
import { DataTable, Column } from "@/components/app/DataTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Pendencia {
  id: string;
  tipo: string;
  tabela: string;
  entidade_id: string;
  status: string;
  dados: any;
  created_at: string;
}

export default function Aprovacao() {
  const [rows, setRows] = useState<Pendencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Aprovação | BlockURB";
    fetchPendencias();
  }, []);

  async function fetchPendencias() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pendencias")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar pendências");
      setLoading(false);
      return;
    }
    const mapped = (data || []).map((p) => ({
      ...p,
      descricao: p.dados?.nome || p.dados?.descricao || "",
      created_at: new Date(p.created_at).toLocaleString("pt-BR"),
    }));
    setRows(mapped);
    setLoading(false);
  }

  async function updatePendencia(p: Pendencia, approved: boolean) {
    const status = approved ? "aprovado" : "rejeitado";
    const { error: upErr } = await supabase
      .from(p.tabela)
      .update({ status })
      .eq("id", p.entidade_id);
    if (upErr) {
      toast.error("Erro ao atualizar entidade");
      return;
    }
    const { error } = await supabase
      .from("pendencias")
      .update({ status })
      .eq("id", p.id);
    if (error) {
      toast.error("Erro ao atualizar pendência");
      return;
    }
    toast.success(`Pendência ${approved ? "aprovada" : "rejeitada"}`);
    fetchPendencias();
  }

  const columns: Column[] = [
    { key: "tipo", header: "Tipo" },
    { key: "descricao", header: "Descrição" },
    { key: "status", header: "Status" },
    { key: "created_at", header: "Criado em" },
    {
      key: "acoes",
      header: "Ações",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => updatePendencia(row as Pendencia, true)}>
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => updatePendencia(row as Pendencia, false)}
          >
            Reprovar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell
        menuKey="superadmin"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Super Admin" },
          { label: "Aprovação" },
        ]}
      >
        {loading ? (
          <p className="text-center py-12 text-muted-foreground">Carregando pendências...</p>
        ) : (
          <DataTable columns={columns} rows={rows} pageSize={10} />
        )}
      </AppShell>
    </Protected>
  );
}
