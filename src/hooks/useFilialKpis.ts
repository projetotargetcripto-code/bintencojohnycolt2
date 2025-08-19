import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/dataClient";

export interface FilialKpi {
  filial_id: string;
  vgv: number;
  inadimplencia: number;
  lat?: number;
  lng?: number;
}

async function fetchKpis(): Promise<FilialKpi[]> {
  const { data, error } = await supabase.rpc("mv_kpis_filial");
  if (error) throw error;
  return (data as FilialKpi[]) ?? [];
}

export function useFilialKpis() {
  return useQuery({ queryKey: ["mv_kpis_filial"], queryFn: fetchKpis });
}

