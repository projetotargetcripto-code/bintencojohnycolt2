import { describe, it, expect } from 'vitest';
import { parseAndValidateGeoJSON, guessStatusStyle, mockFeatureCollection } from '../geo';

describe('geo utils', () => {
  it('parseAndValidateGeoJSON parses valid feature collection', async () => {
    const fc = mockFeatureCollection();
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

  it('guessStatusStyle returns style for each status', () => {
    expect(guessStatusStyle('disponivel')).toMatchObject({ color: '#00C26E' });
    expect(guessStatusStyle('reservado')).toMatchObject({ color: '#E3B341' });
    expect(guessStatusStyle('vendido')).toMatchObject({ color: '#F05252' });
    expect(guessStatusStyle('outro')).toMatchObject({ color: '#38BDF8' });
  });
});
