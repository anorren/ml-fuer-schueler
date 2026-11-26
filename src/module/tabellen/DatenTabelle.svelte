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
          <td><label class="testfeld"><input type="checkbox" aria-label="Zeile {z.id} als Testdaten" checked={z.test} onchange={(e) => { z.test = e.currentTarget.checked; onAendern(); }} /></label></td>
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
  th { text-align: left; font-size: 13px; font-weight: 600; color: var(--schrift2); padding: 4px 4px 6px; vertical-align: bottom; position: sticky; top: 0; background: var(--flaeche); }
  .einheit { display: block; font-weight: 400; color: var(--schrift3); }
  td { padding: 2px 4px; border-top: 1px solid var(--linie); }
  tr.gewaehlt td { background: var(--hintergrund); }
  tr.test input:not([type='checkbox']) { color: var(--frage-text); }
  input:not([type='checkbox']) { font: inherit; width: 100%; min-width: 56px; min-height: 36px; padding: 0 8px; border: 1px solid transparent; border-radius: 6px; background: none; font-variant-numeric: tabular-nums; }
  input:not([type='checkbox']):focus { border-color: var(--modell); outline: none; background: var(--flaeche); }
  /* Safari beachtet die Höhe einer Auswahl nur ohne Systemdarstellung; der Pfeil kommt deshalb als Hintergrund. */
  select { font: inherit; width: 100%; min-width: 72px; height: 40px; padding: 0 24px 0 8px; border: 1px solid var(--linie); border-radius: 6px; color: var(--schrift); -webkit-appearance: none; appearance: none; background: var(--flaeche) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%2352514e' stroke-width='1.5'/%3E%3C/svg%3E") no-repeat right 8px center; }
  tr.test select { color: var(--frage-text); }
  /* Tippfläche 44 × 44 pt (Apple HIG), das Kästchen selbst bleibt klein */
  .testfeld { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; cursor: pointer; }
  input[type='checkbox'] { width: 24px; height: 24px; margin: 0; accent-color: var(--frage-text); }
  .weg { min-height: 36px; min-width: 36px; padding: 0; border: 0; background: none; color: var(--schrift2); }
  .neu { align-self: flex-start; }
  .unsichtbar { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
