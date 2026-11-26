<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LeistenEintrag } from '../lib/module';
  import { erklaert } from '../hilfe/hilfe.svelte';
  import Hilfetext from '../hilfe/Hilfetext.svelte';

  // Rechte Spalte der Arbeitsansicht (BK-D, DEC-14): oben die Hauptaktion, darunter die Bereiche
  // Daten, Modell, Training, Vorhersage zum Aufklappen. Es ist immer nur einer offen; zugeklappt zeigt
  // jeder Bereich seinen Stand. Das „i“ klappt die Info zum Bereich auf (FR-24).
  type Id = LeistenEintrag['id'];
  interface Props {
    eintraege: LeistenEintrag[];
    offen: Id | null;
    onWahl: (id: Id) => void;
    /** Stand des Bereichs in wenigen Worten, sichtbar auch im zugeklappten Zustand. */
    stand?: Partial<Record<Id, string>>;
    /** Hauptaktion oben, z. B. „Trainieren“. */
    oben?: Snippet;
    /** Inhalt des offenen Bereichs. */
    inhalt?: Snippet<[Id]>;
  }
  let { eintraege, offen, onWahl, stand = {}, oben, inhalt }: Props = $props();
  let info = $state<Id | null>(null);

  const hilfe: Record<Id, string> = {
    daten: 'Klappt den Bereich mit den Daten auf. Solange er offen ist, setzt ein Tippen ins Diagramm einen Punkt.',
    modell: 'Klappt den Bereich zum Modell auf.',
    training: 'Klappt den Bereich zum Training auf.',
    vorhersage: 'Klappt den Bereich auf, mit dem ihr das Modell nach einem neuen Fall fragt. Solange er offen ist, fragt ein Tippen ins Diagramm.',
    '3d': ''
  };
  function infoUm(id: Id) {
    info = info === id ? null : id;
    if (info && offen !== id) onWahl(id);
  }
</script>

<aside class="bereiche" aria-label="Bereiche">
  {#if oben}<div class="karte oben">{@render oben()}</div>{/if}
  <div class="liste">
    {#each eintraege as e, k (e.id)}
      {@const auf = offen === e.id}
      <section class="karte bereich" class:auf class:frage={e.id === 'vorhersage'} aria-label={e.name}>
        <div class="kopf">
          <button class="kopfzeile" aria-label={e.name} aria-expanded={auf} onclick={() => onWahl(e.id)} use:erklaert={hilfe[e.id]}>
            <span class="nr" aria-hidden="true">{k + 1}</span>
            <span class="name">{e.name}</span>
            <span class="stand" aria-hidden="true">{stand[e.id] ?? ''}</span>
            <span class="pfeil" aria-hidden="true">›</span>
          </button>
          <button class="i" aria-label="Info zu {e.name}" aria-expanded={auf && info === e.id} data-hilfe-frei onclick={() => infoUm(e.id)}><span>i</span></button>
        </div>
        {#if auf}
          <div class="inhalt">
            {#if info === e.id}<div class="info" role="note"><Hilfetext text={e.info} /></div>{/if}
            {@render inhalt?.(e.id)}
          </div>
        {/if}
      </section>
    {/each}
  </div>
</aside>

<style>
  .bereiche { display: flex; flex-direction: column; gap: 10px; min-height: 0; min-width: 0; }
  .oben { display: flex; gap: 12px; padding: 10px; flex: none; }
  .oben :global(button.haupt) { flex: 1; min-height: 50px; font-size: 17px; font-weight: 600; }
  .liste { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .bereich { flex: none; display: flex; flex-direction: column; overflow: hidden; }
  .bereich.auf { flex: 1 1 auto; min-height: 160px; border-color: var(--modell); }
  .bereich.auf.frage { border-color: var(--frage); }
  .kopf { display: flex; align-items: center; flex: none; }
  .kopfzeile { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; border: 0; border-radius: 0; background: none; text-align: left; padding: 6px 4px 6px 14px; min-height: 52px; }
  .nr { width: 24px; height: 24px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--linie); background: var(--hintergrund); font-size: 13px; }
  .auf .nr { background: var(--modell-knopf); border-color: var(--modell-knopf); color: #fff; }
  .auf.frage .nr { background: var(--frage-knopf); border-color: var(--frage-knopf); }
  .name { font-size: 16px; font-weight: 600; }
  .stand { flex: 1; min-width: 0; text-align: right; font-size: 13px; color: var(--schrift2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pfeil { color: var(--schrift3); font-size: 18px; transition: transform 0.15s; }
  .auf .pfeil { transform: rotate(90deg); }
  .i { border: 0; background: none; min-width: 44px; padding: 0; display: inline-flex; align-items: center; justify-content: center; color: var(--schrift2); }
  .i span { width: 24px; height: 24px; border: 1.5px solid var(--schrift2); border-radius: 50%; font: italic 600 14px/21px Georgia, serif; text-align: center; }
  .i[aria-expanded='true'] span { background: var(--schrift2); color: var(--flaeche); }
  .inhalt { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 2px 14px 14px; display: flex; flex-direction: column; gap: 10px; }
  .info { background: var(--hintergrund); border: 1px solid var(--linie); border-radius: var(--radius-knopf); padding: 10px 12px; font-size: 14px; line-height: 1.5; }
</style>
