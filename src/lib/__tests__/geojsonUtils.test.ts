import { describe, it, expect } from 'vitest';
import { calculatePolygonArea, calculatePolygonCenter, processGeoJSON } from '../geojsonUtils';
import { mockFeatureCollection } from '../../utils/geo';

describe('geojsonUtils', () => {
  const fc = mockFeatureCollection();
  const polygon = fc.features[0].geometry.coordinates;

  it('calculatePolygonArea returns accurate area for provided polygon', () => {
    const area = calculatePolygonArea(polygon as any);
    expect(area).toBeCloseTo(11334.76, 2);
  });

  it('calculatePolygonArea handles small square at equator', () => {
    const d = 100 / 111319.9;
    const square = [[[0, 0], [d, 0], [d, d], [0, d], [0, 0]]];
    const area = calculatePolygonArea(square as any);
    expect(area).toBeCloseTo(9977.59, 2);
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
