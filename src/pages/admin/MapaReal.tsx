import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import L, { LatLngBoundsExpression, Layer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/lib/dataClient";

// Interface para empreendimentos do Supabase
interface Empreendimento {
  id: string;
  nome: string;
  created_at: string;
}

function SidebarEmpreendimentos({ onSelect, activeId }: { onSelect: (e: Empreendimento) => void; activeId?: string; }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [periodo, setPeriodo] = useState("7");
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nome, created_at')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setEmpreendimentos(data);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return empreendimentos.filter(e => e.nome.toLowerCase().includes(q.toLowerCase()));
  }, [q, empreendimentos]);

  return (
    <aside className="rounded-[14px] border border-border bg-secondary/60 p-3 h-full flex flex-col">
      <h2 className="text-sm font-semibold mb-2">Empreendimentos</h2>
      <div className="space-y-2">
        <Input placeholder="Buscar por nome" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar empreendimento" />
        <div className="grid grid-cols-2 gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="z-[60] bg-background">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservado">Reservado</SelectItem>
              <SelectItem value="vendido">Vendido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent className="z-[60] bg-background">
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="mt-3 flex-1">
        <div className="space-y-2 pr-1">
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum empreendimento encontrado</div>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => onSelect(e)}
                className={cn("w-full text-left rounded-md border border-border p-3 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary", activeId===e.id && "ring-2 ring-primary")}
                aria-pressed={activeId===e.id}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{e.nome}</div>
                  <a href={`/admin?empreendimento=${e.id}`} onClick={(ev)=>ev.stopPropagation()} className="text-xs text-primary underline">Abrir no painel</a>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Criado em: {new Date(e.created_at).toLocaleDateString('pt-BR')}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <footer className="pt-3 border-t border-border mt-3 text-xs text-muted-foreground">
        Legenda: <span className="text-[10px] ml-2">Disponível</span> <span className="inline-block w-3 h-3 bg-[#00C26E] rounded-sm align-middle" />
        <span className="text-[10px] ml-2">Reservado</span> <span className="inline-block w-3 h-3 bg-[#EAB308] rounded-sm align-middle" />
        <span className="text-[10px] ml-2">Vendido</span> <span className="inline-block w-3 h-3 bg-[#EF4444] rounded-sm align-middle" />
      </footer>
    </aside>
  );
}

