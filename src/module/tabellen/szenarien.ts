// Vorbereitete Szenarien (FR-10). Alle Daten sind erfunden und so gekennzeichnet.
import type { TabellenInhalt, Zeile } from './typen';

import { LERNRATE_STANDARD as LERNRATE } from './rechnen';

function zeilen(train: [number, number][], test: [number, number][] = []): Zeile[] {
  return [...train.map(([x, y]) => ({ x: [x], y, test: false })), ...test.map(([x, y]) => ({ x: [x], y, test: true }))].map((z, k) => ({ ...z, id: k + 1 }));
}

function grundinhalt(teil: Pick<TabellenInhalt, 'art' | 'merkmale' | 'ziel' | 'zeilen' | 'erfunden'>): TabellenInhalt {
  return { version: 1, ...teil, modell: { art: 'gerade', w: teil.merkmale.map(() => 0), b: 0 }, lernrate: LERNRATE, schritte: 0, verlauf: [], frage: null, naechsteId: teil.zeilen.length + 1 };
}

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
    })
};

/** Leeres Projekt: zwei neutrale Spalten, Punkte setzen die Kinder selbst (eigene Themen folgen mit FR-13). */
function leer(): TabellenInhalt {
  return grundinhalt({
    art: 'zahl',
    erfunden: false,
    merkmale: [{ name: 'Eingabe', einheit: 'Einheit', min: 0, max: 10, stellen: 1 }],
    ziel: { name: 'Ergebnis', einheit: 'Einheit', min: 0, max: 10, stellen: 1 },
    zeilen: []
  });
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
    !!i.modell &&
    Array.isArray(i.modell.w) &&
    Number.isFinite(i.modell.b)
  );
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
export function vorschau(szenario: string): { x: number; y: number; test: boolean }[] | null {
  const v = VORLAGEN[szenario];
  if (!v) return null;
  const i = v();
  return i.zeilen.map((z) => ({ x: (z.x[0] - i.merkmale[0].min) / (i.merkmale[0].max - i.merkmale[0].min), y: (z.y - i.ziel.min) / (i.ziel.max - i.ziel.min), test: z.test }));
}
