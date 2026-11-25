// Eigenes Thema (FR-13): Spalten selbst benennen, Zahl oder Klasse wählen, Vorlagen ohne Personenbezug,
// Datenschutzhinweis bei Spaltennamen, die Personen beschreiben.
import type { Spalte, TabellenInhalt } from './typen';
import { modellNeu } from './rechnen';

export interface EingabeEntwurf {
  name: string;
  einheit: string;
  min: string;
  max: string;
}

export interface ThemaEntwurf {
  thema: string;
  art: 'zahl' | 'klasse';
  merkmale: EingabeEntwurf[];
  ziel: EingabeEntwurf;
  /** Bei Klassen: [Antwort unten (0), Antwort oben (1)]. */
  klassen: [string, string];
}

/** Vorlagen für Experimente ohne Personenbezug; die Messwerte erheben die Kinder selbst. */
export const VORLAGEN: Record<string, ThemaEntwurf> = {
  Papierflieger: {
    thema: 'Papierflieger',
    art: 'zahl',
    merkmale: [{ name: 'Flügelbreite', einheit: 'cm', min: '5', max: '25' }],
    ziel: { name: 'Flugweite', einheit: 'm', min: '0', max: '12' },
    klassen: ['nein', 'ja']
  },
  Murmelrampe: {
    thema: 'Murmelrampe',
    art: 'zahl',
    merkmale: [{ name: 'Rampenhöhe', einheit: 'cm', min: '0', max: '50' }],
    ziel: { name: 'Rollweite', einheit: 'cm', min: '0', max: '300' },
    klassen: ['nein', 'ja']
  },
  Wetterbeobachtung: {
    thema: 'Wetterbeobachtung',
    art: 'klasse',
    merkmale: [
      { name: 'Luftdruck', einheit: 'hPa', min: '980', max: '1040' },
      { name: 'Bewölkung', einheit: 'Achtel', min: '0', max: '8' }
    ],
    ziel: { name: 'Regen am Nachmittag', einheit: '', min: '0', max: '1' },
    klassen: ['kein Regen', 'Regen']
  }
};

const PERSONEN = new Set([
  'name', 'namen', 'vorname', 'nachname', 'alter', 'größe', 'groesse', 'körpergröße', 'koerpergroesse', 'schuhgröße', 'gewicht', 'körpergewicht',
  'geburtstag', 'geburtsdatum', 'adresse', 'wohnort', 'straße', 'telefon', 'handynummer', 'email', 'e-mail', 'geschlecht', 'note', 'noten', 'zeugnis'
]);

/** Spaltennamen, die nach Daten über Personen klingen (FR-13); leer, wenn alles unbedenklich ist. */
export function personenbezug(namen: string[]): string[] {
  const treffer = namen.filter((n) => n.toLowerCase().split(/[^\p{L}-]+/u).some((w) => PERSONEN.has(w)));
  return [...new Set(treffer.map((n) => n.trim()))];
}

const zahlAus = (t: string) => {
  const v = Number(t.trim().replace(',', '.').replace('−', '-'));
  return t.trim() !== '' && Number.isFinite(v) ? v : null;
};

/** Prüft den Entwurf und liefert verständliche Hinweise, was noch fehlt. */
export function pruefen(e: ThemaEntwurf): string[] {
  const fehler: string[] = [];
  if (!e.thema.trim()) fehler.push('Gebt eurem Thema einen Namen.');
  const spalten = e.art === 'zahl' ? [...e.merkmale, e.ziel] : e.merkmale;
  spalten.forEach((s, k) => {
    const wer = k < e.merkmale.length ? (e.merkmale.length > 1 ? `Eingabe ${k + 1}` : 'Die Eingabe') : 'Das Ergebnis';
    if (!s.name.trim()) fehler.push(`${wer} braucht einen Namen.`);
    const a = zahlAus(s.min), b = zahlAus(s.max);
    if (a === null || b === null) fehler.push(`${wer}: Tragt den kleinsten und den größten Wert als Zahl ein.`);
    else if (a >= b) fehler.push(`${wer}: Der größte Wert muss größer sein als der kleinste.`);
  });
  if (e.art === 'klasse') {
    if (!e.ziel.name.trim()) fehler.push('Das Ergebnis braucht einen Namen.');
    if (!e.klassen[0].trim() || !e.klassen[1].trim()) fehler.push('Tragt beide möglichen Antworten ein.');
    else if (e.klassen[0].trim() === e.klassen[1].trim()) fehler.push('Die beiden Antworten müssen verschieden sein.');
  }
  return fehler;
}

function spalte(s: EingabeEntwurf): Spalte {
  const min = zahlAus(s.min)!, max = zahlAus(s.max)!;
  return { name: s.name.trim(), einheit: s.einheit.trim(), min, max, stellen: max - min <= 20 ? 1 : 0 };
}

/** Entwurf aus einem vorhandenen Inhalt, damit „Thema ändern“ mit den bisherigen Angaben beginnt. */
export function entwurfAus(i: TabellenInhalt): ThemaEntwurf {
  // Noch kein Thema: leere Felder, die Platzhalter zeigen Beispiele
  if (!i.thema) {
    const leer = { name: '', einheit: '', min: '', max: '' };
    return { thema: '', art: 'zahl', merkmale: [{ ...leer }], ziel: { ...leer }, klassen: ['', ''] };
  }
  const t = (s: Spalte): EingabeEntwurf => ({ name: s.name, einheit: s.einheit, min: String(s.min), max: String(s.max) });
  return {
    thema: i.thema ?? '',
    art: i.art,
    merkmale: i.merkmale.map(t),
    ziel: i.art === 'klasse' ? { name: i.ziel.name, einheit: '', min: '0', max: '1' } : t(i.ziel),
    klassen: i.ziel.klassen ? [i.ziel.klassen[0], i.ziel.klassen[1]] : ['nein', 'ja']
  };
}

/**
 * Übernimmt das Thema in den Projektinhalt. Bleiben Zahl der Eingaben und Art gleich, bleiben die Daten erhalten
 * (auf den neuen Bereich begrenzt); sonst beginnt die Tabelle leer. Das Modell beginnt immer neu.
 */
export function themaAnwenden(i: TabellenInhalt, e: ThemaEntwurf): { datenGeloescht: boolean } {
  const merkmale = e.merkmale.map(spalte);
  const ziel: Spalte =
    e.art === 'klasse'
      ? { name: e.ziel.name.trim(), einheit: `${e.klassen[1].trim()} oder ${e.klassen[0].trim()}`, min: 0, max: 1, stellen: 0, klassen: [e.klassen[0].trim(), e.klassen[1].trim()] }
      : spalte(e.ziel);
  const gleich = i.art === e.art && i.merkmale.length === merkmale.length;
  const klemmen = (v: number, s: Spalte) => Math.min(Math.max(v, s.min), s.max);
  const datenGeloescht = !gleich && i.zeilen.length > 0;
  i.zeilen = gleich ? i.zeilen.map((z) => ({ ...z, x: z.x.map((v, k) => klemmen(v, merkmale[k])), y: e.art === 'klasse' ? z.y : klemmen(z.y, ziel) })) : [];
  i.thema = e.thema.trim();
  i.eigen = true;
  i.erfunden = false;
  i.art = e.art;
  i.merkmale = merkmale;
  i.ziel = ziel;
  i.modell = modellNeu(e.art === 'klasse' ? 'skurve' : 'gerade', merkmale.length);
  i.schritte = 0;
  i.verlauf = [];
  i.frage = null;
  return { datenGeloescht };
}
