import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Protected } from "@/components/Protected";
import { DataTable, type Column } from "@/components/app/DataTable";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/dataClient";

interface Repasse {
  id: string;
  valor: number;
  documento_url: string | null;
  created_at: string;
}

export default function Extrato() {
  const [rows, setRows] = useState<Repasse[]>([]);

  useEffect(() => {
    supabase
      .from("repasses")
      .select("id, valor, documento_url, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data as Repasse[] ?? []));
  }, []);

  const columns: Column[] = [
    { key: "created_at", header: "Data" },
    { key: "valor", header: "Valor" },
    {
      key: "documento",
      header: "Documento",
      render: (row) =>
        row.documento_url ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const a = document.createElement("a");
              a.href = row.documento_url!;
              a.download = "documento";
              a.click();
            }}
          >
            Baixar
          </Button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <Protected allowedRoles={["terrenista"]}>
      <AppShell menuKey="terrenista" breadcrumbs={[{ label: "Terrenista", href: "/terrenista" }, { label: "Extrato" }]}> 
        <DataTable columns={columns} rows={rows} pageSize={5} />
      </AppShell>
    </Protected>
  );
}
