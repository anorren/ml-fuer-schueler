import { expect, test, type Page } from '@playwright/test';

// Etappe 2 · Schritt 5: Eigenes Thema (FR-13, UAT-03)

async function leeresProjekt(p: Page) {
  await p.goto('./');
  await p.getByRole('button', { name: /Leeres Projekt/ }).click();
  await expect(p.getByRole('form', { name: 'Eigenes Thema' })).toBeVisible();
}

const feld = (p: Page, gruppe: string, name: string) => p.getByRole('group', { name: new RegExp(`^${gruppe}`) }).getByLabel(name, { exact: true });

test('Eigenes Thema anlegen, Datenschutzhinweis, Messwerte eintragen, trainieren, speichern (FR-13, UAT-03)', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'canShare', { value: () => false }));
  await leeresProjekt(page);
  await page.getByRole('button', { name: 'Thema anlegen' }).click();
  await expect(page.getByRole('alert')).toContainText('Gebt eurem Thema einen Namen.');

  await page.getByLabel('Name des Themas').fill('Unsere Murmelbahn');
  await feld(page, 'Eingabe', 'Name').fill('Name');
  await expect(page.getByRole('status')).toContainText('Datenschutz: „Name“ klingt nach Daten über Personen');
  await feld(page, 'Eingabe', 'Name').fill('Rampenhöhe');
  await expect(page.getByText(/^Datenschutz:/)).toHaveCount(0);
  await feld(page, 'Eingabe', 'Einheit').fill('cm');
  await feld(page, 'Eingabe', 'von').fill('0');
  await feld(page, 'Eingabe', 'bis').fill('50');
  await feld(page, 'Ergebnis', 'Name').fill('Rollweite');
  await feld(page, 'Ergebnis', 'Einheit').fill('cm');
  await feld(page, 'Ergebnis', 'von').fill('0');
  await feld(page, 'Ergebnis', 'bis').fill('300');
  await page.getByRole('button', { name: 'Thema anlegen' }).click();

  await expect(page.getByText('› Unsere Murmelbahn')).toBeVisible();
  await expect(page.getByRole('img', { name: /Rollweite \(cm\) über Rampenhöhe \(cm\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Trainieren/ })).toBeDisabled();
  for (const [h, w] of [[10, 70], [20, 120], [30, 170], [40, 220]]) {
    await page.getByRole('button', { name: '+ Zeile' }).click();
    const x = page.getByLabel(/^Rampenhöhe Zeile/).last(), y = page.getByLabel(/^Rollweite Zeile/).last();
    await x.fill(String(h));
    await x.press('Enter');
    await y.fill(String(w));
    await y.press('Enter');
  }
  await expect(page.locator('circle.training')).toHaveCount(4);
  await page.getByRole('button', { name: /Trainieren/ }).click();
  await expect(page.getByRole('button', { name: /Trainieren/ })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Vorhersage', exact: true }).click();
  await page.locator('#frage').fill('25');
  await page.locator('#frage').press('Enter');
  await expect(page.locator('.antwort')).toHaveText(/etwa 1[34]\d cm/);

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Speichern/ }).click();
  const datei = await (await download).path();
  await page.getByRole('button', { name: 'Neu beginnen' }).click();
  await page.locator('input[type=file]').setInputFiles(datei!);
  await expect(page.getByText('Projekt geöffnet.')).toBeVisible();
  await expect(page.getByText('› Unsere Murmelbahn')).toBeVisible();
  await expect(page.locator('circle.training')).toHaveCount(4);
});

test('Vorlage Wetterbeobachtung mit zwei Eingaben; Thema ändern warnt vor dem Löschen der Daten (FR-13)', async ({ page }) => {
  await leeresProjekt(page);
  await page.getByRole('button', { name: 'Wetterbeobachtung' }).click();
  await page.getByRole('button', { name: 'Thema anlegen' }).click();
  await expect(page.getByRole('img', { name: /Draufsicht: Bewölkung \(Achtel\) über Luftdruck \(hPa\)/ })).toBeVisible();
  await expect(page.getByText('Bereich „Regen“')).toBeVisible();
  const box = (await page.locator('svg[role=img]').boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.25);
  await expect(page.locator('circle.training')).toHaveCount(1);

  await page.getByRole('button', { name: 'Thema ändern' }).click();
  await expect(page.getByRole('form', { name: 'Eigenes Thema' })).toBeVisible();
  await page.getByRole('button', { name: 'eine Zahl' }).click();
  await expect(page.getByText('Die bisherigen 1 Zeilen werden dabei gelöscht.')).toBeVisible();
  await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect(page.locator('circle.training')).toHaveCount(1);
});
