<script lang="ts">
  import { MODULE, modul as modulNach, szenarioTitel } from '../lib/module';
  import type { ModulId } from '../lib/projekt';
  import { erklaert } from '../hilfe/hilfe.svelte';
  import { BEDIENUNG } from '../hilfe/texte';

  interface Props {
    modul: ModulId;
    weiter: { team: string; modul: ModulId; szenario: string | null } | null;
    onModul: (id: ModulId) => void;
    onStart: (szenario: string | null) => void;
    onWeiter: () => void;
    onOeffnen: () => void;
    onMachbarkeit: () => void;
  }
  let { modul, weiter, onModul, onStart, onWeiter, onOeffnen, onMachbarkeit }: Props = $props();
  const aktiv = $derived(modulNach(modul));
</script>

<section class="galerie">
  <div class="kopf">
    <h1>Neues Projekt</h1>
    <span class="raum"></span>
    <button onclick={onOeffnen} use:erklaert={BEDIENUNG.oeffnen}>Projekt öffnen …</button>
  </div>

  {#if weiter}
    <div class="karte weiter">
      <div>
        <div class="label">Weiterarbeiten</div>
        <div>{szenarioTitel(modulNach(weiter.modul), weiter.szenario)}{weiter.team ? ' · ' + weiter.team : ''}</div>
        <div class="klein leise">Letzter Stand auf diesem Gerät. Das ist keine Sicherung: Speichert euer Projekt als Datei.</div>
      </div>
      <button class="haupt" onclick={onWeiter} use:erklaert={BEDIENUNG.weiter}>Fortsetzen</button>
    </div>
  {/if}

  <div class="module" role="tablist" aria-label="Themenbereiche">
    {#each MODULE as m}
      <button role="tab" aria-selected={m.id === modul} class:an={m.id === modul} disabled={!m.bereit} onclick={() => onModul(m.id)} use:erklaert={BEDIENUNG.modul}>
        <span class="name">{m.name}{#if !m.bereit}<span class="klein leise">&nbsp;· in Arbeit</span>{/if}</span>
        <span class="lehrplan">{m.lehrplan}</span>
      </button>
    {/each}
  </div>

  <div class="raster" role="tabpanel" aria-label={aktiv.name}>
    {#each aktiv.szenarien as s}
      <button class="karte szenario" onclick={() => onStart(s.id)} title="Beispiel {s.titel} öffnen">
        <span class="vorschau" aria-hidden="true"></span>
        <span class="zeile"><strong>{s.titel}</strong><span class="marke">{s.art}</span></span>
        <span class="klein leise">{s.text}</span>
      </button>
    {/each}
    <button class="karte szenario leer" onclick={() => onStart(null)} use:erklaert={BEDIENUNG.leer}>
      <span class="plus" aria-hidden="true">+</span>
      <strong>Leeres Projekt</strong>
      <span class="klein leise">eigene Tabelle, eigenes Thema</span>
    </button>
  </div>

  <p class="klein leise hinweis">Die Beispiele werden gerade gebaut. <button class="verweis" onclick={onMachbarkeit}>Machbarkeitstest öffnen</button></p>
</section>

<style>
  .galerie { padding: 24px 32px; max-width: 1180px; width: 100%; margin: 0 auto; }
  .kopf { display: flex; align-items: center; }
  .raum { flex: 1; }
  .weiter { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; margin-top: 16px; }
  .module { display: flex; gap: 10px; margin: 16px 0 20px; flex-wrap: wrap; }
  .module button { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 1px; padding: 6px 14px; text-align: left; }
  .module button.an { background: var(--modell); border-color: var(--modell); color: #fff; }
  .module button:disabled { opacity: 0.6; }
  .name { font-weight: 600; }
  .lehrplan { font-size: 12px; opacity: 0.85; }
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
