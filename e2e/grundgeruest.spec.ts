import { expect, test } from '@playwright/test';

test('Start ohne Anmeldung zeigt Galerie, Stufen und Module (FR-01, FR-02)', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Neues Projekt' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Lernen aus Tabellen/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('radio', { name: '1' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Herausgegeben von Andreas Norren')).toBeVisible();
});

test('Stufe wechseln und Arbeitsansicht mit Bereichen (FR-03, BK-D)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Schulkiosk/ }).click();
  await expect(page.getByRole('complementary', { name: 'Bereiche' })).toBeVisible();
  for (const b of ['Daten', 'Modell', 'Training', 'Vorhersage']) await expect(page.getByRole('button', { name: b, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Trainieren/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '3D' })).toHaveCount(0);
  await page.getByRole('radio', { name: '2' }).click();
  await expect(page.getByRole('button', { name: 'Daten', exact: true })).toHaveAttribute('aria-expanded', 'false');
  // 3D nur bei zwei Eingaben (FR-21)
  await expect(page.getByRole('button', { name: '3D' })).toHaveCount(0);
});

test('Letzter Stand bleibt nach Neuladen erhalten (FR-06) und Neu beginnen fragt nach (FR-07)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Hitzefrei/ }).click();
  await page.reload();
  await expect(page.getByText('Weiterarbeiten')).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Neu beginnen' }).click();
  await expect(page.getByText('Weiterarbeiten')).toHaveCount(0);
});

test('Projektdatei speichern und wieder öffnen (FR-04, FR-05)', async ({ page }) => {
  // Im Testbrowser gibt es kein Teilen-Menü: Download-Weg erzwingen. Das Teilen-Menü prüft MV-01 auf dem iPad.
  await page.addInitScript(() => Object.defineProperty(navigator, 'canShare', { value: () => false }));
  await page.goto('./');
  await page.getByRole('button', { name: /Torschuss/ }).click();
  await page.getByRole('radio', { name: '3' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Speichern' }).click();
  const datei = await (await download).path();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Neu beginnen' }).click();
  await page.locator('input[type=file]').setInputFiles(datei!);
  await expect(page.getByText('Projekt geöffnet.')).toBeVisible();
  await expect(page.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'true');
});

test('Machbarkeitstest zeigt Gerätedaten und 3D-Fläche', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Machbarkeitstest öffnen' }).click();
  await expect(page.getByText('OQ-04 · Gerätedaten')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
});
