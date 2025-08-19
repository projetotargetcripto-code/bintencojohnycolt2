import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { DataTable, type Column } from "@/components/app/DataTable";
import { supabase } from "@/lib/dataClient";

interface Investimento {
  id: string;
  quota: number;
  documento_url: string | null;
}

export default function InvestidorExtratosPage() {
  const [rows, setRows] = useState<Investimento[]>([]);

  useEffect(() => {
    supabase
      .from("investimentos")
      .select("id, quota, documento_url")
      .then(({ data }) => setRows((data as Investimento[]) ?? []));
  }, []);

  const columns: Column[] = [
    { key: "quota", header: "Quota" },
    {
      key: "documento_url",
      header: "Documento",
      render: (row) =>
        row.documento_url ? (
          <a
            href={row.documento_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Abrir
          </a>
        ) : (
          ""
        ),
    },
  ];

  return (
    <Protected allowedRoles={["investidor"]}>
      <AppShell
        menuKey="investidor"
        breadcrumbs={[{ label: "Investidor" }, { label: "Extratos" }]}
      >
        <h2 className="text-xl font-semibold mb-4">Extratos</h2>
        <DataTable columns={columns} rows={rows} pageSize={10} />
      </AppShell>
    </Protected>
  );
}
