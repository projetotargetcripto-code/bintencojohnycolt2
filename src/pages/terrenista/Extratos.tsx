import type { User } from "@supabase/supabase-js";
import { ExtratosPage } from "@/components/app/ExtratosPage";
import { supabase } from "@/lib/dataClient";
import type { Column } from "@/components/app/DataTable";

const columns: Column[] = [
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
];

async function fetchRows(user: User) {
  const { data: terrenista } = await supabase
    .from("terrenistas")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!terrenista) return [];
  const { data } = await supabase
    .from("repasses")
    .select("valor, doc_url, created_at")
    .eq("terrenista_id", terrenista.id);
  return data ?? [];
}

export default function TerrenistaExtratosPage() {
  return (
    <ExtratosPage
      menuKey="terrenista"
      breadcrumbs={[{ label: "Terrenista", href: "/terrenista" }, { label: "Extratos" }]}
      columns={columns}
      query={fetchRows}
    />
  );
}
