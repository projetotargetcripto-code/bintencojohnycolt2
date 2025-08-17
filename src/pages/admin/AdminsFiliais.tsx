import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { supabase } from "@/lib/dataClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, Column } from "@/components/app/DataTable";

interface Filial { id: string; nome: string }
interface Usuario { id: string; email: string; nome: string; filial_id: string }

export default function AdminsFiliaisPage() {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ filial_id: "", email: "", nome: "", senha: "" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: f }, { data: u }] = await Promise.all([
      supabase.from("filiais").select("id, nome").order("nome"),
      supabase
        .from("usuarios")
        .select("id, email, nome, filial_id")
        .eq("role", "adminfilial")
        .order("nome"),
    ]);
    setFiliais(f || []);
    setUsuarios(u || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.filial_id || !form.email.trim() || !form.nome.trim() || !form.senha.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (form.senha.length < 8) {
      toast.error("Senha deve ter ao menos 8 caracteres.");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("usuarios").insert({
      email: form.email.trim(),
      nome: form.nome.trim(),
      senha: form.senha,
      filial_id: form.filial_id,
      role: "adminfilial",
    });
    setCreating(false);
    if (error) {
      toast.error("Erro ao criar admin: " + error.message);
      return;
    }
    toast.success("Admin de filial criado");
    setForm({ filial_id: "", email: "", nome: "", senha: "" });
    load();
  }

  const columns: Column[] = [
    { key: "nome", header: "Nome" },
    { key: "email", header: "E-mail" },
    { key: "filial", header: "Filial" },
  ];

  const rows = usuarios.map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    filial: filiais.find((f) => f.id === u.filial_id)?.nome || u.filial_id,
  }));

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell
        menuKey="superadmin"
        breadcrumbs={[
          { label: "Super Admin" },
          { label: "Admins de Filiais" },
        ]}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Novo Admin de Filial</CardTitle>
              <CardDescription>Crie uma conta administrativa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Filial</label>
                <Select value={form.filial_id} onValueChange={(v) => setForm((s) => ({ ...s, filial_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {filiais.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">E-mail</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Senha</label>
                <Input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm((s) => ({ ...s, senha: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Criando..." : "Criar"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admins de Filiais</CardTitle>
              <CardDescription>Contas existentes.</CardDescription>
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

