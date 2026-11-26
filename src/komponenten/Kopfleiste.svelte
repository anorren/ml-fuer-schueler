<script lang="ts">
  import type { Stufe } from '../lib/projekt';
  import type { Darstellung } from '../lib/darstellung';
  import Einstellungen from './Einstellungen.svelte';
  // Symbole von Lucide (ISC-Lizenz), offline mitgeliefert; Apples SF Symbols sind für Web-Apps nicht freigegeben
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Save from '@lucide/svelte/icons/save';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Settings from '@lucide/svelte/icons/settings';
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
  <!-- Stufe nur als Anzeige; gewechselt wird in den Einstellungen (DEC-16) -->
  <span class="stufe-anzeige" use:erklaert={BEDIENUNG.stufeAnzeige}>Stufe {stufe}</span>
  <button class="symbol" aria-label="Öffnen" title="Öffnen" onclick={onOeffnen} use:erklaert={BEDIENUNG.oeffnen}><FolderOpen size={22} aria-hidden="true" /></button>
  <button class="speichern" aria-label={gesichert ? 'Speichern, gesichert' : 'Speichern, nicht gesichert'} title={gesichert ? 'gesichert' : 'nicht gesichert'} onclick={onSpeichern} use:erklaert={BEDIENUNG.speichern}>
    <span class="mitpunkt" aria-hidden="true">
      <Save size={22} />
      <span class="punkt" class:gut={gesichert}>{gesichert ? '✓' : ''}</span>
    </span>
    <span class="wort">Speichern</span>
  </button>
  <button class="symbol" aria-label="Neu beginnen" title="Neu beginnen" onclick={onNeu} use:erklaert={BEDIENUNG.neu}><RotateCcw size={22} aria-hidden="true" /></button>
  <button class="hilfeknopf" aria-pressed={hilfe.modus} data-hilfe-frei title={BEDIENUNG.hilfe} onclick={hilfeUmschalten}>Hilfe</button>
  <button
    class="symbol einstellungsknopf"
    aria-label="Einstellungen"
    title="Einstellungen"
    aria-haspopup="dialog"
    aria-expanded={menueOffen}
    onclick={() => (menueOffen = !menueOffen)}
    use:erklaert={BEDIENUNG.einstellungen}
  ><Settings size={22} aria-hidden="true" /></button>
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
  /* Stufe als ruhige Anzeige, nicht antippbar */
  .stufe-anzeige { display: inline-flex; align-items: center; min-height: 32px; padding: 0 12px; border-radius: 16px; background: var(--hintergrund); border: 1px solid var(--linie); font-size: 14px; font-weight: 600; color: var(--schrift2); white-space: nowrap; }
  .symbol { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; padding: 0 10px; }
  .einstellungsknopf[aria-expanded='true'] { background: var(--modell-hell); border-color: var(--modell-knopf); color: var(--modell-text); }
  .speichern { display: inline-flex; align-items: center; gap: 8px; }
  .mitpunkt { position: relative; display: inline-flex; }
  /* Zustand am Symbol: grün mit Haken = gesichert, grauer Punkt = noch nicht gesichert */
  .punkt { position: absolute; right: -6px; bottom: -5px; width: 14px; height: 14px; border-radius: 50%; background: var(--schrift3); border: 2px solid var(--flaeche); font-size: 9px; line-height: 10px; text-align: center; color: #fff; font-weight: 700; }
  .punkt.gut { background: var(--status-gut); }
  @media (max-width: 900px) { .speichern .wort { display: none; } }
  /* Hilfe nie in Blau oder Orange (Designentwurf, Hilfe nach unten) */
  .hilfeknopf[aria-pressed='true'] { background: var(--schrift2); border-color: var(--schrift2); color: var(--flaeche); }
  .hilfeband { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 20px; background: var(--hintergrund); border-bottom: 1px solid var(--linie); color: var(--schrift2); }
  .hilfeband button { min-height: 36px; }
</style>
