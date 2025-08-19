import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { DataTable, type Column } from "@/components/app/DataTable";
import { supabase } from "@/lib/dataClient";
import { useAuth } from "@/hooks/useAuth";

export default function TerrenistaExtratosPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const { data: terrenista } = await supabase
        .from("terrenistas")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!terrenista) return;

      const { data } = await supabase
        .from("repasses")
        .select("valor, doc_url, created_at")
        .eq("terrenista_id", terrenista.id);

      setRows(data ?? []);
      if (data && data.length > 0) {
        setColumns([
          { key: "valor", header: "Valor" },
          { key: "created_at", header: "Data" },
          {
            key: "doc_url",
            header: "Documento",
            render: (row) =>
              row.doc_url ? (
                <a
                  href={row.doc_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Baixar
                </a>
              ) : null,
          },
        ]);
      }
    }

    fetchData();
  }, [user]);

  return (
    <AppShell
      menuKey="terrenista"
      breadcrumbs={[{ label: "Terrenista", href: "/terrenista" }, { label: "Extratos" }]}
    >
      <DataTable columns={columns} rows={rows} pageSize={5} />
    </AppShell>
  );
}
