<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { AnsichtProps, LeistenEintrag } from '../../lib/module';
  import { leisteFuer } from '../../lib/module';
  import Leiste from '../../komponenten/Leiste.svelte';
  import InfoKarte from '../../hilfe/InfoKarte.svelte';
  import Tipp from '../../hilfe/Tipp.svelte';
  import Begriff from '../../hilfe/Begriff.svelte';
  import { erklaert } from '../../hilfe/hilfe.svelte';
  import { BEDIENUNG } from '../../hilfe/texte';
  import Diagramm from './Diagramm.svelte';
  import FehlerAnzeige from './FehlerAnzeige.svelte';
  import DatenTabelle from './DatenTabelle.svelte';
  import type { TabellenInhalt } from './typen';
  import { fehler, lernschritt, punkteNorm, trainingFertig, verlaufErgaenzen, vorhersage, zahl } from './rechnen';

  // Modul „Lernen aus Tabellen“: Leinwand mit Diagramm, Karten und Training (FR-11, FR-12, FR-16, FR-19, FR-20, FR-22).
  let { stufe, modul, inhalt = $bindable(), tipp, onTippWeg, onGeaendert, onWerte }: AnsichtProps = $props();
  const i = $derived(inhalt as unknown as TabellenInhalt);

  const leiste = $derived(leisteFuer(modul, stufe));
  let offenId = $state<LeistenEintrag['id'] | null>(null);
  const offen = $derived(leiste.find((e) => e.id === offenId) ?? null);
  let tabelle = $state(false);
  const tabelleSichtbar = $derived(tabelle && stufe >= 2);
  let auswahl = $state<number | null>(null);
  const gewaehlt = $derived(i.zeilen.find((z) => z.id === auswahl) ?? null);
  let laeuft = $state(false);
  let rahmen = 0;
  let laufSchritte = 0;

  const anzahlTraining = $derived(i.zeilen.filter((z) => !z.test).length);
  const fehlerTraining = $derived(fehler(i));
  const fehlerTest = $derived(fehler(i, true));
  const einheitWort = $derived(i.ziel.wort ?? i.ziel.einheit);
  const frageWert = $derived(i.frage ? vorhersage(i, i.frage) : null);

  $effect(() => onWerte({ verlauf: [...i.verlauf] }));

  function schritt(): boolean {
    const p = punkteNorm(i);
    if (!p.length) return false;
    const s = lernschritt(i.modell, p, i.lernrate);
    const spanne = i.ziel.max - i.ziel.min;
    if (!i.verlauf.length) i.verlauf = verlaufErgaenzen(i.verlauf, Math.sqrt(s.kostenVorher) * spanne);
    i.modell = s.nachher;
    i.schritte += 1;
    i.verlauf = verlaufErgaenzen(i.verlauf, Math.sqrt(s.kostenNachher) * spanne);
    return Number.isFinite(s.kostenNachher) && s.kostenNachher < 1e6;
  }

  function einLernschritt() {
    anhalten();
    schritt();
    onGeaendert();
  }

  function bild() {
    for (let k = 0; k < 2; k++) {
      laufSchritte += 1;
      if (!schritt() || trainingFertig(i.verlauf) || laufSchritte >= 800) return anhalten();
    }
    rahmen = requestAnimationFrame(bild);
  }

  function trainieren() {
    if (laeuft) return anhalten();
    laeuft = true;
    laufSchritte = 0;
    rahmen = requestAnimationFrame(bild);
  }

  function anhalten() {
    if (!laeuft) return;
    cancelAnimationFrame(rahmen);
    laeuft = false;
    onGeaendert();
  }

  function vonVorn() {
    anhalten();
    i.modell = { art: 'gerade', w: i.merkmale.map(() => 0), b: 0 };
    i.schritte = 0;
    i.verlauf = [];
    onGeaendert();
  }

  function verschieben(id: number, x: number, y: number, fertig: boolean) {
    const z = i.zeilen.find((z) => z.id === id);
    if (!z) return;
    z.x[0] = x;
    z.y = y;
    auswahl = id;
    if (fertig) onGeaendert();
  }

  function neuerPunkt(x: number, y: number) {
    const id = i.naechsteId++;
    i.zeilen.push({ id, x: [x], y, test: false });
    auswahl = id;
    onGeaendert();
  }

  function loeschen(id: number) {
    i.zeilen = i.zeilen.filter((z) => z.id !== id);
    auswahl = null;
    onGeaendert();
  }

  function testUmschalten(id: number) {
    const z = i.zeilen.find((z) => z.id === id);
    if (!z) return;
    z.test = !z.test;
    onGeaendert();
  }

  function frageSetzen(x: number) {
    i.frage = [x];
    onGeaendert();
  }

  function frageEingabe(text: string) {
    const v = Number(text.replace(',', '.').trim());
    if (text.trim() === '' || !Number.isFinite(v)) return;
    const m = i.merkmale[0];
    frageSetzen(Math.min(Math.max(v, m.min), m.max));
  }

  onDestroy(() => cancelAnimationFrame(rahmen));
