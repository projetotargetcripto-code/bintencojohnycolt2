import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { KPIStat } from "@/components/app/KPIStat";
import { DataTable } from "@/components/app/DataTable";

export default function InadimplenciaDashboard() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("conciliacoes")
      .select("referencia, valor, status")
      .eq("status", "pendente")
      .then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell
        menuKey="superadmin"
        breadcrumbs={[{ label: "Super Admin" }, { label: "Inadimplência" }]}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <KPIStat label="Pendentes" value={rows.length} />
        </div>
        <DataTable
          columns={[
            { key: "referencia", header: "Referência" },
            { key: "valor", header: "Valor" },
            { key: "status", header: "Status" },
          ]}
          rows={rows}
          pageSize={10}
        />
      </AppShell>
    </Protected>
  );
}
