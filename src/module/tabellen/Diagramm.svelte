<script lang="ts">
  import type { TabellenInhalt } from './typen';
  import { achsenwerte, vorhersage, zahl } from './rechnen';

  // XY-Ansicht als SVG (DEC-06, FR-20): benannte Achsen mit Einheit, Kreis = Trainingsdaten,
  // Quadrat = Testdaten, Raute = Vorhersage, blaue Linie = Modell. Punkte antippen, ziehen, setzen (FR-11).
  interface Props {
    i: TabellenInhalt;
    /** Was ein Tipp auf eine freie Stelle bewirkt. */
    modus: 'daten' | 'vorhersage' | null;
    auswahl: number | null;
    abstaende: boolean;
    onAuswahl: (id: number | null) => void;
    onVerschieben: (id: number, x: number, y: number, fertig: boolean) => void;
    onNeu: (x: number, y: number) => void;
    onFrage: (x: number) => void;
  }
  let { i, modus, auswahl, abstaende, onAuswahl, onVerschieben, onNeu, onFrage }: Props = $props();

  let breite = $state(800);
  let hoehe = $state(500);
  const R = { l: 76, r: 24, t: 20, b: 58 };
  const mx = $derived(i.merkmale[0]);
  const my = $derived(i.ziel);
  const pb = $derived(Math.max(breite - R.l - R.r, 50));
  const ph = $derived(Math.max(hoehe - R.t - R.b, 50));
  const sx = (x: number) => R.l + ((x - mx.min) / (mx.max - mx.min)) * pb;
  const sy = (y: number) => R.t + ph - ((y - my.min) / (my.max - my.min)) * ph;
  const xWerte = $derived(achsenwerte(mx.min, mx.max, Math.max(3, Math.round(pb / 110))));
  const yWerte = $derived(achsenwerte(my.min, my.max, Math.max(3, Math.round(ph / 70))));
  const linie = $derived({ x1: sx(mx.min), y1: sy(vorhersage(i, [mx.min])), x2: sx(mx.max), y2: sy(vorhersage(i, [mx.max])) });
  const frageY = $derived(i.frage ? vorhersage(i, i.frage) : null);
  const clipId = `plot-${Math.random().toString(36).slice(2, 8)}`;

  let svg: SVGSVGElement;
  let zug: { id: number; x0: number; y0: number; bewegt: boolean } | null = null;
  let leerStart: { x: number; y: number } | null = null;

  function ort(e: PointerEvent) {
    const r = svg.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top };
  }
  const runden = (v: number, stellen: number) => Math.round(v * 10 ** stellen) / 10 ** stellen;
  function daten(px: number, py: number) {
    const x = mx.min + ((px - R.l) / pb) * (mx.max - mx.min);
    const y = my.min + ((R.t + ph - py) / ph) * (my.max - my.min);
    return { x: runden(Math.min(Math.max(x, mx.min), mx.max), mx.stellen), y: runden(Math.min(Math.max(y, my.min), my.max), my.stellen) };
  }
  const imPlot = (px: number, py: number) => px >= R.l && px <= R.l + pb && py >= R.t && py <= R.t + ph;

  function runter(e: PointerEvent) {
    const treffer = (e.target as Element).closest<SVGElement>('[data-id]');
    const { px, py } = ort(e);
    if (treffer) {
      zug = { id: Number(treffer.dataset.id), x0: px, y0: py, bewegt: false };
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
    } else {
      leerStart = { x: px, y: py };
    }
  }
  function bewegen(e: PointerEvent) {
    if (!zug) return;
    const { px, py } = ort(e);
    if (!zug.bewegt && Math.hypot(px - zug.x0, py - zug.y0) < 6) return;
    zug.bewegt = true;
    const d = daten(px, py);
    onVerschieben(zug.id, d.x, d.y, false);
  }
  function hoch(e: PointerEvent) {
    const { px, py } = ort(e);
    if (zug) {
      if (zug.bewegt) {
        const d = daten(px, py);
        onVerschieben(zug.id, d.x, d.y, true);
      } else onAuswahl(auswahl === zug.id ? null : zug.id);
      zug = null;
      return;
    }
    if (!leerStart || Math.hypot(px - leerStart.x, py - leerStart.y) > 10) return (leerStart = null);
    leerStart = null;
    if (!imPlot(px, py)) return;
    const d = daten(px, py);
    if (modus === 'daten') onNeu(d.x, d.y);
    else if (modus === 'vorhersage') onFrage(d.x);
    else onAuswahl(null);
  }
  const titel = (s: { name: string; einheit: string }) => `${s.name} (${s.einheit})`;
</script>

