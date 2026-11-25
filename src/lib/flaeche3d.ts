// DEC-06 / MV-03: leichte 3D-Flächengrafik ohne Bibliothek. Gitter n × n über [0,1]², Höhe f(x, y) in [0,1].
// Zeichnen mit Maleralgorithmus (hintere Vierecke zuerst) auf Canvas 2D.

export interface Ansicht {
  drehung: number; // um die senkrechte Achse, Bogenmaß
  neigung: number; // Blick von oben, Bogenmaß (0 = waagerecht)
  zoom: number;
}

export interface Viereck {
  ecken: [number, number][]; // Bildschirmkoordinaten
  tiefe: number;
  hoehe: number; // mittlere Höhe 0..1
}

export function gitter(n: number, f: (x: number, y: number) => number): number[][] {
  const z: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const zeile: number[] = [];
    for (let j = 0; j <= n; j++) zeile.push(Math.min(1, Math.max(0, f(i / n, j / n))));
    z.push(zeile);
  }
  return z;
}

/** Projiziert einen Punkt (x, y in 0..1, z in 0..1) auf den Bildschirm; liefert [sx, sy, tiefe]. */
export function projiziere(x: number, y: number, z: number, a: Ansicht, breite: number, hoehe: number): [number, number, number] {
  const px = x - 0.5, py = y - 0.5, pz = (z - 0.5) * 0.6;
  const c = Math.cos(a.drehung), s = Math.sin(a.drehung);
  const rx = px * c - py * s;
  const ry = px * s + py * c;
  const cn = Math.cos(a.neigung), sn = Math.sin(a.neigung);
  const bildY = ry * sn - pz * cn;
  const tiefe = ry * cn + pz * sn;
  const massstab = Math.min(breite, hoehe) * 0.75 * a.zoom;
  return [breite / 2 + rx * massstab, hoehe / 2 + bildY * massstab, tiefe];
}

export function vierecke(z: number[][], a: Ansicht, breite: number, hoehe: number): Viereck[] {
  const n = z.length - 1;
  const p = z.map((zeile, i) => zeile.map((h, j) => projiziere(i / n, j / n, h, a, breite, hoehe)));
  const liste: Viereck[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const e = [p[i][j], p[i + 1][j], p[i + 1][j + 1], p[i][j + 1]];
      liste.push({
        ecken: e.map(([sx, sy]) => [sx, sy] as [number, number]),
        tiefe: (e[0][2] + e[1][2] + e[2][2] + e[3][2]) / 4,
        hoehe: (z[i][j] + z[i + 1][j] + z[i + 1][j + 1] + z[i][j + 1]) / 4
      });
    }
  }
  // größere Tiefe = weiter hinten → zuerst zeichnen
  return liste.sort((u, v) => v.tiefe - u.tiefe);
}

/** Farbe der Fläche: helles bis kräftiges Blau je nach Höhe (Blau = Modell). */
export function flaechenFarbe(h: number): string {
  const hell = [230, 239, 251], kraeftig = [42, 120, 214];
  const m = (k: number) => Math.round(hell[k] + (kraeftig[k] - hell[k]) * h);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
}

export const sigmoid = (t: number) => 1 / (1 + Math.exp(-t));
