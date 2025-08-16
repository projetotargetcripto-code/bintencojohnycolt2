import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

type Filial = { id: string; nome: string; kind: string };

export default function FiliaisAccessPage() {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [filialId, setFilialId] = useState<string>("");
  const [panels, setPanels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
                <Select value={filialId} onValueChange={(v) => { setFilialId(v); loadPanels(v); }}>
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
        </div>
      </AppShell>
    </Protected>
  );
}


