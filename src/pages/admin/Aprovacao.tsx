import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { DataTable, type Column } from "@/components/app/DataTable";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/dataClient";
import { toast } from "sonner";

interface Pendencia {
  id: string;
  tipo: string;
  entidade_id: string;
  dados: Record<string, any> | null;
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
      .from<Pendencia>("pendencias")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Erro ao buscar pendências:", error);
      toast.error("Erro ao carregar pendências");
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }

  async function handleApprove(p: Pendencia) {
    try {
      if (p.tipo === "empreendimento") {
        await supabase.rpc("approve_empreendimento", {
          p_empreendimento_id: p.entidade_id,
          p_approved: true,
        });
      }
      await supabase.from("pendencias").update({ status: "aprovado" }).eq("id", p.id);
      toast.success("Pendência aprovada");
      fetchPendencias();
    } catch (err) {
      console.error("Erro ao aprovar:", err);
      toast.error("Erro ao aprovar pendência");
    }
  }

  async function handleReject(p: Pendencia) {
    const reason = window.prompt("Motivo da rejeição?") || "";
    if (!reason) return;
    try {
      if (p.tipo === "empreendimento") {
        await supabase.rpc("approve_empreendimento", {
          p_empreendimento_id: p.entidade_id,
          p_approved: false,
          p_reason: reason,
        });
      }
      await supabase
        .from("pendencias")
        .update({ status: "rejeitado", rejection_reason: reason })
        .eq("id", p.id);
      toast.success("Pendência rejeitada");
      fetchPendencias();
    } catch (err) {
      console.error("Erro ao rejeitar:", err);
      toast.error("Erro ao rejeitar pendência");
    }
  }

  const columns: Column[] = [
    { key: "tipo", header: "Tipo" },
    { key: "nome", header: "Nome" },
    { key: "created_at", header: "Criado em" },
    {
      key: "actions",
      header: "Ações",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleApprove(row)}>Aprovar</Button>
          <Button size="sm" variant="destructive" onClick={() => handleReject(row)}>Reprovar</Button>
        </div>
      ),
    },
  ];

  const formatted = rows.map((p) => ({
    ...p,
    nome: p.dados?.nome || "-",
    created_at: new Date(p.created_at).toLocaleString(),
  }));

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell
        menuKey="superadmin"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Super Admin" }, { label: "Aprovação" }]}
      >
        <h1 className="text-2xl font-semibold mb-4">Pendências</h1>
        {loading ? <p>Carregando...</p> : <DataTable columns={columns} rows={formatted} />}
      </AppShell>
    </Protected>
  );
}
