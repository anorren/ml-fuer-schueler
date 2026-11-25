<script lang="ts">
  import type { TabellenInhalt } from './typen';
  import { achsenwerte, hoehenlinie, raster, wahrscheinlichkeit, zahl } from './rechnen';

  // Draufsicht bei zwei Merkmalen (FR-20): Achsen = Merkmale, Punkte nach Klasse (gefüllt = „ja“, leer = „nein“),
  // Bereich „ja“ blau schraffiert, Grenze bei 50 % als dunkle Linie. Punkte antippen, ziehen, setzen (FR-11).
  interface Props {
    i: TabellenInhalt;
    modus: 'daten' | 'vorhersage' | null;
    auswahl: number | null;
    onAuswahl: (id: number | null) => void;
    onVerschieben: (id: number, x: number[], fertig: boolean) => void;
    onNeu: (x: number[]) => void;
    onFrage: (x: number[]) => void;
  }
  let { i, modus, auswahl, onAuswahl, onVerschieben, onNeu, onFrage }: Props = $props();

  let breite = $state(800);
  let hoehe = $state(500);
  const R = { l: 76, r: 24, t: 20, b: 58 };
  const N = 60;
  const ma = $derived(i.merkmale[0]);
  const mb = $derived(i.merkmale[1]);
  const klassen = $derived(i.ziel.klassen ?? ['nein', 'ja']);
  const pb = $derived(Math.max(breite - R.l - R.r, 50));
  const ph = $derived(Math.max(hoehe - R.t - R.b, 50));
  const sx = (x: number) => R.l + ((x - ma.min) / (ma.max - ma.min)) * pb;
  const sy = (y: number) => R.t + ph - ((y - mb.min) / (mb.max - mb.min)) * ph;
  const xWerte = $derived(achsenwerte(ma.min, ma.max, Math.max(3, Math.round(pb / 110))));
  const yWerte = $derived(achsenwerte(mb.min, mb.max, Math.max(3, Math.round(ph / 70))));

  const gitter = $derived(raster(i, N));
  // Bereich „ja“ als waagrechte Streifen; die Ränder jedes Streifens werden entlang der Zeile genau eingepasst,
  // damit der Bereich ohne Treppenstufen an der Grenzlinie endet.
  const NF = 120;
  const fein = $derived(raster(i, NF));
  const streifen = $derived.by(() => {
    const r: { x: number; y: number; w: number; h: number }[] = [];
    const zw = pb / NF, zh = ph / NF;
    for (let j = 0; j < NF; j++) {
      const zeile = fein.werte[j].map((v, k) => (v + fein.werte[j + 1][k]) / 2);
      let start: number | null = zeile[0] >= 0.5 ? 0 : null;
      for (let k = 1; k <= NF; k++) {
        const a = zeile[k - 1], b = zeile[k];
        if (a >= 0.5 !== b >= 0.5) {
          const kx = k - 1 + (a === b ? 0.5 : (0.5 - a) / (b - a));
          if (b >= 0.5) start = kx;
          else if (start !== null) (r.push({ x: R.l + start * zw, y: R.t + ph - (j + 1) * zh, w: (kx - start) * zw, h: zh }), (start = null));
        }
      }
      if (start !== null) r.push({ x: R.l + start * zw, y: R.t + ph - (j + 1) * zh, w: (NF - start) * zw, h: zh });
    }
    return r;
  });
  const linie = $derived.by(() => {
    const zx = (g: number) => R.l + (g / N) * pb, zy = (g: number) => R.t + ph - (g / N) * ph;
    return hoehenlinie(gitter.werte).map(([a, b]) => `M${zx(a[0]).toFixed(1)},${zy(a[1]).toFixed(1)}L${zx(b[0]).toFixed(1)},${zy(b[1]).toFixed(1)}`).join('');
  });
  const frageP = $derived(i.frage && i.frage.length === 2 ? wahrscheinlichkeit(i, i.frage) : null);
  const clipId = `plot-${Math.random().toString(36).slice(2, 8)}`;
  const musterId = `ja2-${Math.random().toString(36).slice(2, 8)}`;

  let svg: SVGSVGElement;
  let zug: { id: number; x0: number; y0: number; bewegt: boolean } | null = null;
  let leerStart: { x: number; y: number } | null = null;

  function ort(e: PointerEvent) {
    const r = svg.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top };
  }
  const runden = (v: number, stellen: number) => Math.round(v * 10 ** stellen) / 10 ** stellen;
  function daten(px: number, py: number): number[] {
    const a = ma.min + ((px - R.l) / pb) * (ma.max - ma.min);
    const b = mb.min + ((R.t + ph - py) / ph) * (mb.max - mb.min);
    return [runden(Math.min(Math.max(a, ma.min), ma.max), ma.stellen), runden(Math.min(Math.max(b, mb.min), mb.max), mb.stellen)];
  }
  const imPlot = (px: number, py: number) => px >= R.l && px <= R.l + pb && py >= R.t && py <= R.t + ph;

  function runter(e: PointerEvent) {
    const treffer = (e.target as Element).closest<SVGElement>('[data-id]');
    const { px, py } = ort(e);
    if (treffer) {
      zug = { id: Number(treffer.dataset.id), x0: px, y0: py, bewegt: false };
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
    } else leerStart = { x: px, y: py };
  }
  function bewegen(e: PointerEvent) {
    if (!zug) return;
    const { px, py } = ort(e);
    if (!zug.bewegt && Math.hypot(px - zug.x0, py - zug.y0) < 6) return;
    zug.bewegt = true;
    onVerschieben(zug.id, daten(px, py), false);
  }
  function hoch(e: PointerEvent) {
    const { px, py } = ort(e);
    if (zug) {
      if (zug.bewegt) onVerschieben(zug.id, daten(px, py), true);
      else onAuswahl(auswahl === zug.id ? null : zug.id);
      zug = null;
      return;
    }
    if (!leerStart || Math.hypot(px - leerStart.x, py - leerStart.y) > 10) return (leerStart = null);
    leerStart = null;
    if (!imPlot(px, py)) return;
    if (modus === 'daten') onNeu(daten(px, py));
    else if (modus === 'vorhersage') onFrage(daten(px, py));
    else onAuswahl(null);
  }
  const titel = (s: { name: string; einheit: string }) => `${s.name} (${s.einheit})`;
  const werteText = (x: number[]) => `${zahl(x[0], ma.stellen)} ${ma.einheit}, ${zahl(x[1], mb.stellen)} ${mb.einheit}`;
