<script lang="ts">
  import Begriff from '../../hilfe/Begriff.svelte';
  import { zahl } from './rechnen';

  // Fehler oben rechts mit Verlaufskurve (FR-16): sinkt er, zeigt ein grüner Pfeil nach unten.
  // Bei Klassen steht der Fehler in Prozent direkt hinter der Zahl, darunter wie viele Beispiele falsch eingeordnet sind.
  interface Props {
    wert: number | null;
    verlauf: number[];
    einheit: string;
    prozent?: boolean;
    zusatz?: string | null;
  }
  let { wert, verlauf, einheit, prozent = false, zusatz = null }: Props = $props();
  const B = 96, H = 26;
  const pfad = $derived.by(() => {
    if (verlauf.length < 2) return '';
    const max = Math.max(...verlauf) || 1;
    return verlauf.map((v, k) => `${(k / (verlauf.length - 1)) * B},${H - 2 - (v / max) * (H - 4)}`).join(' ');
  });
  const richtung = $derived.by(() => {
    if (verlauf.length < 3) return 0;
    const a = verlauf[Math.max(0, verlauf.length - 6)], b = verlauf[verlauf.length - 1];
    return Math.abs(b - a) < 1e-3 ? 0 : b < a ? -1 : 1;
  });
</script>

<div class="fehler karte" aria-live="off">
  <div class="oben">
    <span class="label"><Begriff id="fehler" /></span>
    <span class="wert">
      {wert === null ? '–' : prozent ? `${zahl(wert, 0)} %` : zahl(wert, 1)}
      {#if richtung < 0}<span class="status-gut" aria-label="sinkt">↓</span>{:else if richtung > 0}<span class="status-achtung" aria-label="steigt">↑</span>{/if}
    </span>
    {#if pfad}<svg width={B} height={H} aria-hidden="true"><polyline points={pfad} /></svg>{/if}
  </div>
  <div class="klein leise">{prozent ? 'daneben im Mittel' : `${einheit} daneben im Mittel`}{#if zusatz}<br />{zusatz}{/if}</div>
</div>

<style>
  /* Kompakt, damit Legende und Fehler in einem Streifen über dem Diagramm Platz haben */
  .fehler { padding: 8px 14px; }
  .oben { display: flex; align-items: center; gap: 12px; }
  .label :global(.begriff) { text-transform: uppercase; letter-spacing: 0.06em; }
  .wert { font-size: 22px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
  svg { margin-left: auto; }
  polyline { fill: none; stroke: var(--modell); stroke-width: 2; }
</style>
