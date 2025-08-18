import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/dataClient';
import { getLoteStatusStyle } from '@/lib/loteStyles';

interface Props {
  empreendimentoId?: string;
  height?: string;
}

// Simple Leaflet map that loads lot polygons via RPC lotes_geojson
export function LotesMapPreview({ empreendimentoId, height = '380px' }: Props) {
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
          style: (feature) => getLoteStatusStyle(feature?.properties?.status || 'disponivel')
        }).addTo(map);
        layerRef.current = layer;
        const bounds = layer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
      });
  }, [empreendimentoId]);

  return <div ref={containerRef} style={{ height }} />;
}
