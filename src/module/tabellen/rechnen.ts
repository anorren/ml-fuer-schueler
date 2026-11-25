// Eigene Rechenbibliothek (DEC-05): Gerade, Fehler und Gradientenabstieg, nachvollziehbar für Stufe 3.
// Gerechnet wird im normierten Raum (0 … 1 je Spalte), damit eine Lernrate für alle Themen passt.
import type { Gerade, Spalte, TabellenInhalt } from './typen';

export interface PunktN {
  x: number[];
  y: number;
}

export const norm = (v: number, s: Spalte) => (v - s.min) / (s.max - s.min);
export const denorm = (v: number, s: Spalte) => s.min + v * (s.max - s.min);

export function punkteNorm(i: TabellenInhalt, test = false): PunktN[] {
  return i.zeilen.filter((z) => z.test === test).map((z) => ({ x: z.x.map((v, k) => norm(v, i.merkmale[k])), y: norm(z.y, i.ziel) }));
}

export function modellwert(m: Gerade, x: number[]): number {
  return m.b + m.w.reduce((s, w, k) => s + w * x[k], 0);
}

/** Vorhersage in echten Einheiten für eine Eingabe in echten Einheiten. */
export function vorhersage(i: TabellenInhalt, x: number[]): number {
  return denorm(modellwert(i.modell, x.map((v, k) => norm(v, i.merkmale[k]))), i.ziel);
}

/** Mittlere quadratische Abweichung im normierten Raum (Kostenfunktion). */
export function kosten(m: Gerade, punkte: PunktN[]): number {
  if (!punkte.length) return 0;
  return punkte.reduce((s, p) => s + (modellwert(m, p.x) - p.y) ** 2, 0) / punkte.length;
}

/** Fehler zum Anzeigen: Wurzel der mittleren quadratischen Abweichung in der Einheit der Zielgröße. */
export function fehler(i: TabellenInhalt, test = false): number | null {
  const p = punkteNorm(i, test);
  return p.length ? Math.sqrt(kosten(i.modell, p)) * (i.ziel.max - i.ziel.min) : null;
}

export interface Lernschritt {
  vorher: Gerade;
  nachher: Gerade;
  gradW: number[];
  gradB: number;
  kostenVorher: number;
  kostenNachher: number;
}

/** Ein Schritt Gradientenabstieg auf der mittleren quadratischen Abweichung. */
export function lernschritt(m: Gerade, punkte: PunktN[], lernrate: number): Lernschritt {
  const n = Math.max(punkte.length, 1);
  const gradW = m.w.map(() => 0);
  let gradB = 0;
  for (const p of punkte) {
    const r = modellwert(m, p.x) - p.y;
    gradB += (2 * r) / n;
    p.x.forEach((xk, k) => (gradW[k] += (2 * r * xk) / n));
  }
  const nachher: Gerade = { art: 'gerade', w: m.w.map((w, k) => w - lernrate * gradW[k]), b: m.b - lernrate * gradB };
  return { vorher: m, nachher, gradW, gradB, kostenVorher: kosten(m, punkte), kostenNachher: kosten(nachher, punkte) };
}

/** Standard-Lernrate; auf Stufe 1 gilt immer sie (FR-17: einstellbar erst ab Stufe 2). */
export const LERNRATE_STANDARD = 0.5;

/** Gerade in echten Einheiten: Zielgröße = steigung · Merkmal + achsenabschnitt (FR-18). */
export function geradeEcht(i: TabellenInhalt): { steigung: number; achsenabschnitt: number } {
  const mx = i.merkmale[0], my = i.ziel;
  const xr = mx.max - mx.min, yr = my.max - my.min;
  const w = i.modell.w[0];
  return { steigung: (yr * w) / xr, achsenabschnitt: my.min + yr * (i.modell.b - (w * mx.min) / xr) };
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

export function zahl(v: number, stellen = 0, gruppieren = true): string {
  return v.toLocaleString('de-DE', { maximumFractionDigits: stellen, minimumFractionDigits: 0, useGrouping: gruppieren });
}
