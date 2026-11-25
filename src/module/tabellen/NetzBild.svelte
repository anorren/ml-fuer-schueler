<script lang="ts">
  import type { Netz } from './typen';

  // Kleines Bild des Netzes (FR-15): Eingaben, Zwischenschicht, Ausgabe. Dicke Linie = großes Gewicht, gestrichelt = negativ.
  let { netz, eingaben, ausgabe }: { netz: Netz; eingaben: string[]; ausgabe: string } = $props();
  const B = 380, R = 11, ABSTAND = 30;
  const h = $derived(netz.w2.length);
  const H = $derived(Math.max(90, Math.max(h, eingaben.length) * ABSTAND + 20));
  const xe = 120, xm = 215, xa = B - 80;
  const reihe = (j: number, n: number) => H / 2 + (j - (n - 1) / 2) * (n > 1 && n < 3 ? ABSTAND * 1.6 : ABSTAND);
  const ye = (k: number) => reihe(k, eingaben.length);
  const ym = (j: number) => reihe(j, h);
  const dicke = (w: number) => Math.min(0.8 + Math.abs(w) * 0.8, 5);
</script>

<svg class="netzbild" width={B} height={H} viewBox="0 0 {B} {H}" role="img" aria-label="Netz mit {h} {h === 1 ? 'Neuron' : 'Neuronen'} in der Zwischenschicht">
  {#each netz.w1 as w, j}
    {#each eingaben as _, k}
      <line x1={xe} y1={ye(k)} x2={xm} y2={ym(j)} stroke-width={dicke(w[k])} class:negativ={w[k] < 0} />
    {/each}
    <line x1={xm} y1={ym(j)} x2={xa} y2={H / 2} stroke-width={dicke(netz.w2[j])} class:negativ={netz.w2[j] < 0} />
  {/each}
  {#each eingaben as name, k}
    <circle class="ein" cx={xe} cy={ye(k)} r={R} />
    <text x={xe - R - 6} y={ye(k) + 5} text-anchor="end">{name}</text>
  {/each}
  {#each netz.w1 as _, j}<circle class="neuron" cx={xm} cy={ym(j)} r={R} />{/each}
  <circle class="aus" cx={xa} cy={H / 2} r={R} />
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
