// Hilfetexte des Rahmens (FR-09, FR-24, DEC-13). Kurz, kindgerecht, höchstens zwei Sätze.
// Herkunft: KI-Synthese (Claude), von Andreas noch nicht geprüft. Modulspezifische Texte stehen beim Modul.

export interface Begriff {
  wort: string;
  erklaerung: string;
}

/** Antippbare Fachbegriffe. Schlüssel klein geschrieben; im Text mit [[Begriff]] markiert. */
export const BEGRIFFE: Record<string, Begriff> = {
  modell: {
    wort: 'Modell',
    erklaerung: 'Das Modell ist das, was der Computer aus den Daten gelernt hat. Mit ihm schätzt er Antworten für neue Fälle.'
  },
  trainingsdaten: {
    wort: 'Trainingsdaten',
    erklaerung: 'Beispiele, aus denen das Modell lernt. Jedes Beispiel ist eine Zeile in der Tabelle und ein Punkt im Diagramm.'
  },
  testdaten: {
    wort: 'Testdaten',
    erklaerung: 'Beispiele, die das Modell beim Lernen nicht sieht. Mit ihnen prüft ihr, ob es auch Neues gut schätzt.'
  },
  training: {
    wort: 'Training',
    erklaerung: 'Beim Training verändert der Computer das Modell Schritt für Schritt, bis es möglichst gut zu den Daten passt.'
  },
  vorhersage: {
    wort: 'Vorhersage',
    erklaerung: 'Ihr fragt das Modell nach einem neuen Fall, und es schätzt die Antwort. Die Schätzung kann auch danebenliegen.'
  },
  fehler: {
    wort: 'Fehler',
    erklaerung: 'Der Fehler zeigt, wie weit das Modell im Mittel von den Daten entfernt liegt. Je kleiner er ist, desto besser passt das Modell.'
  },
  lernrate: {
    wort: 'Lernrate',
    erklaerung: 'Die Lernrate bestimmt, wie groß jeder Lernschritt ist. Ist sie zu groß, springt das Modell hin und her, statt besser zu werden.'
  },
  kostenfunktion: {
    wort: 'Kostenfunktion',
    erklaerung: 'Die Kostenfunktion misst mit einer Zahl, wie schlecht das Modell passt. Bei Zahlen mittelt sie die quadrierten Abstände, bei Klassen bestraft sie sichere falsche Antworten besonders stark.'
  },
  gradientenabstieg: {
    wort: 'Gradientenabstieg',
    erklaerung: 'Der Gradientenabstieg verbessert das Modell Schritt für Schritt. Er schiebt es jeweils in die Richtung, in der die Kosten am schnellsten sinken.'
  },
  skurve: {
    wort: 'S-Kurve',
    erklaerung: 'Eine Kurve, die von 0 % langsam auf 100 % steigt. Sie gibt an, wie wahrscheinlich die Antwort „ja“ ist.'
  },
  wahrscheinlichkeit: {
    wort: 'Wahrscheinlichkeit',
    erklaerung: 'Die Wahrscheinlichkeit sagt, wie sicher sich das Modell ist, von 0 % bis 100 %. Auch bei 80 % kann die Antwort falsch sein.'
  },
  klassengrenze: {
    wort: 'Klassengrenze',
    erklaerung: 'An der Grenze wechselt die Vorhersage von „nein“ zu „ja“. Dort liegt die Wahrscheinlichkeit genau bei 50 %.'
  },
  netz: {
    wort: 'Netz',
    erklaerung: 'Ein neuronales Netz besteht aus vielen kleinen Rechenbausteinen, den Neuronen. Zusammen können sie auch gebogene Zusammenhänge lernen.'
  },
  neuron: {
    wort: 'Neuron',
    erklaerung: 'Ein Neuron ist ein kleiner Rechenbaustein im Netz. Jedes formt einen Knick oder eine Biegung, zusammen ergeben sie die Kurve.'
  },
  normiert: {
    wort: 'normiert',
    erklaerung: 'Normiert heißt: Alle Werte werden auf den Bereich von 0 bis 1 umgerechnet. So passt dieselbe Lernrate für jedes Thema.'
  },
  bias: {
    wort: 'Bias',
    erklaerung: 'Bias heißt Verzerrung: Die Trainingsdaten zeigen nur einen Teil der Welt. Für den Rest schätzt das Modell dann schlecht.'
  },
  stufe: {
    wort: 'Stufe',
    erklaerung: 'Stufe 1 zeigt das Wichtigste, Stufe 2 mehr Werkzeuge und Fachbegriffe, Stufe 3 auch Formeln. Ihr dürft jederzeit wechseln.'
  }
};

/** Kurzerklärungen der Bedienelemente des Rahmens (FR-09). */
export const BEDIENUNG = {
  start: 'Zurück zur Startseite mit allen Beispielen.',
  einstellungen: 'Öffnet die Einstellungen: Stufe und Darstellung (hell oder dunkel).',
  stufeAnzeige: 'Zeigt, auf welcher Stufe ihr arbeitet. Die Stufe ändert ihr in den Einstellungen (Zahnrad ganz rechts).',
  stufe: 'Wählt, wie viel die App zeigt: 1 das Wichtigste, 2 mehr Werkzeuge, 3 auch Formeln. Eure Arbeit bleibt beim Wechseln erhalten.',
  oeffnen: 'Öffnet eine gespeicherte Projektdatei aus eurem Ordner.',
  speichern: 'Speichert euer Projekt als Datei für euren Ordner. Ein grüner Haken an der Diskette heißt: Der letzte Stand ist gesichert.',
  neu: 'Setzt die App für die nächste Gruppe zurück. Vorher fragt sie nach, wenn etwas nicht gespeichert ist.',
  hilfe: 'Hilfe an: Tippt auf einen Knopf, und die App erklärt ihn, statt etwas zu tun. Noch einmal tippen schaltet die Hilfe aus.',
  team: 'Gebt eurem Team einen Namen. Ein Fantasiename genügt, bitte keine echten Namen.',
  tabelle: 'Blendet die Tabelle mit allen Daten am Rand ein oder aus.',
  trainieren: 'Startet das Training: Das Modell lernt aus den Daten.',
  weiter: 'Öffnet den letzten Stand auf diesem Gerät wieder.',
  leer: 'Beginnt ein Projekt ohne Beispieldaten, mit eigener Tabelle.',
  modul: 'Wählt einen Themenbereich. Die Reihenfolge ist egal.'
} as const;
