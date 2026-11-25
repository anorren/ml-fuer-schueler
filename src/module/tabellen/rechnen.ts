// Eigene Rechenbibliothek (DEC-05): Gerade, S-Kurve, kleines Netz und Gradientenabstieg, nachvollziehbar für Stufe 3.
// Gerechnet wird im normierten Raum (0 … 1 je Spalte), damit eine Lernrate für alle Themen passt.
import type { Modell, ModellArt, Netz, Spalte, TabellenInhalt } from './typen';

export interface PunktN {
  x: number[];
  y: number;
}

export const norm = (v: number, s: Spalte) => (v - s.min) / (s.max - s.min);
export const denorm = (v: number, s: Spalte) => s.min + v * (s.max - s.min);
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export function punkteNorm(i: TabellenInhalt, test = false): PunktN[] {
  return i.zeilen.filter((z) => z.test === test).map((z) => ({ x: z.x.map((v, k) => norm(v, i.merkmale[k])), y: norm(z.y, i.ziel) }));
}

const linear = (w: number[], b: number, x: number[]) => b + w.reduce((s, wk, k) => s + wk * x[k], 0);

function netzVorwaerts(m: Netz, x: number[]) {
  const h = m.w1.map((w, j) => Math.tanh(linear(w, m.b1[j], x)));
  return { h, z: linear(m.w2, m.b2, h) };
}

/** Ausgabe des Modells im normierten Raum. Bei Klassen geben S-Kurve und Netz eine Wahrscheinlichkeit aus, die Gerade nicht. */
export function ausgabe(m: Modell, x: number[], klasse = false): number {
  if (m.art === 'gerade') return linear(m.w, m.b, x);
  if (m.art === 'skurve') return sigmoid(linear(m.w, m.b, x));
  const { z } = netzVorwaerts(m, x);
  return klasse ? sigmoid(z) : z;
}

/** Vorhersage in echten Einheiten für eine Eingabe in echten Einheiten; bei Klassen der Wert für „ja“ (0 … 1). */
export function vorhersage(i: TabellenInhalt, x: number[]): number {
  return denorm(ausgabe(i.modell, x.map((v, k) => norm(v, i.merkmale[k])), i.art === 'klasse'), i.ziel);
}

/** Wahrscheinlichkeit für „ja“; die Gerade kann über 100 % und unter 0 % hinausgehen und wird dafür begrenzt. */
export const wahrscheinlichkeit = (i: TabellenInhalt, x: number[]) => Math.min(Math.max(vorhersage(i, x), 0), 1);

/** Kreuzentropie bei S-Kurve und Netz mit Klassen, sonst mittlere quadratische Abweichung. */
export const mitKreuzentropie = (m: Modell, klasse: boolean) => m.art === 'skurve' || (m.art === 'netz' && klasse);

/** Kostenfunktion im normierten Raum. */
export function kosten(m: Modell, punkte: PunktN[], klasse = false): number {
  if (!punkte.length) return 0;
  const ce = mitKreuzentropie(m, klasse);
  return (
    punkte.reduce((s, p) => {
      const y = ausgabe(m, p.x, klasse);
      if (!ce) return s + (y - p.y) ** 2;
      const q = Math.min(Math.max(y, 1e-9), 1 - 1e-9);
      return s - (p.y * Math.log(q) + (1 - p.y) * Math.log(1 - q));
    }, 0) / punkte.length
  );
}

/**
 * Fehler zum Anzeigen: bei Zahlen die Wurzel der mittleren quadratischen Abweichung in der Einheit der Zielgröße,
 * bei Klassen der mittlere Abstand der Wahrscheinlichkeit zur richtigen Klasse in Prozent.
 */
export function fehler(i: TabellenInhalt, test = false): number | null {
  const p = punkteNorm(i, test);
  if (!p.length) return null;
  if (i.art === 'klasse') return (p.reduce((s, q) => s + Math.abs(Math.min(Math.max(ausgabe(i.modell, q.x, true), 0), 1) - q.y), 0) / p.length) * 100;
  const mse = p.reduce((s, q) => s + (ausgabe(i.modell, q.x) - q.y) ** 2, 0) / p.length;
  return Math.sqrt(mse) * (i.ziel.max - i.ziel.min);
}

/** Wie viele Beispiele das Modell der falschen Klasse zuordnet (Grenze bei 50 %). */
export function falschEingeordnet(i: TabellenInhalt, test = false): { falsch: number; von: number } {
  const p = punkteNorm(i, test);
  return { falsch: p.filter((q) => ausgabe(i.modell, q.x, true) >= 0.5 !== q.y >= 0.5).length, von: p.length };
}

