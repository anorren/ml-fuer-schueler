<script lang="ts">
  import type { Snippet } from 'svelte';
  import Hilfetext from './Hilfetext.svelte';

  // Karte mit „i“ oben rechts (FR-24, DEC-13): Antippen klappt einen Infobereich mit wenigen Sätzen auf.
  interface Props {
    titel: string;
    info: string;
    frage?: boolean;
    onSchliessen?: () => void;
    children?: Snippet;
  }
  let { titel, info, frage = false, onSchliessen, children }: Props = $props();
  let infoOffen = $state(false);
</script>

<div class="karte infokarte" class:frage>
  <div class="kopf">
    <h2>{titel}</h2>
    <span class="raum"></span>
    <button class="i" aria-label="Info zu {titel}" aria-expanded={infoOffen} data-hilfe-frei onclick={() => (infoOffen = !infoOffen)}><span>i</span></button>
    {#if onSchliessen}<button class="zu" aria-label="{titel} schließen" data-hilfe-frei onclick={onSchliessen}>✕</button>{/if}
  </div>
  {#if infoOffen}
    <div class="info" role="note"><Hilfetext text={info} /></div>
  {/if}
  {#if children}<div class="inhalt">{@render children()}</div>{/if}
</div>

<style>
  .infokarte { padding: 12px 14px 16px 18px; display: flex; flex-direction: column; gap: 10px; }
  .infokarte.frage { border-top: 4px solid var(--frage); }
  .kopf { display: flex; align-items: center; gap: 4px; }
  .raum { flex: 1; }
  .i, .zu { border: 0; background: none; min-width: 44px; padding: 0; display: inline-flex; align-items: center; justify-content: center; color: var(--schrift2); }
  .i span { width: 24px; height: 24px; border: 1.5px solid var(--schrift2); border-radius: 50%; font: italic 600 14px/21px Georgia, serif; text-align: center; }
  .i[aria-expanded='true'] span { background: var(--schrift2); color: var(--flaeche); }
  .info { background: var(--hintergrund); border: 1px solid var(--linie); border-radius: var(--radius-knopf); padding: 10px 12px; font-size: 14px; line-height: 1.5; }
</style>
