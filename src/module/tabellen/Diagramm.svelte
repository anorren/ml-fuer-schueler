<script lang="ts">
  import { punkteFesthalten } from './wischen';
  import type { TabellenInhalt } from './typen';
  import { achsenwerte, klassenbereiche, luecken, vorhersage, wahrscheinlichkeit, zahl } from './rechnen';

  // XY-Ansicht als SVG (DEC-06, FR-20): benannte Achsen mit Einheit, Kreis = Trainingsdaten,
  // Quadrat = Testdaten, Raute = Vorhersage, blaue Linie = Modell. Punkte antippen, ziehen, setzen (FR-11).
  // Bei Klassen: gefüllt = „ja“, leer = „nein“, Bereich „ja“ blau schraffiert, Grenze gestrichelt (auch in Graustufen lesbar).
  interface Props {
    i: TabellenInhalt;
    /** Was ein Tipp auf eine freie Stelle bewirkt. */
    modus: 'daten' | 'vorhersage' | null;
    auswahl: number | null;
    abstaende: boolean;
    onAuswahl: (id: number | null) => void;
    onVerschieben: (id: number, x: number, y: number, fertig: boolean) => void;
    onNeu: (x: number, y: number) => void;
    /** Abstand oben für Legende und Fehleranzeige. */
    oben?: number;
    onFrage: (x: number) => void;
  }
  let { i, oben = 20, modus, auswahl, abstaende, onAuswahl, onVerschieben, onNeu, onFrage }: Props = $props();

  let breite = $state(800);
  let hoehe = $state(500);
  const R = $derived({ l: 76, r: 24, t: oben, b: 58 });
  const mx = $derived(i.merkmale[0]);
  const my = $derived(i.ziel);
  const pb = $derived(Math.max(breite - R.l - R.r, 50));
  const ph = $derived(Math.max(hoehe - R.t - R.b, 50));
  const klasse = $derived(i.art === 'klasse');
  const klassen = $derived(my.klassen ?? ['nein', 'ja']);
  // Bei Klassen etwas Luft über „ja“ und unter „nein“, damit die Punkte nicht am Rand kleben.
  const yMin = $derived(klasse ? -0.15 : my.min);
  const yMax = $derived(klasse ? 1.15 : my.max);
  const sx = (x: number) => R.l + ((x - mx.min) / (mx.max - mx.min)) * pb;
  const sy = (y: number) => R.t + ph - ((y - yMin) / (yMax - yMin)) * ph;
  const xWerte = $derived(achsenwerte(mx.min, mx.max, Math.max(3, Math.round(pb / 110))));
  const yWerte = $derived(klasse ? [0, 0.25, 0.5, 0.75, 1] : achsenwerte(my.min, my.max, Math.max(3, Math.round(ph / 70))));
  const yText = (v: number) => (klasse ? `${zahl(v * 100)} %` : zahl(v, 2));
  // Modell als Kurve abgetastet; das passt für Gerade, S-Kurve und Netz gleichermaßen.
  const kurve = $derived.by(() => {
    const n = 160, pkt: string[] = [];
    for (let k = 0; k <= n; k++) {
      const x = mx.min + ((mx.max - mx.min) * k) / n;
      const y = sy(vorhersage(i, [x]));
      pkt.push(`${sx(x).toFixed(1)},${(Number.isFinite(y) ? Math.min(Math.max(y, -1e5), 1e5) : 1e5).toFixed(1)}`);
    }
    return pkt.join(' ');
  });
  const bereiche = $derived(klasse ? klassenbereiche(i) : { ja: [], grenzen: [] });
  const frageY = $derived(i.frage ? (klasse ? wahrscheinlichkeit(i, i.frage) : vorhersage(i, i.frage)) : null);
  const musterId = `ja-${Math.random().toString(36).slice(2, 8)}`;
  // Große Bereiche ohne Trainingsdaten grau markieren: Dort rät das Modell nur weiter (FR-23).
  const ohneDaten = $derived(luecken(i));
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
    const y = yMin + ((R.t + ph - py) / ph) * (yMax - yMin);
    const xr = runden(Math.min(Math.max(x, mx.min), mx.max), mx.stellen);
    // Bei Klassen rastet ein Punkt bei „ja“ (1) oder „nein“ (0) ein.
    if (klasse) return { x: xr, y: y >= 0.5 ? 1 : 0 };
    return { x: xr, y: runden(Math.min(Math.max(y, my.min), my.max), my.stellen) };
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
  const yTitel = $derived(klasse ? `${my.name}: Wahrscheinlichkeit für „${klassen[1]}“` : titel(my));
  const zielText = (y: number) => (klasse ? klassen[y >= 0.5 ? 1 : 0] : `${zahl(y, my.stellen)} ${my.wort ?? my.einheit}`);
  function etikett(x: number, p: number) {
    if (!klasse) return `${zahl(x, mx.stellen)} ${mx.einheit} › etwa ${zahl(p, my.stellen)} ${my.wort ?? my.einheit}`;
    const ja = p > 0.5;
    return `${zahl(x, mx.stellen)} ${mx.einheit} › ${klassen[ja ? 1 : 0]} (${zahl((ja ? p : 1 - p) * 100)} %)`;
  }
</script>

