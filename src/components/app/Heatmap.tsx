import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useFilialKpis } from "@/hooks/useFilialKpis";

export function Heatmap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data } = useFilialKpis();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView([-14.235, -51.9253], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.eachLayer(layer => {
      if ((layer as any).options?.radius) {
        mapRef.current?.removeLayer(layer);
      }
    });
    data?.forEach(kpi => {
      if (kpi.lat && kpi.lng) {
        L.circle([kpi.lat, kpi.lng], {
          radius: 50000,
          color: "red",
          fillColor: "red",
          fillOpacity: Math.min(0.8, kpi.vgv / 1000000),
        }).addTo(mapRef.current!);
      }
    });
  }, [data]);

  return <div ref={containerRef} style={{ height: 400, width: "100%" }} />;
}

