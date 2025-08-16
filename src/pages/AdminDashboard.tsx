import { AppShell } from "@/components/layout/AppShell";
import { Protected } from "@/components/Protected";
import { KPIStat } from "@/components/app/KPIStat";
import { FiltersBar } from "@/components/app/FiltersBar";
import { DataTable } from "@/components/app/DataTable";
import { ChartPlaceholder } from "@/components/app/ChartPlaceholder";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, FileText, Target } from "lucide-react";

const columns = [
  { key: 'nome', header: 'Nome' },
  { key: 'papel', header: 'Papel' },
  { key: 'leads', header: 'Leads' },
  { key: 'conv', header: 'Conversão' },
  { key: 'status', header: 'Status' },
];

const rows = [
  { nome: 'Ana Souza', papel: 'Coordenação', leads: 84, conv: '22%', status: 'Ativa' },
  { nome: 'Bruno Lima', papel: 'Vendas', leads: 60, conv: '18%', status: 'Ativa' },
  { nome: 'Carla Nunes', papel: 'Vendas', leads: 74, conv: '21%', status: 'Ativa' },
  { nome: 'Diego Alves', papel: 'Vendas', leads: 42, conv: '12%', status: 'Ativo' },
  { nome: 'Eva Martins', papel: 'Pré-venda', leads: 55, conv: '16%', status: 'Ativa' },
  { nome: 'Felipe Costa', papel: 'Vendas', leads: 38, conv: '10%', status: 'Ativo' },
];

export default function AdminDashboard() {
  return (
    <Protected debugBypass={true}>
      <AppShell breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]}> 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIStat label="Lotes disponíveis" value={128} icon={<Building2 className="text-primary" />} />
          <KPIStat label="Reservas pendentes" value={12} icon={<FileText className="text-accent" />} tone="warning" />
          <KPIStat label="Propostas no mês" value={46} delta="+12%" icon={<FileText className="text-primary" />} tone="positive" />
          <KPIStat label="Conversão 30d" value="18%" delta="+2pp" icon={<Target className="text-primary" />} tone="positive" />
        </div>

        <div className="mt-6">
          <FiltersBar>
            {/* TODO: ligar selects a dados reais */}
            <Select defaultValue="alfa">
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Empreendimento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alfa">Alfa</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="todos">
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="cta">Aplicar filtros</Button>
          </FiltersBar>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <h3 className="mb-2 font-semibold">Equipe</h3>
            <DataTable columns={columns} rows={rows} pageSize={5} />
          </div>
          <div>
            <ChartPlaceholder title="Vendas por semana" />
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-2 font-semibold">Mapa (placeholder)</h3>
          <div className="rounded-[14px] border border-border bg-secondary/60 h-[380px] grid place-items-center text-sm text-muted-foreground">
            {/* TODO: integrar Leaflet + RPC lotes_geojson */}
            Integração futura com Leaflet / RPC lotes_geojson
            <div className="mt-4">
              <Button variant="outline">Abrir mapa completo</Button>
            </div>
          </div>
        </div>
      </AppShell>
    </Protected>
  );
}
