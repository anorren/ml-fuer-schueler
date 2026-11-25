<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LeistenEintrag } from '../lib/module';
  import { erklaert } from '../hilfe/hilfe.svelte';

  // Feste Leiste unten (BK-C, DEC-11), in allen Modulen gleich; die Hauptaktion liefert das Modul.
  interface Props {
    eintraege: LeistenEintrag[];
    offen: LeistenEintrag['id'] | null;
    onWahl: (id: LeistenEintrag['id']) => void;
    children?: Snippet;
  }
  let { eintraege, offen, onWahl, children }: Props = $props();

  const hilfe: Record<LeistenEintrag['id'], string> = {
    daten: 'Öffnet die Karte mit den Daten.',
    modell: 'Öffnet die Karte zum Modell.',
    training: 'Öffnet die Karte zum Training.',
    vorhersage: 'Öffnet die Karte, mit der ihr das Modell nach einem neuen Fall fragt.',
    '3d': 'Zeigt das Modell als Fläche, die ihr drehen könnt.'
  };
</script>

<nav class="karte dock" aria-label="Werkzeuge">
  {#each eintraege as e (e.id)}
    <button class:frage={e.id === 'vorhersage' && offen === e.id} aria-pressed={offen === e.id} onclick={() => onWahl(e.id)} use:erklaert={hilfe[e.id]}>{e.name}</button>
  {/each}
  {@render children?.()}
</nav>

<style>
  .dock { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; gap: 8px; padding: 8px; z-index: 6; }
  .dock :global(button) { min-width: 96px; }
</style>
