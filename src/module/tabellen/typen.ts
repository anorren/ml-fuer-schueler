// Projektinhalt des Moduls „Lernen aus Tabellen“ (gespeichert in Projekt.inhalt, JSON-tauglich).

export interface Spalte {
  name: string;
  einheit: string;
  /** Zählwort für Vorhersagen, z. B. „Eis“ in „etwa 82 Eis“; sonst die Einheit. */
  wort?: string;
  min: number;
  max: number;
  /** Nachkommastellen bei Anzeige und Eingabe. */
  stellen: number;
}

export interface Zeile {
  id: number;
  x: number[];
  y: number;
  /** Testdaten fließen nicht ins Training ein (FR-22). */
  test: boolean;
}

/** Gerade bzw. Ebene im normierten Raum (alle Werte auf 0 … 1 bezogen). */
export interface Gerade {
  art: 'gerade';
  w: number[];
  b: number;
}

export interface TabellenInhalt {
  version: 1;
  art: 'zahl' | 'klasse';
  erfunden: boolean;
  merkmale: Spalte[];
  ziel: Spalte;
  zeilen: Zeile[];
  modell: Gerade;
  lernrate: number;
  schritte: number;
  /** Fehler (in der Einheit der Zielgröße) nach jedem Lernschritt, ausgedünnt. */
  verlauf: number[];
  /** Eingabe für die Vorhersage (FR-19). */
  frage: number[] | null;
  naechsteId: number;
}
