<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { AnsichtProps, LeistenEintrag } from '../../lib/module';
  import { leisteFuer } from '../../lib/module';
  import Bereiche from '../../komponenten/Bereiche.svelte';
  import Tipp from '../../hilfe/Tipp.svelte';
  import Begriff from '../../hilfe/Begriff.svelte';
  import { erklaert } from '../../hilfe/hilfe.svelte';
  import { BEDIENUNG } from '../../hilfe/texte';
  import Diagramm from './Diagramm.svelte';
  import FehlerAnzeige from './FehlerAnzeige.svelte';
  import DatenTabelle from './DatenTabelle.svelte';
  import NetzBild from './NetzBild.svelte';
  import Draufsicht from './Draufsicht.svelte';
  import Ansicht3D from './Ansicht3D.svelte';
  import ThemaEditor from './ThemaEditor.svelte';
  import { entwurfAus, themaAnwenden, type ThemaEntwurf } from './thema';
  import type { ModellArt, TabellenInhalt } from './typen';
  import {
    falschEingeordnet,
    fehler,
    geradeEcht,
    linearEcht,
    klassenbereiche,
    kosten,
    lesen,
    ausserhalbDerDaten,
    LERNRATE_STANDARD,
    lernschritt,
    mitKreuzentropie,
    modellNeu,
    NEURONEN_HOECHSTENS,
    NEURONEN_STANDARD,
    punkteNorm,
    trainingFertig,
    verlaufErgaenzen,
    vorhersage,
    wahrscheinlichkeit,
    zahl,
    type Lernschritt
  } from './rechnen';

  // Modul „Lernen aus Tabellen“: Leinwand mit Diagramm, Karten und Training (FR-11 bis FR-20, FR-22).
  let { stufe, modul, inhalt = $bindable(), tipp, onTippWeg, onGeaendert, onWerte }: AnsichtProps = $props();
  const i = $derived(inhalt as unknown as TabellenInhalt);

  // Bereiche rechts (BK-D, DEC-14): Daten, Modell, Training, Vorhersage; „3D“ ist ein Reiter über der Darstellung (FR-21).
  const leiste = $derived(leisteFuer(modul, stufe).filter((e) => e.id !== '3d'));
  let offenId = $state<LeistenEintrag['id'] | null>(null);
  let dreiD = $state(false);
  // „Vergrößern“ blendet die Bereiche aus, etwa für den Beamer.
  let gross = $state(false);
  function wahl(id: LeistenEintrag['id']) {
    offenId = offenId === id ? null : id;
  }
  // Der offene Bereich bestimmt, was ein Tippen ins Diagramm tut.
  const tippModus = $derived(offenId === 'daten' ? 'daten' : offenId === 'vorhersage' ? 'vorhersage' : null);
  let auswahl = $state<number | null>(null);
  const gewaehlt = $derived(i.zeilen.find((z) => z.id === auswahl) ?? null);
  let laeuft = $state(false);
  let rahmen = 0;
  let laufSchritte = 0;

  const anzahlTraining = $derived(i.zeilen.filter((z) => !z.test).length);
  const klasse = $derived(i.art === 'klasse');
  const klassen = $derived(i.ziel.klassen ?? ['nein', 'ja']);
  const art = $derived(i.modell.art);
  const netz = $derived(i.modell.art === 'netz' ? i.modell : null);
  const fehlerTraining = $derived(fehler(i));
  const fehlerTest = $derived(fehler(i, true));
  const falsch = $derived(klasse ? falschEingeordnet(i) : null);
  const falschTest = $derived(klasse ? falschEingeordnet(i, true) : null);
  const einheitWort = $derived(i.ziel.wort ?? i.ziel.einheit);
  const zielText = (y: number) => (klasse ? klassen[y >= 0.5 ? 1 : 0] : `${zahl(y, i.ziel.stellen)} ${einheitWort}`);
  const frageWert = $derived(i.frage ? vorhersage(i, i.frage) : null);
  const frageJa = $derived(i.frage ? wahrscheinlichkeit(i, i.frage) : null);
  // Zwei Merkmale (Torschuss): Draufsicht statt XY-Diagramm, ab Stufe 2 auch die 3D-Fläche (FR-21).
  const zwei = $derived(i.merkmale.length === 2);
  const ansicht3d = $derived(zwei && dreiD && stufe >= 2);
  let blick = $state<ReturnType<typeof Ansicht3D>>();
  let neueKlasse = $state(1);
  // Eigenes Thema (FR-13): Ein leeres Projekt beginnt mit dem Anlegen des Themas; später lässt es sich ändern.
  const einrichten = $derived(!!i.eigen && !i.thema);
  let themaOffen = $state(false);

  function themaUebernehmen(e: ThemaEntwurf) {
    anhalten();
    themaAnwenden(i, e);
    letzter = null;
    auswahl = null;
    themaOffen = false;
    offenId = 'daten';
    onGeaendert();
  }
  const grenzen = $derived(klasse && art !== 'netz' && !zwei ? klassenbereiche(i).grenzen : []);
  const ebene = $derived(linearEcht(i));
  const tief = ['₁', '₂', '₃'];
  // FR-17: Lernrate erst ab Stufe 2 einstellbar; auf Stufe 1 gilt die Standardrate, ohne die gespeicherte Wahl zu verlieren.
  const lernrate = $derived(stufe >= 2 ? i.lernrate : LERNRATE_STANDARD);
  let letzter = $state<Lernschritt | null>(null);
  const gerade = $derived(geradeEcht(i));
  const kostenJetzt = $derived(kosten(i.modell, punkteNorm(i), klasse));
  const ce = $derived(mitKreuzentropie(i.modell, klasse));
  // Das Netz braucht mehr, dafür kleinere Schritte; damit es nicht ewig dauert, rechnet es mehr Schritte je Bild.
  // Die S-Kurve wird am Ende nur langsam steiler; sie rechnet deshalb viele kleine Schritte je Bild.
  const jeBild = $derived(art === 'netz' ? 4 : art === 'skurve' ? 10 : 2);
  const hoechstens = $derived(art === 'netz' ? 1600 : art === 'skurve' ? 5000 : 800);
  const MERKMAL = $derived(i.merkmale[0].name);
  const ZIEL = $derived(i.ziel.wort ?? i.ziel.name);

  const MODELLNAME = { gerade: 'Gerade', skurve: 'S-Kurve', netz: 'Netz' } as const;
  // Stand der Bereiche in wenigen Worten, auch zugeklappt sichtbar.
  const stand = $derived.by(() => {
    const test = i.zeilen.length - anzahlTraining;
    const frage = i.frage
      ? `${i.frage.map((v, k) => `${zahl(v, i.merkmale[k].stellen)} ${i.merkmale[k].einheit}`).join(', ')} › ${klasse && frageJa !== null ? klassen[frageJa > 0.5 ? 1 : 0] : frageWert !== null ? `etwa ${zahl(frageWert, i.ziel.stellen)} ${einheitWort}` : ''}`
      : 'noch keine Frage';
    return {
      daten: `${anzahlTraining} Training · ${test} Test`,
      modell: netz ? `Netz, ${netz.w2.length} Neuronen` : MODELLNAME[art],
      training: i.schritte ? `${i.schritte} Schritte` : 'noch nicht trainiert',
      vorhersage: frage
    };
  });
  const hinweis = $derived(
    tippModus === 'daten'
      ? zwei
        ? 'Tippt in die Draufsicht, um einen Punkt der gewählten Klasse zu setzen. Zieht einen Punkt, um ihn zu verschieben, oder tippt ihn an, um ihn auszuwählen.'
        : `Tippt ins Diagramm, um einen Punkt zu setzen${klasse ? `: oben „${klassen[1]}“, unten „${klassen[0]}“` : ''}. Zieht einen Punkt, um ihn zu verschieben, oder tippt ihn an, um ihn auszuwählen.`
      : tippModus === 'vorhersage'
        ? 'Tippt ins Diagramm, um das Modell nach diesem Fall zu fragen.'
        : offenId === 'training' && stufe < 2 && !zwei
          ? 'Die gestrichelten Linien zeigen, wie weit jeder Punkt vom Modell entfernt ist. Beim Training werden sie kürzer.'
          : null
  );

  $effect(() => onWerte({ verlauf: [...i.verlauf], ausserhalb: !!i.frage && i.schritte > 0 && ausserhalbDerDaten(i, i.frage) }));

  /** Weitere Daten ergänzen, z. B. die Wintertage im Bias-Beispiel (FR-23). */
  function nachschubHolen() {
    if (!i.nachschub) return;
    for (const z of i.nachschub.zeilen) i.zeilen.push({ ...z, x: [...z.x], id: i.naechsteId++ });
    i.nachschub = undefined;
    onGeaendert();
  }

  function schritt(): boolean {
    const p = punkteNorm(i);
    if (!p.length) return false;
    const s = lernschritt(i.modell, p, lernrate, klasse);
    letzter = s;
    if (!i.verlauf.length) i.verlauf = verlaufErgaenzen(i.verlauf, fehler(i) ?? 0);
    i.modell = s.nachher;
    i.schritte += 1;
    const f = fehler(i) ?? 0;
    i.verlauf = verlaufErgaenzen(i.verlauf, Number.isFinite(f) ? f : 1e9);
    // Läuft das Modell weg (Lernrate zu groß), endet das Training, bevor die Gerade ganz verschwindet.
    return Number.isFinite(s.kostenNachher) && s.kostenNachher < 4;
  }

  function einLernschritt() {
    anhalten();
    schritt();
    onGeaendert();
  }

  let pause = 0;

  function bild() {
    for (let k = 0; k < jeBild; k++) {
      laufSchritte += 1;
      if (!schritt() || trainingFertig(i.verlauf) || laufSchritte >= hoechstens) return anhalten();
      // Steigt der Fehler, läuft das Training langsam weiter, damit man das Springen sieht (FR-17).
      const v = i.verlauf;
      if (v.length > 1 && v[v.length - 1] > v[v.length - 2]) {
        pause = window.setTimeout(() => (rahmen = requestAnimationFrame(bild)), 350);
        return;
      }
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
    clearTimeout(pause);
    laeuft = false;
    onGeaendert();
  }

  function neuesModell(art: ModellArt, neuronen = netz?.w2.length ?? NEURONEN_STANDARD) {
    anhalten();
    i.modell = modellNeu(art, i.merkmale.length, neuronen);
    i.schritte = 0;
    i.verlauf = [];
    letzter = null;
    onGeaendert();
  }

  const vonVorn = () => neuesModell(art);

  function lernrateSetzen(v: number) {
    i.lernrate = v;
    onGeaendert();
  }

  /** Zahl mit Vorzeichen für Rechenwege, z. B. „− 0,231“. */
  const mitVorzeichen = (v: number, stellen = 3) => (v < 0 ? '− ' : '+ ') + zahl(Math.abs(v), stellen);
  const klammer = (v: number, stellen = 3) => (v < 0 ? `(−${zahl(-v, stellen)})` : zahl(v, stellen));

  function verschieben2(id: number, x: number[], fertig: boolean) {
    const z = i.zeilen.find((z) => z.id === id);
    if (!z) return;
    z.x = x;
    auswahl = id;
    if (fertig) onGeaendert();
  }

  function neuerPunkt2(x: number[]) {
    const id = i.naechsteId++;
    i.zeilen.push({ id, x, y: neueKlasse, test: false });
    auswahl = id;
    onGeaendert();
  }

  function klasseWechseln(id: number) {
    const z = i.zeilen.find((z) => z.id === id);
    if (!z) return;
    z.y = z.y >= 0.5 ? 0 : 1;
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

  function frageSetzen(x: number | number[]) {
    i.frage = Array.isArray(x) ? x : [x];
    onGeaendert();
  }

  /** Eingabe eines Merkmals der Frage; fehlende Merkmale starten in der Mitte ihres Bereichs. */
  function frageEingabe(k: number, text: string) {
    const v = lesen(text);
    if (v === null) return;
    const neu = i.merkmale.map((m, n) => i.frage?.[n] ?? Math.round((m.min + m.max) / 2));
    const m = i.merkmale[k];
    neu[k] = Math.min(Math.max(v, m.min), m.max);
    frageSetzen(neu);
  }

  onDestroy(() => {
    cancelAnimationFrame(rahmen);
    clearTimeout(pause);
  });
</script>

{#if einrichten || themaOffen}
  <section class="leinwand einrichten">
    <ThemaEditor
      start={entwurfAus(i)}
      aendern={!einrichten}
      bisher={{ art: i.art, eingaben: i.merkmale.length, zeilen: i.zeilen.length }}
      onFertig={themaUebernehmen}
      onAbbrechen={() => (themaOffen = false)}
    />
  </section>
{:else}
<section class="leinwand" class:gross>
  <div class="bild karte">
    <div class="bildkopf">
      <div class="links">
        {#if zwei && stufe >= 2}
          <div class="reiter" role="group" aria-label="Ansicht">
            <button aria-pressed={!dreiD} onclick={() => (dreiD = false)} use:erklaert={'Zeigt beide Eingaben von oben. Der schraffierte Bereich ist „' + klassen[1] + '“.'}>Draufsicht</button>
            <button aria-pressed={dreiD} onclick={() => (dreiD = true)} use:erklaert={'Zeigt das Modell als Fläche, die ihr drehen könnt.'}>3D</button>
          </div>
        {/if}
        <div class="legende klein">
          {#if klasse}
            <span><i class="kreis voll"></i>{klassen[1]}</span>
            <span><i class="kreis"></i>{klassen[0]}</span>
            <span><i class="quadrat"></i>Testdaten</span>
            {#if zwei}<span><i class="strich dunkel"></i>Grenze 50 %</span>{:else}<span><i class="strich"></i>Modell</span>{/if}
            {#if ansicht3d}<span><i class="verlauf"></i>Fläche = Wahrscheinlichkeit</span>{:else}<span><i class="schraffur"></i>Bereich „{klassen[1]}“</span>{/if}
          {:else}
            <span><i class="kreis"></i>Trainingsdaten</span>
            <span><i class="quadrat"></i>Testdaten</span>
            <span><i class="strich"></i>Modell</span>
          {/if}
          {#if i.frage}<span><i class="raute"></i>Vorhersage</span>{/if}
          {#if i.erfunden}<span class="leise">Beispieldaten, erfunden</span>{/if}
        </div>
      </div>
      <FehlerAnzeige wert={fehlerTraining} verlauf={i.verlauf} einheit={einheitWort} prozent={klasse} zusatz={falsch && falsch.von ? `${falsch.falsch} von ${falsch.von} falsch eingeordnet` : null} />
      <div class="knoepfe">
        {#if gross}{@render trainKnopf()}{/if}
        <button class="vergroessern" aria-pressed={gross} onclick={() => (gross = !gross)} use:erklaert={'Blendet die Bereiche rechts aus, damit die Darstellung den ganzen Platz bekommt, etwa für den Beamer. Derselbe Knopf holt sie zurück.'}>{gross ? '⤡ Bereiche zeigen' : '⤢ Vergrößern'}</button>
      </div>
    </div>
    <div class="plot">
      {#if ansicht3d}
        <Ansicht3D bind:this={blick} {i} />
      {:else if zwei}
        <Draufsicht
          {i}
          modus={tippModus}
          {auswahl}
          onAuswahl={(id) => (auswahl = id)}
          onVerschieben={verschieben2}
          onNeu={neuerPunkt2}
          onFrage={frageSetzen}
        />
      {:else}
        <Diagramm
          {i}
          modus={tippModus}
          {auswahl}
          abstaende={offenId === 'training' || laeuft}
          onAuswahl={(id) => (auswahl = id)}
          onVerschieben={verschieben}
          onNeu={neuerPunkt}
          onFrage={frageSetzen}
        />
      {/if}
    </div>
    {#if tipp || hinweis || ansicht3d}
      <div class="zeilen">
        {#if tipp}<Tipp text={tipp} onWeg={onTippWeg} />{/if}
        {#if ansicht3d}
          <p class="hinweis klein">Die Fläche zeigt für jeden Schuss, wie <Begriff id="wahrscheinlichkeit" text="wahrscheinlich" /> „{klassen[1]}“ ist; die dunkle Linie liegt bei 50 %. Dreht mit einem Finger, zoomt mit zwei.
            <button onclick={() => blick?.zuruecksetzen()}>Ansicht zurücksetzen</button></p>
        {:else if hinweis}
          <p class="hinweis klein" class:frage={tippModus === 'vorhersage'}>{hinweis}</p>
        {/if}
      </div>
    {/if}
  </div>

  {#if !gross}
    <Bereiche eintraege={leiste} offen={offenId} onWahl={wahl} {stand} oben={trainKnopf} inhalt={bereich} />
  {/if}
</section>
{/if}

{#snippet trainKnopf()}
  <button class="haupt trainieren" onclick={trainieren} disabled={!anzahlTraining} use:erklaert={BEDIENUNG.trainieren}>{laeuft ? 'Anhalten ❚❚' : 'Trainieren ▶'}</button>
{/snippet}

{#snippet bereich(id: LeistenEintrag['id'])}
      {#if id === 'daten'}
        {#if i.hinweis}<p class="szenario-hinweis">{i.hinweis}</p>{/if}
        {#if i.nachschub}
          <div class="zeile">
            <button onclick={nachschubHolen} use:erklaert={'Fügt weitere Trainingsdaten hinzu. Danach trainiert ihr das Modell neu und vergleicht die Vorhersagen.'}>+ {i.nachschub.name} ergänzen ({i.nachschub.zeilen.length} Zeilen)</button>
          </div>
        {/if}
        {#if zwei}
          <div class="zeile">
            <span class="klein">Neue Punkte:</span>
            <div class="wahl klein-wahl" role="group" aria-label="Klasse neuer Punkte">
              <button aria-pressed={neueKlasse === 1} onclick={() => (neueKlasse = 1)}>{klassen[1]}</button>
              <button aria-pressed={neueKlasse === 0} onclick={() => (neueKlasse = 0)}>{klassen[0]}</button>
            </div>
          </div>
        {/if}
        {#if gewaehlt}
          <div class="zeile">
            <span>Ausgewählt: <strong>{gewaehlt.x.map((v, k) => `${zahl(v, i.merkmale[k].stellen)} ${i.merkmale[k].einheit}`).join(', ')} · {zielText(gewaehlt.y)}</strong></span>
            <span class="raum"></span>
            {#if zwei}<button onclick={() => klasseWechseln(gewaehlt.id)}>Klasse wechseln</button>{/if}
            <button onclick={() => testUmschalten(gewaehlt.id)}>{gewaehlt.test ? 'Zu Trainingsdaten' : 'Zu Testdaten'}</button>
            <button onclick={() => loeschen(gewaehlt.id)}>Löschen</button>
          </div>
        {/if}
        {#if i.eigen}
          <div class="zeile"><button onclick={() => (themaOffen = true)} use:erklaert={'Öffnet Namen, Einheiten und Bereiche eures Themas zum Ändern.'}>Thema ändern</button></div>
        {/if}
        <div class="tabellenbox"><DatenTabelle {i} {auswahl} onAuswahl={(id) => (auswahl = id)} onAendern={onGeaendert} /></div>
      {:else if id === 'modell'}
        {#if art === 'netz'}
          <p>Das <Begriff id="modell" /> ist ein kleines <Begriff id="netz" />. Seine <Begriff id="neuron" text="Neuronen" /> biegen die Linie, so kann es auch Kurven lernen.</p>
        {:else if zwei && art === 'skurve'}
          <p>Das <Begriff id="modell" /> ist eine <Begriff id="skurve" /> über beide Eingaben. Ab 50 % <Begriff id="wahrscheinlichkeit" /> sagt es „{klassen[1]}“; die dunkle Linie in der Draufsicht ist die <Begriff id="klassengrenze" text="Grenze" />.</p>
        {:else if zwei}
          <p>Das <Begriff id="modell" /> ist eine schräge Ebene über beiden Eingaben. Wo sie über 50 % liegt, sagt es „{klassen[1]}“.</p>
        {:else if art === 'skurve'}
          <p>Das <Begriff id="modell" /> ist eine <Begriff id="skurve" />. Sie zeigt für jeden Wert, wie <Begriff id="wahrscheinlichkeit" text="wahrscheinlich" /> „{klassen[1]}“ ist; ab 50 % sagt es „{klassen[1]}“.</p>
        {:else if klasse}
          <p>Das <Begriff id="modell" /> ist eine Gerade. Wo sie über 50 % liegt, sagt es „{klassen[1]}“, sonst „{klassen[0]}“.</p>
        {:else}
          <p>Das <Begriff id="modell" /> ist eine Gerade. Beim Training sucht die App die Gerade, die am besten zu den <Begriff id="trainingsdaten" /> passt.</p>
        {/if}
        {#if stufe >= 2}
          <div class="wahl" role="group" aria-label="Modell wählen">
            <button aria-pressed={art === 'gerade'} onclick={() => neuesModell('gerade')} use:erklaert={'Eine gerade Linie. Sie passt, wenn die Punkte ungefähr auf einer Linie liegen.'}>Gerade</button>
            <button aria-pressed={art === 'skurve'} disabled={!klasse} onclick={() => neuesModell('skurve')} use:erklaert={'Eine S-förmige Kurve zwischen 0 und 100 %. Sie sagt Klassen wie ja oder nein mit Wahrscheinlichkeit voraus.'}>S-Kurve</button>
            <button aria-pressed={art === 'netz'} onclick={() => neuesModell('netz')} use:erklaert={'Ein kleines Netz mit Zwischenschicht. Es kann auch gebogene Zusammenhänge lernen.'}>Netz</button>
          </div>
          {#if !klasse}<p class="klein leise">Die S-Kurve sagt Klassen wie ja oder nein voraus, keine Zahlen.</p>{/if}
          {#if netz}
            <div class="zeile neuronen">
              <label for="neuronen"><Begriff id="neuron" text="Neuronen" /> in der Zwischenschicht</label>
              <input id="neuronen" type="range" min="1" max={NEURONEN_HOECHSTENS} step="1" value={netz.w2.length} oninput={(e) => neuesModell('netz', Number(e.currentTarget.value))} use:erklaert={'Mehr Neuronen machen das Netz biegsamer. Zu viele können sich auch an Zufälle in den Daten anpassen.'} />
              <strong class="zahl">{netz.w2.length}</strong>
            </div>
            <NetzBild {netz} eingaben={i.merkmale.map((m) => m.name)} ausgabe={ZIEL} />
          {/if}
          <p class="klein leise">Ein neu gewähltes Modell hat noch nichts gelernt. Trainiert es danach.</p>
        {/if}
        {#if stufe >= 3}
          {#if zwei && art !== 'netz'}
            <p class="formel">
              {art === 'skurve' ? 'z' : ZIEL} =
              {#each ebene.steigungen as st, k}{k ? (st < 0 ? ' − ' : ' + ') : st < 0 ? '−' : ''}<span class="w">{zahl(Math.abs(st), 3)}</span> · {i.merkmale[k].name}{/each}
              {mitVorzeichen(ebene.achsenabschnitt, 2)}
            </p>
            {#if art === 'skurve'}<p class="klein leise">p({klassen[1]}) = 1 / (1 + e<sup>−z</sup>). Bei z = 0 ist p = 50 %: Dort liegt die dunkle <Begriff id="klassengrenze" text="Grenze" />, eine gerade Linie in der Draufsicht.</p>
            {:else}<p class="klein leise">Wo die Ebene den Wert 0,5 hat, liegt die <Begriff id="klassengrenze" text="Grenze" />, eine gerade Linie in der Draufsicht.</p>{/if}
          {:else if art === 'gerade'}
            <p class="formel">{ZIEL} = <span class="w">{zahl(gerade.steigung, klasse ? 3 : 2)}</span> · {MERKMAL} {mitVorzeichen(gerade.achsenabschnitt, klasse ? 2 : 1)}</p>
            {#if klasse}
              <p class="klein leise">Steigung {zahl(gerade.steigung, 3)}: Pro {i.merkmale[0].einheit} mehr steigt der Wert um {zahl(gerade.steigung * 100, 1)} Prozentpunkte. {#if grenzen.length}Bei 0,5 liegt die <Begriff id="klassengrenze" text="Grenze" />: {zahl(grenzen[0], 1)} {i.merkmale[0].einheit}.{/if}</p>
            {:else}
              <p class="klein leise">Steigung {zahl(gerade.steigung, 2)}: Pro {i.merkmale[0].einheit} mehr steigt die Vorhersage um {zahl(gerade.steigung, 2)} {einheitWort}. Achsenabschnitt {zahl(gerade.achsenabschnitt, 1)}: der Wert der Geraden bei 0 {i.merkmale[0].einheit}.</p>
            {/if}
          {:else if art === 'skurve'}
            <p class="formel">p({klassen[1]}) = <span class="bruch">1 / (1 + e<sup>−z</sup>)</span>, z = <span class="w">{zahl(gerade.steigung, 3)}</span> · {MERKMAL} {mitVorzeichen(gerade.achsenabschnitt, 2)}</p>
            <p class="klein leise">Bei z = 0 ist p = 50 %: Dort liegt die <Begriff id="klassengrenze" text="Grenze" />{#if grenzen.length}, bei {zahl(grenzen[0], 1)} {i.merkmale[0].einheit}{/if}. Je größer die Steigung, desto steiler die S-Kurve.</p>
          {:else if netz}
            <p class="formel">h<sub>j</sub> = tanh({zwei ? 'w₁ⱼ · x₁ + w₂ⱼ · x₂' : 'wⱼ · x'} + b<sub>j</sub>), &nbsp;ŷ = {klasse ? 'σ(' : ''}Σ v<sub>j</sub> · h<sub>j</sub> + c{klasse ? ')' : ''}</p>
            <table class="gewichte">
              <thead><tr><th>Neuron</th>{#each i.merkmale as _, k}<th>w{zwei ? tief[k] : ''}</th>{/each}<th>b</th><th>v</th></tr></thead>
              <tbody>
                {#each netz.w1 as w, j}
                  <tr><td>{j + 1}</td>{#each w as wk}<td>{zahl(wk, 2)}</td>{/each}<td>{zahl(netz.b1[j], 2)}</td><td>{zahl(netz.w2[j], 2)}</td></tr>
                {/each}
              </tbody>
            </table>
            <p class="klein leise">c = {zahl(netz.b2, 3)}. Alle Werte sind <Begriff id="normiert" /> gerechnet.</p>
          {/if}
        {/if}
      {:else if id === 'training'}
        <div class="zeile">
          <button onclick={einLernschritt} disabled={!anzahlTraining} use:erklaert={'Macht genau einen Lernschritt: Das Modell rückt ein Stück näher an die Punkte.'}>Ein Lernschritt</button>
          <button onclick={vonVorn} use:erklaert={'Setzt das Modell zurück, als hätte es noch nichts gelernt.'}>Von vorn</button>
          <span class="raum"></span>
          <span class="klein leise">Lernschritte: <strong class="zahl">{i.schritte}</strong></span>
        </div>
        {#if stufe >= 2}
          <div class="zeile lernrate">
            <label for="lernrate"><Begriff id="lernrate" /></label>
            <input id="lernrate" type="range" min="0.05" max="1" step="0.05" value={i.lernrate} oninput={(e) => lernrateSetzen(Number(e.currentTarget.value))} use:erklaert={'Stellt ein, wie groß jeder Lernschritt ist. Zu klein dauert lange, zu groß lässt das Modell springen.'} />
            <strong class="zahl">{zahl(i.lernrate, 2)}</strong>
          </div>
          <p class="klein leise">Beim <Begriff id="gradientenabstieg" /> rückt das Modell bei jedem Schritt ein Stück in die Richtung, in der die <Begriff id="kostenfunktion" /> am stärksten sinkt. Die Lernrate bestimmt, wie groß dieser Schritt ist.</p>
        {:else}
          <p class="klein leise">Die gestrichelten Linien zeigen, wie weit jeder Punkt vom Modell entfernt ist. Beim Training werden sie kürzer.</p>
        {/if}
        {#if stufe >= 3}
          <div class="rechenweg">
            <div class="label">Rechenweg, <Begriff id="normiert" /> gerechnet</div>
            <p>
              {art === 'netz' ? 'ŷ = Netz(x)' : `ŷ = ${art === 'skurve' ? 'σ(' : ''}${zwei ? 'w₁ · x₁ + w₂ · x₂' : 'w · x'} + b${art === 'skurve' ? ')' : ''}`} &nbsp;·&nbsp; K =
              {#if ce}−<span class="bruch">1/n</span> Σ [y · ln ŷ + (1 − y) · ln(1 − ŷ)]{:else}<span class="bruch">1/n</span> Σ (ŷ − y)²{/if}
              = <strong>{zahl(kostenJetzt, 4)}</strong>
            </p>
            {#if letzter && letzter.grad.art !== 'netz' && letzter.vorher.art !== 'netz' && letzter.nachher.art !== 'netz'}
              {#each letzter.vorher.w as wk, k}
                <p>w{zwei ? tief[k] : ''}: {zahl(wk, 3)} − {zahl(letzter.lernrate, 2)} · {klammer(letzter.grad.w[k])} = <strong>{zahl(letzter.nachher.w[k], 3)}</strong></p>
              {/each}
              <p>b: {zahl(letzter.vorher.b, 3)} − {zahl(letzter.lernrate, 2)} · {klammer(letzter.grad.b)} = <strong>{zahl(letzter.nachher.b, 3)}</strong></p>
              <p class="klein leise">Neues Gewicht = altes Gewicht − Lernrate · Steigung der Kosten (Gradient). Die Kosten sanken von {zahl(letzter.kostenVorher, 4)} auf {zahl(letzter.kostenNachher, 4)}.</p>
            {:else if letzter && letzter.grad.art === 'netz' && letzter.vorher.art === 'netz' && letzter.nachher.art === 'netz'}
              <p>v₁: {zahl(letzter.vorher.w2[0], 3)} − {zahl(letzter.lernrate, 3)} · {klammer(letzter.grad.w2[0])} = <strong>{zahl(letzter.nachher.w2[0], 3)}</strong></p>
              <p>w₁: {zahl(letzter.vorher.w1[0][0], 3)} − {zahl(letzter.lernrate, 3)} · {klammer(letzter.grad.w1[0][0])} = <strong>{zahl(letzter.nachher.w1[0][0], 3)}</strong></p>
              <p class="klein leise">So ändert die App alle {letzter.vorher.w2.length * (i.merkmale.length + 2) + 1} Gewichte. Die Steigungen rechnet sie von der Ausgabe rückwärts zu den Neuronen aus (Backpropagation). Beim Netz teilt sie die Lernrate: 2 · {zahl(lernrate, 2)} / ({letzter.vorher.w2.length} + 1) = {zahl(letzter.lernrate, 3)}. Die Kosten sanken von {zahl(letzter.kostenVorher, 4)} auf {zahl(letzter.kostenNachher, 4)}.</p>
            {:else}
              <p class="klein leise">Macht einen Lernschritt, dann steht hier, wie die Gewichte neu berechnet werden.</p>
            {/if}
          </div>
        {/if}
      {:else if id === 'vorhersage'}
        <div class="zeile frage">
          {#each i.merkmale as m, k}
            <label for={k ? `frage${k + 1}` : 'frage'}>{m.name}</label>
            <input id={k ? `frage${k + 1}` : 'frage'} inputmode="decimal" placeholder="z. B. {zahl((m.min + m.max) / 2 + 3, 0)}" value={i.frage?.[k] !== undefined ? zahl(i.frage[k], m.stellen, false) : ''} onchange={(e) => frageEingabe(k, e.currentTarget.value)} />
            <span class="leise">{m.einheit}{k === i.merkmale.length - 1 ? ' ›' : ''}</span>
          {/each}
          {#if klasse && frageJa !== null}
            {@const ja = frageJa > 0.5}
            <strong class="antwort">{klassen[ja ? 1 : 0]}</strong>
            <span><Begriff id="wahrscheinlichkeit" />: {zahl((ja ? frageJa : 1 - frageJa) * 100)} %</span>
          {:else if frageWert !== null}<strong class="antwort">etwa {zahl(frageWert, i.ziel.stellen)} {einheitWort}</strong>{/if}
        </div>
        {#if klasse && art === 'gerade' && frageWert !== null && stufe >= 2 && (frageWert > 1 || frageWert < 0)}
          <p class="klein leise">Die Gerade liefert hier {zahl(frageWert * 100)} %. Eine Wahrscheinlichkeit liegt aber immer zwischen 0 und 100 %; die S-Kurve passt deshalb besser.</p>
        {/if}
        {#if !i.frage}<p class="klein leise">Gebt einen Wert ein oder tippt ins Diagramm.</p>{/if}
        {#if i.schritte === 0}
          <p class="klein leise">Das Modell hat noch nicht gelernt. Trainiert es zuerst, sonst rät es nur.</p>
        {:else if falschTest && falschTest.von}
          <p class="klein leise"><Begriff id="testdaten" text="Testdaten" /> zeigen, ob das Modell auch bei Fällen stimmt, die es nicht gelernt hat: Von {falschTest.von} ordnet es {falschTest.von - falschTest.falsch} richtig ein.</p>
        {:else if fehlerTest !== null && !klasse}
          <p class="klein leise"><Begriff id="testdaten" text="Testdaten" /> zeigen, ob das Modell auch bei Fällen stimmt, die es nicht gelernt hat: Dort liegt es im Mittel {zahl(fehlerTest, 1)} {einheitWort} daneben.</p>
        {/if}
      {/if}
{/snippet}

<style>
  /* Das Formular wächst mit seinem Inhalt; die Seite scrollt, statt den Knopf abzuschneiden. */
  .szenario-hinweis { padding: 8px 12px; border-left: 4px solid var(--schrift2); background: var(--hintergrund); border-radius: var(--radius-knopf); }
  /* Zweiteilung (BK-D): Darstellung links, Bereiche rechts; hochkant darunter. Die Seite scrollt nie, nur die Bereiche. */
  .leinwand { flex: none; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 12px; padding: 12px 16px; height: calc(var(--fenster-hoehe, 100vh) - var(--kopf-hoehe, 61px) - var(--fuss-hoehe, 37px)); min-height: 440px; }
  .leinwand.gross { grid-template-columns: minmax(0, 1fr); }
  /* Das Formular „Eigenes Thema“ wächst mit seinem Inhalt; hier darf die Seite scrollen. */
  .leinwand.einrichten { display: flex; justify-content: center; align-items: flex-start; height: auto; padding-bottom: 24px; }
  @media (max-aspect-ratio: 1/1) {
    /* Bei wenig Platz scrollt die Seite, statt das Diagramm flach zu quetschen. */
    .leinwand { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(320px, 45fr) minmax(300px, 55fr); min-height: 660px; }
    .leinwand.gross { grid-template-rows: minmax(0, 1fr); }
  }
  .bild { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
  .bildkopf { display: flex; align-items: flex-start; gap: 12px; padding: 10px 12px 0 14px; }
  .links { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .knoepfe { display: flex; gap: 8px; }
  .vergroessern { padding: 0 12px; }
  .reiter { display: inline-flex; align-self: flex-start; border: 1px solid var(--linie); border-radius: var(--radius-knopf); overflow: hidden; }
  .reiter button { border: 0; border-radius: 0; }
  .reiter button + button { border-left: 1px solid var(--linie); }
  .reiter button[aria-pressed='true'] { background: var(--modell-hell); color: #174a8c; }
  .plot { position: relative; flex: 1; min-height: 0; margin: 0 6px; }
  .zeilen { display: flex; flex-direction: column; gap: 6px; padding: 0 12px 10px; }
  .hinweis { margin: 0; padding: 6px 12px; border-radius: var(--radius-knopf); background: var(--hintergrund); border-left: 4px solid var(--schrift3); color: var(--schrift2); }
  .hinweis.frage { border-left-color: var(--frage); }
  .hinweis button { margin-left: 8px; font-size: 13px; }
  .legende { display: flex; gap: 6px 14px; align-items: center; flex-wrap: wrap; color: var(--schrift2); }
  .legende span { display: inline-flex; align-items: center; gap: 6px; }
  .legende i { display: inline-block; }
  .kreis { width: 11px; height: 11px; border: 2px solid var(--schrift); border-radius: 50%; }
  .kreis.voll { background: var(--schrift); }
  .schraffur { width: 16px; height: 12px; border: 1px solid var(--modell); background: repeating-linear-gradient(45deg, var(--modell-hell) 0 3px, #b9cfee 3px 4.5px); }
  .quadrat { width: 11px; height: 11px; border: 2px solid var(--frage); }
  .strich { width: 16px; height: 3px; background: var(--modell); border-radius: 2px; }
  .strich.dunkel { background: var(--grenze, #174a8c); }
  .verlauf { width: 16px; height: 12px; background: linear-gradient(90deg, var(--modell-hell), var(--modell)); border: 1px solid var(--modell); }
  .klein-wahl button { padding: 0 14px; }
  .raute { width: 9px; height: 9px; background: var(--frage); transform: rotate(45deg); }
  p { margin: 0; }
  .zeile { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .raum { flex: 1; }
  .tabellenbox { min-height: 0; }
  .frage input { font: inherit; width: 90px; min-height: 40px; padding: 0 10px; border: 1px solid var(--linie); border-radius: var(--radius-knopf); }
  .frage input:focus { outline: 3px solid var(--frage); outline-offset: 1px; }
  .antwort { color: var(--frage-text); font-size: 22px; }
  .zahl { font-variant-numeric: tabular-nums; color: var(--schrift); }
  .trainieren { min-width: 140px; }
  .lernrate input { flex: 1; min-width: 160px; accent-color: var(--modell); min-height: 36px; }
  .formel { font-size: 18px; font-weight: 600; }
  .formel .w { color: var(--modell); }
  .rechenweg { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border: 1px solid var(--linie); border-radius: var(--radius-knopf); background: var(--hintergrund); font-variant-numeric: tabular-nums; font-size: 14px; }
  .bruch { font-size: 13px; }
  .formel .bruch { font-size: inherit; }
  .wahl { display: flex; gap: 8px; }
  .wahl button { flex: 1; }
  .wahl button[aria-pressed='true'] { background: var(--modell); border-color: var(--modell); color: #fff; }
  .neuronen input { flex: 1; min-width: 120px; accent-color: var(--modell); min-height: 36px; }
  .gewichte { border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
  .gewichte th, .gewichte td { padding: 2px 10px 2px 0; text-align: right; }
  .gewichte th { color: var(--schrift2); font-weight: 600; }
</style>
