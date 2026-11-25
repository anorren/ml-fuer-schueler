import { describe, expect, it } from 'vitest';
import { gitter, projiziere, vierecke, sigmoid, flaechenFarbe } from './flaeche3d';

const a = { drehung: 0.6, neigung: 0.9, zoom: 1 };

describe('3D-Fläche', () => {
  it('erzeugt ein Gitter mit (n+1)² Höhen im Bereich 0..1', () => {
    const z = gitter(25, (x, y) => sigmoid(8 * (x + y - 1)));
    expect(z.length).toBe(26);
    expect(z.every((r) => r.length === 26 && r.every((h) => h >= 0 && h <= 1))).toBe(true);
  });

  it('bildet die Mitte der Grundfläche auf die Bildmitte ab', () => {
    const [sx, sy] = projiziere(0.5, 0.5, 0.5, a, 800, 600);
    expect(sx).toBeCloseTo(400);
    expect(sy).toBeCloseTo(300);
  });

  it('liefert n² Vierecke, von hinten nach vorn sortiert', () => {
    const v = vierecke(gitter(10, () => 0.5), a, 800, 600);
    expect(v.length).toBe(100);
    for (let k = 1; k < v.length; k++) expect(v[k - 1].tiefe).toBeGreaterThanOrEqual(v[k].tiefe);
  });

  it('färbt niedrige Stellen hell und hohe kräftig blau', () => {
    expect(flaechenFarbe(0)).toBe('rgb(230,239,251)');
    expect(flaechenFarbe(1)).toBe('rgb(42,120,214)');
  });
});
