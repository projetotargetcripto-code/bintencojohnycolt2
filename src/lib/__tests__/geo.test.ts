import { describe, it, expect } from 'vitest';
import {
  calculatePolygonArea,
  calculatePolygonCenter,
  processGeoJSON,
  parseAndValidateGeoJSON,
  mockFeatureCollection,
  getLoteStyle
} from '../geo';

describe('geo utilities', () => {
  const fc = mockFeatureCollection();
  const polygon = fc.features[0].geometry.coordinates;

  it('calculatePolygonArea returns 0 for provided polygon', () => {
    const area = calculatePolygonArea(polygon as any);
    expect(area).toBe(0);
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
    expect(result.lotes[0].area_m2).toBe(calculatePolygonArea(polygon as any));
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

  it('parseAndValidateGeoJSON parses valid feature collection', async () => {
    const { fc: parsed, featuresCount, bbox } = await parseAndValidateGeoJSON(JSON.stringify(fc));
    expect(featuresCount).toBe(fc.features.length);
    expect(parsed).toEqual(fc);
    expect(bbox).toEqual([-46.639, -23.5485, -46.637, -23.547]);
  });

  it('parseAndValidateGeoJSON throws on invalid JSON', async () => {
    await expect(parseAndValidateGeoJSON('invalid')).rejects.toThrow('JSON inválido');
  });

  it('parseAndValidateGeoJSON throws on invalid geometry', async () => {
    const invalid = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }
      ]
    });
    await expect(parseAndValidateGeoJSON(invalid)).rejects.toThrow('Somente Polygon ou MultiPolygon são aceitos');
  });

  it('getLoteStyle returns style for each status', () => {
    expect(getLoteStyle('disponivel').color).toBe('#22c55e');
    expect(getLoteStyle('reservado').color).toBe('#eab308');
    expect(getLoteStyle('vendido').color).toBe('#ef4444');
    expect(getLoteStyle('outro').color).toBe('#3b82f6');
  });
});

