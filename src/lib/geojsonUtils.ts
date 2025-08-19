// =============================================================================
// UTILITÁRIOS PARA PROCESSAMENTO DE GEOJSON
// =============================================================================

import { area as turfArea, polygon as turfPolygon } from '@turf/turf';

export interface LoteData {
  id?: string;
  nome: string;
  numero: number;
  area_m2: number;
  coordenadas: { lat: number; lng: number };
  geometria: number[][][];
  properties: any;
  status?: 'disponivel' | 'reservado' | 'vendido';
  reserva_expira_em?: string | null;
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
 * Calcula a área geodésica de um polígono usando Turf.js
 */
export function calculatePolygonArea(coordinates: number[][][] | number[][]): number {
  if (!coordinates || coordinates.length === 0) return 0;

  // Garante o formato [[[]]] esperado pelo Turf.js
  const polygonCoords: number[][][] =
    typeof (coordinates as any)[0][0] === 'number'
      ? [coordinates as number[][]]
      : (coordinates as number[][][]);

  return turfArea(turfPolygon(polygonCoords));
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

/**
 * Gera cores para status dos lotes
 */
export function getLoteColor(status: string): string {
  switch (status) {
    case 'disponivel':
      return '#22c55e'; // Verde
    case 'reservado':
      return '#eab308'; // Amarelo
    case 'vendido':
      return '#ef4444'; // Vermelho
    default:
      return '#3b82f6'; // Azul (padrão)
  }
}

/**
 * Gera opções de estilo para Leaflet baseado no status
 */
export function getLoteStyle(status: string, isHovered: boolean = false, isSelected: boolean = false) {
  const baseColor = getLoteColor(status);
  
  return {
    color: isSelected ? '#1e40af' : baseColor,
    weight: isSelected ? 3 : isHovered ? 2 : 1,
    opacity: 1,
    fillColor: baseColor,
    fillOpacity: isHovered ? 0.7 : isSelected ? 0.8 : 0.5,
    dashArray: status === 'reservado' ? '5, 5' : undefined
  };
}

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

