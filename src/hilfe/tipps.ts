// Regelbasierte Tipps an Stolperstellen (FR-24, DEC-13): offline, ohne Dienst, wegtippbar.
// Der Rahmen bringt eine Regel mit; Module ergänzen eigene (z. B. steigender Fehler).

export interface Lage {
  /** Zeit in ms seit der ersten ungesicherten Änderung, null wenn gesichert. */
  ungesichertSeit: number | null;
  jetzt: number;
  /** Modulspezifische Messwerte, z. B. fehlerVerlauf. */
  werte?: Record<string, unknown>;
}

export interface Regel {
  id: string;
  text: string;
  greift: (lage: Lage) => boolean;
}

export const RAHMEN_REGELN: Regel[] = [
  {
    id: 'lange-nicht-gespeichert',
    text: 'Ihr habt länger nicht gespeichert. Tippt oben auf „Speichern“ und legt die Datei in euren Ordner.',
    greift: (l) => l.ungesichertSeit !== null && l.jetzt - l.ungesichertSeit >= 10 * 60_000
  }
];

/** Liefert den ersten greifenden Tipp, der in dieser Sitzung noch nicht weggetippt wurde. */
export function aktuellerTipp(regeln: Regel[], lage: Lage, weggetippt: ReadonlySet<string>): Regel | null {
  return regeln.find((r) => !weggetippt.has(r.id) && r.greift(lage)) ?? null;
}
