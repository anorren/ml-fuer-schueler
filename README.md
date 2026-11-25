# Machine Learning für Schüler

Praxis-App zum Informatikunterricht der Sekundarstufe I: Schülerinnen und Schüler probieren maschinelles Lernen aus, ohne Konto, offline und auf älteren Klassen-iPads. Herausgegeben von **Andreas Norren** · [andreasnorren.de](https://andreasnorren.de) · [LinkedIn](https://www.linkedin.com/in/andreas-norren-644819414/)

**Stand:** Etappe 1 (Rahmen): Galerie mit Modulen und Lehrplanbezug, Stufen, Teamname, Projektdatei, letzter Stand, Neu beginnen, Hilfemodus, „i“-Infobereiche, antippbare Begriffe und regelbasierte Tipps. Etappe 2 begonnen: Schulkiosk mit Gerade, sichtbarem Training, Vorhersage, Testdaten und Tabelle; Lernrate ab Stufe 2, Formeln und Rechenweg auf Stufe 3. Dazu Hitzefrei (Klasse mit Wahrscheinlichkeit, Klassenbereich und Grenze) und Fahrrad-Bremsweg; ab Stufe 2 Modellwahl Gerade, S-Kurve oder Netz mit einstellbarer Neuronenzahl. Torschuss mit zwei Merkmalen: Draufsicht mit Bereich und Grenze, ab Stufe 2 eine drehbare 3D-Fläche (Canvas). Eigenes Thema mit selbst benannten Spalten, Vorlagen ohne Personenbezug und Datenschutzhinweis. Die Module folgen nacheinander: Lernen aus Tabellen, Bilder erkennen, Sprachmodell.

## Technik

TypeScript, Vite und Svelte 5; statische Web-App ohne Backend, offline über einen Service Worker, Projekte als Datei mit Versionskennung. Ausgeliefert über GitHub Pages unter `https://anorren.github.io/ml-fuer-schueler/`. Die Planung (Anforderungserhebung, Designentwurf) liegt außerhalb dieses Repositorys in Andreas' Werkstatt.

## Arbeiten

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npx playwright install webkit
```

```bash
npm run test:e2e
```

`npm run check` prüft Typen und Svelte-Komponenten, `npm run build` erzeugt `dist/`. Jeder Push auf `main` prüft und veröffentlicht über GitHub Actions.

## Datenschutz

Die App hat keine Anmeldung und keinen Server. Eingaben bleiben auf dem Gerät; Projekte speichern die Kinder selbst als Datei. GitHub liefert nur die App-Dateien aus.
