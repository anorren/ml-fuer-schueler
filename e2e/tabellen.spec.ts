import { expect, test, type Page } from '@playwright/test';

// Etappe 2 · Modul „Lernen aus Tabellen“, Schulkiosk mit Gerade: FR-11, FR-12, FR-16, FR-19, FR-20, FR-22

const fehlerWert = async (p: Page) => Number((await p.locator('.fehler .wert').innerText()).replace(/[^\d,]/g, '').replace(',', '.'));

async function kiosk(p: Page) {
  await p.goto('./');
  await p.getByRole('button', { name: /Schulkiosk/ }).click();
  await expect(p.getByRole('img', { name: /Verkaufte Eis/ })).toBeVisible();
}

async function trainieren(p: Page) {
  await p.getByRole('button', { name: /Trainieren/ }).click();
  await expect(p.getByRole('button', { name: /Trainieren/ })).toBeVisible({ timeout: 20_000 });
}

test('Achsen tragen Name und Einheit, Daten sind als erfunden gekennzeichnet (FR-20, FR-10)', async ({ page }) => {
  await kiosk(page);
  await expect(page.getByText('Temperatur (°C)')).toBeVisible();
  await expect(page.getByText('Verkaufte Eis (Stück pro Tag)')).toBeVisible();
  await expect(page.getByText('Beispieldaten, erfunden')).toBeVisible();
  await expect(page.locator('circle.training')).toHaveCount(12);
  await expect(page.locator('rect.test')).toHaveCount(2);
});

test('Ein Lernschritt bewegt die Linie, Training senkt den Fehler sichtbar (FR-16)', async ({ page }) => {
  await kiosk(page);
  const linie = page.locator('line.modell');
  const vorher = await linie.getAttribute('y2');
  const fehlerStart = await fehlerWert(page);
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await page.getByRole('button', { name: 'Ein Lernschritt' }).click();
  await expect(page.getByText('Lernschritte: 1')).toBeVisible();
  expect(await linie.getAttribute('y2')).not.toBe(vorher);
  await expect(page.locator('line.abstand')).toHaveCount(12);
  await trainieren(page);
  expect(await fehlerWert(page)).toBeLessThan(fehlerStart / 5);
  await expect(page.locator('.fehler polyline')).toBeVisible();
});

test('Vorhersage für 28 °C mit Testdaten-Rückmeldung (FR-19, FR-22)', async ({ page }) => {
  await kiosk(page);
  await trainieren(page);
  await page.getByRole('button', { name: 'Vorhersage', exact: true }).click();
  await page.locator('#frage').fill('28');
  await page.locator('#frage').press('Enter');
  await expect(page.locator('.antwort')).toHaveText(/etwa 8\d Eis/);
  await expect(page.locator('rect.raute')).toBeVisible();
  await expect(page.getByText(/Dort liegt es im Mittel [\d,]+ Eis daneben/)).toBeVisible();
});

test('Punkt setzen im Diagramm und Zeile in der Tabelle ergänzen (FR-11, FR-12)', async ({ page }) => {
  await kiosk(page);
  await page.getByRole('button', { name: 'Daten', exact: true }).click();
  const box = (await page.locator('svg[role=img]').boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.35, box.y + box.height * 0.25);
  await expect(page.locator('circle.training')).toHaveCount(13);
  await expect(page.getByText(/^Ausgewählt:/)).toBeVisible();
  await page.getByRole('button', { name: 'Löschen', exact: true }).click();
  await expect(page.locator('circle.training')).toHaveCount(12);
  await page.getByRole('button', { name: '+ Zeile' }).click();
  await expect(page.locator('circle.training')).toHaveCount(13);
  await page.getByRole('checkbox', { name: /als Testdaten/ }).last().check();
  await expect(page.locator('rect.test')).toHaveCount(3);
});

test('Ausreißer verändert die Gerade nach erneutem Training (FR-11)', async ({ page }) => {
  await kiosk(page);
  await trainieren(page);
  const vorher = Number(await page.locator('line.modell').getAttribute('y2'));
  await page.getByRole('button', { name: 'Daten', exact: true }).click();
  await page.getByLabel('Verkaufte Eis Zeile 12').fill('10');
  await page.getByLabel('Verkaufte Eis Zeile 12').press('Enter');
  await page.getByRole('button', { name: 'Daten', exact: true }).click();
  await trainieren(page);
  expect(Number(await page.locator('line.modell').getAttribute('y2'))).toBeGreaterThan(vorher + 20);
});

test('Trainiertes Projekt übersteht Speichern und Öffnen (FR-04, FR-05)', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'canShare', { value: () => false }));
  await kiosk(page);
  await trainieren(page);
  const fehler = await page.locator('.fehler .wert').innerText();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Speichern/ }).click();
  const datei = await (await download).path();
  await page.getByRole('button', { name: 'Neu beginnen' }).click();
  await page.locator('input[type=file]').setInputFiles(datei!);
  await expect(page.getByText('Projekt geöffnet.')).toBeVisible();
  await expect(page.locator('.fehler .wert')).toHaveText(fehler);
});

test('Projekt aus Version 0.1.0 ohne Daten öffnet das Kiosk-Beispiel', async ({ page }) => {
  await page.goto('./');
  const alt = JSON.stringify({ format: 'ml-schule-projekt', formatVersion: 1, appVersion: '0.1.0', team: 'Alt', modul: 'tabellen', stufe: 1, szenario: 'Schulkiosk', erstellt: '', geaendert: '', inhalt: {} });
  await page.locator('input[type=file]').setInputFiles({ name: 'alt.json', mimeType: 'application/json', buffer: Buffer.from(alt) });
  await expect(page.locator('circle.training')).toHaveCount(12);
});
