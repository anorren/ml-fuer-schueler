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
  const B = 110, H = 34;
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
  <div>
    <div class="label"><Begriff id="fehler" /></div>
    <div class="wert">
      {wert === null ? '–' : prozent ? `${zahl(wert, 0)} %` : zahl(wert, 1)}
      {#if richtung < 0}<span class="status-gut" aria-label="sinkt">↓</span>{:else if richtung > 0}<span class="status-achtung" aria-label="steigt">↑</span>{/if}
    </div>
    <div class="klein leise">{prozent ? 'daneben im Mittel' : `${einheit} daneben im Mittel`}</div>
    {#if zusatz}<div class="klein leise">{zusatz}</div>{/if}
  </div>
  {#if pfad}
    <svg width={B} height={H} aria-hidden="true"><polyline points={pfad} /></svg>
  {/if}
</div>

<style>
  .fehler { position: absolute; top: 14px; right: 14px; z-index: 4; display: flex; gap: 14px; align-items: center; padding: 10px 14px; }
  .label :global(.begriff) { text-transform: uppercase; letter-spacing: 0.06em; }
  .wert { font-size: 24px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
  polyline { fill: none; stroke: var(--modell); stroke-width: 2; }
</style>
