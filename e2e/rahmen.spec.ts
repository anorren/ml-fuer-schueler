import { expect, test } from '@playwright/test';
import { stufeWaehlen } from './hilfe';

// Etappe 1 · Rahmen: FR-02, FR-03, FR-06, FR-08, FR-09, FR-24

test('Module als Reiter mit Lehrplanbereich, ohne Nummern (FR-02)', async ({ page }) => {
  await page.goto('./');
  const reiter = page.getByRole('tab');
  await expect(reiter).toHaveCount(3);
  for (const text of await reiter.allInnerTexts()) {
    expect(text).toContain('Intelligente Maschinen');
    expect(text).not.toMatch(/^\s*\d/);
  }
  await expect(page.getByRole('tab', { name: /Bilder erkennen/ })).toBeDisabled();
});

test('Stufe bleibt ohne Projekt nach Neuladen erhalten (FR-03)', async ({ page }) => {
  await page.goto('./');
  await stufeWaehlen(page, 3);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Einstellungen, Stufe 3' })).toBeVisible();
});

test('Stufe 2 blendet den Reiter 3D ein, Stufe 1 wieder aus (FR-03)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Torschuss/ }).click();
  await expect(page.getByRole('button', { name: '3D' })).toHaveCount(0);
  await stufeWaehlen(page, 2);
  await expect(page.getByRole('button', { name: '3D' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Draufsicht' })).toHaveAttribute('aria-pressed', 'true');
  await stufeWaehlen(page, 1);
  await expect(page.getByRole('button', { name: '3D' })).toHaveCount(0);
});

test('Nur ein Bereich ist offen; „Vergrößern“ blendet die Bereiche aus (BK-D)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Schulkiosk/ }).click();
  const daten = page.getByRole('button', { name: 'Daten', exact: true });
  const training = page.getByRole('button', { name: 'Training', exact: true });
  await daten.click();
  await expect(daten).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(/Tippt ins Diagramm, um einen Punkt zu setzen/)).toBeVisible();
  await training.click();
  await expect(training).toHaveAttribute('aria-expanded', 'true');
  await expect(daten).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByText('noch nicht trainiert')).toBeVisible();
  // Die Seite scrollt nicht; alles passt in das Fenster
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  await page.getByRole('button', { name: /Vergrößern/ }).click();
  await expect(page.getByRole('complementary', { name: 'Bereiche' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Trainieren/ })).toBeVisible();
  await page.getByRole('button', { name: /Bereiche zeigen/ }).click();
  await expect(page.getByRole('complementary', { name: 'Bereiche' })).toBeVisible();
});

test('Teamname landet im Dateinamen und im letzten Stand (FR-08, FR-06)', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'canShare', { value: () => false }));
  await page.goto('./');
  await page.getByRole('button', { name: /Hitzefrei/ }).click();
  const feld = page.getByRole('textbox', { name: 'Teamname' });
  await expect(feld).toHaveAttribute('placeholder', /Fantasiename/);
  await feld.fill('Die Pinguine');
  await feld.press('Enter');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Speichern' }).click();
  expect((await download).suggestedFilename()).toMatch(/^ML-Schule Die Pinguine \d{4}-\d\d-\d\d\.json$/);
  // Meldungen bleiben stehen, bis man sie wegtippt (Apple HIG: keine Zeitabläufe)
  const meldung = page.getByRole('status').filter({ hasText: 'Projektdatei gespeichert' });
  await page.waitForTimeout(5000);
  await expect(meldung).toBeVisible();
  await page.getByRole('button', { name: 'Meldung schließen' }).click();
  await expect(meldung).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Teamname' })).toHaveValue('Die Pinguine');
  await page.getByRole('button', { name: 'Zur Startseite' }).click();
  await expect(page.getByText('Hitzefrei? · Die Pinguine')).toBeVisible();
  await expect(page.getByText('Das ist keine Sicherung')).toBeVisible();
});

test('Hilfemodus erklärt einen Knopf, statt ihn auszulösen (FR-09)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Hilfe', exact: false }).first().click();
  await expect(page.getByText('Hilfe an:')).toBeVisible();
  await page.getByRole('button', { name: 'Einstellungen, Stufe 1' }).click();
  const blase = page.getByRole('tooltip');
  await expect(blase).toContainText('Öffnet die Einstellungen');
  await expect(page.getByRole('dialog', { name: 'Einstellungen' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Einstellungen, Stufe 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Hilfe aus' }).click();
  await expect(blase).toHaveCount(0);
  await stufeWaehlen(page, 3);
  await expect(page.getByRole('button', { name: 'Einstellungen, Stufe 3' })).toBeVisible();
});

test('„i“ öffnet den Infobereich, Begriffe erklären sich beim Antippen (FR-24)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Schulkiosk/ }).click();
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await page.getByRole('button', { name: 'Info zu Training' }).click();
  await expect(page.getByRole('note')).toContainText('verschiebt die App das Modell');
  await page.getByRole('note').getByRole('button', { name: 'Lernrate' }).click();
  await expect(page.getByRole('tooltip')).toContainText('wie groß jeder Lernschritt ist');
  await page.getByRole('button', { name: 'Erklärung schließen' }).click();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Training', exact: true, expanded: true }).click();
  await expect(page.getByRole('note')).toHaveCount(0);
});

test('Nach zehn Minuten ohne Speichern erscheint ein wegtippbarer Tipp (FR-24)', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  await page.getByRole('button', { name: /Bremsweg/ }).click();
  await expect(page.getByText('länger nicht gespeichert')).toHaveCount(0);
  await page.clock.fastForward('10:30');
  await expect(page.getByText('länger nicht gespeichert')).toBeVisible();
  await page.getByRole('button', { name: 'Tipp schließen' }).click();
  await expect(page.getByText('länger nicht gespeichert')).toHaveCount(0);
});

test('Dunkelmodus folgt der Einstellung des Geräts (Apple HIG, H9)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('./');
  await page.getByRole('button', { name: /Schulkiosk/ }).click();
  const hintergrund = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(hintergrund).toBe('rgb(22, 22, 24)');
  // Knöpfe behalten ein Blau, auf dem weiße Schrift lesbar bleibt
  await expect(page.getByRole('button', { name: /Trainieren/ })).toHaveCSS('background-color', 'rgb(38, 112, 204)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(249, 249, 247)');
});

test('Menü „Einstellungen“: Stufe und Darstellung hell, dunkel, wie das iPad (DEC-16)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Schulkiosk/ }).click();
  const knopf = page.getByRole('button', { name: 'Einstellungen, Stufe 1' });
  await knopf.click();
  const menue = page.getByRole('dialog', { name: 'Einstellungen' });
  await expect(menue.getByRole('radio', { name: /^1 / })).toHaveAttribute('aria-checked', 'true');
  await menue.getByRole('radio', { name: /^2 / }).click();
  await expect(page.getByRole('button', { name: 'Einstellungen, Stufe 2' })).toBeVisible();
  // Darstellung unabhängig vom System
  await page.emulateMedia({ colorScheme: 'light' });
  await menue.getByRole('radio', { name: 'Dunkel' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-thema', 'dunkel');
  // Antippen außerhalb schließt das Menü
  await page.mouse.click(300, 400);
  await expect(menue).toHaveCount(0);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-thema', 'dunkel');
  await page.getByRole('button', { name: /^Einstellungen, Stufe/ }).click();
  await page.getByRole('dialog', { name: 'Einstellungen' }).getByRole('radio', { name: 'Wie das iPad' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-thema', 'hell');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-thema', 'dunkel');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Einstellungen' })).toHaveCount(0);
});