<div class="flaeche" bind:clientWidth={breite} bind:clientHeight={hoehe}>
  <svg
    bind:this={svg}
    use:punkteFesthalten
    width={breite}
    height={hoehe}
    role="img"
    aria-label="Diagramm: {yTitel} über {titel(mx)}"
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

    {#each ohneDaten as [a, b]}
      <rect class="ohne" x={sx(a)} y={R.t} width={Math.max(sx(b) - sx(a), 0)} height={ph} />
      <text class="ohne-text" x={(sx(a) + sx(b)) / 2} y={R.t + ph * 0.45} text-anchor="middle">keine Trainingsdaten</text>
    {/each}
    {#each bereiche.ja as [a, b]}
      <rect class="ja-bereich" x={sx(a)} y={R.t} width={Math.max(sx(b) - sx(a), 0)} height={ph} fill="url(#{musterId})" />
    {/each}

    {#each xWerte as v}
      <line class="gitter" x1={sx(v)} x2={sx(v)} y1={R.t} y2={R.t + ph} />
      <text class="wert" x={sx(v)} y={R.t + ph + 20} text-anchor="middle">{zahl(v, 2)}</text>
    {/each}
    {#each yWerte as v}
      <line class="gitter" x1={R.l} x2={R.l + pb} y1={sy(v)} y2={sy(v)} />
      <text class="wert" x={R.l - 10} y={sy(v) + 5} text-anchor="end">{yText(v)}</text>
    {/each}
    {#if klasse}
      <text class="klassenname" x={R.l + 10} y={sy(1) - 10}>{klassen[1]}</text>
      <text class="klassenname" x={R.l + 10} y={sy(0) + 22}>{klassen[0]}</text>
    {/if}
    <line class="achse" x1={R.l} x2={R.l + pb} y1={R.t + ph} y2={R.t + ph} />
    <line class="achse" x1={R.l} x2={R.l} y1={R.t} y2={R.t + ph} />
    <text class="achsentitel" x={R.l + pb / 2} y={hoehe - 10} text-anchor="middle">{titel(mx)}</text>
    <text class="achsentitel" transform="translate(20 {R.t + ph / 2}) rotate(-90)" text-anchor="middle">{yTitel}</text>

    <g clip-path="url(#{clipId})">
      {#if abstaende}
        {#each i.zeilen.filter((z) => !z.test) as z (z.id)}
          <line class="abstand" x1={sx(z.x[0])} x2={sx(z.x[0])} y1={sy(z.y)} y2={sy(vorhersage(i, z.x))} />
        {/each}
      {/if}
      {#each bereiche.grenzen as g}
        <line class="grenze" x1={sx(g)} x2={sx(g)} y1={R.t} y2={R.t + ph} />
        <text class="grenztext" x={sx(g) + 6} y={R.t + ph - 8}>Grenze {zahl(g, 1)} {mx.einheit}</text>
      {/each}
      <polyline class="modell" points={kurve} />
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
          <rect class="test" class:ja={klasse && z.y >= 0.5} x={cx - 8} y={cy - 8} width="16" height="16" />
        {:else}
          <circle class="training" class:ja={klasse && z.y >= 0.5} {cx} {cy} r="8.5" />
        {/if}
        <circle class="treffer" data-id={z.id} {cx} {cy} r="22">
          <title>{zahl(z.x[0], mx.stellen)} {mx.einheit} · {zielText(z.y)}{z.test ? ' (Testdaten)' : ''}</title>
        </circle>
      </g>
    {/each}

    {#if i.frage && frageY !== null}
      {@const fx = sx(i.frage[0])}
      {@const fy = Math.min(Math.max(sy(frageY), R.t), R.t + ph)}
      {@const text = etikett(i.frage[0], frageY)}
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
  /* Senkrechtes Wischen scrollt die Seite; Punkte ziehen bleibt möglich (punkteFesthalten). */
  svg { display: block; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
  .gitter { stroke: var(--linie); stroke-width: 1; }
  .achse { stroke: var(--schrift3); stroke-width: 1.2; }
  .wert { font-size: 14px; fill: var(--schrift2); }
  .achsentitel { font-size: 15px; font-weight: 600; fill: var(--schrift); }
  .modell { fill: none; stroke: var(--modell); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
  .ja-grund { fill: var(--modell-hell); }
  .ja-strich { stroke: var(--modell); stroke-width: 1.2; opacity: 0.35; }
  .grenze { stroke: var(--modell); stroke-width: 2; stroke-dasharray: 7 5; }
  .grenztext { font-size: 13px; font-weight: 600; fill: var(--modell-text, var(--modell)); }
  .ohne { fill: var(--linie); opacity: 0.45; }
  .ohne-text { font-size: 15px; font-weight: 600; fill: var(--schrift2); }
  .klassenname { font-size: 14px; font-weight: 700; fill: var(--schrift2); }
  .training.ja { fill: var(--schrift); }
  .test.ja { fill: var(--frage); }
  .abstand { stroke: var(--schrift3); stroke-width: 1.5; stroke-dasharray: 4 4; }
  .hilfslinie { stroke: var(--schrift2); stroke-width: 1.2; stroke-dasharray: 5 5; }
  .training { fill: var(--flaeche); stroke: var(--schrift); stroke-width: 2.5; }
  .test { fill: var(--flaeche); stroke: var(--frage); stroke-width: 2.5; }
  .ring { fill: none; stroke: var(--schrift); stroke-width: 1.5; stroke-dasharray: 3 3; }
  .treffer { fill: transparent; cursor: grab; touch-action: none; }
  .raute { fill: var(--frage); stroke: var(--flaeche); stroke-width: 1.5; }
  .etikett rect { fill: var(--schrift); }
  .etikett text { fill: var(--flaeche); font-size: 14px; font-weight: 600; }
  svg.setzen { cursor: crosshair; }
</style>
