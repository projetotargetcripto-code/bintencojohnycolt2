import { describe, it, expect } from 'vitest';
import {
  calculatePolygonArea,
  calculatePolygonCenter,
  processGeoJSON,
  mockFeatureCollection
} from '../geo';

describe('geo utils', () => {
  const fc = mockFeatureCollection();
  const polygon = fc.features[0].geometry.coordinates;

  it('calculatePolygonArea retorna área geodésica para o polígono fornecido', () => {
    const areaValue = calculatePolygonArea(polygon as any);
    expect(areaValue).toBeCloseTo(11334.76, 2);
  });

  it('calculatePolygonArea coincide com área conhecida de quadrado de 100m no equador', () => {
    const delta = 100 / 111319.49079327357;
    const square = [[[0, 0], [delta, 0], [delta, delta], [0, delta], [0, 0]]];
    const areaValue = calculatePolygonArea(square as any);
    expect(areaValue).toBeCloseTo(9977.66, 2);
  });

  it('calculatePolygonArea coincide com área conhecida de quadrado de 1° no equador', () => {
    const squareDeg = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
    const areaValue = calculatePolygonArea(squareDeg as any);
    expect(areaValue).toBeCloseTo(12363718145.18, 0);
  });

  it('calculatePolygonCenter computes centroid', () => {
    const center = calculatePolygonCenter(polygon as any);
    expect(center.lat).toBeCloseTo(-23.5476, 4);
    expect(center.lng).toBeCloseTo(-46.6376, 4);
  });

  it('processGeoJSON processes valid data', () => {
    const result = processGeoJSON(JSON.stringify(fc));
    expect(result.totalLotes).toBe(2);
    expect(result.lotes[0]).toMatchObject({
      nome: 'Lote 1',
      numero: 1,
      properties: fc.features[0].properties,
      status: 'disponivel'
    });
    expect(result.lotes[0].area_m2).toBeCloseTo(calculatePolygonArea(polygon as any), 2);
    expect(result.lotes[0].coordenadas).toEqual(calculatePolygonCenter(polygon as any));
    expect(result.bounds).toEqual({
      sw: { lat: -23.5485, lng: -46.639 },
      ne: { lat: -23.547, lng: -46.637 }
    });
  });

  it('processGeoJSON throws on invalid JSON', () => {
    expect(() => processGeoJSON('invalid')).toThrow('Arquivo GeoJSON inválido');
  });

  it('processGeoJSON throws on invalid geometry', () => {
    const invalid = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } }
      ]
    });
    expect(() => processGeoJSON(invalid)).toThrow('Arquivo GeoJSON inválido');
  });
});

