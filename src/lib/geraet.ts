// Geräteinfo für den Machbarkeitstest und OQ-04: Gerät, Betriebssystem, Safari-Version, Bildschirm, Speicher.

export interface GeraeteInfo {
  geraet: string;
  system: string;
  browser: string;
  bildschirm: string;
  pixeldichte: number;
  touch: boolean;
  online: boolean;
  speicher: string;
  serviceWorker: boolean;
  teilenMitDateien: boolean;
  userAgent: string;
}

export function systemAusUserAgent(ua: string, touchPunkte: number): { geraet: string; system: string; browser: string } {
  const safari = /Version\/([\d.]+).*Safari/.exec(ua)?.[1];
  const ios = /OS (\d+)_(\d+)(?:_(\d+))? like Mac OS X/.exec(ua);
  const ipadAlsMac = /Macintosh/.test(ua) && touchPunkte > 1; // iPadOS meldet sich seit 13 als Mac
  let geraet = 'unbekannt';
  let system = 'unbekannt';
  if (/iPad/.test(ua) || ipadAlsMac) geraet = 'iPad';
  else if (/iPhone/.test(ua)) geraet = 'iPhone';
  else if (/Android/.test(ua)) geraet = 'Android-Gerät';
  else if (/Macintosh/.test(ua)) geraet = 'Mac';
  else if (/Windows/.test(ua)) geraet = 'Windows-PC';
  if (ios) system = `iOS/iPadOS ${ios[1]}.${ios[2]}${ios[3] ? '.' + ios[3] : ''}`;
  else if (ipadAlsMac) system = safari ? `iPadOS (Safari ${safari} gehört zu iPadOS ${safari.split('.')[0]})` : 'iPadOS';
  else if (/Android ([\d.]+)/.test(ua)) system = 'Android ' + /Android ([\d.]+)/.exec(ua)![1];
  else if (/Mac OS X ([\d_]+)/.test(ua)) system = 'macOS';
  else if (/Windows NT/.test(ua)) system = 'Windows';
  let browser = 'unbekannt';
  if (/CriOS|Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome ' + (/(?:CriOS|Chrome)\/([\d.]+)/.exec(ua)?.[1] ?? '');
  else if (/Edg\//.test(ua)) browser = 'Edge ' + (/Edg\/([\d.]+)/.exec(ua)?.[1] ?? '');
  else if (/Firefox\//.test(ua)) browser = 'Firefox ' + (/Firefox\/([\d.]+)/.exec(ua)?.[1] ?? '');
  else if (safari) browser = 'Safari ' + safari;
  return { geraet, system, browser };
}

export async function geraeteInfo(): Promise<GeraeteInfo> {
  const ua = navigator.userAgent;
  const { geraet, system, browser } = systemAusUserAgent(ua, navigator.maxTouchPoints || 0);
  let speicher = 'nicht ermittelbar';
  try {
    const s = await navigator.storage?.estimate?.();
    if (s?.quota) speicher = `${Math.round((s.usage ?? 0) / 1024)} KB belegt von etwa ${Math.round(s.quota / 1024 / 1024)} MB`;
  } catch {
    /* ältere Safari-Fassungen */
  }
  const probe = new File(['{}'], 'probe.json', { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  return {
    geraet,
    system,
    browser,
    bildschirm: `${screen.width} × ${screen.height} pt (Fenster ${innerWidth} × ${innerHeight})`,
    pixeldichte: devicePixelRatio,
    touch: (navigator.maxTouchPoints || 0) > 0,
    online: navigator.onLine,
    speicher,
    serviceWorker: 'serviceWorker' in navigator,
    teilenMitDateien: !!(nav.canShare && nav.canShare({ files: [probe] })),
    userAgent: ua
  };
}
