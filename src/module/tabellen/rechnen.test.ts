import { describe, expect, it } from 'vitest';
import { achsenwerte, falschEingeordnet, fehler, geradeEcht, klassenbereiche, kosten, lernschritt, modellNeu, punkteNorm, lesen, trainingFertig, verlaufErgaenzen, vorhersage, wahrscheinlichkeit, zahl } from './rechnen';
import { inhaltHerstellen, istInhalt, vorschau } from './szenarien';
import type { Gerade, Modell, ModellArt, Netz, TabellenInhalt } from './typen';

const kiosk = () => inhaltHerstellen(null, 'schulkiosk') as unknown as TabellenInhalt;
const szenario = (id: string, art?: ModellArt) => {
  const i = inhaltHerstellen(null, id) as unknown as TabellenInhalt;
  if (art) i.modell = modellNeu(art, 1);
  return i;
};

/** Kleinste-Quadrate-Gerade als Vergleich (geschlossene Lösung). */
function kq(p: { x: number[]; y: number }[]) {
  const n = p.length, mx = p.reduce((s, q) => s + q.x[0], 0) / n, my = p.reduce((s, q) => s + q.y, 0) / n;
  const w = p.reduce((s, q) => s + (q.x[0] - mx) * (q.y - my), 0) / p.reduce((s, q) => s + (q.x[0] - mx) ** 2, 0);
  return { w, b: my - w * mx };
}

function trainieren(i: TabellenInhalt, schritte: number) {
  const p = punkteNorm(i);
  for (let k = 0; k < schritte; k++) i.modell = lernschritt(i.modell, p, i.lernrate, i.art === 'klasse').nachher;
}

const grenze = (i: TabellenInhalt) => klassenbereiche(i).grenzen[0];

