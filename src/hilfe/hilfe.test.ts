import { describe, expect, it } from 'vitest';
import { saetze, zerlegen } from './hilfetext';
import { BEDIENUNG, BEGRIFFE } from './texte';
import { aktuellerTipp, RAHMEN_REGELN, type Regel } from './tipps';
import { MODULE } from '../lib/module';

describe('Hilfetexte (FR-09, FR-24)', () => {
  it('zerlegt markierte Begriffe, auch mit abweichendem Wort', () => {
    expect(zerlegen('Die [[Lernrate]] und [[Lernschritte|Training]].')).toEqual([
      { art: 'text', text: 'Die ' },
      { art: 'begriff', text: 'Lernrate', id: 'lernrate' },
      { art: 'text', text: ' und ' },
      { art: 'begriff', text: 'Lernschritte', id: 'training' },
      { art: 'text', text: '.' }
    ]);
  });

  it('lässt unbekannte Begriffe als Text stehen', () => {
    expect(zerlegen('[[Quatsch]]')).toEqual([{ art: 'text', text: 'Quatsch' }]);
  });

  it('erklärt jeden Begriff und jedes Bedienelement in höchstens zwei Sätzen', () => {
    for (const b of Object.values(BEGRIFFE)) expect(saetze(b.erklaerung), b.wort).toBeLessThanOrEqual(2);
    for (const [k, t] of Object.entries(BEDIENUNG)) expect(saetze(t), k).toBeLessThanOrEqual(2);
  });

  it('verweist in Infotexten nur auf vorhandene Begriffe', () => {
    for (const m of MODULE) for (const e of m.leiste) {
      for (const [, wort, id] of e.info.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
        expect(BEGRIFFE[(id ?? wort).toLowerCase()], `${m.id}/${e.id}: ${wort}`).toBeDefined();
      }
    }
  });
});

describe('Tipps an Stolperstellen (FR-24)', () => {
  const minute = 60_000;
  it('meldet sich erst nach zehn Minuten ohne Speichern', () => {
    expect(aktuellerTipp(RAHMEN_REGELN, { ungesichertSeit: 0, jetzt: 9 * minute }, new Set())).toBeNull();
    expect(aktuellerTipp(RAHMEN_REGELN, { ungesichertSeit: 0, jetzt: 10 * minute }, new Set())?.id).toBe('lange-nicht-gespeichert');
    expect(aktuellerTipp(RAHMEN_REGELN, { ungesichertSeit: null, jetzt: 99 * minute }, new Set())).toBeNull();
  });

  it('bleibt nach dem Wegtippen weg und lässt den nächsten Tipp nachrücken', () => {
    const regeln: Regel[] = [
      { id: 'a', text: 'A', greift: () => true },
      { id: 'b', text: 'B', greift: () => true }
    ];
    expect(aktuellerTipp(regeln, { ungesichertSeit: null, jetzt: 0 }, new Set(['a']))?.id).toBe('b');
    expect(aktuellerTipp(regeln, { ungesichertSeit: null, jetzt: 0 }, new Set(['a', 'b']))).toBeNull();
  });
});
