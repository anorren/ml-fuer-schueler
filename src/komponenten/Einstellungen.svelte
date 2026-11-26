<script lang="ts">
  import { onMount } from 'svelte';
  import type { Stufe } from '../lib/projekt';
  import type { Darstellung } from '../lib/darstellung';
  import { erklaert } from '../hilfe/hilfe.svelte';
  import { BEDIENUNG } from '../hilfe/texte';

  // Menü „Einstellungen“ (DEC-16): Stufe und Darstellung, später weitere Einstellungen.
  // Die Stufe liegt hier, damit sie nicht aus Versehen wechselt; die Kopfleiste zeigt sie weiter an.
  interface Props {
    stufe: Stufe;
    darstellung: Darstellung;
    version: string;
    onStufe: (s: Stufe) => void;
    onDarstellung: (d: Darstellung) => void;
    onSchliessen: () => void;
  }
  let { stufe, darstellung, version, onStufe, onDarstellung, onSchliessen }: Props = $props();

  const STUFEN: { s: Stufe; text: string }[] = [
    { s: 1, text: 'das Wichtigste' },
    { s: 2, text: 'mehr Werkzeuge und Fachbegriffe' },
    { s: 3, text: 'auch Formeln und Rechenwege' }
  ];
  const DARSTELLUNGEN: { d: Darstellung; name: string }[] = [
    { d: 'hell', name: 'Hell' },
    { d: 'dunkel', name: 'Dunkel' },
    { d: 'system', name: 'Wie das iPad' }
  ];

  let menue: HTMLElement;
  onMount(() => {
    // Antippen außerhalb oder Escape schließt das Menü; der Knopf in der Kopfleiste schließt es selbst
    const tippen = (e: PointerEvent) => {
      const ziel = e.target as Element | null;
      if (!menue.contains(ziel) && !ziel?.closest?.('.einstellungsknopf')) onSchliessen();
    };
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && onSchliessen();
    addEventListener('pointerdown', tippen, true);
    addEventListener('keydown', taste);
    menue.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    return () => {
      removeEventListener('pointerdown', tippen, true);
      removeEventListener('keydown', taste);
    };
  });
</script>

<div class="menue karte" role="dialog" aria-label="Einstellungen" bind:this={menue}>
  <div class="kopf">
    <h2>Einstellungen</h2>
    <button class="zu" aria-label="Einstellungen schließen" data-hilfe-frei onclick={onSchliessen}>✕</button>
  </div>

  <section>
    <h3>Stufe</h3>
    <div class="liste" role="radiogroup" aria-label="Stufe">
      {#each STUFEN as e}
        <button role="radio" aria-checked={stufe === e.s} class:an={stufe === e.s} onclick={() => onStufe(e.s)} use:erklaert={BEDIENUNG.stufe}>
          <span class="nr">{e.s}</span>
          <span>{e.text}</span>
        </button>
      {/each}
    </div>
    <p class="klein leise">Eure Arbeit bleibt beim Wechseln erhalten.</p>
  </section>

  <section>
    <h3>Darstellung</h3>
    <div class="wahl" role="radiogroup" aria-label="Darstellung">
      {#each DARSTELLUNGEN as e}
        <button role="radio" aria-checked={darstellung === e.d} class:an={darstellung === e.d} onclick={() => onDarstellung(e.d)} use:erklaert={'Hell, dunkel oder wie am iPad eingestellt. Am Beamer ist Hell meist besser lesbar.'}>{e.name}</button>
      {/each}
    </div>
  </section>

  <p class="fuss klein leise">Version {version} · Herausgegeben von Andreas Norren</p>
</div>

<style>
  .menue { position: fixed; top: calc(var(--kopf-hoehe, 61px) + 6px); right: 12px; z-index: 30; width: min(360px, calc(100vw - 24px)); max-height: calc(var(--fenster-hoehe, 100vh) - var(--kopf-hoehe, 61px) - 24px); overflow-y: auto; padding: 12px 16px 14px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18); }
  .kopf { display: flex; align-items: center; justify-content: space-between; }
  h2 { font-size: 18px; }
  h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: var(--schrift2); text-transform: uppercase; letter-spacing: 0.06em; }
  .zu { border: 0; background: none; min-width: 44px; padding: 0; color: var(--schrift2); }
  .liste { display: flex; flex-direction: column; gap: 8px; }
  .liste button { display: flex; align-items: center; gap: 12px; text-align: left; white-space: normal; }
  .nr { width: 26px; height: 26px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--linie); font-weight: 600; }
  .liste button.an { border-color: var(--modell-knopf); background: var(--modell-hell); color: var(--modell-text); }
  .liste button.an .nr { background: var(--modell-knopf); border-color: var(--modell-knopf); color: #fff; }
  .wahl { display: flex; gap: 8px; }
  .wahl button { flex: 1; padding: 0 8px; }
  .wahl button.an { background: var(--modell-knopf); border-color: var(--modell-knopf); color: #fff; }
  section p { margin: 8px 0 0; }
  .fuss { margin: 0; border-top: 1px solid var(--linie); padding-top: 10px; }
</style>
