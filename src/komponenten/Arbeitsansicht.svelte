<script lang="ts">
  import type { Stufe } from '../lib/projekt';
  import { leisteFuer, type LeistenEintrag, type Modul } from '../lib/module';
  import { ANSICHTEN } from '../module/ansichten';
  import Bereiche from './Bereiche.svelte';
  import Tipp from '../hilfe/Tipp.svelte';

  // Rahmen der Arbeitsansicht (BK-D): Das Modul liefert seine Ansicht (NFR-08); ohne Daten zeigt der Rahmen einen Platzhalter.
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
  const leiste = $derived(leisteFuer(modul, stufe).filter((e) => e.id !== '3d'));
  let offenId = $state<LeistenEintrag['id'] | null>(null);
</script>

{#if Ansicht && mitDaten}
  <Ansicht bind:inhalt {stufe} {modul} {tipp} {onTippWeg} {onGeaendert} {onWerte} />
{:else}
  <section class="leinwand">
    <div class="bild karte">
      <p class="leise">Dieses Beispiel wird gerade gebaut.</p>
      <p class="klein leise">Über die Startseite kommt ihr zu den fertigen Beispielen.</p>
      {#if tipp}<Tipp text={tipp} onWeg={onTippWeg} />{/if}
    </div>
    <Bereiche eintraege={leiste} offen={offenId} onWahl={(id) => (offenId = offenId === id ? null : id)}>
      {#snippet oben()}<button class="haupt" disabled>Trainieren ▶</button>{/snippet}
    </Bereiche>
  </section>
{/if}

<style>
  .leinwand { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 12px; padding: 12px 16px; height: calc(var(--fenster-hoehe, 100vh) - var(--kopf-hoehe, 61px) - var(--fuss-hoehe, 37px)); min-height: 440px; }
  @media (max-aspect-ratio: 1/1) { .leinwand { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) minmax(0, 1fr); } }
  .bild { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 16px; }
</style>
