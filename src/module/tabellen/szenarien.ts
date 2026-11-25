// Vorbereitete Szenarien (FR-10). Alle Daten sind erfunden und so gekennzeichnet.
import type { ModellArt, TabellenInhalt, Zeile } from './typen';
import { LERNRATE_STANDARD as LERNRATE, modellNeu } from './rechnen';

function zeilen(train: [number, number][], test: [number, number][] = []): Zeile[] {
  return [...train.map(([x, y]) => ({ x: [x], y, test: false })), ...test.map(([x, y]) => ({ x: [x], y, test: true }))].map((z, k) => ({ ...z, id: k + 1 }));
}

function zeilen2(train: [number, number, number][], test: [number, number, number][] = []): Zeile[] {
  return [...train.map(([a, b, y]) => ({ x: [a, b], y, test: false })), ...test.map(([a, b, y]) => ({ x: [a, b], y, test: true }))].map((z, k) => ({ ...z, id: k + 1 }));
}

function grundinhalt(teil: Pick<TabellenInhalt, 'art' | 'merkmale' | 'ziel' | 'zeilen' | 'erfunden'>, modell: ModellArt = 'gerade'): TabellenInhalt {
  return { version: 1, ...teil, modell: modellNeu(modell, teil.merkmale.length), lernrate: LERNRATE, schritte: 0, verlauf: [], frage: null, naechsteId: teil.zeilen.length + 1 };
}

const KLASSEN: [string, string] = ['nein', 'ja'];

