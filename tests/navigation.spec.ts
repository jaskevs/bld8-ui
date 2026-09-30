import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) test('floating navigation stays visible at ' + width + 'px', async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/examples');
  await page.evaluate(() => window.scrollTo(0, 800));
  const header = page.locator('.site-header');
  await expect(header).toHaveAttribute('data-scrolled', 'true');
  await expect.poll(async () => (await header.boundingBox())?.y).toBe(width < 761 ? 8 : 12);
  if (width < 761) await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Motion', exact: true }).click();
  await expect(page).toHaveURL(/\/motion$/);
  if (width < 761) {
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).not.toBeVisible();
  }
});

test('mobile navigation closes with Escape and an outside click', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'Components', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(navigation).not.toBeVisible();
  await menu.click();
  await page.locator('.hero-copy .lead').click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).not.toBeVisible();
});