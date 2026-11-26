import type { Page } from '@playwright/test';

/** Stufe über das Menü „Einstellungen“ wählen (DEC-16). */
export async function stufeWaehlen(page: Page, n: 1 | 2 | 3) {
  await page.getByRole('button', { name: 'Einstellungen', exact: true }).click();
  await page.getByRole('radiogroup', { name: 'Stufe' }).getByRole('radio', { name: new RegExp(`^${n} `) }).click();
  await page.getByRole('button', { name: 'Einstellungen schließen' }).click();
}
