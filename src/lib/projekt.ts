// Projektdatei (IF-01, DEC-04): ein Projekt eines Tandems als JSON-Datei mit Formatkennung und Version.
// Die Datei landet über das Teilen-Menü bzw. als Download im Ordner des Tandems und wird über die Dateiauswahl wieder geöffnet.

export const FORMAT = 'ml-schule-projekt';
export const FORMAT_VERSION = 1;

export type Stufe = 1 | 2 | 3;
export type ModulId = 'tabellen' | 'bilder' | 'sprache';

export interface Projekt {
  format: typeof FORMAT;
  formatVersion: number;
  appVersion: string;
  team: string;
  modul: ModulId;
  stufe: Stufe;
  szenario: string | null;
  erstellt: string;
  geaendert: string;
  /** Modulspezifischer Inhalt (Daten, Modell, Trainingsstand); in Etappe 0 noch leer. */
  inhalt: Record<string, unknown>;
}

export class ProjektFehler extends Error {}

export function neuesProjekt(appVersion: string, team = '', modul: ModulId = 'tabellen', stufe: Stufe = 1, jetzt = new Date()): Projekt {
  const zeit = jetzt.toISOString();
  return { format: FORMAT, formatVersion: FORMAT_VERSION, appVersion, team: team.trim(), modul, stufe, szenario: null, erstellt: zeit, geaendert: zeit, inhalt: {} };
}

export function serialisieren(p: Projekt, jetzt = new Date()): string {
  return JSON.stringify({ ...p, geaendert: jetzt.toISOString() }, null, 1);
}

/** Liest eine Projektdatei. Wirft ProjektFehler mit einer Meldung, die Kinder verstehen. */
export function einlesen(text: string): Projekt {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new ProjektFehler('Diese Datei ist kein Projekt dieser App.');
  }
  if (!roh || typeof roh !== 'object' || (roh as { format?: unknown }).format !== FORMAT) {
    throw new ProjektFehler('Diese Datei ist kein Projekt dieser App.');
  }
  const p = roh as Partial<Projekt>;
  if (typeof p.formatVersion !== 'number' || p.formatVersion > FORMAT_VERSION) {
    throw new ProjektFehler('Dieses Projekt stammt aus einer neueren Fassung der App. Lade die Seite neu, um sie zu aktualisieren.');
  }
  const stufe = p.stufe === 2 || p.stufe === 3 ? p.stufe : 1;
  const modul: ModulId = p.modul === 'bilder' || p.modul === 'sprache' ? p.modul : 'tabellen';
  return {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    appVersion: String(p.appVersion ?? ''),
    team: typeof p.team === 'string' ? p.team : '',
    modul,
    stufe,
    szenario: typeof p.szenario === 'string' ? p.szenario : null,
    erstellt: String(p.erstellt ?? ''),
    geaendert: String(p.geaendert ?? ''),
    inhalt: p.inhalt && typeof p.inhalt === 'object' ? (p.inhalt as Record<string, unknown>) : {}
  };
}

export function dateiname(p: Projekt, jetzt = new Date()): string {
  const team = p.team.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'Projekt';
  const tag = jetzt.toISOString().slice(0, 10);
  return `ML-Schule ${team} ${tag}.json`;
}

export type SpeicherErgebnis = 'geteilt' | 'heruntergeladen' | 'abgebrochen';

/** Speichert über das Teilen-Menü (iPad: „In Dateien sichern“) oder als Download. */
export async function speichernAlsDatei(p: Projekt): Promise<SpeicherErgebnis> {
  const text = serialisieren(p);
  const name = dateiname(p);
  const datei = new File([text], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [datei] })) {
    try {
      await nav.share({ files: [datei], title: name });
      return 'geteilt';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'abgebrochen';
      // anderer Fehler: auf Download ausweichen
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'heruntergeladen';
}

export async function ausDateiLesen(datei: File): Promise<Projekt> {
  return einlesen(await datei.text());
}
