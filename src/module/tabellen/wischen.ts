// Wischen auf dem Diagramm verschiebt die Seite (iPad-Test 26.11.2026). Nur wer einen Punkt berührt,
// zieht ihn: Dafür verhindert ein nicht passiver touchstart das Scrollen, denn Safari beachtet
// touch-action an einzelnen SVG-Formen nicht zuverlässig.
export function punkteFesthalten(node: Element) {
  const start = (e: Event) => {
    if ((e.target as Element | null)?.closest?.('[data-id]')) e.preventDefault();
  };
  node.addEventListener('touchstart', start, { passive: false });
  return { destroy: () => node.removeEventListener('touchstart', start) };
}
