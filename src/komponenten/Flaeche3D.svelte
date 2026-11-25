<script lang="ts">
  import { onMount } from 'svelte';
  import { gitter, vierecke, flaechenFarbe, projiziere, sigmoid, type Ansicht } from '../lib/flaeche3d';

  // MV-03: Testfläche einer S-Kurve über zwei Merkmalen (wie beim Torschuss), drehbar und zoombar mit Fingern.
  let { n = 25 }: { n?: number } = $props();
  let canvas: HTMLCanvasElement;
  let ansicht: Ansicht = { drehung: 0.7, neigung: 0.95, zoom: 1 };
  let fps = $state<number | null>(null);
  let laeuft = $state(false);
  const z = $derived(gitter(n, (x, y) => sigmoid(9 * (0.9 * x + 0.6 * y - 0.8))));

  function zeichnen() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = devicePixelRatio || 1;
    const b = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(b * dpr)) { canvas.width = Math.round(b * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, b, h);
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = 'rgba(11,11,11,0.18)';
    for (const v of vierecke(z, ansicht, b, h)) {
      ctx.beginPath();
      ctx.moveTo(v.ecken[0][0], v.ecken[0][1]);
      for (let k = 1; k < 4; k++) ctx.lineTo(v.ecken[k][0], v.ecken[k][1]);
      ctx.closePath();
      ctx.fillStyle = flaechenFarbe(v.hoehe);
      ctx.fill();
      ctx.stroke();
    }
    // Grenze bei 50 % (Schnitt der Fläche): Punkte mit Höhe ≈ 0,5 markieren
    ctx.fillStyle = '#d9700b';
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
      if (Math.abs(z[i][j] - 0.5) < 0.06) { const [sx, sy] = projiziere(i / n, j / n, z[i][j], ansicht, b, h); ctx.fillRect(sx - 2, sy - 2, 4, 4); }
    }
  }

  // Fingergesten: ein Finger dreht, zwei Finger zoomen
  const zeiger = new Map<number, { x: number; y: number }>();
  let abstand0 = 0, zoom0 = 1;
  function runter(e: PointerEvent) { canvas.setPointerCapture(e.pointerId); zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (zeiger.size === 2) { const [a, b] = [...zeiger.values()]; abstand0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = ansicht.zoom; } }
  function bewegen(e: PointerEvent) {
    const alt = zeiger.get(e.pointerId);
    if (!alt) return;
    zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.size === 1) {
      ansicht = { ...ansicht, drehung: ansicht.drehung + (e.clientX - alt.x) * 0.01, neigung: Math.min(1.5, Math.max(0.2, ansicht.neigung - (e.clientY - alt.y) * 0.008)) };
    } else if (zeiger.size === 2 && abstand0 > 0) {
      const [a, b] = [...zeiger.values()];
      ansicht = { ...ansicht, zoom: Math.min(2.5, Math.max(0.5, zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / abstand0)) };
    }
    requestAnimationFrame(zeichnen);
  }
  function hoch(e: PointerEvent) { zeiger.delete(e.pointerId); abstand0 = 0; }

  /** Leistungstest: 5 Sekunden drehen und Bilder pro Sekunde messen. */
  function leistungstest() {
    laeuft = true; fps = null;
    const start = performance.now(); let bilder = 0;
    const schritt = (t: number) => {
      ansicht = { ...ansicht, drehung: ansicht.drehung + 0.03 };
      zeichnen(); bilder++;
      if (t - start < 5000) requestAnimationFrame(schritt);
      else { fps = Math.round((bilder * 1000) / (t - start)); laeuft = false; }
    };
    requestAnimationFrame(schritt);
  }

  onMount(() => { zeichnen(); addEventListener('resize', zeichnen); return () => removeEventListener('resize', zeichnen); });
</script>

<div class="flaeche">
  <canvas bind:this={canvas} onpointerdown={runter} onpointermove={bewegen} onpointerup={hoch} onpointercancel={hoch} aria-label="3D-Testfläche: mit einem Finger drehen, mit zwei Fingern zoomen"></canvas>
  <div class="zeile">
    <button onclick={leistungstest} disabled={laeuft}>{laeuft ? 'Test läuft …' : 'Leistungstest (5 s)'}</button>
    {#if fps !== null}
      <span class={fps >= 30 ? 'status-gut' : 'status-achtung'}>{fps} Bilder pro Sekunde {fps >= 30 ? '✓ flüssig' : '– zu langsam'}</span>
    {/if}
    <span class="klein leise">Gitter {n} × {n} · Orange markiert die 50-%-Grenze</span>
  </div>
</div>

<style>
  .flaeche { display: flex; flex-direction: column; gap: 10px; }
  canvas { width: 100%; height: 360px; touch-action: none; background: var(--flaeche); border: 1px solid var(--linie); border-radius: var(--radius-knopf); }
  .zeile { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
</style>
