import { describe, expect, it } from 'vitest';
import { dateiname, einlesen, neuesProjekt, ProjektFehler, serialisieren, FORMAT_VERSION } from './projekt';

const fest = new Date('2026-11-25T10:00:00Z');

describe('Projektdatei', () => {
  it('liest geschriebene Projekte unverändert zurück', () => {
    const p = neuesProjekt('0.0.1', 'Team Eisbär', 'tabellen', 2, fest);
    p.szenario = 'schulkiosk';
    p.inhalt = { punkte: [[14, 26], [16, 35]] };
    const zurueck = einlesen(serialisieren(p, fest));
    expect(zurueck).toEqual(p);
  });

  it('lehnt fremde Dateien mit verständlicher Meldung ab', () => {
    expect(() => einlesen('kein json')).toThrow(ProjektFehler);
    expect(() => einlesen('{"name":"etwas anderes"}')).toThrow('kein Projekt dieser App');
  });

  it('lehnt Dateien einer neueren App-Fassung ab', () => {
    const p = { ...neuesProjekt('9.0.0'), formatVersion: FORMAT_VERSION + 1 };
    expect(() => einlesen(JSON.stringify(p))).toThrow('neueren Fassung');
  });

  it('setzt unbekannte Werte auf sichere Vorgaben', () => {
    const p = einlesen(JSON.stringify({ format: 'ml-schule-projekt', formatVersion: 1, stufe: 7, modul: 'x' }));
    expect(p.stufe).toBe(1);
    expect(p.modul).toBe('tabellen');
    expect(p.inhalt).toEqual({});
  });

  it('bildet einen lesbaren Dateinamen ohne Sonderzeichen', () => {
    const p = neuesProjekt('0.0.1', 'Team/Eisbär?*', 'tabellen', 1, fest);
    expect(dateiname(p, fest)).toBe('ML-Schule TeamEisbär 2026-11-25.json');
    expect(dateiname(neuesProjekt('0.0.1'), fest)).toBe('ML-Schule Projekt 2026-11-25.json');
  });
});
