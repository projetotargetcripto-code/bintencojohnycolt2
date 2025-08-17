import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { supabase } from "@/lib/dataClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DataTable, Column } from "@/components/app/DataTable";

interface Filial {
  id: string;
  nome: string;
}

export default function FiliaisPage({ filter }: { filter?: "interna" | "saas" }) {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [nome, setNome] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    setLoading(true);
    let query = supabase.from("filiais").select("id, nome").order("nome");
    if (filter) query = query.eq("kind", filter);
    const { data, error } = await query;
    if (error) toast.error("Erro ao carregar filiais: " + error.message);
    setFiliais(data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!nome.trim()) { toast.error("Informe o nome"); return; }
    const { error } = await supabase.from("filiais").insert({ nome: nome.trim(), kind: filter || "interna" });
    if (error) toast.error("Erro ao criar filial: " + error.message);
    else { toast.success("Filial criada"); setNome(""); load(); }
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!nome.trim()) { toast.error("Informe o nome"); return; }
    const { error } = await supabase.from("filiais").update({ nome: nome.trim() }).eq("id", editingId);
    if (error) toast.error("Erro ao editar filial: " + error.message);
    else { toast.success("Filial atualizada"); setEditingId(null); setNome(""); load(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta filial?")) return;
    const { error } = await supabase.from("filiais").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir filial: " + error.message);
    else {
      toast.success("Filial excluída");
      if (editingId === id) { setEditingId(null); setNome(""); }
      load();
    }
  }

  function startEdit(f: Filial) {
    setEditingId(f.id);
    setNome(f.nome);
  }

  const columns: Column[] = [
    { key: "nome", header: "Nome" },
    {
      key: "actions",
      header: "Ações",
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => startEdit(row as Filial)}>Editar</Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete((row as Filial).id)}>Excluir</Button>
        </div>
      ),
    },
  ];

  const rows = filiais.map((f) => ({ id: f.id, nome: f.nome }));

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell
        menuKey="superadmin"
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: filter === "saas" ? "Gestão SaaS" : "Filiais Internas" },
        ]}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Editar Filial" : "Nova Filial"}</CardTitle>
              <CardDescription>
                {editingId ? "Atualize o nome da filial selecionada." : "Crie uma nova filial."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-3">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da filial" />
              {editingId ? (
                <>
                  <Button onClick={handleUpdate}>Salvar</Button>
                  <Button variant="outline" onClick={() => { setEditingId(null); setNome(""); }}>Cancelar</Button>
                </>
              ) : (
                <Button onClick={handleCreate}>Criar</Button>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Filiais Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : (
                <DataTable columns={columns} rows={rows} pageSize={5} />
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </Protected>
  );
}

