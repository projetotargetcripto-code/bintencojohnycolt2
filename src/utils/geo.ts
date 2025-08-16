import { FeatureCollection, Geometry } from "geojson";

export type ValidGeoJSON = FeatureCollection<Geometry, any>;

export function guessStatusStyle(status?: string) {
  const s = (status || "").toString().toLowerCase();
  if (s === "disponivel" || s === "disponível") return { color: "#00C26E", weight: 2, fillColor: "#00C26E", fillOpacity: 0.25 };
  if (s === "reservado") return { color: "#E3B341", weight: 2, fillColor: "#E3B341", fillOpacity: 0.25 };
  if (s === "vendido") return { color: "#F05252", weight: 2, fillColor: "#F05252", fillOpacity: 0.25 };
  return { color: "#38BDF8", weight: 2, fillColor: "#38BDF8", fillOpacity: 0.2 };
}

export function computeBBox(fc: ValidGeoJSON): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

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

export async function parseAndValidateGeoJSON(input?: File | string | null): Promise<{ fc: ValidGeoJSON; featuresCount: number; bbox: [number, number, number, number]; }>{
  const text = await readText(input);
  let obj: any;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    throw new Error("JSON inválido");
  }

  if (!obj || obj.type !== "FeatureCollection" || !Array.isArray(obj.features) || obj.features.length === 0) {
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
        properties: { codigo: "L01", status: "disponivel", preco: 100000, area: 350 },
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
        properties: { codigo: "L02", status: "reservado", preco: 120000, area: 420 },
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
