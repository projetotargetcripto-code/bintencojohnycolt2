import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { KPIStat } from "@/components/app/KPIStat";
import { FiltersBar } from "@/components/app/FiltersBar";
import { DataTable, type Column } from "@/components/app/DataTable";
import { ChartPlaceholder } from "@/components/app/ChartPlaceholder";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, FileText, Target, Plus } from "lucide-react";
import { adminTeamColumns, adminTeamRows } from "@/mocks/tables";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { LotesMapPreview } from "@/components/app/LotesMapPreview";
import { SelectedEmpreendimentoProvider, useSelectedEmpreendimento } from "@/hooks/useSelectedEmpreendimento";
import { supabase } from "@/lib/dataClient";
import { Progress } from "@/components/ui/progress";

const panelTableMap: Record<string, string> = {
  comercial: 'leads',
  marketing: 'leads',
  juridico: 'contratos',
  obras: 'cronograma',
  contabilidade: 'contratos',
  imobiliaria: 'corretores',
  corretor: 'leads'
};

const sectionTableMap: Record<string, string> = {
  Leads: 'leads',
  Contratos: 'contratos',
  Cronograma: 'cronograma',
  Corretores: 'corretores'
};

function PanelHomePageInner({ menuKey, title }: { menuKey: string; title: string }) {
  const { empreendimentos, statuses } = useFilterOptions();
  const { selectedEmpreendimento, setSelectedEmpreendimento } = useSelectedEmpreendimento();
  const [status, setStatus] = useState<string>('todos');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [progress, setProgress] = useState(0);

  const table = panelTableMap[menuKey];

  useEffect(() => {
    if (!table || !selectedEmpreendimento) return;
    supabase
      .from(table)
      .select('*')
      .eq('empreendimento_id', selectedEmpreendimento)
      .then(({ data }) => {
        setRows(data ?? []);
        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]).map(key => ({ key, header: key })));
        }
      });
  }, [table, selectedEmpreendimento]);

  useEffect(() => {
    if (menuKey !== 'obras' || !selectedEmpreendimento) return;
    supabase
      .from('etapas_obras')
      .select('concluida')
      .eq('empreendimento_id', selectedEmpreendimento)
      .then(({ data }) => {
        if (data) {
          const total = data.length;
          const done = data.filter(e => e.concluida).length;
          setProgress(total ? Math.round((done / total) * 100) : 0);
        } else {
          setProgress(0);
        }
      });
  }, [menuKey, selectedEmpreendimento]);

  if (menuKey === 'superadmin' || menuKey === 'adminfilial') {
    return (
      <Protected>
        <AppShell menuKey={menuKey} breadcrumbs={[{ label: 'Home', href: '/' }, { label: title }]}> 
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">Ações rápidas</h2>
            <Link to={menuKey === 'superadmin' ? '/super-admin/empreendimentos/novo' : '/admin-filial/empreendimentos/novo'}>
              <Button variant="cta" className="gap-2"><Plus className="size-4" /> Novo Empreendimento</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIStat label="Indicador A" value={128} icon={<Building2 className="text-primary" />} />
            <KPIStat label="Indicador B" value={12} icon={<FileText className="text-accent" />} tone="warning" />
            <KPIStat label="Indicador C" value={46} delta="+12%" icon={<FileText className="text-primary" />} tone="positive" />
            <KPIStat label="Indicador D" value="18%" delta="+2pp" icon={<Target className="text-primary" />} tone="positive" />
          </div>

          <div className="mt-6">
            <FiltersBar>
              <Select value={selectedEmpreendimento ?? ''} onValueChange={setSelectedEmpreendimento}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Empreendimento" />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="cta">Aplicar filtros</Button>
            </FiltersBar>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <h3 className="mb-2 font-semibold">Tabela exemplo</h3>
              <DataTable columns={adminTeamColumns} rows={adminTeamRows} pageSize={5} />
            </div>
            <div>
              <ChartPlaceholder title="Gráfico (placeholder)" />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-2 font-semibold">Mapa</h3>
            <div className="rounded-[14px] border border-border bg-secondary/60 h-[380px] overflow-hidden">
              <LotesMapPreview empreendimentoId={selectedEmpreendimento ?? ''} height="100%" />
            </div>
            <div className="mt-4">
              <Button variant="outline">Abrir mapa completo</Button>
            </div>
          </div>
        </AppShell>
      </Protected>
    );
  }

  return (
    <Protected>
      <AppShell menuKey={menuKey} breadcrumbs={[{ label: 'Home', href: '/' }, { label: title }]}>
        <FiltersBar>
          <Select value={selectedEmpreendimento ?? ''} onValueChange={setSelectedEmpreendimento}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Empreendimento" />
            </SelectTrigger>
            <SelectContent>
              {empreendimentos.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltersBar>
        {menuKey === 'obras' && selectedEmpreendimento && (
          <div className="mt-6">
            <h3 className="mb-2 font-semibold">Progresso</h3>
            <Progress value={progress} />
            <p className="mt-1 text-sm text-muted-foreground">{progress}% concluído</p>
          </div>
        )}
        <div className="mt-6">
          {selectedEmpreendimento ? (
            <DataTable columns={columns} rows={rows} pageSize={5} />
          ) : (
            <p className="text-muted-foreground">Selecione um empreendimento para visualizar os dados.</p>
          )}
        </div>
      </AppShell>
    </Protected>
  );
}

function PanelSectionPageInner({ menuKey, title, section }: { menuKey: string; title: string; section: string }) {
  const { empreendimentos } = useFilterOptions();
  const { selectedEmpreendimento, setSelectedEmpreendimento } = useSelectedEmpreendimento();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const table = sectionTableMap[section as keyof typeof sectionTableMap];

  useEffect(() => {
    if (!table || !selectedEmpreendimento) return;
    supabase
      .from(table)
      .select('*')
      .eq('empreendimento_id', selectedEmpreendimento)
      .then(({ data }) => {
        setRows(data ?? []);
        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]).map(key => ({ key, header: key })));
        }
      });
  }, [table, selectedEmpreendimento]);

  return (
    <Protected>
      <AppShell menuKey={menuKey} breadcrumbs={[{ label: 'Home', href: '/' }, { label: title }, { label: section }]}> 
        <FiltersBar>
          <Select value={selectedEmpreendimento ?? ''} onValueChange={setSelectedEmpreendimento}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Empreendimento" />
            </SelectTrigger>
            <SelectContent>
              {empreendimentos.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FiltersBar>
        <div className="mt-6">
          {selectedEmpreendimento ? (
            <DataTable columns={columns} rows={rows} pageSize={5} />
          ) : (
            <p className="text-muted-foreground">Selecione um empreendimento para visualizar os dados.</p>
          )}
        </div>
      </AppShell>
    </Protected>
  );
}

export function PanelHomePage({ menuKey, title }: { menuKey: string; title: string }) {
  return (
    <SelectedEmpreendimentoProvider>
      <PanelHomePageInner menuKey={menuKey} title={title} />
    </SelectedEmpreendimentoProvider>
  );
}

export function PanelSectionPage({ menuKey, title, section }: { menuKey: string; title: string; section: string }) {
  return (
    <SelectedEmpreendimentoProvider>
      <PanelSectionPageInner menuKey={menuKey} title={title} section={section} />
    </SelectedEmpreendimentoProvider>
  );
}