</script>

<section class="leinwand">
  <div class="diagramm karte">
    <div class="plot">
      <Diagramm
        {i}
        modus={offenId === 'daten' ? 'daten' : offenId === 'vorhersage' ? 'vorhersage' : null}
        {auswahl}
        abstaende={offenId === 'training' || laeuft}
        onAuswahl={(id) => (auswahl = id)}
        onVerschieben={verschieben}
        onNeu={neuerPunkt}
        onFrage={frageSetzen}
      />
    </div>
    <div class="legende klein">
      <span><i class="kreis"></i>Trainingsdaten</span>
      <span><i class="quadrat"></i>Testdaten</span>
      <span><i class="strich"></i>Modell</span>
      {#if i.frage}<span><i class="raute"></i>Vorhersage</span>{/if}
      {#if i.erfunden}<span class="leise">Beispieldaten, erfunden</span>{/if}
    </div>
    <FehlerAnzeige wert={fehlerTraining} verlauf={i.verlauf} einheit={einheitWort} />
    {#if tipp}<Tipp text={tipp} onWeg={onTippWeg} />{/if}
  </div>

  {#if tabelleSichtbar}
    <aside class="karte seitentabelle" aria-label="Tabelle">
      <DatenTabelle {i} {auswahl} onAuswahl={(id) => (auswahl = id)} onAendern={onGeaendert} />
    </aside>
  {/if}

  {#if offen}
    <div class="schublade">
      <InfoKarte titel={offen.name} info={offen.info} frage={offen.id === 'vorhersage'} onSchliessen={() => (offenId = null)}>
        {#if offen.id === 'daten'}
          <p class="klein leise">Tippt ins Diagramm, um einen Punkt zu setzen. Zieht einen Punkt, um ihn zu verschieben, oder tippt ihn an, um ihn auszuwählen.</p>
          {#if gewaehlt}
            <div class="zeile">
              <span>Ausgewählt: <strong>{zahl(gewaehlt.x[0], i.merkmale[0].stellen)} {i.merkmale[0].einheit} · {zahl(gewaehlt.y, i.ziel.stellen)} {einheitWort}</strong></span>
              <span class="raum"></span>
              <button onclick={() => testUmschalten(gewaehlt.id)}>{gewaehlt.test ? 'Zu Trainingsdaten' : 'Zu Testdaten'}</button>
              <button onclick={() => loeschen(gewaehlt.id)}>Löschen</button>
            </div>
          {/if}
          {#if !tabelleSichtbar}
            <div class="tabellenbox"><DatenTabelle {i} {auswahl} onAuswahl={(id) => (auswahl = id)} onAendern={onGeaendert} /></div>
          {/if}
        {:else if offen.id === 'modell'}
          <p>Das <Begriff id="modell" /> ist eine Gerade. Beim Training sucht die App die Gerade, die am besten zu den <Begriff id="trainingsdaten" /> passt.</p>
          {#if stufe >= 2}<p class="klein leise">S-Kurve und Netz zum Auswählen kommen mit der nächsten Version.</p>{/if}
        {:else if offen.id === 'training'}
          <div class="zeile">
            <button onclick={einLernschritt} disabled={!anzahlTraining} use:erklaert={'Macht genau einen Lernschritt: Die Gerade rückt ein Stück näher an die Punkte.'}>Ein Lernschritt</button>
            <button onclick={vonVorn} use:erklaert={'Setzt das Modell zurück, als hätte es noch nichts gelernt.'}>Von vorn</button>
            <span class="raum"></span>
            <span class="klein leise">Lernschritte: <strong class="zahl">{i.schritte}</strong></span>
          </div>
          <p class="klein leise">Die gestrichelten Linien zeigen, wie weit jeder Punkt vom Modell entfernt ist. Beim Training werden sie kürzer.</p>
        {:else if offen.id === 'vorhersage'}
          <div class="zeile frage">
            <label for="frage">{i.merkmale[0].name}</label>
            <input id="frage" inputmode="decimal" placeholder="z. B. {zahl((i.merkmale[0].min + i.merkmale[0].max) / 2 + 3, 0)}" value={i.frage ? zahl(i.frage[0], i.merkmale[0].stellen, false) : ''} onchange={(e) => frageEingabe(e.currentTarget.value)} />
            <span class="leise">{i.merkmale[0].einheit} ›</span>
            {#if frageWert !== null}<strong class="antwort">etwa {zahl(frageWert, i.ziel.stellen)} {einheitWort}</strong>{/if}
          </div>
          {#if !i.frage}<p class="klein leise">Gebt einen Wert ein oder tippt ins Diagramm.</p>{/if}
          {#if i.schritte === 0}
            <p class="klein leise">Das Modell hat noch nicht gelernt. Trainiert es zuerst, sonst rät es nur.</p>
          {:else if fehlerTest !== null}
            <p class="klein leise"><Begriff id="testdaten" text="Testdaten" /> zeigen, ob das Modell auch bei Fällen stimmt, die es nicht gelernt hat: Dort liegt es im Mittel {zahl(fehlerTest, 1)} {einheitWort} daneben.</p>
          {/if}
        {:else}
          <p class="klein leise">Die 3D-Ansicht braucht zwei Eingaben. Sie kommt mit dem Beispiel Torschuss.</p>
        {/if}
      </InfoKarte>
    </div>
  {/if}

  <Leiste eintraege={leiste} offen={offenId} onWahl={(id) => (offenId = offenId === id ? null : id)}>
    {#if stufe >= 2}
      <button aria-pressed={tabelle} onclick={() => (tabelle = !tabelle)} use:erklaert={BEDIENUNG.tabelle}>Tabelle</button>
    {/if}
    <button class="haupt trainieren" onclick={trainieren} disabled={!anzahlTraining} use:erklaert={BEDIENUNG.trainieren}>{laeuft ? 'Anhalten ❚❚' : 'Trainieren ▶'}</button>
  </Leiste>
</section>

<style>
  .leinwand { position: relative; flex: none; padding: 12px 16px 96px; display: flex; gap: 12px; height: calc(100vh - 100px); min-height: 520px; }
  .diagramm { position: relative; flex: 1; min-width: 0; }
  .plot { position: absolute; inset: 8px 8px 4px; }
  .legende { position: absolute; top: 14px; left: 92px; display: flex; gap: 14px; align-items: center; padding: 6px 12px; background: var(--flaeche); border: 1px solid var(--linie); border-radius: var(--radius-knopf); pointer-events: none; flex-wrap: wrap; max-width: calc(100% - 400px); }
  .legende span { display: inline-flex; align-items: center; gap: 6px; }
  .legende i { display: inline-block; }
  .kreis { width: 11px; height: 11px; border: 2px solid var(--schrift); border-radius: 50%; }
  .quadrat { width: 11px; height: 11px; border: 2px solid var(--frage); }
  .strich { width: 16px; height: 3px; background: var(--modell); border-radius: 2px; }
  .raute { width: 9px; height: 9px; background: var(--frage); transform: rotate(45deg); }
  .seitentabelle { width: 320px; padding: 10px 12px; overflow: auto; }
  .schublade { position: absolute; left: 50%; bottom: 92px; transform: translateX(-50%); width: min(480px, 92vw); z-index: 10; }
  .schublade p { margin: 0; }
  .zeile { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .raum { flex: 1; }
  .tabellenbox { max-height: 230px; overflow: auto; }
  .frage input { font: inherit; width: 90px; min-height: 40px; padding: 0 10px; border: 1px solid var(--linie); border-radius: var(--radius-knopf); }
  .frage input:focus { outline: 3px solid var(--frage); outline-offset: 1px; }
  .antwort { color: var(--frage-text); font-size: 22px; }
  .zahl { font-variant-numeric: tabular-nums; color: var(--schrift); }
  .trainieren { min-width: 140px; }
</style>