function MapView({ selected }: { selected?: Empreendimento }) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [base, setBase] = useState<'esri'|'osm'>('esri');
  const [showLots, setShowLots] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [lotsLayer, setLotsLayer] = useState<Layer | null>(null);
  const [overlayLayer, setOverlayLayer] = useState<Layer | null>(null);

  // Initialize map
  useEffect(() => {
    const container = document.getElementById('leaflet-map-real');
    if (map || !container) return;
    const m = L.map(container, {
      zoomControl: true,
      center: [-23.5489, -46.6388],
      zoom: 13,
    });
    setMap(m);
    return () => { m.remove(); };
  }, [map]);

  // Base layers
  useEffect(() => {
    if (!map) return;
    const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles © Esri' });
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' });

    const chosen = base === 'esri' ? esri : osm;
    chosen.addTo(map);

    return () => { map.removeLayer(chosen); };
  }, [map, base]);

  // When selected empreendimento changes, load data from Supabase
  useEffect(() => {
    if (!map || !selected) return;
    
    setLoading(true);
    
    (async () => {
      try {        
        // Load lotes via RPC
        const { data: fc, error: lotesError } = await supabase.rpc('lotes_geojson', { p_empreendimento: selected.id });
        
        if (!lotesError && fc) {
          // Remove previous lots layer
          if (lotsLayer) map.removeLayer(lotsLayer);
          
          // Create new lots layer
          const layer = L.geoJSON(fc as any, {
            style: (feat: any) => {
              const status = feat?.properties?.status || 'disponivel';
              switch (status) {
                case 'disponivel': return { color: '#00C26E', fillColor: '#00C26E', fillOpacity: 0.25, weight: 2 };
                case 'reservado': return { color: '#EAB308', fillColor: '#EAB308', fillOpacity: 0.25, weight: 2 };
                case 'vendido': return { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.25, weight: 2 };
                default: return { color: '#22D3EE', fillColor: '#22D3EE', fillOpacity: 0.20, weight: 2 };
              }
            },
            onEachFeature: (feat, lyr) => {
              const p: any = feat.properties || {};
              const html = `
                <div class="text-xs">
                  <div><strong>${p.codigo ?? 'Lote'}</strong></div>
                  <div>Status: ${p.status ?? '—'}</div>
                  ${p.area_m2 ? `<div>Área: ${p.area_m2} m²</div>` : ''}
                  ${p.preco ? `<div>Preço: R$ ${p.preco.toLocaleString('pt-BR')}</div>` : ''}
                </div>
              `;
              (lyr as any).bindPopup(html);
            },
          });
          
          setLotsLayer(layer);
          if (showLots) layer.addTo(map);

          // Fit bounds to the feature collection
          if (fc.features && fc.features.length > 0) {
            const group = L.geoJSON(fc as any);
            map.fitBounds(group.getBounds(), { padding: [20, 20] });
          }
        }

        // Load overlay
        if (overlayLayer) { map.removeLayer(overlayLayer); setOverlayLayer(null); }
        
        const { data: overlay, error: overlayError } = await supabase
          .from('masterplan_overlays')
          .select('image_path, bounds, opacity')
          .eq('empreendimento_id', selected.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!overlayError && overlay && showOverlay) {
          // Get signed URL for the image
          const { data: signed } = await supabase.storage
            .from('masterplans')
            .createSignedUrl(overlay.image_path, 60);
          
          if (signed?.signedUrl) {
            // Convert bounds from GeoJSON Polygon to SW/NE
            const coords = overlay.bounds.coordinates[0];
            const sw: [number, number] = [coords[0][1], coords[0][0]]; // [lat, lng]
            const ne: [number, number] = [coords[2][1], coords[2][0]]; // [lat, lng]
            
            const img = L.imageOverlay(signed.signedUrl, [sw, ne], { opacity: overlay.opacity ?? opacity });
            img.addTo(map);
            setOverlayLayer(img);
          }
        }

      } catch (error) {
        console.error('Erro ao carregar dados do empreendimento:', error);
      } finally {
        setLoading(false);
      }
    })();
    
  }, [map, selected]);

  // Toggle showLots
  useEffect(() => {
    if (!map || !lotsLayer) return;
    if (showLots) lotsLayer.addTo(map); else map.removeLayer(lotsLayer);
  }, [map, lotsLayer, showLots]);

  // Overlay visibility and opacity changes
  useEffect(() => {
    if (!map || !overlayLayer) return;
    if (showOverlay) {
      if (!map.hasLayer(overlayLayer)) overlayLayer.addTo(map);
      if ((overlayLayer as any).setOpacity) (overlayLayer as any).setOpacity(opacity);
    } else {
      if (map.hasLayer(overlayLayer)) map.removeLayer(overlayLayer);
    }
  }, [map, showOverlay, opacity, overlayLayer]);

  const clearSelection = () => {
    setLoading(false);
    if (lotsLayer && map) map.removeLayer(lotsLayer);
    if (overlayLayer && map) map.removeLayer(overlayLayer);
    setLotsLayer(null);
    setOverlayLayer(null);
  };

  return (
    <div className="relative h-[60vh] lg:h-[calc(100vh-180px)] rounded-[14px] border border-border bg-secondary/60 overflow-hidden">
      <div id="leaflet-map-real" className="absolute inset-0" />

      {/* Topbar flutuante */}
      <div className="absolute left-3 top-3 z-40 rounded-md border border-border bg-background/90 backdrop-blur p-3 shadow">
        <div className="grid grid-cols-2 lg:flex lg:items-center gap-2">
          <div className="min-w-[160px]">
            <Select value={base} onValueChange={(v: any)=>setBase(v)}>
              <SelectTrigger className="h-9 bg-background/90"><SelectValue placeholder="Base Map" /></SelectTrigger>
              <SelectContent className="z-[60] bg-background">
                <SelectItem value="esri">Esri World Imagery</SelectItem>
                <SelectItem value="osm">OpenStreetMap</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm"><Checkbox checked={showLots} onCheckedChange={(v)=>setShowLots(Boolean(v))}/> Mostrar lotes</label>
          <label className="inline-flex items-center gap-2 text-sm"><Checkbox checked={showOverlay} onCheckedChange={(v)=>setShowOverlay(Boolean(v))}/> Mostrar masterplan</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Opacidade</span>
            <div className="w-[120px]">
              <Slider min={0.2} max={1} step={0.05} value={[opacity]} onValueChange={(v)=>setOpacity(v[0])} />
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={clearSelection}>Limpar seleção</Button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-background/40">
          <div className="h-8 w-8 rounded-full border-2 border-accent/40 border-t-accent animate-spin" aria-label="Carregando" />
        </div>
      )}

      {!selected && !loading && (
        <div className="absolute inset-0 z-20 grid place-items-center pointer-events-none">
          <div className="rounded-md bg-background/90 border border-border px-4 py-2 text-sm text-muted-foreground">Selecione um empreendimento à esquerda para visualizar no mapa.</div>
        </div>
      )}
    </div>
  );
}

export default function AdminMapaReal() {
  const [active, setActive] = useState<Empreendimento | undefined>(undefined);
  useEffect(() => { document.title = "Mapa Interativo (Real) | BlockURB"; }, []);

  return (
    <Protected>
      <AppShell menuKey="adminfilial" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Mapa Interativo (Real)' }]}> 
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
          <div className="h-full">
            <SidebarEmpreendimentos onSelect={setActive} activeId={active?.id} />
          </div>
          <div>
            <MapView selected={active} />
          </div>
        </div>
      </AppShell>
    </Protected>
  );
}