<script lang="ts">
  import type { Netz } from './typen';

  // Kleines Bild des Netzes (FR-15): Eingabe, Zwischenschicht, Ausgabe. Dicke Linie = großes Gewicht, gestrichelt = negativ.
  let { netz, eingabe, ausgabe }: { netz: Netz; eingabe: string; ausgabe: string } = $props();
  const B = 380, R = 11;
  const h = $derived(netz.w2.length);
  const H = $derived(Math.max(90, h * 30 + 20));
  const xe = 120, xm = 215, xa = B - 80;
  const ym = (j: number) => H / 2 + (j - (h - 1) / 2) * 30;
  const dicke = (w: number) => Math.min(0.8 + Math.abs(w) * 0.8, 5);
</script>

<svg class="netzbild" width={B} height={H} viewBox="0 0 {B} {H}" role="img" aria-label="Netz mit {h} {h === 1 ? 'Neuron' : 'Neuronen'} in der Zwischenschicht">
  {#each netz.w1 as w, j}
    <line x1={xe} y1={H / 2} x2={xm} y2={ym(j)} stroke-width={dicke(w[0])} class:negativ={w[0] < 0} />
    <line x1={xm} y1={ym(j)} x2={xa} y2={H / 2} stroke-width={dicke(netz.w2[j])} class:negativ={netz.w2[j] < 0} />
  {/each}
  <circle class="ein" cx={xe} cy={H / 2} r={R} />
  {#each netz.w1 as _, j}<circle class="neuron" cx={xm} cy={ym(j)} r={R} />{/each}
  <circle class="aus" cx={xa} cy={H / 2} r={R} />
  <text x={xe - R - 6} y={H / 2 + 5} text-anchor="end">{eingabe}</text>
  <text x={xa + R + 6} y={H / 2 + 5}>{ausgabe}</text>
</svg>

<style>
  .netzbild { display: block; max-width: 100%; height: auto; overflow: visible; }
  line { stroke: var(--modell); opacity: 0.75; }
  line.negativ { stroke-dasharray: 4 3; }
  circle { stroke-width: 2; }
  .ein, .aus { fill: var(--flaeche); stroke: var(--schrift); }
  .neuron { fill: var(--modell-hell); stroke: var(--modell); }
  text { font-size: 12px; fill: var(--schrift2); }
</style>
