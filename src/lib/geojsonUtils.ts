// =============================================================================
// UTILITÁRIOS PARA PROCESSAMENTO DE GEOJSON
// =============================================================================

export interface LoteData {
  id?: string;
  nome: string;
  numero: number;
  area_m2: number;
  coordenadas: { lat: number; lng: number };
  geometria: number[][][];
  properties: any;
  status?: 'disponivel' | 'reservado' | 'vendido';
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: { [key: string]: any };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface ProcessedGeoJSON {
  lotes: LoteData[];
  totalLotes: number;
  bounds: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  };
}

/**
 * Calcula a área de um polígono usando a fórmula do shoelace
 */
export function calculatePolygonArea(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 3) return 0;
  
  let area = 0;
  const coords = coordinates[0] || coordinates; // Primeiro ring (exterior)
  
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    area += (lng1 * lat2 - lng2 * lat1);
  }
  
  // Converte para metros quadrados (aproximação)
  return Math.abs(area) * 111319.9 * 111319.9 / 2;
}

/**
 * Calcula o centro (centroide) de um polígono
 */
export function calculatePolygonCenter(coordinates: number[][]): { lat: number; lng: number } {
  if (!coordinates || coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }
  
  const coords = coordinates[0] || coordinates;
  let latSum = 0;
  let lngSum = 0;
  
  for (const [lng, lat] of coords) {
    latSum += lat;
    lngSum += lng;
  }
  
  return {
    lat: latSum / coords.length,
    lng: lngSum / coords.length
  };
}

/**
 * Calcula os bounds (limites) de um conjunto de features
 */
export function calculateBounds(features: GeoJSONFeature[]): { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } {
  if (!features || features.length === 0) {
    return {
      sw: { lat: -23.5489, lng: -46.6388 },
      ne: { lat: -23.5489, lng: -46.6388 }
    };
  }
  
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  
  features.forEach(feature => {
    const coords = feature.geometry.coordinates[0];
    coords.forEach(([lng, lat]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });
  });
  
  return {
    sw: { lat: minLat, lng: minLng },
    ne: { lat: maxLat, lng: maxLng }
  };
}

/**
 * Extrai nome do lote das properties
 */
export function extractLoteName(properties: any, index: number): string {
  const name = properties?.Name || 
               properties?.name || 
               properties?.NOME || 
               properties?.nome ||
               properties?.label ||
               properties?.description;
  
  if (name && typeof name === 'string') {
    return name.trim();
  }
  
  return `Lote ${index + 1}`;
}

/**
 * Extrai número do lote do nome
 */
export function extractLoteNumber(name: string, index: number): number {
  const match = name.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : index + 1;
}

/**
 * Processa GeoJSON completo e retorna dados estruturados dos lotes
 */
export function processGeoJSON(geojsonText: string): ProcessedGeoJSON {
  try {
    const geojson = JSON.parse(geojsonText);
    const features: GeoJSONFeature[] = geojson.features || [];
    
    const lotes: LoteData[] = features.map((feature, index) => {
      const nome = extractLoteName(feature.properties, index);
      const numero = extractLoteNumber(nome, index);
      const geometria = feature.geometry.coordinates;
      const area_m2 = calculatePolygonArea(geometria);
      const coordenadas = calculatePolygonCenter(geometria);
      
      return {
        nome,
        numero,
        area_m2: Math.round(area_m2 * 100) / 100, // 2 casas decimais
        coordenadas,
        geometria,
        properties: feature.properties,
        status: 'disponivel' as const
      };
    });
    
    // Ordenar por número
    lotes.sort((a, b) => a.numero - b.numero);
    
    const bounds = calculateBounds(features);
    
    return {
      lotes,
      totalLotes: lotes.length,
      bounds
    };
    
  } catch (error) {
    console.error('Erro ao processar GeoJSON:', error);
    throw new Error('Arquivo GeoJSON inválido');
  }
}

export { getLoteColor, getLoteStyle } from './loteStyles';

/**
 * Formata área para exibição
 */
export function formatArea(area: number): string {
  if (area < 1000) {
    return `${area.toFixed(0)} m²`;
  } else {
    return `${(area / 10000).toFixed(2)} ha`;
  }
}

/**
 * Formata preço para exibição
 */
export function formatPrice(price: number | null): string {
  if (!price) return 'Não informado';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

