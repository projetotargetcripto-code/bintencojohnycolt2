import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ALL_PANELS, ALL_ROLES } from "@/config/rolesPanels";

type Filial = { id: string; nome: string; kind: string };
type UserProfile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  filial_id: string | null;
};

export default function FiliaisAccessPage() {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [filialId, setFilialId] = useState<string>("");
  const [panels, setPanels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Acessos por Filial | BlockURB";
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data: f } = await supabase.from('filiais').select('id, nome, kind').order('nome');
    setFiliais(f || []);
    setLoading(false);
  };

  const loadPanels = async (id: string) => {
    setPanels([]);
    // Super admin pode consultar diretamente a whitelist da filial
    const { data } = await supabase
      .from('filial_allowed_panels')
      .select('panel')
      .eq('filial_id', id);
    const list = (data || []).map((r: any) => r.panel);
    setPanels(list);
  };

  const loadUsers = async (id: string) => {
    setUsersLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, role, filial_id')
      .eq('filial_id', id)
      .order('full_name', { ascending: true });
    setUsers((data as any) || []);
    setUsersLoading(false);
  };

  const toggle = (key: string) => {
    setPanels((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const save = async () => {
    if (!filialId) { toast.error('Selecione uma filial'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.rpc('set_filial_allowed_panels', {
        p_filial_id: filialId,
        p_panels: panels,
      });
      if (error) throw error;
      toast.success('Acessos atualizados.');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar acessos');
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    const normalized: string | null = newRole === 'no-role' ? null : newRole;
    setUpdating(userId);
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        p_user_id: userId,
        p_role: normalized,
      });
      if (error) throw error;
      toast.success('Papel atualizado.');
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, role: normalized } : u));
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao atualizar papel');
    } finally {
      setUpdating(null);
    }
  };

  const updateFilial = async (userId: string, newFilialId: string) => {
    setUpdating(userId);
    try {
      const { error } = await supabase.rpc('admin_set_user_filial', {
        p_user_id: userId,
        p_filial_id: newFilialId,
      });
      if (error) throw error;
      toast.success('Filial atualizada.');
      await loadUsers(filialId);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao atualizar filial');
    } finally {
      setUpdating(null);
    }
  };

  const selected = useMemo(() => filiais.find((f) => f.id === filialId), [filiais, filialId]);

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: 'Super Admin' }, { label: 'Acessos por Filial' }]}> 
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Acessos por Filial</CardTitle>
              <CardDescription>Defina quais painéis cada filial pode acessar. Filiais internas por padrão têm acesso a tudo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Filial</label>
                <Select value={filialId} onValueChange={(v) => { setFilialId(v); loadPanels(v); loadUsers(v); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {filiais.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome} {f.kind === 'saas' ? '(SaaS)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filialId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ALL_PANELS.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 rounded-md border p-3">
                      <Checkbox checked={panels.includes(p.key)} onCheckedChange={() => toggle(p.key)} />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              )}

              <div>
                <Button disabled={!filialId || saving} onClick={save}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </div>
          </CardContent>
          </Card>

          {filialId && (
            <Card>
              <CardHeader>
                <CardTitle>Usuários da Filial</CardTitle>
                <CardDescription>Gerencie papéis e vínculo dos colaboradores.</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-center text-muted-foreground">Carregando...</p>
                ) : users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Filial</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.user_id}>
                          <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                          <TableCell>{u.email || '—'}</TableCell>
                          <TableCell>
                            <Select
                              value={u.role ?? 'no-role'}
                              onValueChange={(val) => updateRole(u.user_id, val)}
                              disabled={updating === u.user_id}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecionar" />
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
                            <Select
                              value={u.filial_id || ''}
                              onValueChange={(val) => updateFilial(u.user_id, val)}
                              disabled={updating === u.user_id}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Selecionar filial" />
                              </SelectTrigger>
                              <SelectContent>
                                {filiais.map((f) => (
                                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground">Nenhum usuário vinculado a esta filial.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </Protected>
  );
}


