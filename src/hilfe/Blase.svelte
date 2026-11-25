<script lang="ts">
  import { hilfe, schliesseBlase } from './hilfe.svelte';
</script>

{#if hilfe.blase}
  {@const b = hilfe.blase}
  <div class="blase karte" class:oben={b.oben} style="left: {b.x}px; top: {b.y}px" role="tooltip">
    {#if b.titel}<strong>{b.titel}</strong>{/if}
    <span>{b.text}</span>
    <button class="zu" aria-label="Erklärung schließen" data-hilfe-frei onclick={schliesseBlase}>✕</button>
  </div>
{/if}

<style>
  .blase { position: fixed; z-index: 40; width: 300px; transform: translateX(-50%); padding: 12px 40px 12px 14px; font-size: 14px; display: flex; flex-direction: column; gap: 3px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); }
  .blase.oben { transform: translate(-50%, -100%); }
  .zu { position: absolute; top: 0; right: 0; border: 0; background: none; min-width: 40px; color: var(--schrift2); }
</style>
