import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "sonner";

type Filial = { id: string; nome: string };
type UserProfile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  filial_id: string | null;
  panels: string[] | null;
};

const ALL_ROLES = [
  "superadmin",
  "adminfilial",
  "urbanista",
  "juridico",
  "contabilidade",
  "marketing",
  "comercial",
  "imobiliaria",
  "corretor",
  "obras",
  "investidor",
  "terrenista",
];

const ALL_PANELS = [
  { key: 'adminfilial', label: 'Admin Filial (Geral)' },
  { key: 'urbanista', label: 'Urbanismo (Mapa, Projetos)' },
  { key: 'juridico', label: 'Jurídico' },
  { key: 'contabilidade', label: 'Contabilidade' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'comercial', label: 'Comercial (Vendas)' },
  { key: 'imobiliaria', label: 'Imobiliária' },
  { key: 'corretor', label: 'Corretor' },
  { key: 'obras', label: 'Obras' },
  { key: 'investidor', label: 'Investidor' },
  { key: 'terrenista', label: 'Terrenista' },
];

export default function UsuariosPage() {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Usuários | BlockURB";
    void init();
  }, []);

  useEffect(() => {
    const s = search.trim().toLowerCase();
    const r = roleFilter.trim();
    const out = users.filter((u) => {
      const matchesSearch = !s ||
        (u.email?.toLowerCase().includes(s) || u.full_name?.toLowerCase().includes(s));
      const matchesRole = (r === "all") || (u.role === r);
      return matchesSearch && matchesRole;
    });
    setFiltered(out);
  }, [users, search, roleFilter]);

  const filialById = useMemo(() => Object.fromEntries(filiais.map(f => [f.id, f.nome])), [filiais]);

  const init = async () => {
    setLoading(true);
    const [{ data: f }, { data: u }, { data: userData }] = await Promise.all([
      supabase.from("filiais").select("id, nome").order("nome"),
      supabase.from("user_profiles").select("user_id, email, full_name, role, filial_id, panels").order("full_name", { ascending: true }),
      supabase.auth.getUser(),
    ]);
    setFiliais(f || []);
    setUsers((u as any) || []);
    setLoading(false);
    setCurrentUserId(userData.user?.id ?? null);
  };

  const updateRole = async (userId: string, newRole: string) => {
    const normalized: string | null = newRole === "no-role" ? null : newRole;
    if (!normalized && newRole !== "no-role") return;
    if (userId === currentUserId && normalized !== "superadmin") {
      toast.error("Você não pode remover seu próprio acesso de Super Admin.");
      return;
    }
    setUpdating(userId);
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        p_user_id: userId,
        p_role: normalized,
      });
      if (error) throw error;
      toast.success("Papel atualizado.");
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, role: normalized } as UserProfile : u));
    } catch (e: any) {
      toast.error(e?.message || "Falha ao atualizar papel");
    } finally {
      setUpdating(null);
    }
  };

  const updateFilial = async (userId: string, filialId: string) => {
    if (!filialId) return;
    setUpdating(userId);
    try {
      const { error } = await supabase.rpc('admin_set_user_filial', {
        p_user_id: userId,
        p_filial_id: filialId,
      });
      if (error) throw error;
      toast.success('Filial atualizada.');
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, filial_id: filialId } : u));
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao atualizar filial');
    } finally {
      setUpdating(null);
    }
  };

  const updatePanels = async (userId: string, panels: string[]) => {
    setUpdating(userId);
    try {
      const { error } = await supabase.rpc('admin_set_user_panels', {
        p_user_id: userId,
        p_panels: panels,
      });
      if (error) throw error;
      toast.success('Painéis atualizados.');
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, panels } : u));
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao atualizar painéis');
    } finally {
      setUpdating(null);
    }
  };

  const togglePanel = (userId: string, panelKey: string) => {
    const user = users.find((u) => u.user_id === userId);
    if (!user) return;
    const list = Array.isArray(user.panels) ? user.panels : [];
    const updated = list.includes(panelKey) ? list.filter((p) => p !== panelKey) : [...list, panelKey];
    setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, panels: updated } : u));
    void updatePanels(userId, updated);
  };

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: "Super Admin" }, { label: "Usuários" }]}>        
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>Gerencie papéis (roles) de todos os usuários da plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Buscar</label>
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome ou e-mail" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Filtrar por papel</label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="secondary" onClick={() => { setSearch(""); setRoleFilter(""); }}>Limpar filtros</Button>
                </div>
              </div>

              {loading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Filial</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Painéis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email || "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={u.filial_id || ""}
                            onValueChange={(val) => updateFilial(u.user_id, val)}
                            disabled={updating === u.user_id}
                          >
                            <SelectTrigger className="w-[240px]">
                              <SelectValue placeholder={(u.filial_id && filialById[u.filial_id]) || "Selecionar filial"} />
                            </SelectTrigger>
                            <SelectContent>
                              {filiais.map((f) => (
                                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role ?? "no-role"}
                            onValueChange={(val) => updateRole(u.user_id, val)}
                            disabled={updating === u.user_id}
                          >
                            <SelectTrigger className="w-[220px]">
                              <SelectValue placeholder="Selecionar papel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-role">Sem papel</SelectItem>
                              {ALL_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" disabled={updating === u.user_id}>
                                {Array.isArray(u.panels) && u.panels.length > 0 ? `${u.panels.length} selecionado(s)` : 'Selecionar'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2">
                              <div className="grid gap-2">
                                {ALL_PANELS.map((p) => (
                                  <label key={p.key} className="flex items-center gap-2">
                                    <Checkbox checked={Array.isArray(u.panels) && u.panels.includes(p.key)} onCheckedChange={() => togglePanel(u.user_id, p.key)} disabled={updating === u.user_id} />
                                    <span className="text-sm">{p.label}</span>
                                  </label>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
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


