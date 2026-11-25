import { expect, test, type Page } from '@playwright/test';

// Etappe 2 · Schritt 3: Klassen mit Wahrscheinlichkeit (FR-14), Modellwahl Gerade, S-Kurve, Netz (FR-15), Klassenbereiche (FR-20)

const zahlAus = (t: string) => Number(t.replace(/[^\d,]/g, '').replace(',', '.'));
const fehlerWert = async (p: Page) => zahlAus(await p.locator('.fehler .wert').innerText());
const grenze = async (p: Page) => zahlAus((await p.locator('text.grenztext').first().textContent())!);

async function oeffnen(p: Page, name: RegExp, achse: RegExp) {
  await p.goto('./');
  await p.getByRole('button', { name }).click();
  await expect(p.getByRole('img', { name: achse })).toBeVisible();
}

async function trainieren(p: Page) {
  await p.getByRole('button', { name: /Trainieren/ }).click();
  await expect(p.getByRole('button', { name: /Trainieren/ })).toBeVisible({ timeout: 30_000 });
}

async function modellWaehlen(p: Page, name: string) {
  if (!(await p.locator('.wahl').isVisible())) await p.getByRole('button', { name: 'Modell', exact: true }).click();
  await p.locator('.wahl').getByRole('button', { name, exact: true }).click();
}

test('Hitzefrei sagt eine Klasse mit Wahrscheinlichkeit voraus, Bereich und Grenze sind sichtbar (FR-14, FR-19, FR-20)', async ({ page }) => {
  await oeffnen(page, /Hitzefrei/, /Wahrscheinlichkeit für „ja“/);
  await expect(page.getByText('Bereich „ja“')).toBeVisible();
  await expect(page.locator('circle.training.ja')).toHaveCount(5);
  await expect(page.locator('circle.training:not(.ja)')).toHaveCount(10);
  await trainieren(page);
  await expect(page.locator('rect.ja-bereich')).toHaveCount(1);
  expect(await grenze(page)).toBeGreaterThan(26.5);
  expect(await grenze(page)).toBeLessThan(28.5);
  await expect(page.locator('.fehler')).toContainText(/von 15 falsch eingeordnet/);
  await page.getByRole('button', { name: 'Vorhersage', exact: true }).click();
  await page.locator('#frage').fill('33');
  await page.locator('#frage').press('Enter');
  await expect(page.locator('.antwort')).toHaveText('ja');
  await expect(page.getByText(/^Wahrscheinlichkeit: \d+ %$/)).toBeVisible();
  await expect(page.getByText(/Von 2 ordnet es 2 richtig ein/)).toBeVisible();
});

test('Ein heißer Ausreißer verschiebt die Grenze der Geraden, die der S-Kurve kaum (FR-15)', async ({ page }) => {
  await oeffnen(page, /Hitzefrei/, /Wahrscheinlichkeit/);
  await page.getByRole('radio', { name: '2' }).click();
  const verschiebung = async (art: string) => {
    await modellWaehlen(page, art);
    await trainieren(page);
    const vorher = await grenze(page);
    await page.getByRole('button', { name: 'Tabelle', exact: true }).click();
    for (const t of ['38', '40']) {
      await page.locator('aside').getByRole('button', { name: '+ Zeile' }).click();
      const feld = page.locator('aside').getByLabel(/^Höchsttemperatur Zeile/).last();
      await feld.fill(t);
      await feld.press('Enter');
      await page.locator('aside').getByLabel(/^Hitzefrei Zeile/).last().selectOption('1');
    }
    await page.getByRole('button', { name: 'Tabelle', exact: true }).click();
    await modellWaehlen(page, art);
    await trainieren(page);
    const nachher = await grenze(page);
    // Ausreißer wieder entfernen
    await page.getByRole('button', { name: 'Tabelle', exact: true }).click();
    for (let k = 0; k < 2; k++) await page.locator('aside').getByRole('button', { name: /löschen$/ }).last().click();
    await page.getByRole('button', { name: 'Tabelle', exact: true }).click();
    return nachher - vorher;
  };
  expect(await verschiebung('Gerade')).toBeGreaterThan(0.4);
  expect(Math.abs(await verschiebung('S-Kurve'))).toBeLessThan(0.2);
});

test('Beim Bremsweg passt das Netz besser als die Gerade; Neuronen sind einstellbar (FR-15)', async ({ page }) => {
  await oeffnen(page, /Fahrrad-Bremsweg/, /Bremsweg \(m\)/);
  await trainieren(page);
  const gerade = await fehlerWert(page);
  expect(gerade).toBeGreaterThan(0.8);
  await page.getByRole('radio', { name: '2' }).click();
  await page.getByRole('button', { name: 'Modell', exact: true }).click();
  await expect(page.locator('.wahl').getByRole('button', { name: 'S-Kurve' })).toBeDisabled();
  await modellWaehlen(page, 'Netz');
  await expect(page.getByRole('img', { name: 'Netz mit 4 Neuronen in der Zwischenschicht' })).toBeVisible();
  await page.locator('#neuronen').evaluate((el: HTMLInputElement) => {
    el.value = '3';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.getByRole('img', { name: 'Netz mit 3 Neuronen in der Zwischenschicht' })).toBeVisible();
  await trainieren(page);
  expect(await fehlerWert(page)).toBeLessThan(gerade / 2);
});

test('Stufe 3 zeigt Formel der S-Kurve und Gewichte des Netzes (FR-18)', async ({ page }) => {
  await oeffnen(page, /Hitzefrei/, /Wahrscheinlichkeit/);
  await page.getByRole('radio', { name: '3' }).click();
  await trainieren(page);
  await page.getByRole('button', { name: 'Modell', exact: true }).click();
  await expect(page.locator('.formel')).toContainText(/z = [\d,]+ · Höchsttemperatur − [\d,]+/);
  await modellWaehlen(page, 'Netz');
  await expect(page.locator('table.gewichte tbody tr')).toHaveCount(4);
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await page.getByRole('button', { name: 'Ein Lernschritt' }).click();
  await expect(page.locator('.rechenweg')).toContainText(/v₁: −?[\d,]+ − 0,2 · /);
  await expect(page.locator('.rechenweg')).toContainText('Backpropagation');
});
