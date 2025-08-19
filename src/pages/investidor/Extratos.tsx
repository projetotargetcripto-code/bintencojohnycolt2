import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { DataTable, type Column } from "@/components/app/DataTable";
import { supabase } from "@/lib/dataClient";
import { useAuth } from "@/hooks/useAuth";

export default function InvestidorExtratosPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("investimentos")
      .select("quota, doc_url")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setRows(data ?? []);
        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]).map(key => ({ key, header: key })));
        }
      });
  }, [user]);

  return (
    <AppShell
      menuKey="investidor"
      breadcrumbs={[{ label: "Investidor", href: "/investidor" }, { label: "Extratos" }]}
    >
      <DataTable columns={columns} rows={rows} pageSize={5} />
    </AppShell>
  );
}
