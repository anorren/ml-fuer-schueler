<script lang="ts">
  import type { Stufe } from '../lib/projekt';

  interface Props {
    stufe: Stufe;
    gesichert: boolean;
    online: boolean;
    titel: string;
    onStufe: (s: Stufe) => void;
    onOeffnen: () => void;
    onSpeichern: () => void;
    onNeu: () => void;
    onStart: () => void;
  }
  let { stufe, gesichert, online, titel, onStufe, onOeffnen, onSpeichern, onNeu, onStart }: Props = $props();
  const stufen: Stufe[] = [1, 2, 3];
</script>

<header class="leiste">
  <button class="app" onclick={onStart} aria-label="Zur Startseite">Machine Learning für Schüler</button>
  {#if titel}<span class="leise titel">› {titel}</span>{/if}
  <span class="raum"></span>
  {#if !online}<span class="klein leise" title="Die App läuft ohne Internet weiter.">offline</span>{/if}
  <span class="label">Stufe</span>
  <div class="stufen" role="radiogroup" aria-label="Stufe">
    {#each stufen as s}
      <button role="radio" aria-checked={stufe === s} class:an={stufe === s} onclick={() => onStufe(s)}>{s}</button>
    {/each}
  </div>
  <button onclick={onOeffnen}>Öffnen</button>
  <button onclick={onSpeichern}>Speichern</button>
  {#if gesichert}<span class="klein status-gut" aria-live="polite">✓ gesichert</span>{:else}<span class="klein leise">nicht gesichert</span>{/if}
  <button onclick={onNeu}>Neu beginnen</button>
</header>

<style>
  .leiste { display: flex; align-items: center; gap: 12px; padding: 8px 20px; background: var(--flaeche); border-bottom: 1px solid var(--linie); flex-wrap: wrap; }
  .app { border: 0; padding: 0; font-weight: 700; font-size: 16px; background: none; min-height: var(--tippflaeche); }
  .titel { text-transform: none; }
  .raum { flex: 1; }
  .stufen { display: flex; border: 1px solid var(--linie); border-radius: var(--radius-knopf); overflow: hidden; }
  .stufen button { border: 0; border-right: 1px solid var(--linie); border-radius: 0; min-width: 44px; }
  .stufen button:last-child { border-right: 0; }
  .stufen button.an { background: var(--modell); color: #fff; }
</style>
