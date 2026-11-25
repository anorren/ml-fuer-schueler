<script lang="ts">
  import type { TabellenInhalt } from './typen';
  import { lesen, zahl } from './rechnen';

  // Tabelle zum Ansehen und Eingeben (FR-12); Änderungen erscheinen sofort im Diagramm und umgekehrt.
  interface Props {
    i: TabellenInhalt;
    auswahl: number | null;
    onAuswahl: (id: number | null) => void;
    onAendern: () => void;
  }
  let { i, auswahl, onAuswahl, onAendern }: Props = $props();

  const klemmen = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
  // Bei Klassen (FR-14) wählt man die Klasse aus, statt eine Zahl einzugeben.
  const klassen = $derived(i.art === 'klasse' ? (i.ziel.klassen ?? ['nein', 'ja']) : null);
  function setzeKlasse(id: number, wert: string) {
    const z = i.zeilen.find((z) => z.id === id);
    if (!z) return;
    z.y = Number(wert);
    onAendern();
  }

  function setzeX(id: number, k: number, text: string) {
    const z = i.zeilen.find((z) => z.id === id), v = lesen(text);
    if (!z || v === null) return;
    z.x[k] = klemmen(v, i.merkmale[k].min, i.merkmale[k].max);
    onAendern();
  }
  function setzeY(id: number, text: string) {
    const z = i.zeilen.find((z) => z.id === id), v = lesen(text);
    if (!z || v === null) return;
    z.y = klemmen(v, i.ziel.min, i.ziel.max);
    onAendern();
  }
  function neueZeile() {
    const id = i.naechsteId++;
    i.zeilen.push({ id, x: i.merkmale.map((m) => (m.min + m.max) / 2), y: klassen ? 0 : (i.ziel.min + i.ziel.max) / 2, test: false });
    onAuswahl(id);
    onAendern();
  }
  function loeschen(id: number) {
    i.zeilen = i.zeilen.filter((z) => z.id !== id);
    if (auswahl === id) onAuswahl(null);
    onAendern();
  }
</script>

<div class="tabelle">
  <table>
    <thead>
      <tr>
        {#each i.merkmale as m}<th>{m.name}<span class="einheit">{m.einheit}</span></th>{/each}
        <th>{i.ziel.name}<span class="einheit">{i.ziel.einheit}</span></th>
        <th title="Testdaten fließen nicht ins Training ein">Test</th>
        <th><span class="unsichtbar">Löschen</span></th>
      </tr>
    </thead>
    <tbody>
      {#each i.zeilen as z (z.id)}
        <tr class:gewaehlt={auswahl === z.id} class:test={z.test} onfocusin={() => onAuswahl(z.id)}>
          {#each z.x as v, k}
            <td><input inputmode="decimal" aria-label="{i.merkmale[k].name} Zeile {z.id}" value={zahl(v, i.merkmale[k].stellen, false)} onchange={(e) => setzeX(z.id, k, e.currentTarget.value)} /></td>
          {/each}
          <td>
            {#if klassen}
              <select aria-label="{i.ziel.name} Zeile {z.id}" value={String(z.y >= 0.5 ? 1 : 0)} onchange={(e) => setzeKlasse(z.id, e.currentTarget.value)}>
                <option value="0">{klassen[0]}</option>
                <option value="1">{klassen[1]}</option>
              </select>
            {:else}
              <input inputmode="decimal" aria-label="{i.ziel.name} Zeile {z.id}" value={zahl(z.y, i.ziel.stellen, false)} onchange={(e) => setzeY(z.id, e.currentTarget.value)} />
            {/if}
          </td>
          <td><input type="checkbox" aria-label="Zeile {z.id} als Testdaten" checked={z.test} onchange={(e) => { z.test = e.currentTarget.checked; onAendern(); }} /></td>
          <td><button class="weg" aria-label="Zeile {z.id} löschen" onclick={() => loeschen(z.id)}>✕</button></td>
        </tr>
      {/each}
    </tbody>
  </table>
  <button class="neu" onclick={neueZeile}>+ Zeile</button>
</div>

<style>
  .tabelle { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th { text-align: left; font-size: 12px; font-weight: 600; color: var(--schrift2); padding: 4px 4px 6px; vertical-align: bottom; position: sticky; top: 0; background: var(--flaeche); }
  .einheit { display: block; font-weight: 400; color: var(--schrift3); }
  td { padding: 2px 4px; border-top: 1px solid var(--linie); }
  tr.gewaehlt td { background: var(--hintergrund); }
  tr.test input:not([type='checkbox']) { color: var(--frage-text); }
  input:not([type='checkbox']) { font: inherit; width: 100%; min-width: 56px; min-height: 36px; padding: 0 8px; border: 1px solid transparent; border-radius: 6px; background: none; font-variant-numeric: tabular-nums; }
  input:not([type='checkbox']):focus { border-color: var(--modell); outline: none; background: var(--flaeche); }
  select { font: inherit; width: 100%; min-width: 64px; min-height: 36px; padding: 0 6px; border: 1px solid var(--linie); border-radius: 6px; background: var(--flaeche); }
  tr.test select { color: var(--frage-text); }
  input[type='checkbox'] { width: 22px; height: 22px; accent-color: var(--frage); }
  .weg { min-height: 36px; min-width: 36px; padding: 0; border: 0; background: none; color: var(--schrift2); }
  .neu { align-self: flex-start; }
  .unsichtbar { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
