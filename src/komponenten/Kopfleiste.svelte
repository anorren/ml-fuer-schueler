<script lang="ts">
  import type { Stufe } from '../lib/projekt';
  import type { Darstellung } from '../lib/darstellung';
  import Einstellungen from './Einstellungen.svelte';
  import { erklaert, hilfe, schliesseBlase } from '../hilfe/hilfe.svelte';
  import { BEDIENUNG } from '../hilfe/texte';

  interface Props {
    stufe: Stufe;
    gesichert: boolean;
    online: boolean;
    titel: string;
    /** Teamname; undefined blendet das Feld aus (nur in der Arbeitsansicht). */
    team?: string;
    onTeam: (name: string) => void;
    onStufe: (s: Stufe) => void;
    darstellung: Darstellung;
    onDarstellung: (d: Darstellung) => void;
    version: string;
    onOeffnen: () => void;
    onSpeichern: () => void;
    onNeu: () => void;
    onStart: () => void;
  }
  let { stufe, gesichert, online, titel, team, onTeam, onStufe, darstellung, onDarstellung, version, onOeffnen, onSpeichern, onNeu, onStart }: Props = $props();
  let menueOffen = $state(false);

  function hilfeUmschalten() {
    hilfe.modus = !hilfe.modus;
    schliesseBlase();
  }
</script>

<header class="leiste">
  <button class="app" onclick={onStart} aria-label="Zur Startseite" use:erklaert={BEDIENUNG.start}>{titel ? 'ML für Schüler' : 'Machine Learning für Schüler'}</button>
  {#if titel}<span class="leise titel" title={titel}>› {titel}</span>{/if}
  {#if team !== undefined}
    <input
      class="team"
      type="text"
      maxlength="30"
      placeholder="Teamname (Fantasiename)"
      aria-label="Teamname"
      autocomplete="off"
      autocapitalize="words"
      spellcheck="false"
      value={team}
      onchange={(e) => onTeam(e.currentTarget.value)}
      use:erklaert={BEDIENUNG.team}
    />
  {/if}
  <span class="raum"></span>
  {#if !online}<span class="klein leise" title="Die App läuft ohne Internet weiter.">offline</span>{/if}
  <button
    class="einstellungsknopf"
    aria-label="Einstellungen, Stufe {stufe}"
    aria-haspopup="dialog"
    aria-expanded={menueOffen}
    onclick={() => (menueOffen = !menueOffen)}
    use:erklaert={BEDIENUNG.einstellungen}
  ><span class="zahnrad" aria-hidden="true">⚙&#xFE0E;</span> Stufe {stufe}</button>
  <button onclick={onOeffnen} use:erklaert={BEDIENUNG.oeffnen}>Öffnen</button>
  <button class="speichern" onclick={onSpeichern} use:erklaert={BEDIENUNG.speichern}>
    <span>Speichern</span>
    {#if gesichert}<span class="zustand status-gut">✓ gesichert</span>{:else}<span class="zustand leise">nicht gesichert</span>{/if}
  </button>
  <button onclick={onNeu} use:erklaert={BEDIENUNG.neu}>Neu beginnen</button>
  <button class="hilfeknopf" aria-pressed={hilfe.modus} data-hilfe-frei title={BEDIENUNG.hilfe} onclick={hilfeUmschalten}>? Hilfe</button>
</header>
{#if menueOffen}
  <Einstellungen {stufe} {darstellung} {version} {onStufe} {onDarstellung} onSchliessen={() => (menueOffen = false)} />
{/if}
{#if hilfe.modus}
  <div class="hilfeband klein" role="status">
    <span><strong>Hilfe an:</strong> Tippt auf einen Knopf oder ein Feld, und die App erklärt es, statt etwas zu tun.</span>
    <button data-hilfe-frei onclick={hilfeUmschalten}>Hilfe aus</button>
  </div>
{/if}

<style>
  .leiste { display: flex; align-items: center; gap: 12px; padding: 8px 16px; background: var(--flaeche); border-bottom: 1px solid var(--linie); flex-wrap: wrap; }
  .app { border: 0; padding: 0; font-weight: 700; font-size: 16px; background: none; min-height: var(--tippflaeche); }
  /* Der Szenariotitel nimmt den freien Platz und kürzt sich mit „…“, statt die Leiste umbrechen zu lassen. */
  .titel { text-transform: none; flex: 1 1 0; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .titel + .team, .titel ~ .raum { flex: none; }
  .team { font: inherit; font-size: 14px; min-height: 44px; width: 160px; padding: 0 10px; border: 1px solid var(--linie); border-radius: var(--radius-knopf); background: var(--hintergrund); color: var(--schrift); }
  .team:focus { outline: 3px solid var(--modell); outline-offset: 1px; background: var(--flaeche); }
  .raum { flex: 1; }
  .einstellungsknopf { display: inline-flex; align-items: center; gap: 6px; }
  .einstellungsknopf[aria-expanded='true'] { background: var(--modell-hell); border-color: var(--modell-knopf); color: var(--modell-text); }
  .zahnrad { font-size: 20px; line-height: 1; }
  .speichern { display: inline-flex; flex-direction: column; justify-content: center; line-height: 1.15; }
  .zustand { font-size: 12px; }
  /* Hilfe nie in Blau oder Orange (Designentwurf, Hilfe nach unten) */
  .hilfeknopf[aria-pressed='true'] { background: var(--schrift2); border-color: var(--schrift2); color: var(--flaeche); }
  .hilfeband { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 20px; background: var(--hintergrund); border-bottom: 1px solid var(--linie); color: var(--schrift2); }
  .hilfeband button { min-height: 36px; }
</style>