export const NEURONEN_STANDARD = 4;
export const NEURONEN_HOECHSTENS = 8;

/** Frisches, ungelerntes Modell. Das Netz startet immer gleich, damit „Von vorn“ nachvollziehbar bleibt. */
export function modellNeu(art: ModellArt, merkmale: number, neuronen = NEURONEN_STANDARD): Modell {
  if (art !== 'netz') return { art, w: Array(merkmale).fill(0), b: 0 };
  let s = 12345 + neuronen;
  const zufall = () => ((s = (s * 1103515245 + 12345) % 2147483648), s / 2147483648);
  const m: Netz = { art: 'netz', w1: [], b1: [], w2: [], b2: 0 };
  for (let j = 0; j < neuronen; j++) {
    // Die Knicke der Neuronen verteilen sich über den Wertebereich, damit jedes einen eigenen Abschnitt formen kann.
    const mitte = (j + 0.5) / neuronen;
    const w = Array.from({ length: merkmale }, () => (zufall() < 0.5 ? -1 : 1) * (2 + 2 * zufall()));
    m.w1.push(w);
    m.b1.push(-w.reduce((a, wk) => a + wk * mitte, 0));
    m.w2.push((zufall() - 0.5) * 0.4);
  }
  return m;
}

/** Beim Netz wächst die Wirkung eines Schritts mit der Zahl der Neuronen; die App teilt die Lernrate deshalb passend. */
export const wirksameLernrate = (m: Modell, lernrate: number) => (m.art === 'netz' ? (2 * lernrate) / (m.w2.length + 1) : lernrate);

export interface Lernschritt {
  vorher: Modell;
  nachher: Modell;
  /** Steigung der Kosten für jedes Gewicht, gleich aufgebaut wie das Modell. */
  grad: Modell;
  /** Tatsächlich verwendete Lernrate (beim Netz geteilt). */
  lernrate: number;
  kostenVorher: number;
  kostenNachher: number;
}

/** Ein Schritt Gradientenabstieg; beim Netz mit Rückwärtsrechnung (Backpropagation). */
export function lernschritt(m: Modell, punkte: PunktN[], lernrate: number, klasse = false): Lernschritt {
  const n = Math.max(punkte.length, 1);
  // Bei der Kreuzentropie mit σ ist die Ableitung nach z einfach ŷ − y, bei der quadratischen Abweichung 2 · (ŷ − y).
  const faktor = mitKreuzentropie(m, klasse) ? 1 : 2;
  const lr = wirksameLernrate(m, lernrate);
  let grad: Modell;
  if (m.art === 'netz') {
    const g: Netz = { art: 'netz', w1: m.w1.map((w) => w.map(() => 0)), b1: m.b1.map(() => 0), w2: m.w2.map(() => 0), b2: 0 };
    for (const p of punkte) {
      const { h, z } = netzVorwaerts(m, p.x);
      const dz = (faktor * ((klasse ? sigmoid(z) : z) - p.y)) / n;
      g.b2 += dz;
      h.forEach((hj, j) => {
        g.w2[j] += dz * hj;
        const da = dz * m.w2[j] * (1 - hj * hj);
        g.b1[j] += da;
        p.x.forEach((xk, k) => (g.w1[j][k] += da * xk));
      });
    }
    grad = g;
  } else {
    const w = m.w.map(() => 0);
    let b = 0;
    for (const p of punkte) {
      const dz = (faktor * (ausgabe(m, p.x, klasse) - p.y)) / n;
      b += dz;
      p.x.forEach((xk, k) => (w[k] += dz * xk));
    }
    grad = { art: m.art, w, b };
  }
  const nachher = schrittAnwenden(m, grad, lr);
  return { vorher: m, nachher, grad, lernrate: lr, kostenVorher: kosten(m, punkte, klasse), kostenNachher: kosten(nachher, punkte, klasse) };
}

function schrittAnwenden(m: Modell, g: Modell, lr: number): Modell {
  const neu = (a: number[], b: number[]) => a.map((v, k) => v - lr * b[k]);
  if (m.art === 'netz' && g.art === 'netz')
    return { art: 'netz', w1: m.w1.map((w, j) => neu(w, g.w1[j])), b1: neu(m.b1, g.b1), w2: neu(m.w2, g.w2), b2: m.b2 - lr * g.b2 };
  if (m.art !== 'netz' && g.art !== 'netz') return { art: m.art, w: neu(m.w, g.w), b: m.b - lr * g.b };
  return m;
}

