<script lang="ts">
  import type { Stufe } from '../lib/projekt';
  let { stufe }: { stufe: Stufe } = $props();

  // Etappe 0: Leinwand mit fester Leiste (BK-C, DEC-11). Inhalte der Karten folgen in Etappe 1 und 2.
  const leiste = ['Daten', 'Modell', 'Training', 'Vorhersage', '3D'];
  let offen = $state<string | null>(null);
</script>

<section class="leinwand">
  <div class="diagramm karte">
    <p class="leise">Hier entsteht das Diagramm (Etappe 2).</p>
    <p class="klein leise">Stufe {stufe}{stufe >= 2 ? ': Modellwahl, Netz, 3D und eigene Tabellen werden hier sichtbar.' : ': Szenarien, Datenpunkte, Training und Vorhersage.'}</p>
  </div>

  {#if offen}
    <div class="karte schublade" class:frage={offen === 'Vorhersage'}>
      <div class="zeile"><h2>{offen}</h2><button aria-label="Schließen" onclick={() => (offen = null)}>✕</button></div>
      <p class="klein leise">Inhalt folgt in Etappe 2.</p>
    </div>
  {/if}

  <nav class="karte dock" aria-label="Werkzeuge">
    {#each leiste as eintrag}
      <button class:frage={eintrag === 'Vorhersage' && offen === eintrag} aria-pressed={offen === eintrag} onclick={() => (offen = offen === eintrag ? null : eintrag)} disabled={eintrag === '3D' && stufe < 2}>{eintrag}</button>
    {/each}
    <button class="haupt" disabled>Trainieren ▶</button>
  </nav>
</section>

<style>
  .leinwand { position: relative; flex: 1; padding: 12px 16px 100px; display: flex; }
  .diagramm { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
  .dock { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; gap: 8px; padding: 8px; }
  .dock button { min-width: 96px; }
  .schublade { position: absolute; left: 50%; bottom: 96px; transform: translateX(-50%); width: min(440px, 90vw); padding: 16px 18px; }
  .schublade.frage { border-top: 4px solid var(--frage); }
  .zeile { display: flex; justify-content: space-between; align-items: center; }
</style>
