import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Table as UTable, TableHeader as UTableHeader, TableRow as UTableRow, TableHead as UTableHead, TableBody as UTableBody, TableCell as UTableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VincularClienteSaas from "@/components/app/VincularClienteSaas";

interface Filial {
  id: string;
  nome: string;
  created_at: string;
  kind?: string;
  owner_name?: string | null;
  owner_email?: string | null;
  billing_plan?: string | null;
  billing_status?: string | null;
  domain?: string | null;
  is_active?: boolean;
}

interface AdminProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  filial_id: string;
  role: string;
}

interface AdminForm {
  filial_id: string;
  email: string;
  full_name: string;
  password: string;
}

interface AdminCreatePayload {
  email: string;
  full_name?: string;
  filial_id: string;
  password?: string;
}

interface AllowedPanel {
  panel: string;
}

export default function FiliaisPage({ filter }: { filter?: "interna" | "saas" }) {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [novaFilialNome, setNovaFilialNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [novaKind, setNovaKind] = useState<string>('interna');
  const [novaOwnerName, setNovaOwnerName] = useState("");
  const [novaOwnerEmail, setNovaOwnerEmail] = useState("");
  const [novaPlan, setNovaPlan] = useState("");
  const [novaBilling, setNovaBilling] = useState("");
  const [novaDomain, setNovaDomain] = useState("");
  const [editing, setEditing] = useState<Record<string, Partial<Filial>>>({});
  // Admins de Filial (unificado)
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState<AdminForm>({ filial_id: "", email: "", full_name: "", password: "" });
  // Acessos por Filial (unificado)
  const [accessFilialId, setAccessFilialId] = useState<string>("");
  const [accessPanels, setAccessPanels] = useState<string[]>([]);
  const [accessSaving, setAccessSaving] = useState(false);
  // Modais de criação
  const [openInternal, setOpenInternal] = useState(false);
  const [openSaas, setOpenSaas] = useState(false);
  const [formInternal, setFormInternal] = useState({ nome: "" });
  const [formSaas, setFormSaas] = useState({ nome: "", owner_name: "", owner_email: "", billing_plan: "", billing_status: "", domain: "" });

  useEffect(() => {
    document.title = "Gestão de Filiais | BlockURB";
    fetchFiliais();
    loadAdmins();
  }, []);

  const fetchFiliais = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('filiais')
      .select('id, nome, created_at, kind, owner_name, owner_email, billing_plan, billing_status, domain, is_active')
      .order('nome', { ascending: true });

    if (error) {
      toast.error("Erro ao buscar filiais: " + error.message);
    } else if (data) {
      setFiliais(data);
    }
    setLoading(false);
  };

  const handleAddFilial = async () => {
    if (!novaFilialNome.trim()) {
      toast.warning("O nome da filial não pode estar vazio.");
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase
      .from('filiais')
      .insert([{ 
        nome: novaFilialNome.trim(),
        kind: novaKind,
        owner_name: novaOwnerName || null,
        owner_email: novaOwnerEmail || null,
        billing_plan: novaPlan || null,
        billing_status: novaBilling || null,
        domain: novaDomain || null,
      }]);

    if (error) {
      toast.error(`Erro ao adicionar filial: ${error.message}`);
    } else {
      toast.success(`Filial "${novaFilialNome.trim()}" adicionada com sucesso!`);
      setNovaFilialNome("");
      setNovaKind('interna');
      setNovaOwnerName("");
      setNovaOwnerEmail("");
      setNovaPlan("");
      setNovaBilling("");
      setNovaDomain("");
      fetchFiliais(); // Re-fetch the list
    }
    setIsSubmitting(false);
  };

  const setEdit = (id: string, field: keyof Filial, value: Filial[keyof Filial]) => {
    setEditing((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const saveEdit = async (f: Filial) => {
    const changes = editing[f.id] || {};
    if (!Object.keys(changes).length) return;
    try {
      const payload = {
        p_filial_id: f.id,
        p_kind: (changes.kind ?? f.kind) as string,
        p_owner_name: (changes.owner_name ?? f.owner_name) || null,
        p_owner_email: (changes.owner_email ?? f.owner_email) || null,
        p_billing_plan: (changes.billing_plan ?? f.billing_plan) || null,
        p_billing_status: (changes.billing_status ?? f.billing_status) || null,
        p_domain: (changes.domain ?? f.domain) || null,
      };
      const { error } = await supabase.rpc('admin_update_filial_info', payload);
      if (error) throw error;
      toast.success('Filial atualizada');
      setEditing((prev) => ({ ...prev, [f.id]: {} }));
      fetchFiliais();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Falha ao atualizar filial';
      toast.error(message);
    }
  };

  // ===== Admins de Filial =====
  const loadAdmins = async () => {
    setAdminsLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, filial_id, role')
      .eq('role', 'adminfilial')
      .order('full_name', { ascending: true });
    setAdmins(data || []);
    setAdminsLoading(false);
  };

  const createAdmin = async () => {
    if (!adminForm.filial_id || !adminForm.email.trim()) {
      toast.error('Selecione a filial e informe o e-mail.');
      return;
    }
    if (adminForm.password && adminForm.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setCreatingAdmin(true);
    try {
      const payload: AdminCreatePayload = {
        email: adminForm.email.trim(),
        full_name: adminForm.full_name?.trim(),
        filial_id: adminForm.filial_id,
      };
      if (adminForm.password) payload.password = adminForm.password;
      const { data: result, error } = await supabase.functions.invoke('create-admin-filial', { body: payload });
      if (error) throw new Error(error.message || 'Falha ao criar admin de filial');
      toast.success(`Admin de filial criado: ${result.email}`);
      setAdminForm({ filial_id: "", email: "", full_name: "", password: "" });
      loadAdmins();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao criar admin de filial';
      toast.error(message);
    } finally {
      setCreatingAdmin(false);
    }
  };

  // ===== Acessos por Filial =====
  const loadAccessPanels = async (id: string) => {
    setAccessPanels([]);
    const { data } = await supabase
      .from('filial_allowed_panels')
      .select('panel')
      .eq('filial_id', id);
    setAccessPanels(((data as AllowedPanel[]) || []).map((r) => r.panel));
  };

  const togglePanel = (key: string) => {
    setAccessPanels((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const saveAccessPanels = async () => {
    if (!accessFilialId) { toast.error('Selecione uma filial'); return; }
    setAccessSaving(true);
    try {
      const { error } = await supabase.rpc('set_filial_allowed_panels', { p_filial_id: accessFilialId, p_panels: accessPanels });
      if (error) throw error;
      toast.success('Acessos atualizados.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Falha ao salvar acessos';
      toast.error(message);
    } finally {
      setAccessSaving(false);
    }
  };

  return (
    <Protected>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: 'Admin' }, { label: 'Gestão de Filiais' }]}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Coluna da Esquerda: Adicionar Nova Filial */}
          <div className="space-y-6">
{filter === "saas" ? (
  <Card>
    <CardHeader>
      <CardTitle>Adicionar SaaS</CardTitle>
      <CardDescription>Cadastre um novo cliente SaaS.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setOpenSaas(true)}>Adicionar SaaS</Button>
      </div>
    </CardContent>
  </Card>
) : (
  <Card>
    <CardHeader>
      <CardTitle>Adicionar Filial</CardTitle>
      <CardDescription>Escolha o tipo de filial para cadastrar.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex gap-3">
        <Button variant="default" onClick={() => setOpenInternal(true)}>Adicionar Filial Interna</Button>
        <Button variant="secondary" onClick={() => setOpenSaas(true)}>Adicionar SaaS</Button>
      </div>
    </CardContent>
  </Card>
)}

            {/* Modal Filial Interna */}
            <Dialog open={openInternal} onOpenChange={setOpenInternal}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Filial Interna</DialogTitle>
                  <DialogDescription>Crie uma filial interna vinculada à BlockURB.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <Input placeholder="Ex: Filial Curitiba" value={formInternal.nome} onChange={(e) => setFormInternal({ ...formInternal, nome: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpenInternal(false)}>Cancelar</Button>
                  <Button onClick={async () => {
                    if (!formInternal.nome.trim()) { toast.error('Informe o nome'); return; }
                    setIsSubmitting(true);
                    const { error } = await supabase.from('filiais').insert([{ nome: formInternal.nome.trim(), kind: 'interna' }]);
                    setIsSubmitting(false);
                    if (error) { toast.error(error.message); return; }
                    toast.success('Filial interna criada');
                    setFormInternal({ nome: '' });
                    setOpenInternal(false);
                    fetchFiliais();
                  }}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal SaaS */}
            <Dialog open={openSaas} onOpenChange={setOpenSaas}>
              <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Cliente SaaS</DialogTitle>
                  <DialogDescription>Crie um cliente SaaS (funciona como uma filial dedicada).</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <Input placeholder="Ex: Cliente XYZ" value={formSaas.nome} onChange={(e) => setFormSaas({ ...formSaas, nome: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Responsável</label>
                      <Input value={formSaas.owner_name} onChange={(e) => setFormSaas({ ...formSaas, owner_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">E-mail</label>
                      <Input type="email" value={formSaas.owner_email} onChange={(e) => setFormSaas({ ...formSaas, owner_email: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Plano</label>
                      <Input value={formSaas.billing_plan} onChange={(e) => setFormSaas({ ...formSaas, billing_plan: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Status Cobrança</label>
                      <Input value={formSaas.billing_status} onChange={(e) => setFormSaas({ ...formSaas, billing_status: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Domínio</label>
                      <Input placeholder="cliente.blockurb.com" value={formSaas.domain} onChange={(e) => setFormSaas({ ...formSaas, domain: e.target.value })} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpenSaas(false)}>Cancelar</Button>
                  <Button onClick={async () => {
                    if (!formSaas.nome.trim()) { toast.error('Informe o nome'); return; }
                    setIsSubmitting(true);
                    const { error } = await supabase.from('filiais').insert([{ 
                      nome: formSaas.nome.trim(),
                      kind: 'saas',
                      owner_name: formSaas.owner_name || null,
                      owner_email: formSaas.owner_email || null,
                      billing_plan: formSaas.billing_plan || null,
                      billing_status: formSaas.billing_status || null,
                      domain: formSaas.domain || null,
                    }]);
                    setIsSubmitting(false);
                    if (error) { toast.error(error.message); return; }
                    toast.success('Cliente SaaS criado');
                    setFormSaas({ nome: '', owner_name: '', owner_email: '', billing_plan: '', billing_status: '', domain: '' });
                    setOpenSaas(false);
                    fetchFiliais();
                  }}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

{filter === "saas" ? (
  <Card>
    <CardHeader>
      <CardTitle>Gerenciar e Vincular Cliente SaaS</CardTitle>
      <CardDescription>Associe um usuário existente como responsável de uma filial SaaS.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <VincularClienteSaas filiais={filiais} onVincular={fetchFiliais} />
    </CardContent>
  </Card>
) : (
  <Card>
    <CardHeader>
      <CardTitle>Contas Admin Filial</CardTitle>
      <CardDescription>Crie e gerencie contas administrativas vinculadas às filiais.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {/* Conteúdo original para filiais internas permanece igual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Filial</label>
          <Select value={adminForm.filial_id} onValueChange={(v) => setAdminForm((s) => ({ ...s, filial_id: v }))}>
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
          <Input value={adminForm.full_name} onChange={(e) => setAdminForm((s) => ({ ...s, full_name: e.target.value }))} placeholder="Nome completo" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">E-mail</label>
          <Input type="email" value={adminForm.email} onChange={(e) => setAdminForm((s) => ({ ...s, email: e.target.value }))} placeholder="email@empresa.com" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Senha (opcional)</label>
          <Input type="password" value={adminForm.password} onChange={(e) => setAdminForm((s) => ({ ...s, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
        </div>
        <div className="flex items-end">
          <Button onClick={createAdmin} disabled={creatingAdmin}>{creatingAdmin ? 'Criando...' : 'Criar'}</Button>
        </div>
      </div>

      <div className="mt-4">
        {adminsLoading ? (
          <p className="text-center text-muted-foreground">Carregando...</p>
        ) : (
          <UTable>
            <UTableHeader>
              <UTableRow>
                <UTableHead>Nome</UTableHead>
                <UTableHead>E-mail</UTableHead>
                <UTableHead>Filial</UTableHead>
              </UTableRow>
            </UTableHeader>
            <UTableBody>
              {admins.map((a) => (
                <UTableRow key={a.user_id}>
                  <UTableCell className="font-medium">{a.full_name}</UTableCell>
                  <UTableCell>{a.email}</UTableCell>
                  <UTableCell>{filiais.find(f => f.id === a.filial_id)?.nome || a.filial_id}</UTableCell>
                </UTableRow>
              ))}
            </UTableBody>
          </UTable>
        )}
      </div>
    </CardContent>
  </Card>
)}

{filter === "saas" ? (
  <Card>
    <CardHeader>
      <CardTitle>Gestão de Acessos SaaS</CardTitle>
      <CardDescription>Defina quais painéis cada filial pode acessar.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <label className="text-sm text-muted-foreground">Filial SaaS</label>
        <Select value={accessFilialId} onValueChange={(v) => { setAccessFilialId(v); loadAccessPanels(v); }}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {filiais.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {accessFilialId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {['adminfilial','urbanista','juridico','contabilidade','marketing','comercial','imobiliaria','corretor','obras','investidor','terrenista'].map((k) => (
            <label key={k} className="flex items-center gap-2 rounded-md border p-2">
              <input type="checkbox" checked={accessPanels.includes(k)} onChange={() => togglePanel(k)} />
              <span className="capitalize">{k}</span>
            </label>
          ))}
        </div>
      )}
      <div>
        <Button disabled={!accessFilialId || accessSaving} onClick={saveAccessPanels}>{accessSaving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </CardContent>
  </Card>
) : (
  <Card>
    <CardHeader>
      <CardTitle>Acessos por Filial</CardTitle>
      <CardDescription>Defina quais painéis cada filial pode acessar.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <label className="text-sm text-muted-foreground">Filial</label>
        <Select value={accessFilialId} onValueChange={(v) => { setAccessFilialId(v); loadAccessPanels(v); }}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {filiais.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {accessFilialId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {['adminfilial','urbanista','juridico','contabilidade','marketing','comercial','imobiliaria','corretor','obras','investidor','terrenista'].map((k) => (
            <label key={k} className="flex items-center gap-2 rounded-md border p-2">
              <input type="checkbox" checked={accessPanels.includes(k)} onChange={() => togglePanel(k)} />
              <span className="capitalize">{k}</span>
            </label>
          ))}
        </div>
      )}
      <div>
        <Button disabled={!accessFilialId || accessSaving} onClick={saveAccessPanels}>{accessSaving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </CardContent>
  </Card>
)}
          </div>

          {/* Coluna da Direita: Lista de Filiais */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Filiais Cadastradas</CardTitle>
                <CardDescription>Lista de todas as filiais existentes no sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground">Carregando...</p>
                ) : (
                  <>
                    {filter === "interna" ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead>E-mail</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filiais
                            .filter(filial => !filter || filial.kind === filter)
                            .map((filial) => {
                              const admin = admins.find(a => a.filial_id === filial.id);
                              return (
                                <TableRow key={filial.id}>
                                  <TableCell className="font-medium">{filial.nome}</TableCell>
                                  <TableCell>{admin ? admin.full_name : "N/A"}</TableCell>
                                  <TableCell>{admin ? admin.email : "N/A"}</TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Billing</TableHead>
                            <TableHead>Domínio</TableHead>
                            <TableHead>Ações</TableHead>
                            <TableHead>Data de Criação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filiais
                            .filter(filial => !filter || filial.kind === filter)
                            .map((filial) => (
                              <TableRow key={filial.id}>
                                <TableCell className="font-medium">{filial.nome}</TableCell>
                                <TableCell>
                                  <Select value={(editing[filial.id]?.kind ?? filial.kind ?? 'interna') as string} onValueChange={(v) => setEdit(filial.id, 'kind', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="interna">Interna</SelectItem>
                                      <SelectItem value="saas">SaaS</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input value={editing[filial.id]?.owner_name ?? filial.owner_name ?? ''} onChange={(e) => setEdit(filial.id, 'owner_name', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                  <Input type="email" value={editing[filial.id]?.owner_email ?? filial.owner_email ?? ''} onChange={(e) => setEdit(filial.id, 'owner_email', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                  <Input value={editing[filial.id]?.billing_plan ?? filial.billing_plan ?? ''} onChange={(e) => setEdit(filial.id, 'billing_plan', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                  <Input value={editing[filial.id]?.billing_status ?? filial.billing_status ?? ''} onChange={(e) => setEdit(filial.id, 'billing_status', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                  <Input value={editing[filial.id]?.domain ?? filial.domain ?? ''} onChange={(e) => setEdit(filial.id, 'domain', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                  <Button variant="secondary" onClick={() => saveEdit(filial)}>Salvar</Button>
                                </TableCell>
                                <TableCell>{new Date(filial.created_at).toLocaleDateString('pt-BR')}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}
                {!loading && filiais.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhuma filial encontrada.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </Protected>
  );
}
