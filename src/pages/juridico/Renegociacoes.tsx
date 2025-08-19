import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/app/DataTable";
import { supabase } from "@/lib/dataClient";

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
    const { data } = await supabase
      .from("renegociacoes")
      .select("id, reserva_id, email, status, created_at")
      .order("created_at", { ascending: false });
    setItems((data as Renegociacao[]) || []);
  }

  useEffect(() => {
    document.title = "Renegociações | BlockURB";
    load();
  }, []);

  async function handleAction(id: string, email: string, status: string) {
    await supabase.from("renegociacoes").update({ status }).eq("id", id);
    if (status === "approved") {
      await supabase.functions.invoke("renegociacao-confirm", {
        body: { email, status },
      });
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
