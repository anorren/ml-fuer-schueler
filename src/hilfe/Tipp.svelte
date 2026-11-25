<script lang="ts">
  // Regelbasierter Tipp oben links über dem Diagramm (FR-24); neutral gestaltet und wegtippbar.
  let { text, onWeg }: { text: string; onWeg: () => void } = $props();
</script>

<div class="tipp karte" role="status">
  <span class="label">Tipp</span>
  <span>{text}</span>
  <button aria-label="Tipp schließen" data-hilfe-frei onclick={onWeg}>✕</button>
</div>

<style>
  .tipp { position: absolute; top: 24px; left: 28px; z-index: 5; max-width: min(420px, 70%); display: flex; align-items: flex-start; gap: 10px; padding: 10px 4px 10px 14px; font-size: 14px; border-left: 4px solid var(--schrift3); }
  .label { padding-top: 2px; }
  button { border: 0; background: none; min-width: 40px; min-height: 32px; padding: 0; color: var(--schrift2); }
</style>
