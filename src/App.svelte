<script lang="ts">
  import { onMount } from 'svelte';
  import { registerSW } from 'virtual:pwa-register';
  import Kopfleiste from './komponenten/Kopfleiste.svelte';
  import Galerie from './komponenten/Galerie.svelte';
  import Arbeitsansicht from './komponenten/Arbeitsansicht.svelte';
  import Machbarkeit from './komponenten/Machbarkeit.svelte';
  import Blase from './hilfe/Blase.svelte';
  import { hilfeEinrichten } from './hilfe/hilfe.svelte';
  import { aktuellerTipp, RAHMEN_REGELN } from './hilfe/tipps';
  import { ausDateiLesen, neuesProjekt, ProjektFehler, speichernAlsDatei, type ModulId, type Projekt, type Stufe } from './lib/projekt';
  import { modul as modulNach, szenarioTitel } from './lib/module';
  import * as zwischen from './lib/zwischenspeicher';
  import * as einstellungen from './lib/einstellungen';

  const APP_VERSION = __APP_VERSION__;

  type Ansicht = 'galerie' | 'arbeit' | 'machbarkeit';
  let ansicht = $state<Ansicht>('galerie');
  const startstand = zwischen.laden();
  let projekt = $state<Projekt | null>(startstand);
  let stufe = $state<Stufe>(startstand?.stufe ?? einstellungen.stufeLaden() ?? 1);
  let modulId = $state<ModulId>(startstand?.modul ?? 'tabellen');
  const modul = $derived(modulNach(projekt?.modul ?? modulId));
  let gesichert = $state(true);
  let ungesichertSeit = $state<number | null>(null);
  let jetzt = $state(Date.now());
  let weggetippt = $state(new Set<string>());
  let meldung = $state<{ text: string; art: 'gut' | 'achtung' | 'info' } | null>(null);
  let updateBereit = $state(false);
  let offlineBereit = $state(false);
  let online = $state(navigator.onLine);
  let dateiwahl: HTMLInputElement;

  const tipp = $derived(aktuellerTipp([...RAHMEN_REGELN, ...modul.regeln], { ungesichertSeit, jetzt }, weggetippt));

  const aktualisieren = registerSW({
    onNeedRefresh: () => (updateBereit = true),
    onOfflineReady: () => (offlineBereit = true)
  });

  addEventListener('online', () => (online = true));
  addEventListener('offline', () => (online = false));
  // Projekte auch bei geteilten Geräten möglichst lange halten (Safari kann sonst Daten löschen)
  navigator.storage?.persist?.().catch(() => {});

  onMount(() => {
    const aufraeumen = hilfeEinrichten();
    const uhr = setInterval(() => (jetzt = Date.now()), 30_000);
    return () => {
      aufraeumen();
      clearInterval(uhr);
    };
  });

  function melden(text: string, art: 'gut' | 'achtung' | 'info' = 'info') {
    meldung = { text, art };
    setTimeout(() => (meldung = null), 4500);
  }

  function alsGesichert() {
    gesichert = true;
    ungesichertSeit = null;
  }

  function geaendert() {
    if (!projekt) return;
    projekt.stufe = stufe;
    zwischen.merken(projekt);
    gesichert = false;
    ungesichertSeit ??= Date.now();
  }

  function stufeWechseln(s: Stufe) {
    stufe = s;
    einstellungen.stufeMerken(s);
    geaendert();
  }

  function teamAendern(name: string) {
    if (!projekt) return;
    projekt.team = name.trim().slice(0, 30);
    geaendert();
  }

  function starten(szenario: string | null) {
    projekt = neuesProjekt(APP_VERSION, '', modulId, stufe);
    projekt.szenario = szenario;
    geaendert();
    ansicht = 'arbeit';
  }

  async function speichern() {
    if (!projekt) projekt = neuesProjekt(APP_VERSION, '', modulId, stufe);
    const r = await speichernAlsDatei(projekt);
    if (r === 'abgebrochen') return melden('Speichern abgebrochen. Das Projekt ist noch nicht gesichert.', 'achtung');
    alsGesichert();
    melden(r === 'geteilt' ? 'Projektdatei weitergegeben. Legt sie im Ordner eures Teams ab.' : 'Projektdatei gespeichert (Downloads).', 'gut');
  }

  async function oeffnenGewaehlt(e: Event) {
    const datei = (e.currentTarget as HTMLInputElement).files?.[0];
    (e.currentTarget as HTMLInputElement).value = '';
    if (!datei) return;
    try {
      projekt = await ausDateiLesen(datei);
      stufe = projekt.stufe;
      einstellungen.stufeMerken(stufe);
      modulId = projekt.modul;
      zwischen.merken(projekt);
      alsGesichert();
      ansicht = 'arbeit';
      melden('Projekt geöffnet.', 'gut');
    } catch (f) {
      melden(f instanceof ProjektFehler ? f.message : 'Die Datei ließ sich nicht öffnen.', 'achtung');
    }
  }

  function neuBeginnen() {
    if (projekt && !gesichert && !confirm('Das Projekt ist noch nicht gesichert. Trotzdem neu beginnen?')) return;
    zwischen.vergessen();
    projekt = null;
    stufe = 1;
    einstellungen.stufeMerken(1);
    modulId = 'tabellen';
    weggetippt = new Set();
    alsGesichert();
    ansicht = 'galerie';
  }
