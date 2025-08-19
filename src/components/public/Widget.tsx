import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/dataClient';

interface WidgetProps {
  empreendimentoId: string;
  height?: string;
}

export function Widget({ empreendimentoId, height = '400px' }: WidgetProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);

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
    if (!empreendimentoId) return;
    void supabase.rpc('log_widget_event', {
      widget_id: empreendimentoId,
      evento: 'view',
      meta: { empreendimento_id: empreendimentoId }
    });
  }, [empreendimentoId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !empreendimentoId) return;

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
              case 'reservado':
                return { color: '#EAB308', fillColor: '#EAB308', fillOpacity: 0.25, weight: 2 };
              case 'vendido':
                return { color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.25, weight: 2 };
              default:
                return { color: '#00C26E', fillColor: '#00C26E', fillOpacity: 0.25, weight: 2 };
            }
          }
        }).addTo(map);
        layerRef.current = layer;
        const bounds = layer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
      });
  }, [empreendimentoId]);

  return <div ref={containerRef} style={{ height }} />;
}