const VORLAGEN: Record<string, () => TabellenInhalt> = {
  schulkiosk: () =>
    grundinhalt({
      art: 'zahl',
      erfunden: true,
      merkmale: [{ name: 'Temperatur', einheit: '°C', min: 10, max: 35, stellen: 0 }],
      ziel: { name: 'Verkaufte Eis', einheit: 'Stück pro Tag', wort: 'Eis', min: 0, max: 120, stellen: 0 },
      zeilen: zeilen(
        [[14, 26], [16, 35], [18, 41], [19, 48], [21, 52], [23, 63], [24, 65], [26, 74], [27, 80], [29, 85], [31, 96], [32, 98]],
        [[20, 55], [25, 66]]
      )
    }),
  // Klasse mit Wahrscheinlichkeit (FR-14); eine Ausreißer-Hitze verschiebt die Grenze der Geraden, kaum die der S-Kurve (FR-15).
  hitzefrei: () =>
    grundinhalt(
      {
        art: 'klasse',
        erfunden: true,
        merkmale: [{ name: 'Höchsttemperatur', einheit: '°C', min: 10, max: 40, stellen: 0 }],
        ziel: { name: 'Hitzefrei', einheit: 'ja oder nein', min: 0, max: 1, stellen: 0, klassen: KLASSEN },
        zeilen: zeilen(
          [[14, 0], [16, 0], [18, 0], [20, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [28, 0], [27, 1], [29, 1], [30, 1], [31, 1], [33, 1]],
          [[21, 0], [32, 1]]
        )
      },
      'skurve'
    ),
  // Zwei Merkmale (FR-21): Draufsicht mit Bereich „Tor“ und 3D-Fläche der Wahrscheinlichkeit; Vorhersage mit Wahrscheinlichkeit (FR-19).
  torschuss: () =>
    grundinhalt(
      {
        art: 'klasse',
        erfunden: true,
        merkmale: [
          { name: 'Entfernung', einheit: 'm', min: 0, max: 35, stellen: 0 },
          { name: 'Winkel', einheit: '°', min: 0, max: 80, stellen: 0 }
        ],
        ziel: { name: 'Torschuss', einheit: 'Tor oder kein Tor', min: 0, max: 1, stellen: 0, klassen: ['kein Tor', 'Tor'] },
        zeilen: zeilen2(
          [
            [5, 5, 1], [6, 30, 1], [8, 15, 1], [9, 45, 1], [11, 10, 1], [12, 30, 1], [14, 5, 1], [15, 20, 1], [17, 8, 1], [7, 55, 1], [20, 12, 1],
            [8, 70, 0], [13, 55, 0], [16, 40, 0], [19, 30, 0], [22, 15, 0], [24, 5, 0], [26, 25, 0], [28, 45, 0], [30, 10, 0], [18, 60, 0], [32, 30, 0], [25, 55, 0], [14, 35, 0]
          ],
          [[9, 25, 1], [16, 10, 1], [27, 15, 0], [20, 45, 0]]
        )
      },
      'skurve'
    ),
  // Gekrümmter Zusammenhang (Z-03b): Die Gerade passt schlecht, das Netz mit Zwischenschicht gut (FR-15).
  bremsweg: () =>
    grundinhalt({
      art: 'zahl',
      erfunden: true,
      merkmale: [{ name: 'Geschwindigkeit', einheit: 'km/h', min: 0, max: 40, stellen: 0 }],
      ziel: { name: 'Bremsweg', einheit: 'm', min: 0, max: 20, stellen: 1 },
      zeilen: zeilen(
        [[5, 0.4], [8, 0.7], [10, 1.0], [12, 1.5], [15, 2.1], [18, 3.2], [20, 3.8], [22, 4.8], [25, 5.9], [27, 7.2], [30, 8.6], [32, 10.1], [35, 11.7], [38, 14.1], [40, 15.3]],
        [[17, 2.9], [28, 7.5]]
      )
    })
};

/** Leeres Projekt: Die Kinder legen zuerst ihr eigenes Thema an (FR-13), dann tragen sie ihre Messwerte ein. */
function leer(): TabellenInhalt {
  return {
    ...grundinhalt({
      art: 'zahl',
      erfunden: false,
      merkmale: [{ name: 'Eingabe', einheit: 'Einheit', min: 0, max: 10, stellen: 1 }],
      ziel: { name: 'Ergebnis', einheit: 'Einheit', min: 0, max: 10, stellen: 1 },
      zeilen: []
    }),
    eigen: true
  };
}

export function hatDaten(szenario: string | null): boolean {
  return szenario === null || szenario in VORLAGEN;
}

export function istInhalt(roh: unknown): roh is TabellenInhalt {
  const i = roh as Partial<TabellenInhalt> | null;
  return (
    !!i &&
    i.version === 1 &&
    Array.isArray(i.merkmale) &&
    i.merkmale.length > 0 &&
    !!i.ziel &&
    Array.isArray(i.zeilen) &&
    i.zeilen.every((z) => Array.isArray(z?.x) && z.x.length === i.merkmale!.length && z.x.every(Number.isFinite) && Number.isFinite(z.y)) &&
    (i.art === 'zahl' || i.art === 'klasse') &&
    modellGueltig(i.modell, i.merkmale.length)
  );
}

const zahlen = (a: unknown, n?: number) => Array.isArray(a) && (n === undefined || a.length === n) && a.every(Number.isFinite);

function modellGueltig(m: unknown, merkmale: number): boolean {
  const o = m as Record<string, unknown> | null;
  if (!o) return false;
  if (o.art === 'gerade' || o.art === 'skurve') return zahlen(o.w, merkmale) && Number.isFinite(o.b);
  if (o.art !== 'netz' || !Array.isArray(o.w1) || !o.w1.length) return false;
  const h = o.w1.length;
  return o.w1.every((w) => zahlen(w, merkmale)) && zahlen(o.b1, h) && zahlen(o.w2, h) && Number.isFinite(o.b2);
}

/** Liefert einen gültigen Inhalt: den gespeicherten, sonst die Vorlage des Szenarios; {} für Szenarien ohne Daten. */
export function inhaltHerstellen(roh: unknown, szenario: string | null): Record<string, unknown> {
  if (istInhalt(roh)) return roh as unknown as Record<string, unknown>;
  const id = szenario === null ? null : szenario.toLowerCase();
  if (id === null) return leer() as unknown as Record<string, unknown>;
  const vorlage = VORLAGEN[id];
  return vorlage ? (vorlage() as unknown as Record<string, unknown>) : {};
}

/** Kleine Vorschau für die Galerie: Punkte im Bereich 0 … 1. */
export function vorschau(szenario: string): { x: number; y: number; test: boolean; voll?: boolean }[] | null {
  const v = VORLAGEN[szenario];
  if (!v) return null;
  const i = v();
  const n = (w: number, s: { min: number; max: number }) => (w - s.min) / (s.max - s.min);
  // Bei zwei Merkmalen zeigt die Vorschau die Draufsicht; gefüllt = „ja“.
  if (i.merkmale.length === 2) return i.zeilen.map((z) => ({ x: n(z.x[0], i.merkmale[0]), y: n(z.x[1], i.merkmale[1]), test: z.test, voll: z.y >= 0.5 }));
  return i.zeilen.map((z) => ({ x: n(z.x[0], i.merkmale[0]), y: n(z.y, i.ziel), test: z.test, voll: i.art === 'klasse' && z.y >= 0.5 }));
}
