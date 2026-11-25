// Modulverzeichnis (FR-02, NFR-08): Module teilen Rahmen, Leiste, Stufen, Speichern und Hilfe.
// Ein neues Modul ergänzt hier seinen Eintrag, ohne andere Module zu ändern.
import type { ModulId, Stufe } from './projekt';
import type { Regel } from '../hilfe/tipps';
import * as tabellenSzenarien from '../module/tabellen/szenarien';

export interface LeistenEintrag {
  id: 'daten' | 'modell' | 'training' | 'vorhersage' | '3d';
  name: string;
  abStufe: Stufe;
  /** Text des Infobereichs („i“), Fachbegriffe als [[Begriff]]. */
  info: string;
}

export interface Szenario {
  id: string;
  titel: string;
  text: string;
  art: string;
}

export interface Modul {
  id: ModulId;
  name: string;
  /** Bezug zum Lehrplanentwurf Informatik 7/8 Rheinland-Pfalz (Quelle Q-02). */
  lehrplan: string;
  bereit: boolean;
  leiste: LeistenEintrag[];
  szenarien: Szenario[];
  regeln: Regel[];
  /** Macht aus gespeichertem oder fehlendem Inhalt einen gültigen Projektinhalt. */
  inhaltHerstellen?: (roh: unknown, szenario: string | null) => Record<string, unknown>;
  /** Punkte für das Vorschaubild in der Galerie (0 … 1). */
  vorschau?: (szenario: string) => { x: number; y: number; test: boolean; voll?: boolean }[] | null;
}

/** Was der Rahmen einer Modulansicht übergibt (NFR-08). */
export interface AnsichtProps {
  stufe: Stufe;
  modul: Modul;
  inhalt: Record<string, unknown>;
  tipp: string | null;
  onTippWeg: () => void;
  /** Inhalt wurde geändert: merken und als ungesichert markieren. */
  onGeaendert: () => void;
  /** Messwerte für regelbasierte Tipps. */
  onWerte: (werte: Record<string, unknown>) => void;
}

const tabellen: Modul = {
  id: 'tabellen',
  name: 'Lernen aus Tabellen',
  lehrplan: 'Intelligente Maschinen?! · überwachtes Lernen mit Daten',
  bereit: true,
  leiste: [
    { id: 'daten', name: 'Daten', abStufe: 1, info: 'Hier stehen die [[Trainingsdaten]]: Jede Zeile der Tabelle ist ein Beispiel und ein Punkt im Diagramm. Ihr könnt Beispiele ergänzen, ändern oder löschen.' },
    { id: 'modell', name: 'Modell', abStufe: 1, info: 'Das [[Modell]] ist die blaue Linie im Diagramm. Ab Stufe 2 wählt ihr, ob eine Gerade, eine S-Kurve oder ein kleines Netz lernen soll.' },
    { id: 'training', name: 'Training', abStufe: 1, info: 'Beim [[Training]] verschiebt die App das Modell in kleinen Schritten so, dass der [[Fehler]] kleiner wird. Ab Stufe 2 stellt ihr die [[Lernrate]] ein.' },
    { id: 'vorhersage', name: 'Vorhersage', abStufe: 1, info: 'Fragt das Modell nach einem neuen Fall. Die orange Raute zeigt seine [[Vorhersage]].' },
    { id: '3d', name: '3D', abStufe: 2, info: 'Bei zwei Eingaben wird aus der Linie eine Fläche. Dreht sie mit einem Finger und zoomt mit zwei.' }
  ],
  szenarien: [
    { id: 'schulkiosk', titel: 'Schulkiosk', text: 'Temperatur › verkaufte Eis', art: 'Zahl' },
    { id: 'hitzefrei', titel: 'Hitzefrei?', text: 'Temperatur › ja oder nein', art: 'Ja/Nein' },
    { id: 'bremsweg', titel: 'Fahrrad-Bremsweg', text: 'Geschwindigkeit › Bremsweg', art: 'Zahl' },
    { id: 'torschuss', titel: 'Torschuss', text: 'Entfernung, Winkel › Tor?', art: 'Ja/Nein' },
    { id: 'bias-kiosk', titel: 'Bias im Kiosk', text: 'nur Sommerdaten', art: 'Bias' }
  ],
  regeln: [
    {
      id: 'fehler-steigt',
      text: 'Der Fehler steigt. Probiert eine kleinere Lernrate.',
      greift: (l) => {
        const v = (l.werte?.verlauf as number[] | undefined) ?? [];
        // drei Anstiege in Folge: Das Modell springt, statt besser zu werden
        if (v.length < 4) return false;
        const s = v.slice(-4);
        return s.every((w, k) => k === 0 || w > s[k - 1]);
      }
    }
  ],
  inhaltHerstellen: tabellenSzenarien.inhaltHerstellen,
  vorschau: tabellenSzenarien.vorschau
};

const inArbeit = (id: ModulId, name: string, lehrplan: string): Modul => ({ id, name, lehrplan, bereit: false, leiste: [], szenarien: [], regeln: [] });

export const MODULE: Modul[] = [
  tabellen,
  inArbeit('bilder', 'Bilder erkennen', 'Intelligente Maschinen?! · Rolle der Trainingsdaten'),
  inArbeit('sprache', 'Sprachmodell', 'Intelligente Maschinen?! · N-Gramme')
];

export function modul(id: ModulId): Modul {
  return MODULE.find((m) => m.id === id) ?? tabellen;
}

export function szenarioTitel(m: Modul, id: string | null): string {
  if (!id) return 'Leeres Projekt';
  return m.szenarien.find((s) => s.id === id || s.titel === id)?.titel ?? id;
}

export function leisteFuer(m: Modul, stufe: Stufe): LeistenEintrag[] {
  return m.leiste.filter((e) => e.abStufe <= stufe);
}
