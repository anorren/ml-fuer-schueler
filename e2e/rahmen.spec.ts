import { expect, test } from '@playwright/test';

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
  await page.getByRole('radio', { name: '3' }).click();
  await page.reload();
  await expect(page.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'true');
});

test('Stufe 2 blendet Tabelle und 3D ein, Stufe 1 wieder aus (FR-03)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Schulkiosk/ }).click();
  await expect(page.getByRole('button', { name: '3D' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Tabelle/ })).toHaveCount(0);
  await page.getByRole('radio', { name: '2' }).click();
  await expect(page.getByRole('button', { name: '3D' })).toBeVisible();
  await page.getByRole('button', { name: /^Tabelle/ }).click();
  await expect(page.getByRole('complementary', { name: 'Tabelle' })).toBeVisible();
  await page.getByRole('radio', { name: '1' }).click();
  await expect(page.getByRole('button', { name: '3D' })).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: 'Tabelle' })).toHaveCount(0);
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
  await page.reload();
  await expect(page.getByText('Hitzefrei? · Die Pinguine')).toBeVisible();
  await expect(page.getByText('Das ist keine Sicherung')).toBeVisible();
});

test('Hilfemodus erklärt einen Knopf, statt ihn auszulösen (FR-09)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Hilfe', exact: false }).first().click();
  await expect(page.getByText('Hilfe an:')).toBeVisible();
  await page.getByRole('radio', { name: '3' }).click();
  const blase = page.getByRole('tooltip');
  await expect(blase).toContainText('Wählt, wie viel die App zeigt');
  await expect(page.getByRole('radio', { name: '1' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Hilfe aus' }).click();
  await expect(blase).toHaveCount(0);
  await page.getByRole('radio', { name: '3' }).click();
  await expect(page.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'true');
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
  await page.getByRole('button', { name: 'Training schließen' }).click();
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
