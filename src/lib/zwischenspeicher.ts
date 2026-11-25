// FR-06: laufender Stand im Browser. Nur Zwischenspeicher, keine Sicherung (Safari kann Website-Daten löschen).
import { einlesen, serialisieren, type Projekt } from './projekt';

const SCHLUESSEL = 'ml-schule.letzter-stand';

export function merken(p: Projekt): void {
  try {
    localStorage.setItem(SCHLUESSEL, serialisieren(p));
  } catch {
    /* Speicher voll oder gesperrt: Arbeit läuft weiter, nur ohne Zwischenstand */
  }
}

export function laden(): Projekt | null {
  try {
    const text = localStorage.getItem(SCHLUESSEL);
    return text ? einlesen(text) : null;
  } catch {
    return null;
  }
}

export function vergessen(): void {
  try {
    localStorage.removeItem(SCHLUESSEL);
  } catch {
    /* nichts zu tun */
  }
}
