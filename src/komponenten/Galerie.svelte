<script lang="ts">
  interface Props {
    weiter: { team: string; szenario: string | null } | null;
    onStart: (szenario: string | null) => void;
    onWeiter: () => void;
    onOeffnen: () => void;
    onMachbarkeit: () => void;
  }
  let { weiter, onStart, onWeiter, onOeffnen, onMachbarkeit }: Props = $props();

  // Etappe 0: Beispiele sind angelegt, ihre Inhalte folgen in Etappe 2 (FR-10).
  const szenarien = [
    { id: 'Schulkiosk', text: 'Temperatur › verkaufte Eis', art: 'Zahl' },
    { id: 'Hitzefrei?', text: 'Temperatur › ja oder nein', art: 'Ja/Nein' },
    { id: 'Fahrrad-Bremsweg', text: 'Geschwindigkeit › Bremsweg', art: 'Zahl' },
    { id: 'Torschuss', text: 'Entfernung, Winkel › Tor?', art: 'Ja/Nein' },
    { id: 'Bias im Kiosk', text: 'nur Sommerdaten', art: 'Bias' }
  ];
</script>

<section class="galerie">
  <div class="kopf">
    <h1>Neues Projekt</h1>
    <span class="raum"></span>
    <button onclick={onOeffnen}>Projekt öffnen …</button>
  </div>

  {#if weiter}
    <div class="karte weiter">
      <div><div class="label">Weiterarbeiten</div><div>{weiter.szenario ?? 'Leeres Projekt'}{weiter.team ? ' · ' + weiter.team : ''}</div><div class="klein leise">letzter Stand auf diesem Gerät</div></div>
      <button class="haupt" onclick={onWeiter}>Fortsetzen</button>
    </div>
  {/if}

  <div class="module">
    <button class="haupt">Lernen aus Tabellen</button>
    <button disabled>Bilder erkennen · in Arbeit</button>
    <button disabled>Sprachmodell · in Arbeit</button>
  </div>

  <div class="raster">
    {#each szenarien as s}
      <button class="karte szenario" onclick={() => onStart(s.id)}>
        <span class="vorschau" aria-hidden="true"></span>
        <span class="zeile"><strong>{s.id}</strong><span class="marke">{s.art}</span></span>
        <span class="klein leise">{s.text}</span>
      </button>
    {/each}
    <button class="karte szenario leer" onclick={() => onStart(null)}>
      <span class="plus">+</span>
      <strong>Leeres Projekt</strong>
      <span class="klein leise">eigene Tabelle, eigenes Thema</span>
    </button>
  </div>

  <p class="klein leise hinweis">Etappe 0: Die Beispiele sind noch leer. <button class="verweis" onclick={onMachbarkeit}>Machbarkeitstest öffnen</button></p>
</section>

<style>
  .galerie { padding: 24px 32px; max-width: 1180px; width: 100%; margin: 0 auto; }
  .kopf { display: flex; align-items: center; }
  .raum { flex: 1; }
  .weiter { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; margin-top: 16px; }
  .module { display: flex; gap: 10px; margin: 16px 0 20px; flex-wrap: wrap; }
  .raster { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
  .szenario { display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 14px; text-align: left; height: auto; white-space: normal; }
  .vorschau { display: block; height: 110px; border: 1px solid var(--linie); border-radius: var(--radius-knopf); background: var(--hintergrund); }
  .zeile { display: flex; justify-content: space-between; align-items: center; }
  .marke { font-size: 12px; padding: 2px 9px; border-radius: 20px; background: var(--modell-hell); }
  .leer { border-style: dashed; align-items: center; justify-content: center; }
  .plus { font-size: 40px; color: var(--schrift3); }
  .hinweis { margin-top: 20px; }
  .verweis { border: 0; background: none; padding: 0; min-height: 0; text-decoration: underline; color: var(--schrift2); font-size: 13px; }
</style>
