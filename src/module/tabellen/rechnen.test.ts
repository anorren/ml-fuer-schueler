import { describe, expect, it } from 'vitest';
import { achsenwerte, fehler, geradeEcht, kosten, lernschritt, punkteNorm, trainingFertig, verlaufErgaenzen, vorhersage, zahl } from './rechnen';
import { inhaltHerstellen, istInhalt, vorschau } from './szenarien';
import type { TabellenInhalt } from './typen';

const kiosk = () => inhaltHerstellen(null, 'schulkiosk') as unknown as TabellenInhalt;

/** Kleinste-Quadrate-Gerade als Vergleich (geschlossene Lösung). */
function kq(p: { x: number[]; y: number }[]) {
  const n = p.length, mx = p.reduce((s, q) => s + q.x[0], 0) / n, my = p.reduce((s, q) => s + q.y, 0) / n;
  const w = p.reduce((s, q) => s + (q.x[0] - mx) * (q.y - my), 0) / p.reduce((s, q) => s + (q.x[0] - mx) ** 2, 0);
  return { w, b: my - w * mx };
}

function trainieren(i: TabellenInhalt, schritte: number) {
  const p = punkteNorm(i);
  for (let k = 0; k < schritte; k++) i.modell = lernschritt(i.modell, p, i.lernrate).nachher;
}

describe('Gerade und Gradientenabstieg (DEC-05, FR-16)', () => {
  it('ein Lernschritt senkt die Kosten und bewegt die Gerade', () => {
    const i = kiosk();
    const s = lernschritt(i.modell, punkteNorm(i), i.lernrate);
    expect(s.kostenNachher).toBeLessThan(s.kostenVorher);
    expect(s.nachher.b).not.toBe(s.vorher.b);
  });

  it('findet nach genügend Schritten die Kleinste-Quadrate-Gerade', () => {
    const i = kiosk();
    trainieren(i, 3000);
    const ziel = kq(punkteNorm(i));
    expect(i.modell.w[0]).toBeCloseTo(ziel.w, 3);
    expect(i.modell.b).toBeCloseTo(ziel.b, 3);
  });

  it('sagt im Kiosk für 28 °C eine ablesbare Zahl voraus (FR-19)', () => {
    const i = kiosk();
    trainieren(i, 3000);
    expect(vorhersage(i, [28])).toBeGreaterThan(75);
    expect(vorhersage(i, [28])).toBeLessThan(90);
  });

  it('trennt Trainings- und Testdaten (FR-22)', () => {
    const i = kiosk();
    expect(punkteNorm(i).length).toBe(12);
    expect(punkteNorm(i, true).length).toBe(2);
    trainieren(i, 3000);
    expect(fehler(i, true)!).toBeLessThan(8);
  });

  it('ein Ausreißer verändert die trainierte Gerade (FR-11)', () => {
    const i = kiosk();
    trainieren(i, 3000);
    const vorher = vorhersage(i, [30]);
    i.zeilen.push({ id: 99, x: [30], y: 20, test: false });
    trainieren(i, 3000);
    expect(vorhersage(i, [30])).toBeLessThan(vorher - 5);
  });

  it('rechnet Steigung und Achsenabschnitt in echte Einheiten um (FR-18)', () => {
    const i = kiosk();
    trainieren(i, 3000);
    const { steigung, achsenabschnitt } = geradeEcht(i);
    for (const t of [12, 20, 31]) expect(steigung * t + achsenabschnitt).toBeCloseTo(vorhersage(i, [t]), 6);
    expect(steigung).toBeGreaterThan(3);
    expect(steigung).toBeLessThan(5);
  });

  it('eine viel zu große Lernrate lässt die Kosten steigen (Grundlage FR-17)', () => {
    const i = kiosk();
    const p = punkteNorm(i);
    let m = i.modell;
    for (let k = 0; k < 20; k++) m = lernschritt(m, p, 3).nachher;
    expect(kosten(m, p)).toBeGreaterThan(kosten(i.modell, p));
  });

  it('erkennt das Ende des Trainings und dünnt den Verlauf aus', () => {
    expect(trainingFertig([5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1])).toBe(false);
    expect(trainingFertig(Array(12).fill(2))).toBe(true);
    let v: number[] = [];
    for (let k = 0; k < 1000; k++) v = verlaufErgaenzen(v, 1000 - k);
    expect(v.length).toBeLessThanOrEqual(400);
    expect(v[v.length - 1]).toBe(1);
  });
});

describe('Darstellungshilfen und Szenarien', () => {
  it('liefert schöne Achsenwerte', () => {
    expect(achsenwerte(10, 35)).toEqual([10, 15, 20, 25, 30, 35]);
    expect(achsenwerte(0, 120)).toEqual([0, 20, 40, 60, 80, 100, 120]);
    expect(achsenwerte(0, 1)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('schreibt Zahlen deutsch', () => {
    expect(zahl(12.345, 1)).toBe('12,3');
    expect(zahl(1234)).toBe('1.234');
  });

  it('stellt Inhalte her und erkennt kaputte Dateien', () => {
    expect(istInhalt(kiosk())).toBe(true);
    expect(istInhalt({ version: 1 })).toBe(false);
    const kaputt = { ...kiosk(), zeilen: [{ id: 1, x: ['a'], y: 2, test: false }] };
    expect(istInhalt(kaputt)).toBe(false);
    expect(inhaltHerstellen(kaputt, 'schulkiosk')).toMatchObject({ version: 1 });
    expect(inhaltHerstellen(null, 'Schulkiosk')).toMatchObject({ version: 1 });
    expect(inhaltHerstellen(null, 'hitzefrei')).toEqual({});
    expect((inhaltHerstellen(null, null) as unknown as TabellenInhalt).zeilen).toEqual([]);
    expect(kiosk().erfunden).toBe(true);
    expect(vorschau('schulkiosk')!.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)).toBe(true);
  });
});
