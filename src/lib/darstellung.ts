// Darstellung hell, dunkel oder wie das System (Apple HIG H9, DEC-15). Die Farben stehen in stil.css
// unter :root[data-thema='dunkel']; hier wird nur entschieden, welches Thema gilt.
export type Darstellung = 'hell' | 'dunkel' | 'system';

const SCHLUESSEL = 'ml-schule.darstellung';
const DUNKEL = '(prefers-color-scheme: dark)';

export function darstellungLaden(): Darstellung {
  try {
    const d = localStorage.getItem(SCHLUESSEL);
    return d === 'hell' || d === 'dunkel' ? d : 'system';
  } catch {
    return 'system';
  }
}

export function darstellungMerken(d: Darstellung): void {
  try {
    if (d === 'system') localStorage.removeItem(SCHLUESSEL);
    else localStorage.setItem(SCHLUESSEL, d);
  } catch {
    /* ohne Speicher gilt die Wahl nur bis zum Schließen */
  }
}

export function istDunkel(d: Darstellung): boolean {
  return d === 'dunkel' || (d === 'system' && matchMedia(DUNKEL).matches);
}

/** Setzt das Thema am Dokument; bei „System“ folgt es auch späteren Wechseln des Geräts. */
export function darstellungAnwenden(d: Darstellung): () => void {
  const setzen = () => {
    const dunkel = istDunkel(d);
    document.documentElement.dataset.thema = dunkel ? 'dunkel' : 'hell';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dunkel ? '#232325' : '#ffffff');
  };
  setzen();
  const m = matchMedia(DUNKEL);
  m.addEventListener('change', setzen);
  return () => m.removeEventListener('change', setzen);
}
