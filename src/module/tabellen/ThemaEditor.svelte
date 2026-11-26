<script lang="ts">
  import { erklaert } from '../../hilfe/hilfe.svelte';
  import { personenbezug, pruefen, VORLAGEN, type ThemaEntwurf } from './thema';

  // Eigenes Thema anlegen oder ändern (FR-13): Vorlage wählen oder Spalten selbst benennen, Zahl oder Klasse.
  interface Props {
    start: ThemaEntwurf;
    /** Beim Ändern eines angelegten Themas; beim ersten Anlegen gibt es kein Zurück. */
    aendern: boolean;
    /** Wie das Projekt bisher aufgebaut ist, um vor dem Löschen der Daten zu warnen. */
    bisher: { art: 'zahl' | 'klasse'; eingaben: number; zeilen: number };
    onFertig: (e: ThemaEntwurf) => void;
    onAbbrechen: () => void;
  }
  let { start, aendern, bisher, onFertig, onAbbrechen }: Props = $props();

  // svelte-ignore state_referenced_locally
  let e = $state<ThemaEntwurf>($state.snapshot(start) as ThemaEntwurf);
  let versucht = $state(false);
  const fehler = $derived(pruefen(e));
  const datenschutz = $derived(personenbezug([...e.merkmale.map((m) => m.name), e.ziel.name]));
  const datenWeg = $derived(aendern && bisher.zeilen > 0 && (bisher.art !== e.art || bisher.eingaben !== e.merkmale.length));

  function vorlage(name: string) {
    e = structuredClone(VORLAGEN[name]);
  }
  function zweite(an: boolean) {
    if (an) e.merkmale.push({ name: '', einheit: '', min: '', max: '' });
    else e.merkmale = e.merkmale.slice(0, 1);
  }
  function anlegen() {
    versucht = true;
    if (!fehler.length) onFertig($state.snapshot(e) as ThemaEntwurf);
  }
</script>

