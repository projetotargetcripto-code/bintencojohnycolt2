import { FeatureCollection, Geometry } from "geojson";

// Types
export type ValidGeoJSON = FeatureCollection<Geometry, any>;

export interface LoteData {
  id?: string;
  nome: string;
  numero: number;
  area_m2: number;
  coordenadas: { lat: number; lng: number };
  geometria: number[][][];
  properties: any;
  status?: "disponivel" | "reservado" | "vendido";
  reserva_expira_em?: string | null;
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: { [key: string]: any };
  geometry: {
    type: "Polygon";
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

// =============================================================================
// Funções oriundas de geojsonUtils.ts
// =============================================================================

/** Calcula a área de um polígono usando a fórmula do shoelace */
export function calculatePolygonArea(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 3) return 0;

  let area = 0;
  const coords = coordinates[0] || coordinates; // Primeiro ring (exterior)

  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    area += lng1 * lat2 - lng2 * lat1;
  }

  // Converte para metros quadrados (aproximação)
  return Math.abs(area) * 111319.9 * 111319.9 / 2;
}

/** Calcula o centro (centroide) de um polígono */
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
    lng: lngSum / coords.length,
  };
}

/** Calcula os bounds (limites) de um conjunto de features */
export function calculateBounds(
  features: GeoJSONFeature[]
): { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } {
  if (!features || features.length === 0) {
    return {
      sw: { lat: -23.5489, lng: -46.6388 },
      ne: { lat: -23.5489, lng: -46.6388 },
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  features.forEach((feature) => {
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
    ne: { lat: maxLat, lng: maxLng },
  };
}

/** Extrai nome do lote das properties */
export function extractLoteName(properties: any, index: number): string {
  const name =
    properties?.Name ||
    properties?.name ||
    properties?.NOME ||
    properties?.nome ||
    properties?.label ||
    properties?.description;

  if (name && typeof name === "string") {
    return name.trim();
  }

  return `Lote ${index + 1}`;
}

/** Extrai número do lote do nome */
export function extractLoteNumber(name: string, index: number): number {
  const match = name.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : index + 1;
}

/** Processa GeoJSON completo e retorna dados estruturados dos lotes */
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
        status: "disponivel" as const,
      };
    });

    // Ordenar por número
    lotes.sort((a, b) => a.numero - b.numero);

    const bounds = calculateBounds(features);

    return {
      lotes,
      totalLotes: lotes.length,
      bounds,
    };
  } catch (error) {
    console.error("Erro ao processar GeoJSON:", error);
    throw new Error("Arquivo GeoJSON inválido");
  }
}

/** Gera cores para status dos lotes */
export function getLoteColor(status: string): string {
  switch (status) {
    case "disponivel":
      return "#22c55e"; // Verde
    case "reservado":
      return "#eab308"; // Amarelo
    case "vendido":
      return "#ef4444"; // Vermelho
    default:
      return "#3b82f6"; // Azul (padrão)
  }
}

/** Gera opções de estilo para Leaflet baseado no status */
export function getLoteStyle(
  status: string,
  isHovered: boolean = false,
  isSelected: boolean = false
) {
  const baseColor = getLoteColor(status);

  return {
    color: isSelected ? "#1e40af" : baseColor,
    weight: isSelected ? 3 : isHovered ? 2 : 1,
    opacity: 1,
    fillColor: baseColor,
    fillOpacity: isHovered ? 0.7 : isSelected ? 0.8 : 0.5,
    dashArray: status === "reservado" ? "5, 5" : undefined,
  };
}

/** Alias de getLoteStyle para compatibilidade com código legado */
export function guessStatusStyle(status?: string) {
  return getLoteStyle(status ?? "");
}

/** Formata área para exibição */
export function formatArea(area: number): string {
  if (area < 1000) {
    return `${area.toFixed(0)} m²`;
  } else {
    return `${(area / 10000).toFixed(2)} ha`;
  }
}

/** Formata preço para exibição */
export function formatPrice(price: number | null): string {
  if (!price) return "Não informado";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

// =============================================================================
// Funções oriundas de utils/geo.ts
// =============================================================================

export function computeBBox(
  fc: ValidGeoJSON
): [number, number, number, number] {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const update = (coords: any) => {
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const [x, y] = coords as [number, number];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    } else if (Array.isArray(coords)) {
      for (const c of coords) update(c);
    }
  };

  for (const f of fc.features) {
    // Only Polygon / MultiPolygon are supported per requirements
    if (!f.geometry) continue;
    const t = f.geometry.type;
    if (t !== "Polygon" && t !== "MultiPolygon") continue;
    update((f.geometry as any).coordinates);
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    throw new Error("Não foi possível calcular a bbox (geometrias inválidas)");
  }

  return [minX, minY, maxX, maxY];
}

export async function parseAndValidateGeoJSON(
  input?: File | string | null
): Promise<{ fc: ValidGeoJSON; featuresCount: number; bbox: [number, number, number, number] }> {
  const text = await readText(input);
  let obj: any;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    throw new Error("JSON inválido");
  }

  if (
    !obj ||
    obj.type !== "FeatureCollection" ||
    !Array.isArray(obj.features) ||
    obj.features.length === 0
  ) {
    throw new Error("O GeoJSON deve ser um FeatureCollection com features");
  }

  // Validate geometries
  for (const f of obj.features) {
    const t = f?.geometry?.type;
    if (t !== "Polygon" && t !== "MultiPolygon") {
      throw new Error("Somente Polygon ou MultiPolygon são aceitos");
    }
  }

  const bbox = computeBBox(obj);
  return { fc: obj as ValidGeoJSON, featuresCount: obj.features.length, bbox };
}

async function readText(input?: File | string | null): Promise<string> {
  if (!input) throw new Error("Nenhum conteúdo fornecido");
  if (typeof input === "string") return input;
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result ?? ""));
    fr.onerror = () => reject(new Error("Falha ao ler arquivo"));
    fr.readAsText(input);
  });
}

export function mockFeatureCollection(): ValidGeoJSON {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          codigo: "L01",
          status: "disponivel",
          preco: 100000,
          area: 350,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-46.638, -23.548],
              [-46.637, -23.548],
              [-46.637, -23.547],
              [-46.638, -23.547],
              [-46.638, -23.548],
            ],
          ],
        },
      },
      {
        type: "Feature",
        properties: {
          codigo: "L02",
          status: "reservado",
          preco: 120000,
          area: 420,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-46.639, -23.5485],
              [-46.6382, -23.5485],
              [-46.6382, -23.5477],
              [-46.639, -23.5477],
              [-46.639, -23.5485],
            ],
          ],
        },
      },
    ],
  };
}

