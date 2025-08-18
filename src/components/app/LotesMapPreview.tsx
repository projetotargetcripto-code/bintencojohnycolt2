import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/dataClient';
import { toast } from 'sonner';

interface Props {
  empreendimentoId?: string;
  height?: string;
}

// Simple Leaflet map that loads lot polygons via RPC lotes_geojson
export function LotesMapPreview({ empreendimentoId, height = '380px' }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-23.5489, -46.6388],
      zoom: 13,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !empreendimentoId) return;

    setLoading(true);
    supabase
      .rpc('lotes_geojson', { p_empreendimento_id: empreendimentoId })
      .then(({ data }) => {
        if (!data) return;
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
          layerRef.current = null;
        }
        const layer = L.geoJSON(data as any, {
          style: (feature) => {
            const status = feature?.properties?.status || 'disponivel';
            switch (status) {
              case 'reservado': return { color: '#EAB308', fillColor: '#EAB308', fillOpacity: 0.25, weight: 2 };
              case 'vendido': return { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.25, weight: 2 };
              default: return { color: '#00C26E', fillColor: '#00C26E', fillOpacity: 0.25, weight: 2 };
            }
          }
        }).addTo(map);
        layerRef.current = layer;
        const bounds = layer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
      })
      .catch((err) => {
        console.error('Erro ao carregar lotes:', err);
        toast.error('Erro ao carregar lotes: ' + err.message);
      })
      .finally(() => setLoading(false));
  }, [empreendimentoId]);

  return (
    <div style={{ height, position: 'relative' }}>
      <div ref={containerRef} className="h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      )}
    </div>
  );
}
