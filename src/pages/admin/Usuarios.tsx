import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/dataClient";
import { useAuth } from "@/hooks/useAuth";
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
import { ALL_ROLES, ALL_PANELS } from "@/config/rolesPanels";

type Filial = { id: string; nome: string };
type UserProfile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  filial_id: string | null;
  panels: string[] | null;
};

const PAGE_SIZE = 20;

export default function UsuariosPage() {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const { setSession, loading: authLoading } = useAuth();
  const [filiaisLoaded, setFiliaisLoaded] = useState(false);

  // Wait for authentication to finish before triggering initial filial fetch
  useEffect(() => {
    if (authLoading) return;
    document.title = "Usuários | BlockURB";
    void loadFiliais().then(() => setFiliaisLoaded(true));
  }, [authLoading]);

  useEffect(() => {
    setPage(0);
  }, [search, roleFilter]);

  const filialById = useMemo(() => Object.fromEntries(filiais.map(f => [f.id, f.nome])), [filiais]);

  const loadFiliais = async () => {
    try {
      const { data, error } = await supabase.from("filiais").select("id, nome").order("nome");
      if (error) throw error;
      setFiliais(data || []);
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id ?? null);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar filiais");
    }
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("user_profiles")
        .select("user_id, email, full_name, role, filial_id, panels", { count: 'exact' })
        .order("full_name", { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        query = query.or(`email.ilike.${s},full_name.ilike.${s}`);
      }
      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }
      const { data, count, error } = await query;
      if (error) throw error;
      setUsers((data as any) || []);
      setTotal(count || 0);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar usuários");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  // Load users only after filiais have been fetched and authentication resolved
  useEffect(() => {
    if (authLoading || !filiaisLoaded) return;
    void loadUsers();
  }, [loadUsers, authLoading, filiaisLoaded]);

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

  const impersonate = async (userId: string) => {
    setUpdating(userId);
    try {
      const { data, error } = await supabase.rpc('impersonate_user', { p_user_id: userId });
      if (error) throw error;
      const tokens = data as { access_token: string; refresh_token: string };
      await setSession(tokens);
      navigate('/');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao entrar como usuário');
    } finally {
      setUpdating(null);
    }
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
                  <Button variant="secondary" onClick={() => { setSearch(""); setRoleFilter("all"); }}>Limpar filtros</Button>
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
                      <TableHead>Entrar como</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
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
                        <TableCell>
                          <Button variant="outline" size="sm" disabled={updating === u.user_id} onClick={() => impersonate(u.user_id)}>
                            Entrar como
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Anterior</Button>
                <Button variant="outline" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </Protected>
  );
}


