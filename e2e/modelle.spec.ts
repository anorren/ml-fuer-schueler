import { expect, test, type Page } from '@playwright/test';

// Etappe 2 · Schritt 3 und 4: Klassen mit Wahrscheinlichkeit (FR-14), Modellwahl (FR-15), Klassenbereiche (FR-20), Torschuss mit Draufsicht und 3D (FR-19, FR-21)

const zahlAus = (t: string) => Number(t.replace(/[^\d,]/g, '').replace(',', '.'));
const fehlerWert = async (p: Page) => zahlAus(await p.locator('.fehler .wert').innerText());
const imMittel = async (p: Page) => Number((await p.getByText(/Dort liegt es im Mittel/).textContent())!.match(/im Mittel ([\d,]+)/)![1].replace(',', '.'));
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

test('Torschuss: Draufsicht mit Bereich „Tor“ und Vorhersage mit Wahrscheinlichkeit (FR-19, FR-20)', async ({ page }) => {
  await oeffnen(page, /Torschuss/, /Draufsicht: Winkel \(°\) über Entfernung \(m\)/);
  await expect(page.locator('circle.training.ja')).toHaveCount(11);
  await trainieren(page);
  expect(await page.locator('path.grenze').getAttribute('d')).toMatch(/^M/);
  expect(await page.locator('g.ja-bereich rect').count()).toBeGreaterThan(20);
  await page.getByRole('button', { name: 'Vorhersage', exact: true }).click();
  await page.locator('#frage').fill('8');
  await page.locator('#frage').press('Enter');
  await page.locator('#frage2').fill('10');
  await page.locator('#frage2').press('Enter');
  await expect(page.locator('.antwort')).toHaveText('Tor');
  await expect(page.getByText(/^Wahrscheinlichkeit: \d+ %$/)).toBeVisible();
  await expect(page.locator('g.etikett')).toContainText('8 m, 10 ° › Tor');
});

test('Torschuss: neue Punkte mit gewählter Klasse, Klasse wechseln (FR-11)', async ({ page }) => {
  await oeffnen(page, /Torschuss/, /Draufsicht/);
  await page.getByRole('button', { name: 'Daten', exact: true }).click();
  await page.getByRole('group', { name: 'Klasse neuer Punkte' }).getByRole('button', { name: 'kein Tor' }).click();
  const box = (await page.locator('svg[role=img]').boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.85, box.y + box.height * 0.3);
  await expect(page.locator('circle.training:not(.ja)')).toHaveCount(14);
  await page.getByRole('button', { name: 'Klasse wechseln' }).click();
  await expect(page.locator('circle.training.ja')).toHaveCount(12);
});

test('3D-Ansicht ab Stufe 2: drehen, zoomen, zurücksetzen (FR-21)', async ({ page }) => {
  await oeffnen(page, /Torschuss/, /Draufsicht/);
  await expect(page.getByRole('button', { name: '3D', exact: true })).toHaveCount(0);
  await page.getByRole('radio', { name: '2' }).click();
  await trainieren(page);
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.getByRole('img', { name: /3D-Ansicht: Wahrscheinlichkeit für „Tor“/ })).toBeVisible();
  const leinwand = page.locator('canvas');
  const start = await leinwand.getAttribute('data-drehung');
  const c = (await leinwand.boundingBox())!;
  await page.mouse.move(c.x + c.width * 0.3, c.y + c.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(c.x + c.width * 0.3 + 100, c.y + c.height * 0.4, { steps: 6 });
  await page.mouse.up();
  expect(await leinwand.getAttribute('data-drehung')).not.toBe(start);
  // Das iPad kennt kein Mausrad; das Zoomen mit zwei Fingern wird hier über das Rad-Ereignis des Rechners geprüft.
  await leinwand.dispatchEvent('wheel', { deltaY: -300 });
  await expect(leinwand).not.toHaveAttribute('data-zoom', '1.00');
  await page.getByRole('button', { name: 'Ansicht zurücksetzen' }).click();
  // Zwei Finger auseinanderziehen vergrößert die Fläche
  await leinwand.evaluate((el) => {
    const p = (typ: string, id: number, x: number) => el.dispatchEvent(new PointerEvent(typ, { pointerId: id, clientX: x, clientY: 300, bubbles: true, pointerType: 'touch' }));
    p('pointerdown', 11, 400);
    p('pointerdown', 12, 500);
    p('pointermove', 12, 600);
    p('pointerup', 11, 400);
    p('pointerup', 12, 600);
  });
  await expect(leinwand).toHaveAttribute('data-zoom', '2.00');
  await page.getByRole('button', { name: 'Ansicht zurücksetzen' }).click();
  await expect(leinwand).toHaveAttribute('data-drehung', start!);
  await expect(leinwand).toHaveAttribute('data-zoom', '1.00');
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.getByRole('img', { name: /Draufsicht/ })).toBeVisible();
});

test('Bias im Kiosk: Sommerdaten liegen beim Wintertag daneben, Wintertage beheben es (FR-23)', async ({ page }) => {
  await oeffnen(page, /Bias im Kiosk/, /Verkaufte Eis/);
  await expect(page.getByText('keine Trainingsdaten')).toBeVisible();
  await trainieren(page);
  await page.getByRole('button', { name: 'Vorhersage', exact: true }).click();
  await page.locator('#frage').fill('3');
  await page.locator('#frage').press('Enter');
  await expect(page.locator('.antwort')).toHaveText(/etwa −\d+ Eis/);
  await expect(page.getByText('Für diesen Wert gibt es keine Trainingsdaten.', { exact: false })).toBeVisible();
  const vorher = await imMittel(page);
  expect(vorher).toBeGreaterThan(20);
  await page.getByRole('button', { name: 'Tipp schließen' }).click();

  await page.getByRole('button', { name: 'Daten', exact: true }).click();
  await expect(page.getByText(/nur von Sommertagen/)).toBeVisible();
  await page.getByRole('button', { name: /Wintertage ergänzen/ }).click();
  await expect(page.locator('circle.training')).toHaveCount(24);
  await expect(page.getByText('keine Trainingsdaten')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Wintertage ergänzen/ })).toHaveCount(0);
  await trainieren(page);
  await page.getByRole('button', { name: 'Vorhersage', exact: true }).click();
  await expect(page.locator('.antwort')).toHaveText(/etwa \d+ Eis/);
  expect(await imMittel(page)).toBeLessThan(8);
});
