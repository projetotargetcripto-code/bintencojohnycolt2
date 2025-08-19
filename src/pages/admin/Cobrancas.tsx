import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { DataTable, type Column } from "@/components/app/DataTable";
import { supabase } from "@/lib/dataClient";
import { supabaseRequest } from "@/lib/request";

export default function CobrancasPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    async function load() {
      const data = await supabaseRequest<any[]>(
        () => supabase.from("cobrancas").select("*"),
        { error: "Erro ao carregar cobranças" },
      );
      if (data) {
        setRows(data);
        if (data.length > 0) {
          setColumns(Object.keys(data[0]).map((key) => ({ key, header: key })));
        }
      }
    }
    load();
  }, []);

  return (
    <Protected allowedRoles={["comercial"]}>
      <AppShell
        menuKey="comercial"
        breadcrumbs={[{ label: "Comercial", href: "/comercial" }, { label: "Cobranças" }]}
      >
        <DataTable columns={columns} rows={rows} pageSize={5} />
      </AppShell>
    </Protected>
  );
}