<div class="flaeche" bind:clientWidth={breite} bind:clientHeight={hoehe}>
  <svg
    bind:this={svg}
    width={breite}
    height={hoehe}
    role="img"
    aria-label="Diagramm: {titel(my)} über {titel(mx)}"
    class:setzen={modus !== null}
    onpointerdown={runter}
    onpointermove={bewegen}
    onpointerup={hoch}
    onpointercancel={() => (zug = leerStart = null)}
  >
    <defs><clipPath id={clipId}><rect x={R.l} y={R.t} width={pb} height={ph} /></clipPath></defs>

    {#each xWerte as v}
      <line class="gitter" x1={sx(v)} x2={sx(v)} y1={R.t} y2={R.t + ph} />
      <text class="wert" x={sx(v)} y={R.t + ph + 20} text-anchor="middle">{zahl(v, 2)}</text>
    {/each}
    {#each yWerte as v}
      <line class="gitter" x1={R.l} x2={R.l + pb} y1={sy(v)} y2={sy(v)} />
      <text class="wert" x={R.l - 10} y={sy(v) + 5} text-anchor="end">{zahl(v, 2)}</text>
    {/each}
    <line class="achse" x1={R.l} x2={R.l + pb} y1={R.t + ph} y2={R.t + ph} />
    <line class="achse" x1={R.l} x2={R.l} y1={R.t} y2={R.t + ph} />
    <text class="achsentitel" x={R.l + pb / 2} y={hoehe - 10} text-anchor="middle">{titel(mx)}</text>
    <text class="achsentitel" transform="translate(20 {R.t + ph / 2}) rotate(-90)" text-anchor="middle">{titel(my)}</text>

    <g clip-path="url(#{clipId})">
      {#if abstaende}
        {#each i.zeilen.filter((z) => !z.test) as z (z.id)}
          <line class="abstand" x1={sx(z.x[0])} x2={sx(z.x[0])} y1={sy(z.y)} y2={sy(vorhersage(i, z.x))} />
        {/each}
      {/if}
      <line class="modell" {...linie} />
      {#if i.frage && frageY !== null}
        <line class="hilfslinie" x1={sx(i.frage[0])} x2={sx(i.frage[0])} y1={R.t + ph} y2={sy(frageY)} />
        <line class="hilfslinie" x1={R.l} x2={sx(i.frage[0])} y1={sy(frageY)} y2={sy(frageY)} />
      {/if}
    </g>

    {#each i.zeilen as z (z.id)}
      {@const cx = sx(z.x[0])}
      {@const cy = sy(z.y)}
      <g class="punkt" class:gewaehlt={auswahl === z.id}>
        {#if auswahl === z.id}<circle class="ring" {cx} {cy} r="15" />{/if}
        {#if z.test}
          <rect class="test" x={cx - 8} y={cy - 8} width="16" height="16" />
        {:else}
          <circle class="training" {cx} {cy} r="8.5" />
        {/if}
        <circle class="treffer" data-id={z.id} {cx} {cy} r="22">
          <title>{zahl(z.x[0], mx.stellen)} {mx.einheit} · {zahl(z.y, my.stellen)} {my.wort ?? my.einheit}{z.test ? ' (Testdaten)' : ''}</title>
        </circle>
      </g>
    {/each}

    {#if i.frage && frageY !== null}
      {@const fx = sx(i.frage[0])}
      {@const fy = Math.min(Math.max(sy(frageY), R.t), R.t + ph)}
      {@const text = `${zahl(i.frage[0], mx.stellen)} ${mx.einheit} › etwa ${zahl(frageY, my.stellen)} ${my.wort ?? my.einheit}`}
      {@const tb = text.length * 8 + 24}
      {@const tx = Math.min(fx + 16, R.l + pb - tb)}
      <rect class="raute" x={fx - 9} y={fy - 9} width="18" height="18" transform="rotate(45 {fx} {fy})" />
      <g class="etikett" transform="translate({tx} {fy - 44})">
        <rect width={tb} height="32" rx="6" />
        <text x={tb / 2} y="21" text-anchor="middle">{text}</text>
      </g>
    {/if}
  </svg>
</div>

<style>
  .flaeche { position: absolute; inset: 0; }
  svg { display: block; touch-action: none; user-select: none; -webkit-user-select: none; }
  .gitter { stroke: var(--linie); stroke-width: 1; }
  .achse { stroke: var(--schrift3); stroke-width: 1.2; }
  .wert { font-size: 14px; fill: var(--schrift2); }
  .achsentitel { font-size: 15px; font-weight: 600; fill: var(--schrift); }
  .modell { stroke: var(--modell); stroke-width: 3.5; stroke-linecap: round; }
  .abstand { stroke: var(--schrift3); stroke-width: 1.5; stroke-dasharray: 4 4; }
  .hilfslinie { stroke: var(--schrift2); stroke-width: 1.2; stroke-dasharray: 5 5; }
  .training { fill: var(--flaeche); stroke: var(--schrift); stroke-width: 2.5; }
  .test { fill: var(--flaeche); stroke: var(--frage); stroke-width: 2.5; }
  .ring { fill: none; stroke: var(--schrift); stroke-width: 1.5; stroke-dasharray: 3 3; }
  .treffer { fill: transparent; cursor: grab; }
  .raute { fill: var(--frage); stroke: var(--flaeche); stroke-width: 1.5; }
  .etikett rect { fill: var(--schrift); }
  .etikett text { fill: #fff; font-size: 14px; font-weight: 600; }
  svg.setzen { cursor: crosshair; }
</style>