</script>

<Kopfleiste
  {stufe}
  {gesichert}
  {online}
  titel={ansicht === 'arbeit' ? szenarioTitel(modul, projekt?.szenario ?? null) : ansicht === 'machbarkeit' ? 'Machbarkeitstest' : ''}
  team={ansicht === 'arbeit' ? (projekt?.team ?? '') : undefined}
  onTeam={teamAendern}
  onStufe={stufeWechseln}
  onOeffnen={() => dateiwahl.click()}
  onSpeichern={speichern}
  onNeu={neuBeginnen}
  onStart={() => (ansicht = 'galerie')}
/>
<input bind:this={dateiwahl} type="file" accept=".json,application/json" hidden onchange={oeffnenGewaehlt} />

<main>
  {#if ansicht === 'galerie'}
    <Galerie
      modul={modulId}
      weiter={projekt ? { team: projekt.team, modul: projekt.modul, szenario: projekt.szenario } : null}
      onModul={(id) => (modulId = id)}
      onStart={starten}
      onWeiter={() => (ansicht = 'arbeit')}
      onOeffnen={() => dateiwahl.click()}
      onMachbarkeit={() => (ansicht = 'machbarkeit')}
    />
  {:else if ansicht === 'arbeit'}
    <Arbeitsansicht {stufe} {modul} tipp={tipp?.text ?? null} onTippWeg={() => tipp && (weggetippt = new Set([...weggetippt, tipp.id]))} />
  {:else}
    <Machbarkeit {offlineBereit} {online} onSpeichern={speichern} onOeffnen={() => dateiwahl.click()} />
  {/if}
</main>

<Blase />

{#if meldung}
  <div class="meldung karte" class:gut={meldung.art === 'gut'} class:achtung={meldung.art === 'achtung'} role="status">{meldung.text}</div>
{/if}
{#if updateBereit}
  <div class="meldung karte" role="status">
    Eine neue Version ist verfügbar.
    <button class="haupt" onclick={() => aktualisieren(true)}>Jetzt aktualisieren</button>
  </div>
{/if}

<footer class="klein leise">Machine Learning für Schüler {APP_VERSION} · Herausgegeben von Andreas Norren · <a href="https://andreasnorren.de" target="_blank" rel="noopener">andreasnorren.de</a></footer>

<style>
  main { flex: 1; display: flex; flex-direction: column; }
  .meldung { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); padding: 12px 16px; display: flex; gap: 12px; align-items: center; z-index: 20; max-width: 90vw; }
  .meldung.gut { border-left: 4px solid var(--status-gut); }
  .meldung.achtung { border-left: 4px solid var(--status-achtung); }
  footer { text-align: center; padding: 8px; }
  footer a { color: inherit; }
</style>
