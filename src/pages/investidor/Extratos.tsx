import type { User } from "@supabase/supabase-js";
import { ExtratosPage } from "@/components/app/ExtratosPage";
import { supabase } from "@/lib/dataClient";
import type { Column } from "@/components/app/DataTable";

const columns: Column[] = [
  { key: "quota", header: "Quota" },
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
];

async function fetchRows(user: User) {
  const { data } = await supabase
    .from("investimentos")
    .select("quota, doc_url")
    .eq("user_id", user.id);
  return data ?? [];
}

export default function InvestidorExtratosPage() {
  return (
    <ExtratosPage
      menuKey="investidor"
      breadcrumbs={[{ label: "Investidor", href: "/investidor" }, { label: "Extratos" }]}
      columns={columns}
      query={fetchRows}
    />
  );
}