describe('Gerade und Gradientenabstieg (DEC-05, FR-16)', () => {
  it('ein Lernschritt senkt die Kosten und bewegt die Gerade', () => {
    const i = kiosk();
    const s = lernschritt(i.modell, punkteNorm(i), i.lernrate);
    expect(s.kostenNachher).toBeLessThan(s.kostenVorher);
    expect((s.nachher as Gerade).b).not.toBe((s.vorher as Gerade).b);
  });

  it('findet nach genügend Schritten die Kleinste-Quadrate-Gerade', () => {
    const i = kiosk();
    trainieren(i, 3000);
    const ziel = kq(punkteNorm(i));
    const m = i.modell as Gerade;
    expect(m.w[0]).toBeCloseTo(ziel.w, 3);
    expect(m.b).toBeCloseTo(ziel.b, 3);
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

describe('Klassen, S-Kurve und Netz (FR-14, FR-15)', () => {
  it('Hitzefrei sagt eine Klasse mit Wahrscheinlichkeit voraus (FR-14)', () => {
    const i = szenario('hitzefrei');
    expect(i.art).toBe('klasse');
    expect(i.modell.art).toBe('skurve');
    trainieren(i, 800);
    expect(wahrscheinlichkeit(i, [33])).toBeGreaterThan(0.8);
    expect(wahrscheinlichkeit(i, [18])).toBeLessThan(0.1);
    expect(grenze(i)).toBeGreaterThan(26.5);
    expect(grenze(i)).toBeLessThan(28.5);
    expect(falschEingeordnet(i, true)).toEqual({ falsch: 0, von: 2 });
    expect(klassenbereiche(i).ja).toEqual([[grenze(i), 40]]);
  });

  it('ein heißer Ausreißer verschiebt die Grenze der Geraden, die der S-Kurve kaum (FR-15)', () => {
    const verschiebung = (art: ModellArt) => {
      const i = szenario('hitzefrei', art);
      trainieren(i, 800);
      const vorher = grenze(i);
      i.zeilen.push({ id: 90, x: [38], y: 1, test: false }, { id: 91, x: [40], y: 1, test: false });
      i.modell = modellNeu(art, 1);
      trainieren(i, 800);
      return grenze(i) - vorher;
    };
    expect(verschiebung('gerade')).toBeGreaterThan(0.5);
    expect(Math.abs(verschiebung('skurve'))).toBeLessThan(0.15);
  });

  it('die Gerade liefert bei Klassen Werte über 100 %, die Wahrscheinlichkeit wird begrenzt', () => {
    const i = szenario('hitzefrei', 'gerade');
    trainieren(i, 800);
    expect(vorhersage(i, [40])).toBeGreaterThan(1);
    expect(wahrscheinlichkeit(i, [40])).toBe(1);
  });

  it('beim Bremsweg passt das Netz deutlich besser als die Gerade (FR-15, Z-03b)', () => {
    const gerade = szenario('bremsweg');
    expect(gerade.modell.art).toBe('gerade');
    trainieren(gerade, 1500);
    const netz = szenario('bremsweg', 'netz');
    trainieren(netz, 1500);
    expect(fehler(gerade)!).toBeGreaterThan(0.8);
    expect(fehler(netz)!).toBeLessThan(0.4);
    expect(fehler(netz, true)!).toBeLessThan(fehler(gerade, true)!);
  });

  it('die Rückwärtsrechnung im Netz stimmt mit der numerischen Ableitung überein', () => {
    for (const klasse of [false, true]) {
      const i = szenario(klasse ? 'hitzefrei' : 'bremsweg', 'netz');
      const p = punkteNorm(i);
      const m = i.modell as Netz;
      const { grad } = lernschritt(m, p, 0.5, klasse);
      const g = grad as Netz;
      const eps = 1e-6;
      const verschoben = (f: (n: Netz) => void): Modell => {
        const n = structuredClone(m);
        f(n);
        return n;
      };
      const num = (f: (n: Netz, d: number) => void) => (kosten(verschoben((n) => f(n, eps)), p, klasse) - kosten(verschoben((n) => f(n, -eps)), p, klasse)) / (2 * eps);
      expect(g.w1[1][0]).toBeCloseTo(num((n, d) => (n.w1[1][0] += d)), 5);
      expect(g.b1[2]).toBeCloseTo(num((n, d) => (n.b1[2] += d)), 5);
      expect(g.w2[0]).toBeCloseTo(num((n, d) => (n.w2[0] += d)), 5);
      expect(g.b2).toBeCloseTo(num((n, d) => (n.b2 += d)), 5);
    }
  });

  it('die S-Kurve in echten Einheiten trifft die Grenze bei z = 0 (FR-18)', () => {
    const i = szenario('hitzefrei');
    trainieren(i, 800);
    const { steigung, achsenabschnitt } = geradeEcht(i);
    expect(-achsenabschnitt / steigung).toBeCloseTo(grenze(i), 3);
  });

  it('ein frisches Netz startet immer gleich', () => {
    expect(modellNeu('netz', 1, 3)).toEqual(modellNeu('netz', 1, 3));
    expect((modellNeu('netz', 1, 6) as Netz).w2.length).toBe(6);
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
    expect(zahl(-0.05, 2)).toBe('−0,05');
    expect(zahl(-0.0001, 2)).toBe('0');
    expect(lesen('−2,5')).toBe(-2.5);
    expect(lesen(' ')).toBeNull();
  });

  it('stellt Inhalte her und erkennt kaputte Dateien', () => {
    expect(istInhalt(kiosk())).toBe(true);
    expect(istInhalt({ version: 1 })).toBe(false);
    const kaputt = { ...kiosk(), zeilen: [{ id: 1, x: ['a'], y: 2, test: false }] };
    expect(istInhalt(kaputt)).toBe(false);
    expect(inhaltHerstellen(kaputt, 'schulkiosk')).toMatchObject({ version: 1 });
    expect(inhaltHerstellen(null, 'Schulkiosk')).toMatchObject({ version: 1 });
    expect(inhaltHerstellen(null, 'torschuss')).toEqual({});
    expect(istInhalt(szenario('bremsweg', 'netz'))).toBe(true);
    expect(istInhalt({ ...kiosk(), modell: { art: 'netz', w1: [[1]], b1: [0], w2: [], b2: 0 } })).toBe(false);
    for (const id of ['hitzefrei', 'bremsweg']) expect(vorschau(id)!.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)).toBe(true);
    expect((inhaltHerstellen(null, null) as unknown as TabellenInhalt).zeilen).toEqual([]);
    expect(kiosk().erfunden).toBe(true);
    expect(vorschau('schulkiosk')!.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)).toBe(true);
  });
});
