import { describe, expect, it } from 'vitest';
import { leisteFuer, modul, MODULE, szenarioTitel } from './module';

describe('Module (FR-02, FR-03, NFR-08)', () => {
  it('nennt jedes Modul mit Lehrplanbereich und ohne Nummer', () => {
    for (const m of MODULE) {
      expect(m.lehrplan.length).toBeGreaterThan(5);
      expect(m.name).not.toMatch(/\d/);
    }
  });

  it('hat eindeutige Kennungen', () => {
    expect(new Set(MODULE.map((m) => m.id)).size).toBe(MODULE.length);
  });

  it('blendet die 3D-Ansicht erst ab Stufe 2 ein und behält die Leistenreihenfolge', () => {
    const t = modul('tabellen');
    expect(leisteFuer(t, 1).map((e) => e.id)).toEqual(['daten', 'modell', 'training', 'vorhersage']);
    expect(leisteFuer(t, 2).map((e) => e.id)).toEqual(['daten', 'modell', 'training', 'vorhersage', '3d']);
  });

  it('findet Beispiele auch unter ihrem Titel aus Projekten von Version 0.0.1', () => {
    const t = modul('tabellen');
    expect(szenarioTitel(t, 'schulkiosk')).toBe('Schulkiosk');
    expect(szenarioTitel(t, 'Schulkiosk')).toBe('Schulkiosk');
    expect(szenarioTitel(t, null)).toBe('Leeres Projekt');
  });
});

describe('Tipp bei steigendem Fehler (FR-17, FR-24)', () => {
  const regel = modul('tabellen').regeln.find((r) => r.id === 'fehler-steigt')!;
  const lage = (verlauf: number[]) => ({ ungesichertSeit: null, jetzt: 0, werte: { verlauf } });
  it('greift nach drei Anstiegen in Folge', () => {
    expect(regel.greift(lage([50, 40, 45, 60, 90]))).toBe(true);
    expect(regel.greift(lage([50, 40, 45, 60]))).toBe(false);
    expect(regel.greift(lage([60, 40, 20, 10, 5]))).toBe(false);
    expect(regel.greift(lage([]))).toBe(false);
  });
});
