// FR-03: Die gewählte Stufe bleibt beim nächsten Öffnen erhalten, auch ohne Projekt.
import type { Stufe } from './projekt';

const SCHLUESSEL = 'ml-schule.stufe';

export function stufeLaden(): Stufe | null {
  try {
    const s = Number(localStorage.getItem(SCHLUESSEL));
    return s === 1 || s === 2 || s === 3 ? s : null;
  } catch {
    return null;
  }
}

export function stufeMerken(s: Stufe): void {
  try {
    localStorage.setItem(SCHLUESSEL, String(s));
  } catch {
    /* ohne Speicher gilt die Wahl nur bis zum Schließen */
  }
}
