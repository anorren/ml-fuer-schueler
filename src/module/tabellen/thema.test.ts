import { describe, expect, it } from 'vitest';
import { entwurfAus, personenbezug, pruefen, themaAnwenden, VORLAGEN, type ThemaEntwurf } from './thema';
import { inhaltHerstellen, istInhalt } from './szenarien';
import { lernschritt, punkteNorm, vorhersage } from './rechnen';
import type { TabellenInhalt } from './typen';

const leer = () => inhaltHerstellen(null, null) as unknown as TabellenInhalt;
const kopie = (e: ThemaEntwurf): ThemaEntwurf => structuredClone(e);

describe('Eigenes Thema (FR-13)', () => {
  it('ein leeres Projekt wartet auf sein Thema', () => {
    const i = leer();
    expect(i.eigen).toBe(true);
    expect(i.thema).toBeUndefined();
    expect(entwurfAus(i)).toMatchObject({ thema: '', merkmale: [{ name: '', min: '' }] });
  });

  it('Spalten wie Name, Alter oder Größe lösen den Datenschutzhinweis aus', () => {
    expect(personenbezug(['Name'])).toEqual(['Name']);
    expect(personenbezug(['Alter der Kinder', 'Größe'])).toEqual(['Alter der Kinder', 'Größe']);
    expect(personenbezug(['Rampenhöhe', 'Rollweite', 'Flügelbreite'])).toEqual([]);
    for (const v of Object.values(VORLAGEN)) expect(personenbezug([...v.merkmale, v.ziel].map((s) => s.name))).toEqual([]);
  });

  it('meldet fehlende Namen und unpassende Bereiche verständlich', () => {
    const e = kopie(VORLAGEN.Murmelrampe);
    expect(pruefen(e)).toEqual([]);
    e.thema = ' ';
    e.merkmale[0].name = '';
    e.ziel.min = '300';
    expect(pruefen(e)).toEqual(['Gebt eurem Thema einen Namen.', 'Die Eingabe braucht einen Namen.', 'Das Ergebnis: Der größte Wert muss größer sein als der kleinste.']);
    const k = kopie(VORLAGEN.Wetterbeobachtung);
    k.klassen = ['Regen', 'Regen'];
    expect(pruefen(k)).toContain('Die beiden Antworten müssen verschieden sein.');
  });

  it('ein selbst benanntes Thema lässt sich anlegen, trainieren und als gültiger Inhalt speichern', () => {
    const i = leer();
    const e = kopie(VORLAGEN.Murmelrampe);
    e.thema = 'Unsere Murmelbahn';
    themaAnwenden(i, e);
    expect(i.thema).toBe('Unsere Murmelbahn');
    expect(i.merkmale[0]).toMatchObject({ name: 'Rampenhöhe', einheit: 'cm', min: 0, max: 50 });
    i.zeilen = [10, 20, 30, 40].map((h, k) => ({ id: k + 1, x: [h], y: h * 5 + 20, test: false }));
    for (let k = 0; k < 2000; k++) i.modell = lernschritt(i.modell, punkteNorm(i), 0.5).nachher;
    expect(vorhersage(i, [25])).toBeCloseTo(145, 0);
    expect(istInhalt(JSON.parse(JSON.stringify(i)))).toBe(true);
  });

  it('beim Ändern bleiben die Daten, solange Eingaben und Art gleich bleiben', () => {
    const i = leer();
    themaAnwenden(i, kopie(VORLAGEN.Murmelrampe));
    i.zeilen = [{ id: 1, x: [45], y: 250, test: false }];
    const e = entwurfAus(i);
    e.merkmale[0].max = '40';
    expect(themaAnwenden(i, e).datenGeloescht).toBe(false);
    expect(i.zeilen[0].x[0]).toBe(40);
    const k = kopie(VORLAGEN.Wetterbeobachtung);
    expect(themaAnwenden(i, k).datenGeloescht).toBe(true);
    expect(i.zeilen).toEqual([]);
    expect(i.modell.art).toBe('skurve');
    expect(i.ziel.klassen).toEqual(['kein Regen', 'Regen']);
  });
});
