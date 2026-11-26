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
  // Höhe der Kopfleiste (eine oder zwei Zeilen, mit Hilfeband) für die Höhe der Arbeitsfläche
  let kopfHoehe = $state(61);
  $effect(() => document.documentElement.style.setProperty('--kopf-hoehe', `${kopfHoehe}px`));
  // Sichtbare Fensterhöhe statt 100vh: In Safari ist 100vh höher als der sichtbare Bereich (iPad-Test 26.11.2026).
  let fensterHoehe = $state(0);
  let fussHoehe = $state(37);
  $effect(() => {
    if (fensterHoehe) document.documentElement.style.setProperty('--fenster-hoehe', `${fensterHoehe}px`);
  });
  $effect(() => document.documentElement.style.setProperty('--fuss-hoehe', `${fussHoehe}px`));
  const startstand = zwischen.laden();
  if (startstand) inhaltPruefen(startstand);
  let projekt = $state<Projekt | null>(startstand);
  // Nach dem Neuladen (z. B. Herunterziehen auf dem iPad) bleibt man in der Ansicht, in der man war.
  // sessionStorage gilt nur für diesen Tab: Ein neuer Start der App beginnt wieder auf der Startseite.
  const ANSICHT_SCHLUESSEL = 'mlfs-ansicht';
  const gemerkt = (() => {
    try {
      return sessionStorage.getItem(ANSICHT_SCHLUESSEL);
    } catch {
      return null;
    }
  })();
  let ansicht = $state<Ansicht>(gemerkt === 'machbarkeit' || (gemerkt === 'arbeit' && startstand) ? gemerkt : 'galerie');
  $effect(() => {
    try {
      sessionStorage.setItem(ANSICHT_SCHLUESSEL, ansicht);
    } catch {
      /* privates Surfen: dann eben Startseite */
    }
  });
  let stufe = $state<Stufe>(startstand?.stufe ?? einstellungen.stufeLaden() ?? 1);
  let modulId = $state<ModulId>(startstand?.modul ?? 'tabellen');
  const modul = $derived(modulNach(projekt?.modul ?? modulId));

  /** Bringt den Projektinhalt in eine gültige Form (alte Dateien, fehlende Daten). */
  function inhaltPruefen(p: Projekt) {
    const m = modulNach(p.modul);
    if (m.inhaltHerstellen) p.inhalt = m.inhaltHerstellen(p.inhalt, p.szenario);
  }
  let gesichert = $state(true);
  let ungesichertSeit = $state<number | null>(null);
  let jetzt = $state(Date.now());
  let weggetippt = $state(new Set<string>());
  let werte = $state<Record<string, unknown>>({});
  let meldung = $state<{ text: string; art: 'gut' | 'achtung' | 'info' } | null>(null);
  let updateBereit = $state(false);
  let offlineBereit = $state(false);
  let online = $state(navigator.onLine);
  let dateiwahl: HTMLInputElement;

  const tipp = $derived(aktuellerTipp([...RAHMEN_REGELN, ...modul.regeln], { ungesichertSeit, jetzt, werte }, weggetippt));

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
    const weiter = (e: PointerEvent) => {
      if (meldung && !(e.target as Element | null)?.closest?.('.meldung')) meldung = null;
    };
    addEventListener('pointerdown', weiter, true);
    const uhr = setInterval(() => (jetzt = Date.now()), 30_000);
    return () => {
      aufraeumen();
      removeEventListener('pointerdown', weiter, true);
      clearInterval(uhr);
    };
  });

  function melden(text: string, art: 'gut' | 'achtung' | 'info' = 'info') {
    // Meldungen bleiben stehen, bis man sie wegtippt oder woanders weiterarbeitet (Apple HIG: keine Zeitabläufe).
    meldung = { text, art };
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
    inhaltPruefen(projekt);
    werte = {};
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
      const geladen = await ausDateiLesen(datei);
      inhaltPruefen(geladen);
      projekt = geladen;
      werte = {};
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

<svelte:window bind:innerHeight={fensterHoehe} />

<div class="kopf" bind:clientHeight={kopfHoehe}>
<Kopfleiste
  {stufe}
  {gesichert}
  {online}
  titel={ansicht === 'arbeit' ? ((projekt?.inhalt as { thema?: string } | undefined)?.thema || szenarioTitel(modul, projekt?.szenario ?? null)) : ansicht === 'machbarkeit' ? 'Machbarkeitstest' : ''}
  team={ansicht === 'arbeit' ? (projekt?.team ?? '') : undefined}
  onTeam={teamAendern}
  onStufe={stufeWechseln}
  onOeffnen={() => dateiwahl.click()}
  onSpeichern={speichern}
  onNeu={neuBeginnen}
  onStart={() => (ansicht = 'galerie')}
/>
</div>
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
    {#if projekt}
      <Arbeitsansicht
        bind:inhalt={projekt.inhalt}
        {stufe}
        {modul}
        tipp={tipp?.text ?? null}
        onTippWeg={() => tipp && (weggetippt = new Set([...weggetippt, tipp.id]))}
        onGeaendert={geaendert}
        onWerte={(w) => (werte = w)}
      />
    {/if}
  {:else}
    <Machbarkeit {offlineBereit} {online} onSpeichern={speichern} onOeffnen={() => dateiwahl.click()} />
  {/if}
</main>

<Blase />

{#if meldung}
  <div class="meldung karte" class:gut={meldung.art === 'gut'} class:achtung={meldung.art === 'achtung'} role="status">
    <span>{meldung.text}</span>
    <button class="zu" aria-label="Meldung schließen" data-hilfe-frei onclick={() => (meldung = null)}>✕</button>
  </div>
{/if}
{#if updateBereit}
  <div class="meldung karte" role="status">
    Eine neue Version ist verfügbar.
    <button class="haupt" onclick={() => aktualisieren(true)}>Jetzt aktualisieren</button>
  </div>
{/if}

<footer class="klein leise" bind:clientHeight={fussHoehe}>Machine Learning für Schüler {APP_VERSION} · Herausgegeben von Andreas Norren · <a href="https://andreasnorren.de" target="_blank" rel="noopener">andreasnorren.de</a></footer>

<style>
  main { flex: 1; display: flex; flex-direction: column; }
  .meldung .zu { border: 0; background: none; min-width: 44px; padding: 0; color: var(--schrift2); }
  .meldung { position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom)); transform: translateX(-50%); padding: 12px 16px; display: flex; gap: 12px; align-items: center; z-index: 20; max-width: 90vw; }
  .meldung.gut { border-left: 4px solid var(--status-gut); }
  .meldung.achtung { border-left: 4px solid var(--status-achtung); }
  /* Auf dem Home-Bildschirm nicht unter die Home-Leiste rutschen (Apple HIG: sichere Bereiche) */
  footer { text-align: center; padding: 8px 8px calc(8px + env(safe-area-inset-bottom)); }
  footer a { color: inherit; }
</style>
