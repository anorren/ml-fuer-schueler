// Hilfetexte dürfen Fachbegriffe als [[Begriff]] oder [[angezeigtes Wort|begriff]] markieren (FR-24).
import { BEGRIFFE } from './texte';

export type Teil = { art: 'text'; text: string } | { art: 'begriff'; text: string; id: string };

export function zerlegen(text: string): Teil[] {
  const teile: Teil[] = [];
  const muster = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let rest = 0;
  for (const m of text.matchAll(muster)) {
    if (m.index! > rest) teile.push({ art: 'text', text: text.slice(rest, m.index) });
    const id = (m[2] ?? m[1]).trim().toLowerCase();
    teile.push(BEGRIFFE[id] ? { art: 'begriff', text: m[1], id } : { art: 'text', text: m[1] });
    rest = m.index! + m[0].length;
  }
  if (rest < text.length) teile.push({ art: 'text', text: text.slice(rest) });
  return teile;
}

/** Zählt Sätze grob an Satzzeichen; Prüfhilfe für die Zwei-Satz-Grenze. */
export function saetze(text: string): number {
  return (text.replace(/\[\[|\]\]/g, '').match(/[.!?](\s|$)/g) ?? []).length;
}