<form class="thema karte" aria-label="Eigenes Thema" onsubmit={(ev) => (ev.preventDefault(), anlegen())}>
  <div class="kopf">
    <h2>{aendern ? 'Thema ändern' : 'Eigenes Thema anlegen'}</h2>
    {#if aendern}<button type="button" class="schliessen" aria-label="Thema ändern abbrechen" onclick={onAbbrechen}>✕</button>{/if}
  </div>

  <div class="zeile">
    <span class="klein leise">Vorlage:</span>
    {#each Object.keys(VORLAGEN) as v}
      <button type="button" onclick={() => vorlage(v)} use:erklaert={'Füllt die Felder mit einem Experiment ohne Daten über Personen. Die Messwerte tragt ihr selbst ein.'}>{v}</button>
    {/each}
  </div>

  <label class="feld breit">Name des Themas <input bind:value={e.thema} placeholder="z. B. Unsere Murmelbahn" maxlength="40" /></label>

  <fieldset>
    <legend>Was soll das Modell vorhersagen?</legend>
    <div class="wahl" role="group" aria-label="Art der Vorhersage">
      <button type="button" aria-pressed={e.art === 'zahl'} onclick={() => (e.art = 'zahl')}>eine Zahl</button>
      <button type="button" aria-pressed={e.art === 'klasse'} onclick={() => (e.art = 'klasse')}>eine von zwei Antworten</button>
    </div>
  </fieldset>

  {#each e.merkmale as m, k}
    <fieldset>
      <legend>{e.merkmale.length > 1 ? `Eingabe ${k + 1}` : 'Eingabe'} <span class="leise">(was ihr messt oder einstellt)</span></legend>
      <div class="spalte">
        <label class="feld">Name <input bind:value={m.name} placeholder={k ? 'z. B. Bewölkung' : 'z. B. Rampenhöhe'} maxlength="30" /></label>
        <label class="feld kurz">Einheit <input bind:value={m.einheit} placeholder="cm" maxlength="12" /></label>
        <label class="feld kurz">von <input bind:value={m.min} inputmode="decimal" placeholder="0" /></label>
        <label class="feld kurz">bis <input bind:value={m.max} inputmode="decimal" placeholder="50" /></label>
      </div>
    </fieldset>
  {/each}
  <div class="zeile">
    {#if e.merkmale.length === 1}
      <button type="button" onclick={() => zweite(true)}>+ zweite Eingabe</button>
    {:else}
      <button type="button" onclick={() => zweite(false)}>Zweite Eingabe entfernen</button>
    {/if}
  </div>

  <fieldset>
    <legend>Ergebnis <span class="leise">(was das Modell vorhersagen soll)</span></legend>
    {#if e.art === 'zahl'}
      <div class="spalte">
        <label class="feld">Name <input bind:value={e.ziel.name} placeholder="z. B. Rollweite" maxlength="30" /></label>
        <label class="feld kurz">Einheit <input bind:value={e.ziel.einheit} placeholder="cm" maxlength="12" /></label>
        <label class="feld kurz">von <input bind:value={e.ziel.min} inputmode="decimal" placeholder="0" /></label>
        <label class="feld kurz">bis <input bind:value={e.ziel.max} inputmode="decimal" placeholder="300" /></label>
      </div>
    {:else}
      <div class="spalte">
        <label class="feld">Frage <input bind:value={e.ziel.name} placeholder="z. B. Regen am Nachmittag" maxlength="30" /></label>
        <label class="feld">Antwort A <input bind:value={e.klassen[1]} placeholder="z. B. Regen" maxlength="20" /></label>
        <label class="feld">Antwort B <input bind:value={e.klassen[0]} placeholder="z. B. kein Regen" maxlength="20" /></label>
      </div>
    {/if}
  </fieldset>

  {#if datenschutz.length}
    <p class="hinweis" role="status">
      <strong>Datenschutz:</strong> „{datenschutz[0]}“ klingt nach Daten über Personen. Sammelt lieber Messwerte über Dinge, etwa Papierflieger oder Murmeln, und schreibt keine echten Namen auf.
    </p>
  {/if}
  {#if datenWeg}
    <p class="hinweis" role="status">Ihr ändert die Zahl der Eingaben oder die Art der Vorhersage. Die bisherigen {bisher.zeilen} Zeilen werden dabei gelöscht.</p>
  {/if}
  {#if versucht && fehler.length}
    <ul class="fehlerliste" role="alert">
      {#each fehler as f}<li>{f}</li>{/each}
    </ul>
  {/if}

  <div class="zeile fuss">
    <span class="klein leise">Danach tragt ihr eure Messwerte in die Tabelle ein oder tippt sie ins Diagramm.</span>
    <span class="raum"></span>
    {#if aendern}<button type="button" onclick={onAbbrechen}>Abbrechen</button>{/if}
    <button type="submit" class="haupt">{aendern ? 'Übernehmen' : 'Thema anlegen'}</button>
  </div>
</form>

<style>
  .thema { display: flex; flex-direction: column; gap: 12px; width: min(720px, 100%); padding: 18px 22px; }
  .kopf { display: flex; align-items: center; justify-content: space-between; }
  h2 { margin: 0; font-size: 20px; }
  .schliessen { min-width: 40px; padding: 0; border: 0; background: none; }
  fieldset { border: 1px solid var(--linie); border-radius: var(--radius-knopf); padding: 8px 12px 12px; margin: 0; }
  legend { font-weight: 600; padding: 0 4px; }
  .zeile { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .raum { flex: 1; }
  .spalte { display: flex; gap: 12px; flex-wrap: wrap; }
  .feld { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--schrift2); flex: 1; min-width: 150px; }
  .feld.kurz { flex: 0 0 90px; min-width: 0; }
  .feld.breit input { max-width: 360px; }
  .feld input { font: inherit; font-size: 16px; color: var(--schrift); min-height: 40px; padding: 0 10px; border: 1px solid var(--linie); border-radius: var(--radius-knopf); background: var(--flaeche); }
  .feld input:focus { outline: 3px solid var(--modell); outline-offset: 1px; }
  .wahl { display: flex; gap: 12px; }
  .wahl button { flex: 1; }
  .wahl button[aria-pressed='true'] { background: var(--modell-knopf); border-color: var(--modell-knopf); color: #fff; }
  .hinweis { margin: 0; padding: 10px 12px; border-radius: var(--radius-knopf); background: var(--hintergrund); border-left: 4px solid var(--schrift2); }
  .fehlerliste { margin: 0; padding: 8px 12px 8px 30px; list-style: disc; border-radius: var(--radius-knopf); background: var(--hintergrund); border-left: 4px solid var(--status-achtung); color: var(--schrift); }
  .fuss { border-top: 1px solid var(--linie); padding-top: 12px; }
</style>
