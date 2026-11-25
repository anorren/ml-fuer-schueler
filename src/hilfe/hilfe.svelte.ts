// Gemeinsamer Hilfezustand (FR-09, FR-24): Hilfemodus und eine Erklärblase, die nie dauerhaft etwas verdeckt.

export interface Blase {
  titel?: string;
  text: string;
  x: number;
  y: number;
  oben: boolean;
  quelle: Element;
}

export const hilfe = $state<{ modus: boolean; blase: Blase | null }>({ modus: false, blase: null });

const BREITE = 300;

export function zeigeBlase(quelle: Element, text: string, titel?: string): void {
  const r = quelle.getBoundingClientRect();
  const x = Math.min(Math.max(r.left + r.width / 2, BREITE / 2 + 8), innerWidth - BREITE / 2 - 8);
  const oben = r.bottom + 150 > innerHeight;
  hilfe.blase = { titel, text, x, y: oben ? r.top - 8 : r.bottom + 8, oben, quelle };
}

export function schliesseBlase(): void {
  hilfe.blase = null;
}

/** Svelte-Aktion: hinterlegt die Kurzerklärung eines Bedienelements (Hilfemodus, am Desktop als Hover-Titel). */
export function erklaert(node: HTMLElement, text: string) {
  const setzen = (t: string) => {
    node.dataset.hilfe = t;
    node.title = t;
  };
  setzen(text);
  return { update: setzen };
}

/** Fängt im Hilfemodus Taps auf Bedienelemente ab und zeigt deren Erklärung, statt sie auszulösen. */
export function hilfeEinrichten(): () => void {
  const klick = (e: MouseEvent) => {
    const ziel = e.target as Element | null;
    if (!ziel) return;
    const offen = hilfe.blase;
    if (offen && !ziel.closest('.blase') && !offen.quelle.contains(ziel)) schliesseBlase();
    if (!hilfe.modus || ziel.closest('[data-hilfe-frei]')) return;
    const el = ziel.closest<HTMLElement>('[data-hilfe]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    if (offen?.quelle === el) schliesseBlase();
    else zeigeBlase(el, el.dataset.hilfe!);
  };
  const taste = (e: KeyboardEvent) => {
    if (e.key === 'Escape') schliesseBlase();
  };
  const rollen = () => schliesseBlase();
  document.addEventListener('click', klick, true);
  document.addEventListener('keydown', taste);
  addEventListener('scroll', rollen, true);
  addEventListener('resize', rollen);
  return () => {
    document.removeEventListener('click', klick, true);
    document.removeEventListener('keydown', taste);
    removeEventListener('scroll', rollen, true);
    removeEventListener('resize', rollen);
  };
}
