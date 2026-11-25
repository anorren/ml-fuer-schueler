<script lang="ts">
  import type { Stufe } from '../lib/projekt';
  import { leisteFuer, type LeistenEintrag, type Modul } from '../lib/module';
  import InfoKarte from '../hilfe/InfoKarte.svelte';
  import Tipp from '../hilfe/Tipp.svelte';
  import { erklaert } from '../hilfe/hilfe.svelte';
  import { BEDIENUNG } from '../hilfe/texte';

  // Leinwand mit fester Leiste (BK-C, DEC-11). Die Stufe blendet Einträge ein oder aus (FR-03); Inhalte der Karten folgen mit dem Modul.
  interface Props {
    stufe: Stufe;
    modul: Modul;
    tipp: string | null;
    onTippWeg: () => void;
  }
  let { stufe, modul, tipp, onTippWeg }: Props = $props();

  const leiste = $derived(leisteFuer(modul, stufe));
  let offenId = $state<LeistenEintrag['id'] | null>(null);
  const offen = $derived(leiste.find((e) => e.id === offenId) ?? null);
  let tabelle = $state(false);
  const tabelleSichtbar = $derived(tabelle && stufe >= 2);

  const leisteHilfe: Record<LeistenEintrag['id'], string> = {
    daten: 'Öffnet die Karte mit den Daten.',
    modell: 'Öffnet die Karte zum Modell.',
    training: 'Öffnet die Karte zum Training.',
    vorhersage: 'Öffnet die Karte, mit der ihr das Modell nach einem neuen Fall fragt.',
    '3d': 'Zeigt das Modell als Fläche, die ihr drehen könnt.'
  };
</script>

<section class="leinwand" class:mitTabelle={tabelleSichtbar}>
  <div class="diagramm karte">
    {#if tipp}<Tipp text={tipp} onWeg={onTippWeg} />{/if}
    {#if stufe >= 2}
      <button class="tabellenknopf" aria-pressed={tabelle} onclick={() => (tabelle = !tabelle)} use:erklaert={BEDIENUNG.tabelle}>Tabelle {tabelle ? '⇥' : '⇤'}</button>
    {/if}
    <p class="leise">Hier entsteht das Diagramm.</p>
    <p class="klein leise">Stufe {stufe}{stufe >= 2 ? ': mit Tabelle am Rand, Modellwahl und 3D.' : ': Beispiele, Datenpunkte, Training und Vorhersage.'}</p>
  </div>

  {#if tabelleSichtbar}
    <aside class="karte tabelle" aria-label="Tabelle">
      <div class="label">Tabelle</div>
      <p class="klein leise">Die Daten des Beispiels erscheinen hier, sobald das Modul fertig ist.</p>
    </aside>
  {/if}

  {#if offen}
    <div class="schublade">
      <InfoKarte titel={offen.name} info={offen.info} frage={offen.id === 'vorhersage'} onSchliessen={() => (offenId = null)}>
        <p class="klein leise">Diese Karte wird gerade gebaut.</p>
      </InfoKarte>
    </div>
  {/if}

  <nav class="karte dock" aria-label="Werkzeuge">
    {#each leiste as eintrag (eintrag.id)}
      <button
        class:frage={eintrag.id === 'vorhersage' && offenId === eintrag.id}
        aria-pressed={offenId === eintrag.id}
        onclick={() => (offenId = offenId === eintrag.id ? null : eintrag.id)}
        use:erklaert={leisteHilfe[eintrag.id]}>{eintrag.name}</button
      >
    {/each}
    <button class="haupt" disabled title={BEDIENUNG.trainieren}>Trainieren ▶</button>
  </nav>
</section>

<style>
  .leinwand { position: relative; flex: 1; padding: 12px 16px 100px; display: flex; gap: 12px; }
  .diagramm { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
  .tabellenknopf { position: absolute; top: 12px; right: 12px; }
  .tabelle { width: 280px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
  .dock { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; gap: 8px; padding: 8px; }
  .dock button { min-width: 96px; }
  .schublade { position: absolute; left: 50%; bottom: 96px; transform: translateX(-50%); width: min(440px, 90vw); z-index: 10; }
</style>
