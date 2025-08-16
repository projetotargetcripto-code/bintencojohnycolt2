import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Filial = { id: string; nome: string };

export default function AdminsFiliaisPage() {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ filial_id: "", email: "", full_name: "", password: "" });

  useEffect(() => {
    document.title = "Contas Admin Filiais | BlockURB";
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: f }, { data: u }] = await Promise.all([
      supabase.from("filiais").select("id, nome").order("nome"),
      supabase
        .from("user_profiles")
        .select("user_id, email, full_name, filial_id, role")
        .eq("role", "adminfilial")
        .order("full_name", { ascending: true }),
    ]);
    setFiliais(f || []);
    setAdmins(u || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.filial_id || !form.email.trim()) {
      toast.error("Selecione a filial e informe o e-mail.");
      return;
    }
    if (form.password && form.password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setCreating(true);
    try {
      const payload: any = {
        email: form.email.trim(),
        full_name: form.full_name?.trim(),
        filial_id: form.filial_id,
      };
      if (form.password) payload.password = form.password;

      console.debug("[AdminsFiliais] Criar admin de filial - payload:", payload);

      const { data: result, error } = await supabase.functions.invoke("create-admin-filial", {
        body: payload,
      });
      if (error) {
        let message = error.message || "Falha ao criar admin de filial";
        try {
          const resp: any = (error as any).context?.response;
          if (resp) {
            const text = await resp.text();
            try {
              const json = JSON.parse(text);
              message = json.error || message;
            } catch {
              message = text || message;
            }
          }
        } catch {}
        throw new Error(message);
      }

      toast.success(`Admin de filial criado: ${result.email}`);
      setForm({ filial_id: "", email: "", full_name: "", password: "" });
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar admin de filial");
    } finally {
      setCreating(false);
    }
  };

  const filialById = useMemo(() => Object.fromEntries(filiais.map(f => [f.id, f.nome])), [filiais]);

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: "Super Admin" }, { label: "Contas Admin Filiais" }]}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Novo Admin de Filial</CardTitle>
              <CardDescription>Crie uma conta administrativa vinculada a uma filial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Filial</label>
                <Select value={form.filial_id} onValueChange={(v) => setForm((s) => ({ ...s, filial_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {filiais.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">E-mail</label>
                <Input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="email@empresa.com" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Senha (opcional)</label>
                <Input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
              </div>
              <Button onClick={handleCreate} disabled={creating}>{creating ? "Criando..." : "Criar"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admins de Filiais</CardTitle>
              <CardDescription>Gerencie contas existentes.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Filial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((a) => (
                      <TableRow key={a.user_id}>
                        <TableCell className="font-medium">{a.full_name}</TableCell>
                        <TableCell>{a.email}</TableCell>
                        <TableCell>{filialById[a.filial_id] || a.filial_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </Protected>
  );
}