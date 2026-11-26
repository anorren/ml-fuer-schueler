<script lang="ts">
  import { onMount } from 'svelte';
  import type { TabellenInhalt } from './typen';
  import { hoehenlinie, raster, wahrscheinlichkeit, zahl } from './rechnen';

  // 3D-Ansicht (FR-21, DEC-06): Grundfläche = zwei Merkmale, Höhe = Wahrscheinlichkeit für „ja“.
  // Eigene leichte Flächengrafik auf Canvas: Maler-Verfahren (hinten zuerst), Drehen mit einem Finger, Zoomen mit zwei.
  // Die Linie bei 50 % kommt aus derselben Rechnung wie die Grenze der Draufsicht.
  interface Props {
    i: TabellenInhalt;
  }
  let { i }: Props = $props();

  const START = { drehung: -35, neigung: 28, zoom: 1 };
  let drehung = $state(START.drehung);
  let neigung = $state(START.neigung);
  let zoom = $state(START.zoom);
  export function zuruecksetzen() {
    drehung = START.drehung;
    neigung = START.neigung;
    zoom = START.zoom;
  }

  let breite = $state(800);
  let hoehe = $state(500);
  let canvas: HTMLCanvasElement;
  let farben = $state({ modell: '#2670cc', hell: '#e6effb', schrift: '#1f2328', schrift2: '#59636e', linie: '#d8dee4', frage: '#d9700b', flaeche: '#ffffff', grenze: '#174a8c' });

  onMount(() => {
    const lesen = () => {
      const s = getComputedStyle(canvas);
      const v = (n: string, alt: string) => s.getPropertyValue(n).trim() || alt;
      farben = { modell: v('--modell', farben.modell), hell: v('--modell-hell', farben.hell), schrift: v('--schrift', farben.schrift), schrift2: v('--schrift2', farben.schrift2), linie: v('--linie', farben.linie), frage: v('--frage', farben.frage), flaeche: v('--flaeche', farben.flaeche), grenze: v('--grenze', farben.grenze) };
    };
    lesen();
    // Hell/dunkel kann sich während der Arbeit ändern (Dunkelmodus, H9)
    const m = matchMedia('(prefers-color-scheme: dark)');
    m.addEventListener('change', lesen);
    return () => m.removeEventListener('change', lesen);
  });

  const N_FLAECHE = 24;
  const N_LINIE = 60;
  const klassen = $derived(i.ziel.klassen ?? ['nein', 'ja']);

  /** Farbe zwischen hell (0 %) und Modellblau (100 %). */
  function mischen(t: number) {
    const a = parseInt(farben.hell.slice(1), 16), b = parseInt(farben.modell.slice(1), 16);
    const k = Math.min(Math.max(t, 0), 1);
    const c = [16, 8, 0].map((s) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  type Teil = { tiefe: number; malen: (c: CanvasRenderingContext2D) => void };

  function zeichnen() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(breite * dpr);
    canvas.height = Math.round(hoehe * dpr);
    const c = canvas.getContext('2d');
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, breite, hoehe);

    const [ma, mb] = i.merkmale;
    const dr = (drehung * Math.PI) / 180, ne = (neigung * Math.PI) / 180;
    const cosd = Math.cos(dr), sind = Math.sin(dr), cosn = Math.cos(ne), sinn = Math.sin(ne);
    // Platz lassen: oben die Legende, rechts unten die Karte „3D“
    const masz = Math.min(breite * 0.62, hoehe - 120) * 0.42 * zoom;
    const mx = breite * 0.4, my = 90 + (hoehe - 90) * 0.5;
    // Weltkoordinaten: u, v ∈ [−1, 1] auf der Grundfläche, h ∈ [0, 1] als Höhe (Mitte bei 0,5)
    const p = (u: number, v: number, h: number) => {
      const x = u * cosd - v * sind, y = u * sind + v * cosd, z = (h - 0.5) * 1.3;
      return { sx: mx + x * masz, sy: my - (z * cosn + y * sinn) * masz, tiefe: y * cosn - z * sinn };
    };
    const uv = (a: number, b: number) => [((a - ma.min) / (ma.max - ma.min)) * 2 - 1, ((b - mb.min) / (mb.max - mb.min)) * 2 - 1];
    const hoch = (w: number) => Math.min(Math.max(w, -0.2), 1.2);

    // Boden mit Gitter und Achsen
    const boden = [p(-1, -1, 0), p(1, -1, 0), p(1, 1, 0), p(-1, 1, 0)];
    c.fillStyle = farben.flaeche;
    c.strokeStyle = farben.linie;
    c.lineWidth = 1;
    c.beginPath();
    boden.forEach((q, k) => (k ? c.lineTo(q.sx, q.sy) : c.moveTo(q.sx, q.sy)));
    c.closePath();
    c.fill();
    for (let k = 1; k < 4; k++) {
      const t = -1 + k / 2;
      for (const [a, b] of [[p(t, -1, 0), p(t, 1, 0)], [p(-1, t, 0), p(1, t, 0)]]) {
        c.beginPath();
        c.moveTo(a.sx, a.sy);
        c.lineTo(b.sx, b.sy);
        c.stroke();
      }
    }
    c.strokeStyle = farben.schrift2;
    c.beginPath();
    boden.forEach((q, k) => (k ? c.lineTo(q.sx, q.sy) : c.moveTo(q.sx, q.sy)));
    c.closePath();
    c.stroke();

    // Fläche, Grenzlinie und Punkte gemeinsam nach Tiefe sortiert
    const teile: Teil[] = [];
    const f = raster(i, N_FLAECHE);
    for (let j = 0; j < N_FLAECHE; j++) {
      for (let k = 0; k < N_FLAECHE; k++) {
        const ecken = [
          [k, j],
          [k + 1, j],
          [k + 1, j + 1],
          [k, j + 1]
        ].map(([a, b]) => p((a / N_FLAECHE) * 2 - 1, (b / N_FLAECHE) * 2 - 1, hoch(f.werte[b][a])));
        const mittel = (f.werte[j][k] + f.werte[j][k + 1] + f.werte[j + 1][k] + f.werte[j + 1][k + 1]) / 4;
        teile.push({
          tiefe: ecken.reduce((s, q) => s + q.tiefe, 0) / 4,
          malen: (c) => {
            c.beginPath();
            ecken.forEach((q, n) => (n ? c.lineTo(q.sx, q.sy) : c.moveTo(q.sx, q.sy)));
            c.closePath();
            c.globalAlpha = 0.92;
            c.fillStyle = mischen(mittel);
            c.fill();
            c.globalAlpha = 1;
            c.strokeStyle = farben.modell;
            c.globalAlpha = 0.35;
            c.lineWidth = 0.8;
            c.stroke();
            c.globalAlpha = 1;
          }
        });
      }
    }
    const g = raster(i, N_LINIE);
    for (const [a, b] of hoehenlinie(g.werte)) {
      const qa = p((a[0] / N_LINIE) * 2 - 1, (a[1] / N_LINIE) * 2 - 1, 0.5), qb = p((b[0] / N_LINIE) * 2 - 1, (b[1] / N_LINIE) * 2 - 1, 0.5);
      teile.push({
        tiefe: (qa.tiefe + qb.tiefe) / 2 - 0.02,
        malen: (c) => {
          c.strokeStyle = farben.grenze;
          c.lineWidth = 3.5;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(qa.sx, qa.sy);
          c.lineTo(qb.sx, qb.sy);
          c.stroke();
        }
      });
    }
    for (const z of i.zeilen) {
      const [u, v] = uv(z.x[0], z.x[1]);
      const q = p(u, v, z.y >= 0.5 ? 1 : 0);
      const ja = z.y >= 0.5;
      teile.push({
        tiefe: q.tiefe - 0.05,
        malen: (c) => {
          c.lineWidth = 2.2;
          c.beginPath();
          if (z.test) c.rect(q.sx - 6, q.sy - 6, 12, 12);
          else c.arc(q.sx, q.sy, 6.5, 0, Math.PI * 2);
          c.fillStyle = ja ? (z.test ? farben.frage : farben.schrift) : farben.flaeche;
          c.strokeStyle = z.test ? farben.frage : farben.schrift;
          c.fill();
          c.stroke();
        }
      });
    }
    if (i.frage && i.frage.length === 2) {
      const [u, v] = uv(i.frage[0], i.frage[1]);
      const q = p(u, v, wahrscheinlichkeit(i, i.frage));
      teile.push({
        tiefe: q.tiefe - 0.1,
        malen: (c) => {
          c.save();
          c.translate(q.sx, q.sy);
          c.rotate(Math.PI / 4);
          c.fillStyle = farben.frage;
          c.strokeStyle = farben.flaeche;
          c.lineWidth = 1.5;
          c.fillRect(-7, -7, 14, 14);
          c.strokeRect(-7, -7, 14, 14);
          c.restore();
        }
      });
    }
    teile.sort((a, b) => b.tiefe - a.tiefe).forEach((t) => t.malen(c));

    // Beschriftung: Merkmale an zwei Bodenkanten, Höhe an einer Ecke
    c.fillStyle = farben.schrift;
    c.font = '600 14px system-ui, -apple-system, sans-serif';
    c.textAlign = 'center';
    const kante = (a: ReturnType<typeof p>, b: ReturnType<typeof p>, text: string, wa: string, wb: string) => {
      const aussen = (q: ReturnType<typeof p>) => ({ x: q.sx + (q.sx - mx) * 0.12, y: q.sy + (q.sy - my) * 0.12 + 6 });
      const m = aussen({ ...a, sx: (a.sx + b.sx) / 2, sy: (a.sy + b.sy) / 2 });
      c.font = '600 14px system-ui, -apple-system, sans-serif';
      c.fillStyle = farben.schrift;
      c.fillText(text, m.x, m.y);
      c.font = '13px system-ui, -apple-system, sans-serif';
      c.fillStyle = farben.schrift2;
      // Endwerte entlang der eigenen Kante nach außen schieben, damit sich an der gemeinsamen Ecke nichts überlagert
      const laenge = Math.hypot(b.sx - a.sx, b.sy - a.sy) || 1;
      const ux = (b.sx - a.sx) / laenge, uy = (b.sy - a.sy) / laenge;
      const pa = aussen(a), pbb = aussen(b);
      c.fillText(wa, pa.x - ux * 18, pa.y - uy * 18);
      c.fillText(wb, pbb.x + ux * 18, pbb.y + uy * 18);
    };
    // vordere Kanten wählen: die mit der kleineren Tiefe
    const vorneV = p(0, -1, 0).tiefe < p(0, 1, 0).tiefe ? -1 : 1;
    const vorneU = p(-1, 0, 0).tiefe < p(1, 0, 0).tiefe ? -1 : 1;
    kante(p(-1, vorneV, 0), p(1, vorneV, 0), `${ma.name} (${ma.einheit})`, zahl(ma.min), zahl(ma.max));
    kante(p(vorneU, -1, 0), p(vorneU, 1, 0), `${mb.name} (${mb.einheit})`, zahl(mb.min), zahl(mb.max));
    // Höhenachse an der hinteren Ecke
    const eu = -vorneU, ev = -vorneV;
    const unten = p(eu, ev, 0), oben = p(eu, ev, 1), halb = p(eu, ev, 0.5);
    c.strokeStyle = farben.schrift2;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(unten.sx, unten.sy);
    c.lineTo(oben.sx, oben.sy);
    c.stroke();
    c.font = '13px system-ui, -apple-system, sans-serif';
    c.fillStyle = farben.schrift2;
    c.textAlign = 'right';
    for (const [q, t] of [[unten, '0 %'], [halb, '50 %'], [oben, '100 %']] as const) c.fillText(t, q.sx - 8, q.sy + 4);
    c.font = '600 14px system-ui, -apple-system, sans-serif';
    c.fillStyle = farben.schrift;
    c.textAlign = 'center';
    c.fillText(`Wahrscheinlichkeit für „${klassen[1]}“`, oben.sx, oben.sy - 14);
  }

  $effect(() => {
    // Abhängigkeiten lesen, damit die Fläche beim Training und beim Drehen neu gezeichnet wird
    void [breite, hoehe, drehung, neigung, zoom, JSON.stringify(i.modell), JSON.stringify(i.zeilen), i.frage?.join(), farben];
    zeichnen();
  });

  // Gesten: ein Finger dreht, zwei Finger zoomen; am Rechner dreht die Maus, das Mausrad zoomt
  const zeiger = new Map<number, { x: number; y: number }>();
  let abstand0 = 0, zoom0 = 1;
  const abstand = () => {
    const [a, b] = [...zeiger.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  function runter(e: PointerEvent) {
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Zeiger ohne Erfassung (z. B. bereits beendet): Geste trotzdem verfolgen
    }
    zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.size === 2) {
      abstand0 = abstand();
      zoom0 = zoom;
    }
  }
  function bewegen(e: PointerEvent) {
    const alt = zeiger.get(e.pointerId);
    if (!alt) return;
    const neu = { x: e.clientX, y: e.clientY };
    zeiger.set(e.pointerId, neu);
    if (zeiger.size === 1) {
      drehung = (drehung + (neu.x - alt.x) * 0.5) % 360;
      neigung = Math.min(Math.max(neigung + (neu.y - alt.y) * 0.4, 5), 85);
    } else if (zeiger.size === 2 && abstand0 > 0) zoom = Math.min(Math.max((zoom0 * abstand()) / abstand0, 0.5), 3);
  }
  function hoch(e: PointerEvent) {
    zeiger.delete(e.pointerId);
    if (zeiger.size < 2) abstand0 = 0;
  }
  function rad(e: WheelEvent) {
    e.preventDefault();
    zoom = Math.min(Math.max(zoom * Math.exp(-e.deltaY * 0.0015), 0.5), 3);
  }
</script>

<div class="flaeche" bind:clientWidth={breite} bind:clientHeight={hoehe} role="img" aria-label="3D-Ansicht: Wahrscheinlichkeit für „{klassen[1]}“ über {i.merkmale[0].name} und {i.merkmale[1].name}. Grenzlinie bei 50 %.">
  <canvas
    bind:this={canvas}
    style="width: {breite}px; height: {hoehe}px"
    aria-hidden="true"
    data-drehung={Math.round(drehung)}
    data-zoom={zoom.toFixed(2)}
    onpointerdown={runter}
    onpointermove={bewegen}
    onpointerup={hoch}
    onpointercancel={hoch}
    onwheel={rad}
  ></canvas>
</div>

<style>
  .flaeche { position: absolute; inset: 0; }
  canvas { display: block; touch-action: none; cursor: grab; }
  canvas:active { cursor: grabbing; }
</style>
