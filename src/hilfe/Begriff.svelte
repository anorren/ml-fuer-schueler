<script lang="ts">
  import { BEGRIFFE } from './texte';
  import { hilfe, schliesseBlase, zeigeBlase } from './hilfe.svelte';

  // Antippbarer Fachbegriff (FR-24): Antippen zeigt die Erklärung, am Desktop auch das Überfahren.
  let { id, text }: { id: string; text?: string } = $props();
  const begriff = $derived(BEGRIFFE[id]);
  let el = $state<HTMLButtonElement>();
  let vonHover = false;

  function tippen() {
    if (hilfe.blase?.quelle === el && !vonHover) return schliesseBlase();
    vonHover = false;
    zeigeBlase(el!, begriff.erklaerung, begriff.wort);
  }
  function rein(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || hilfe.blase) return;
    vonHover = true;
    zeigeBlase(el!, begriff.erklaerung, begriff.wort);
  }
  function raus(e: PointerEvent) {
    if (e.pointerType === 'mouse' && vonHover && hilfe.blase?.quelle === el) schliesseBlase();
    vonHover = false;
  }
</script>

<button bind:this={el} type="button" class="begriff" data-hilfe-frei aria-expanded={hilfe.blase?.quelle === el} onclick={tippen} onpointerenter={rein} onpointerleave={raus}>{text ?? begriff.wort}</button>

<style>
  .begriff { display: inline; min-height: 0; padding: 0; border: 0; border-radius: 0; background: none; font: inherit; color: inherit; white-space: normal; text-decoration: underline dotted var(--schrift2); text-decoration-thickness: 1.5px; text-underline-offset: 3px; cursor: help; }
</style>
