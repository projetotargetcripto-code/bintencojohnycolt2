import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/dataClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import L, { LatLngBoundsExpression, Layer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { LoteInfoModal, LoteDetalhado } from "@/components/LoteInfoModal";
import { useAuthorization } from "@/providers/AuthorizationProvider";

// --- INÍCIO DA VERSÃO ESTÁVEL E CORRIGIDA ---

// Interfaces e Funções de Busca (mantidas como estão)
interface Emp {
  id: string;
  nome: string;
  status: string;
  stats: { lotes: number; vendidos: number; pct: number; };
  bounds: { sw: [number, number]; ne: [number, number]; };
  geojson_url?: string;
  masterplan_url?: string;
  overlay?: { url: string; sw: [number, number]; ne: [number, number]; opacity: number; };
}
const fetchEmpreendimentos = async (filialId?: string | null): Promise<Emp[]> => {
  try {
    if (!filialId) return [];

    // 1) Estatísticas por empreendimento da filial
    const { data: statsRows, error: statsError } = await supabase.rpc('get_filial_empreendimentos', {
      p_filial_id: filialId,
    });
    if (statsError) {
      console.error("Erro ao buscar stats de empreendimentos:", statsError);
      return [];
    }

    const ids: string[] = (statsRows || []).map((r: any) => r.empreendimento_id);
    if (ids.length === 0) return [];

    // 2) Detalhes (bounds, urls) dos empreendimentos da filial
    const { data: empRows, error: empError } = await supabase
      .from('empreendimentos')
      .select('id, nome, bounds, geojson_url, masterplan_url')
      .in('id', ids);
    if (empError) {
      console.error("Erro ao buscar empreendimentos:", empError);
      return [];
    }

    const detailsById = Object.fromEntries((empRows || []).map((e: any) => [e.id, e]));

    return (statsRows || []).map((row: any) => {
      const det = detailsById[row.empreendimento_id] || {};
      const boundsRaw = det.bounds ? (typeof det.bounds === 'string' ? JSON.parse(det.bounds) : det.bounds) : { sw: [-23.5, -46.6], ne: [-23.5, -46.6] };
      const total = Number(row.total_lotes) || 0;
      const vendidos = Number(row.lotes_vendidos) || 0;

      return {
        id: row.empreendimento_id,
        nome: det.nome || row.nome || 'Sem nome',
        status: row.status || 'pendente',
        stats: {
          lotes: total,
          vendidos,
          pct: total > 0 ? Math.round((vendidos / total) * 100) : 0,
        },
        bounds: {
          sw: [boundsRaw.sw?.lat || boundsRaw.sw?.[0], boundsRaw.sw?.lng || boundsRaw.sw?.[1]],
          ne: [boundsRaw.ne?.lat || boundsRaw.ne?.[0], boundsRaw.ne?.lng || boundsRaw.ne?.[1]],
        },
        geojson_url: det.geojson_url,
        masterplan_url: det.masterplan_url,
        overlay: det.masterplan_url && boundsRaw
          ? {
              url: det.masterplan_url,
              sw: [boundsRaw.sw?.lat || boundsRaw.sw?.[0], boundsRaw.sw?.lng || boundsRaw.sw?.[1]],
              ne: [boundsRaw.ne?.lat || boundsRaw.ne?.[0], boundsRaw.ne?.lng || boundsRaw.ne?.[1]],
              opacity: 0.7,
            }
          : undefined,
      } as Emp;
    });
  } catch (e) {
    return [];
  }
};

// Função para definir o estilo do lote com base no status
const getLoteStyle = (status: string | undefined) => {
    switch (status) {
        case 'disponivel':
            return { color: '#22c55e', weight: 1, fillColor: '#86efac', fillOpacity: 0.4 }; // Verde
        case 'reservado':
            return { color: '#f59e0b', weight: 1, fillColor: '#fcd34d', fillOpacity: 0.4 }; // Amarelo
        case 'vendido':
            return { color: '#ef4444', weight: 1, fillColor: '#fca5a5', fillOpacity: 0.4 }; // Vermelho
        default:
            return { color: '#6b7280', weight: 1, fillColor: '#d1d5db', fillOpacity: 0.4 }; // Cinza
    }
};

// Função para definir o estilo de HOVER do lote com base no status
const getLoteHoverStyle = (status: string | undefined) => {
    const baseStyle = getLoteStyle(status);
    return {
        ...baseStyle,
        weight: 3,
        fillOpacity: 0.7, // Deixa a cor mais forte
    };
};

// Componente Sidebar (mantido como está, mas sem erros)
function SidebarEmpreendimentos({ onSelect, activeId, filialId }: { onSelect: (e: Emp) => void; activeId?: string; filialId?: string | null; }) {
  const [q, setQ] = useState("");
  const [empreendimentos, setEmpreendimentos] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmpreendimentos(filialId).then(data => {
      setEmpreendimentos(data);
      setLoading(false);
    });
  }, [filialId]);

  const filtered = useMemo(() => empreendimentos.filter(e => e.nome.toLowerCase().includes(q.toLowerCase())), [q, empreendimentos]);

  return (
    <aside className="rounded-[14px] border bg-secondary/60 p-3 h-full flex flex-col">
      <h2 className="text-sm font-semibold mb-2">Empreendimentos</h2>
      <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
      <ScrollArea className="mt-3 flex-1">
        <div className="space-y-2 pr-1">
          {loading && <p className="text-xs text-muted-foreground p-4 text-center">Carregando...</p>}
          {!loading && filtered.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center">Nenhum resultado.</p>}
          {filtered.map((e) => (
            <button key={e.id} onClick={() => onSelect(e)} className={cn("w-full text-left rounded-md border p-3 hover:bg-muted/50", activeId === e.id && "ring-2 ring-primary")}
            >
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm">{e.nome}</div>
                {e.status !== 'aprovado' && (
                  <Badge className={e.status === 'pendente' ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' : 'bg-red-500/20 text-red-700 border border-red-500/30'}>
                    {e.status === 'pendente' ? 'Pendente' : (e.status === 'rejeitado' ? 'Rejeitado' : e.status)}
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span>{e.stats.lotes} lotes</span>
                <span>{e.stats.vendidos} vendidos</span>
                <span>{e.stats.pct}%</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

// Componente MapView CORRIGIDO
function MapView({ selected }: { selected?: Emp }) {
  const mapRef = useRef<L.Map | null>(null);
  const lotsLayerRef = useRef<Layer | null>(null);
  const overlayLayerRef = useRef<Layer | null>(null);
  const [baseLayer, setBaseLayer] = useState<'esri' | 'osm'>('esri');
  const [showLots, setShowLots] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [selectedLote, setSelectedLote] = useState<LoteDetalhado | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && mapRef.current === null) {
      const map = L.map(node, { center: [-23.5, -46.6], zoom: 13, zoomControl: true });
      mapRef.current = map;
      // Força a atualização para carregar o tile layer
      setBaseLayer(current => current);
    }
  }, []);
  
  // Gerencia o Tile Layer (Base do Mapa)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    const layer = baseLayer === 'esri' ? esri : osm;
    layer.addTo(map);
    return () => { map.removeLayer(layer) };
  }, [baseLayer]);

  // Carrega os dados do Empreendimento Selecionado
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) {
        // Limpa layers se nada estiver selecionado
        if (lotsLayerRef.current) map?.removeLayer(lotsLayerRef.current);
        if (overlayLayerRef.current) map?.removeLayer(overlayLayerRef.current);
        return;
    };

    setLoading(true);
    const bounds = [selected.bounds.sw, selected.bounds.ne] as LatLngBoundsExpression;
    map.fitBounds(bounds, { padding: [20, 20] });

    const loadData = async () => {
        try {
            // Limpa layers antigos antes de carregar novos
            if (lotsLayerRef.current) map.removeLayer(lotsLayerRef.current);
            if (overlayLayerRef.current) map.removeLayer(overlayLayerRef.current);

            // 1. Carregar GeoJSON via RPC para garantir que o status venha corretamente
            const { data: geojsonData, error: rpcError } = await supabase.rpc('lotes_geojson', {
                p_empreendimento_id: selected.id
            });

            if (rpcError) throw new Error(`Falha ao buscar lotes: ${rpcError.message}`);
            if (!geojsonData || !geojsonData.features) throw new Error("Nenhum lote encontrado ou GeoJSON inválido.");

            const layer = L.geoJSON(geojsonData, {
                style: (feature) => getLoteStyle(feature?.properties.status),
                onEachFeature: (feature, layer) => {
                    const p = feature.properties || {};
                    
                    // Evento de Clique para abrir o Modal
                    layer.on({
                        click: async () => {
                            try {
                                // O 'p.id' vem das propriedades do GeoJSON, que foi adicionado pela nossa RPC
                                if (!p.id) {
                                    toast.error("Este lote não possui um ID para carregar os detalhes.");
                                    return;
                                }
                                const { data, error } = await supabase
                                    .from('lotes')
                                    .select('id, nome, numero, status, area_m2, perimetro_m, area_hectares, valor') // Adiciona 'valor'
                                    .eq('id', p.id)
                                    .single();
                                
                                if (error) throw error;
                                
                                setSelectedLote(data);
                                setIsModalOpen(true);

          } catch (error) {
                                toast.error("Não foi possível carregar os detalhes do lote.");
                                console.error("Erro ao buscar detalhes do lote:", error);
                            }
                        },
                        mouseover: (e) => { // Manter hover
                            e.target.setStyle(getLoteHoverStyle(p.status));
                            e.target.bringToFront();
                        },
                        mouseout: (e) => { // Manter hover
                            (lotsLayerRef.current as L.GeoJSON).resetStyle(e.target);
                        }
                    });
                }
            });
        if (showLots) layer.addTo(map);
            lotsLayerRef.current = layer;

            // 2. Carregar Masterplan Overlay
            if (selected.overlay?.url) {
                const overlay = L.imageOverlay(selected.overlay.url, bounds, { opacity });
                if (showOverlay) overlay.addTo(map);
                overlayLayerRef.current = overlay;
            }
      } catch (error) {
            console.error("Erro ao carregar dados do mapa:", error);
            toast.error(`Não foi possível carregar os dados do loteamento. (${error.message})`);
        } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selected, showLots, showOverlay, opacity]);

  return (
    <div className="relative h-[calc(100vh-180px)] rounded-md border bg-secondary/60">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />
      <div className="absolute left-3 top-3 z-40 rounded-md border bg-background/90 p-2 shadow space-y-2">
        <Select value={baseLayer} onValueChange={(v: any) => setBaseLayer(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="esri">Satélite</SelectItem><SelectItem value="osm">Mapa</SelectItem></SelectContent>
            </Select>
        <div className="flex items-center gap-2"><Checkbox checked={showLots} onCheckedChange={(v) => setShowLots(Boolean(v))} id="lotes" /><label htmlFor="lotes">Lotes</label></div>
        <div className="flex items-center gap-2"><Checkbox checked={showOverlay} onCheckedChange={(v) => setShowOverlay(Boolean(v))} id="masterplan" /><label htmlFor="masterplan">Masterplan</label></div>
        <div><Slider value={[opacity]} onValueChange={(v) => setOpacity(v[0])} min={0.1} max={1} step={0.1} /></div>
      </div>
      {loading && <div className="absolute inset-0 grid place-items-center bg-background/40 z-[1001]"><div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin" /></div>}
      {!selected && !loading && (
        <div className="absolute inset-0 grid place-items-center z-[1001]">
          <div className="rounded-md bg-background/90 border p-4 text-sm">Selecione um empreendimento.</div>
        </div>
      )}
      
      {/* Renderiza o Modal */}
      <LoteInfoModal
        lote={selectedLote}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

// Componente Principal da Página
export default function AdminMapa() {
  const [active, setActive] = useState<Emp | undefined>(undefined);
  const { profile } = useAuthorization();
  useEffect(() => { document.title = `Mapa Interativo | BlockURB`; }, []);

  return (
    <Protected>
      <AppShell menuKey="adminfilial" breadcrumbs={[{ label: 'Admin' }, { label: 'Mapa Interativo' }]}> 
        <div className="grid gap-4 lg:grid-cols-[320px_1fr] items-start">
            <SidebarEmpreendimentos onSelect={setActive} activeId={active?.id} filialId={profile?.filial_id || null} />
            <MapView selected={active} />
        </div>
      </AppShell>
    </Protected>
  );
}
// --- FIM DA VERSÃO ESTÁVEL E CORRIGIDA ---
