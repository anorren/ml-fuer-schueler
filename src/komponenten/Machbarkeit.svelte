<script lang="ts">
  import { onMount } from 'svelte';
  import { geraeteInfo, type GeraeteInfo } from '../lib/geraet';
  import Flaeche3D from './Flaeche3D.svelte';

  // Etappe 0: Machbarkeitsversuche MV-01 bis MV-03 und Gerätedaten (OQ-04) auf einem Schul-iPad.
  let { offlineBereit, online, onSpeichern, onOeffnen }: { offlineBereit: boolean; online: boolean; onSpeichern: () => void; onOeffnen: () => void } = $props();
  let info = $state<GeraeteInfo | null>(null);
  let kopiert = $state(false);

  onMount(async () => { info = await geraeteInfo(); });

  async function infoKopieren() {
    if (!info) return;
    const text = Object.entries(info).map(([k, v]) => `${k}: ${v}`).join('\n');
    try { await navigator.clipboard.writeText(text); kopiert = true; } catch { kopiert = false; }
  }
</script>

<section class="test">
  <h1>Machbarkeitstest</h1>
  <p class="leise">Für Andreas: auf einem Schul-iPad durchgehen und die Ergebnisse zurückmelden. Kinder brauchen diese Seite nicht.</p>

  <div class="karte block">
    <div class="label">OQ-04 · Gerätedaten</div>
    {#if info}
      <table>
        <tbody>
          <tr><th>Gerät</th><td>{info.geraet}</td></tr>
          <tr><th>System</th><td>{info.system}</td></tr>
          <tr><th>Browser</th><td>{info.browser}</td></tr>
          <tr><th>Bildschirm</th><td>{info.bildschirm}, Pixeldichte {info.pixeldichte}</td></tr>
          <tr><th>Speicher</th><td>{info.speicher}</td></tr>
          <tr><th>Teilen mit Dateien</th><td>{info.teilenMitDateien ? 'ja' : 'nein (Download-Weg)'}</td></tr>
        </tbody>
      </table>
      <button onclick={infoKopieren}>Angaben kopieren</button>{#if kopiert}<span class="klein status-gut"> ✓ kopiert</span>{/if}
    {:else}<p class="leise">wird ermittelt …</p>{/if}
  </div>

  <div class="karte block">
    <div class="label">MV-01 · Speichern und Öffnen</div>
    <ol>
      <li>„Projektdatei speichern“ tippen und im Teilen-Menü „In Dateien sichern“ wählen, Ordner des Teams wählen.</li>
      <li>Die Datei im Schulcampus hochladen.</li>
      <li>„Neu beginnen“ oben tippen, dann „Projektdatei öffnen“ und die Datei wählen.</li>
    </ol>
    <div class="zeile"><button class="haupt" onclick={onSpeichern}>Projektdatei speichern</button><button onclick={onOeffnen}>Projektdatei öffnen</button></div>
  </div>

  <div class="karte block">
    <div class="label">MV-02 · Offline-Betrieb</div>
    <p>App für offline bereit: {#if offlineBereit}<span class="status-gut">✓ ja</span>{:else}<span class="leise">noch nicht (Seite einmal neu laden)</span>{/if} · Netz: {online ? 'verbunden' : 'offline'}</p>
    <p class="klein leise">Test: WLAN ausschalten, Seite neu laden, dann diesen Test und Speichern wiederholen.</p>
  </div>

  <div class="karte block">
    <div class="label">MV-03 · 3D-Fläche</div>
    <p class="klein leise">Mit einem Finger drehen, mit zwei Fingern zoomen, dann den Leistungstest starten. Ab 30 Bildern pro Sekunde gilt die Fläche als flüssig.</p>
    <Flaeche3D />
  </div>
</section>

<style>
  .test { padding: 24px 32px 40px; max-width: 900px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .block { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
  table { border-collapse: collapse; }
  th { text-align: left; font-weight: 600; color: var(--schrift2); padding: 4px 16px 4px 0; vertical-align: top; }
  td { padding: 4px 0; }
  ol { margin: 0; padding-left: 20px; }
  .zeile { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
