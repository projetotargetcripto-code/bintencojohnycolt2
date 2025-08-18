import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { FiltersBar } from "@/components/app/FiltersBar";
import { DataTable } from "@/components/app/DataTable";
import { LotesMapPreview } from "@/components/app/LotesMapPreview";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/dataClient";

interface Empreendimento {
  id: string;
  nome: string;
  status: string;
  total_lotes: number | null;
}

const columns = [
  { key: "nome", header: "Nome" },
  { key: "status", header: "Status" },
  { key: "total_lotes", header: "Lotes" },
];

export default function EmpreendimentosPage() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Empreendimentos | BlockURB";
    setLoading(true);
    setError(null);
    supabase
      .from("empreendimentos")
      .select("id, nome, status, total_lotes")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setEmpreendimentos((data as Empreendimento[]) || []);
        if (data && data.length > 0) {
          setSelected(data[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = empreendimentos.filter((e) =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Protected>
      <AppShell
        menuKey="adminfilial"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin" }, { label: "Empreendimentos" }]}
      >
        {loading ? (
          <p className="text-center text-muted-foreground">Carregando...</p>
        ) : error ? (
          <p className="text-center text-destructive">{error}</p>
        ) : (
          <div className="space-y-6">
            <FiltersBar>
              <Input
                placeholder="Buscar por nome"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px]"
              />
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Mapa" />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FiltersBar>

            <DataTable columns={columns} rows={filtered} pageSize={10} />

            <div className="rounded-[14px] border border-border bg-secondary/60 h-[380px] overflow-hidden">
              <LotesMapPreview empreendimentoId={selected} height="100%" />
            </div>
          </div>
        )}
      </AppShell>
    </Protected>
  );
}
