export interface Empreendimento {
  id: string;
  nome: string;
  status?: string;
  filial_id?: string | null;
  total_lotes?: number;
  bounds?: {
    sw: { lat: number; lng: number } | [number, number];
    ne: { lat: number; lng: number } | [number, number];
  };
  geojson_url?: string | null;
  masterplan_url?: string | null;
}

export interface Lote {
  id: string;
  nome: string;
  numero: number;
  status: 'disponivel' | 'reservado' | 'vendido';
  area_m2: number;
  valor: number | null;
  comprador_nome?: string | null;
  comprador_email?: string | null;
  observacoes?: string | null;
  reserva_expira_em?: string | null;
  liberado?: boolean;
}

export interface AuthorizationProfile {
  role: string;
  panels: string[];
  filial_id: string | null;
}

export interface Venda {
  id: string;
  lote_id: string;
  filial_id: string;
  corretor_id: string;
  valor: number;
  comissao: number;
  created_at?: string;
}
