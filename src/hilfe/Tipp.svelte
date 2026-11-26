<script lang="ts">
  // Regelbasierter Tipp als schmale Zeile unter dem Diagramm (FR-24, DEC-14); neutral gestaltet und wegtippbar.
  let { text, onWeg }: { text: string; onWeg: () => void } = $props();
</script>

<div class="tipp" role="status">
  <span class="label">Tipp</span>
  <span class="text">{text}</span>
  <button aria-label="Tipp schließen" data-hilfe-frei onclick={onWeg}>✕</button>
</div>

<style>
  .tipp { display: flex; align-items: center; gap: 10px; padding: 4px 4px 4px 12px; font-size: 14px; border-radius: var(--radius-knopf); background: var(--hintergrund); border-left: 4px solid var(--schrift3); }
  .text { flex: 1; }
  button { border: 0; background: none; min-width: 44px; min-height: 44px; padding: 0; color: var(--schrift2); }
</style>
