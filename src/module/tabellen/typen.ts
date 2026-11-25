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
  /** Nur bei Klassen (FR-14): Namen für 0 und 1, z. B. [„nein“, „ja“]. */
  klassen?: [string, string];
}

export interface Zeile {
  id: number;
  x: number[];
  y: number;
  /** Testdaten fließen nicht ins Training ein (FR-22). */
  test: boolean;
}

// Modelle im normierten Raum (alle Werte auf 0 … 1 bezogen), wählbar ab Stufe 2 (FR-15).

/** Gerade bzw. Ebene: ŷ = w · x + b (lineare Regression). */
export interface Gerade {
  art: 'gerade';
  w: number[];
  b: number;
}

/** S-Kurve: ŷ = σ(w · x + b), eine Wahrscheinlichkeit für „ja“ (logistische Regression). */
export interface SKurve {
  art: 'skurve';
  w: number[];
  b: number;
}

/** Netz mit einer Zwischenschicht: hⱼ = tanh(w1ⱼ · x + b1ⱼ), ŷ = Σ w2ⱼ · hⱼ + b2 (bei Klassen durch σ). */
export interface Netz {
  art: 'netz';
  w1: number[][];
  b1: number[];
  w2: number[];
  b2: number;
}

export type Modell = Gerade | SKurve | Netz;
export type ModellArt = Modell['art'];

export interface TabellenInhalt {
  version: 1;
  art: 'zahl' | 'klasse';
  erfunden: boolean;
  merkmale: Spalte[];
  ziel: Spalte;
  zeilen: Zeile[];
  modell: Modell;
  lernrate: number;
  schritte: number;
  /** Fehler (in der Einheit der Zielgröße) nach jedem Lernschritt, ausgedünnt. */
  verlauf: number[];
  /** Eingabe für die Vorhersage (FR-19). */
  frage: number[] | null;
  naechsteId: number;
  /** Eigenes Thema (FR-13): Name des Themas; fehlt er, ist das Thema noch nicht angelegt. */
  thema?: string;
  /** Projekt mit eigenem Thema statt eines vorbereiteten Szenarios. */
  eigen?: boolean;
}
