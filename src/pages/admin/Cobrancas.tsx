import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { DataTable, type Column } from "@/components/app/DataTable";
import { supabase } from "@/lib/dataClient";

export default function CobrancasPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    supabase
      .from("cobrancas")
      .select("*")
      .then(({ data }) => {
        setRows(data ?? []);
        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]).map(key => ({ key, header: key })));
        }
      });
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