/** Standard-Lernrate; auf Stufe 1 gilt immer sie (FR-17: einstellbar erst ab Stufe 2). */
export const LERNRATE_STANDARD = 0.5;

/**
 * Gerade bzw. innerer Teil der S-Kurve in echten Einheiten des Merkmals (FR-18):
 * Gerade: Zielgröße = steigung · Merkmal + achsenabschnitt; S-Kurve: z = steigung · Merkmal + achsenabschnitt.
 */
export function geradeEcht(i: TabellenInhalt): { steigung: number; achsenabschnitt: number } {
  const m = i.modell;
  if (m.art === 'netz') return { steigung: NaN, achsenabschnitt: NaN };
  const mx = i.merkmale[0], my = i.ziel;
  const xr = mx.max - mx.min;
  const yr = m.art === 'skurve' ? 1 : my.max - my.min, y0 = m.art === 'skurve' ? 0 : my.min;
  const w = m.w[0];
  return { steigung: (yr * w) / xr, achsenabschnitt: y0 + yr * (m.b - (w * mx.min) / xr) };
}

/**
 * Bereiche des Merkmals, in denen das Modell „ja“ vorhersagt (Wahrscheinlichkeit ab 50 %), und die Grenzen dazwischen (FR-20).
 * Abgetastet und an jedem Wechsel durch Halbieren genau bestimmt; so klappt es auch beim Netz mit mehreren Grenzen.
 */
export function klassenbereiche(i: TabellenInhalt, proben = 240): { ja: [number, number][]; grenzen: number[] } {
  const m = i.merkmale[0];
  const p = (x: number) => vorhersage(i, [x]) >= 0.5;
  const ja: [number, number][] = [];
  const grenzen: number[] = [];
  let start: number | null = p(m.min) ? m.min : null;
  let xa = m.min, pa = p(xa);
  for (let k = 1; k <= proben; k++) {
    const xb = m.min + ((m.max - m.min) * k) / proben, pb = p(xb);
    if (pb !== pa) {
      let lo = xa, hi = xb;
      for (let t = 0; t < 30; t++) {
        const mid = (lo + hi) / 2;
        if (p(mid) === pa) lo = mid;
        else hi = mid;
      }
      const g = (lo + hi) / 2;
      grenzen.push(g);
      if (pb) start = g;
      else if (start !== null) (ja.push([start, g]), (start = null));
    }
    xa = xb;
    pa = pb;
  }
  if (start !== null) ja.push([start, m.max]);
  return { ja, grenzen };
}

/** Training gilt als fertig, wenn sich der Fehler über zehn Schritte kaum noch ändert. */
export function trainingFertig(verlauf: number[]): boolean {
  if (verlauf.length < 12) return false;
  const a = verlauf[verlauf.length - 11];
  const b = verlauf[verlauf.length - 1];
  return Math.abs(a - b) <= Math.max(1e-6, a * 0.0005);
}

/** Hängt einen Fehlerwert an und dünnt lange Verläufe aus, damit Projektdateien klein bleiben. */
export function verlaufErgaenzen(verlauf: number[], wert: number, hoechstens = 400): number[] {
  const v = [...verlauf, Math.round(wert * 1000) / 1000];
  return v.length > hoechstens ? v.filter((_, k) => k % 2 === 0 || k === v.length - 1) : v;
}

/** „Schöne“ Achsenwerte (1, 2, 5 × 10^n) zwischen min und max. */
export function achsenwerte(min: number, max: number, ziel = 6): number[] {
  const roh = (max - min) / ziel;
  const p = 10 ** Math.floor(Math.log10(roh));
  const schritt = [1, 2, 5, 10].map((f) => f * p).find((s) => s >= roh) ?? 10 * p;
  const werte: number[] = [];
  for (let v = Math.ceil(min / schritt) * schritt; v <= max + 1e-9; v += schritt) werte.push(Math.round(v * 1e6) / 1e6);
  return werte;
}

/** Zahl auf Deutsch mit echtem Minuszeichen (−); `lesen` versteht beide Schreibweisen. */
export function zahl(v: number, stellen = 0, gruppieren = true): string {
  const t = v.toLocaleString('de-DE', { maximumFractionDigits: stellen, minimumFractionDigits: 0, useGrouping: gruppieren });
  return t === '-0' ? '0' : t.replace('-', '−');
}

/** Liest eine eingetippte Zahl mit Komma oder Punkt und Minus oder Bindestrich; leer oder ungültig ergibt null. */
export function lesen(text: string): number | null {
  const t = text.trim().replace(',', '.').replace('−', '-');
  const v = Number(t);
  return t !== '' && Number.isFinite(v) ? v : null;
}