</script>

<div class="flaeche" bind:clientWidth={breite} bind:clientHeight={hoehe}>
  <svg
    bind:this={svg}
    width={breite}
    height={hoehe}
    role="img"
    aria-label="Draufsicht: {titel(mb)} über {titel(ma)}, Bereich „{klassen[1]}“ schraffiert"
    class:setzen={modus !== null}
    onpointerdown={runter}
    onpointermove={bewegen}
    onpointerup={hoch}
    onpointercancel={() => (zug = leerStart = null)}
  >
    <defs>
      <clipPath id={clipId}><rect x={R.l} y={R.t} width={pb} height={ph} /></clipPath>
      <pattern id={musterId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="10" class="ja-grund" />
        <line x1="0" y1="0" x2="0" y2="10" class="ja-strich" />
      </pattern>
    </defs>

    <g class="ja-bereich" fill="url(#{musterId})">
      {#each streifen as s}<rect x={s.x} y={s.y} width={s.w} height={s.h + 0.6} />{/each}
    </g>

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
    <text class="achsentitel" x={R.l + pb / 2} y={hoehe - 10} text-anchor="middle">{titel(ma)}</text>
    <text class="achsentitel" transform="translate(20 {R.t + ph / 2}) rotate(-90)" text-anchor="middle">{titel(mb)}</text>

    <g clip-path="url(#{clipId})">
      <path class="grenze" d={linie} />
    </g>

    {#each i.zeilen as z (z.id)}
      {@const cx = sx(z.x[0])}
      {@const cy = sy(z.x[1])}
      <g class="punkt">
        {#if auswahl === z.id}<circle class="ring" {cx} {cy} r="15" />{/if}
        {#if z.test}
          <rect class="test" class:ja={z.y >= 0.5} x={cx - 8} y={cy - 8} width="16" height="16" />
        {:else}
          <circle class="training" class:ja={z.y >= 0.5} {cx} {cy} r="8.5" />
        {/if}
        <circle class="treffer" data-id={z.id} {cx} {cy} r="22">
          <title>{werteText(z.x)} · {klassen[z.y >= 0.5 ? 1 : 0]}{z.test ? ' (Testdaten)' : ''}</title>
        </circle>
      </g>
    {/each}

    {#if i.frage && i.frage.length === 2 && frageP !== null}
      {@const fx = sx(i.frage[0])}
      {@const fy = sy(i.frage[1])}
      {@const ja = frageP >= 0.5}
      {@const text = `${werteText(i.frage)} › ${klassen[ja ? 1 : 0]} (${zahl((ja ? frageP : 1 - frageP) * 100)} %)`}
      {@const tb = text.length * 8 + 24}
      {@const tx = Math.min(fx + 16, R.l + pb - tb)}
      <rect class="raute" x={fx - 9} y={fy - 9} width="18" height="18" transform="rotate(45 {fx} {fy})" />
      <g class="etikett" transform="translate({tx} {Math.max(fy - 44, 4)})">
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
  .ja-grund { fill: var(--modell-hell); }
  .ja-strich { stroke: var(--modell); stroke-width: 1.2; opacity: 0.35; }
  .grenze { fill: none; stroke: var(--grenze, #174a8c); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
  .training { fill: var(--flaeche); stroke: var(--schrift); stroke-width: 2.5; }
  .training.ja { fill: var(--schrift); }
  .test { fill: var(--flaeche); stroke: var(--frage); stroke-width: 2.5; }
  .test.ja { fill: var(--frage); }
  .ring { fill: none; stroke: var(--schrift); stroke-width: 1.5; stroke-dasharray: 3 3; }
  .treffer { fill: transparent; cursor: grab; }
  .raute { fill: var(--frage); stroke: var(--flaeche); stroke-width: 1.5; }
  .etikett rect { fill: var(--schrift); }
  .etikett text { fill: #fff; font-size: 14px; font-weight: 600; }
  svg.setzen { cursor: crosshair; }
</style>
