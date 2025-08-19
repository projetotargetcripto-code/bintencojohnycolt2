import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/app/DataTable";
import { supabase } from "@/lib/dataClient";
import { supabaseRequest } from "@/lib/request";

interface Renegociacao {
  id: string;
  reserva_id: string;
  email: string;
  status: string;
  created_at: string;
}

const columns: Column[] = [
  { key: "reserva_id", header: "Reserva" },
  { key: "email", header: "E-mail" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Ações", render: (row) => row.actions },
];

export default function RenegociacoesPage() {
  const [items, setItems] = useState<Renegociacao[]>([]);

  async function load() {
    const data = await supabaseRequest<Renegociacao[]>(
      () =>
        supabase
          .from("renegociacoes")
          .select("id, reserva_id, email, status, created_at")
          .order("created_at", { ascending: false }),
      { error: "Erro ao carregar renegociações" },
    );
    setItems(data || []);
  }

  useEffect(() => {
    document.title = "Renegociações | BlockURB";
    load();
  }, []);

  async function handleAction(id: string, email: string, status: string) {
    await supabaseRequest(
      () => supabase.from("renegociacoes").update({ status }).eq("id", id),
      {
        success: status === "approved" ? "Renegociação aprovada" : "Renegociação rejeitada",
        error: "Erro ao atualizar renegociação",
      },
    );
    if (status === "approved") {
      await supabaseRequest(
        () =>
          supabase.functions.invoke("renegociacao-confirm", {
            body: { email, status },
          }),
        { error: "Erro ao confirmar renegociação" },
      );
    }
    await load();
  }

  const rows = items.map((item) => ({
    ...item,
    actions: (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleAction(item.id, item.email, "approved")}>Aprovar</Button>
        <Button size="sm" variant="destructive" onClick={() => handleAction(item.id, item.email, "rejected")}>Rejeitar</Button>
      </div>
    ),
  }));

  return (
    <Protected allowedRoles={['juridico']}>
      <AppShell
        menuKey="juridico"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Jurídico" },
          { label: "Renegociações" },
        ]}
      >
        <div className="space-y-6">
          <DataTable columns={columns} rows={rows} pageSize={10} />
        </div>
      </AppShell>
    </Protected>
  );
}
