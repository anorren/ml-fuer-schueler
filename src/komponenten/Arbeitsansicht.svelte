<script lang="ts">
  import type { Stufe } from '../lib/projekt';
  import { leisteFuer, type LeistenEintrag, type Modul } from '../lib/module';
  import { ANSICHTEN } from '../module/ansichten';
  import Leiste from './Leiste.svelte';
  import InfoKarte from '../hilfe/InfoKarte.svelte';
  import Tipp from '../hilfe/Tipp.svelte';

  // Rahmen der Arbeitsansicht (BK-C): Das Modul liefert seine Leinwand (NFR-08); ohne Daten zeigt der Rahmen einen Platzhalter.
  interface Props {
    stufe: Stufe;
    modul: Modul;
    inhalt: Record<string, unknown>;
    tipp: string | null;
    onTippWeg: () => void;
    onGeaendert: () => void;
    onWerte: (werte: Record<string, unknown>) => void;
  }
  let { stufe, modul, inhalt = $bindable(), tipp, onTippWeg, onGeaendert, onWerte }: Props = $props();

  const Ansicht = $derived(ANSICHTEN[modul.id]);
  const mitDaten = $derived(Object.keys(inhalt ?? {}).length > 0);
  const leiste = $derived(leisteFuer(modul, stufe));
  let offenId = $state<LeistenEintrag['id'] | null>(null);
  const offen = $derived(leiste.find((e) => e.id === offenId) ?? null);
</script>

{#if Ansicht && mitDaten}
  <Ansicht bind:inhalt {stufe} {modul} {tipp} {onTippWeg} {onGeaendert} {onWerte} />
{:else}
  <section class="leinwand">
    <div class="diagramm karte">
      {#if tipp}<Tipp text={tipp} onWeg={onTippWeg} />{/if}
      <p class="leise">Dieses Beispiel wird gerade gebaut.</p>
      <p class="klein leise">Fertig sind schon Schulkiosk, Hitzefrei und Fahrrad-Bremsweg. Über die Startseite kommt ihr dorthin.</p>
    </div>
    {#if offen}
      <div class="schublade">
        <InfoKarte titel={offen.name} info={offen.info} onSchliessen={() => (offenId = null)} />
      </div>
    {/if}
    <Leiste eintraege={leiste} offen={offenId} onWahl={(id) => (offenId = offenId === id ? null : id)}>
      <button class="haupt" disabled>Trainieren ▶</button>
    </Leiste>
  </section>
{/if}

<style>
  .leinwand { position: relative; flex: 1; padding: 12px 16px 96px; display: flex; }
  .diagramm { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
  .schublade { position: absolute; left: 50%; bottom: 92px; transform: translateX(-50%); width: min(440px, 90vw); z-index: 10; }
</style>
