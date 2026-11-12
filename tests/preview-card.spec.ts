import { test, expect, type Page } from '@playwright/test';

async function example(page: Page, id: string) {
  const region = page.locator('[data-example-id="' + id + '"]');
  const run = region.getByRole('button', { name: 'Run example', exact: true });
  if (await run.isVisible()) await run.click();
  await expect(region.locator('[data-example-ready]')).toBeVisible();
  return region;
}

test('person preview keeps its link and complete destination available and dismisses on Escape', async ({ page }) => {
  await page.goto('/components/preview-card'); const region = await example(page, 'preview-person');
  const link = region.getByRole('link', { name: 'Maya Chen', exact: true }); await link.hover();
  const popup = page.locator('.person-preview'); await expect(popup).toBeVisible();
  await expect(popup).toHaveAttribute('aria-hidden', 'true'); await expect(popup).toContainText('Design systems · Sydney');
  expect(await popup.locator('a,button,input,select,textarea,[tabindex="0"]').count()).toBe(0);
  await link.focus(); await page.keyboard.press('Escape'); await expect(popup).toBeHidden(); await expect(link).toBeFocused();
  await link.press('Enter'); await expect(page).toHaveURL(/#preview-person-details$/);
  await expect(region.locator('#preview-person-details')).toContainText('Maintains the shared component library');
});

test('focus may open the upstream visual preview while Enter keeps native navigation', async ({ page }) => {
  await page.goto('/components/preview-card'); const region = await example(page, 'preview-person');
  const link = region.getByRole('link', { name: 'Maya Chen', exact: true });
  await page.mouse.move(1, 1); await link.focus(); await expect(page.locator('.person-preview')).toBeVisible();
  await expect(link).toBeFocused(); await link.press('Enter'); await expect(page).toHaveURL(/#preview-person-details$/);
});

test('detached record links share one preview and switch typed metadata', async ({ page }) => {
  await page.goto('/components/preview-card'); const region = await example(page, 'preview-linked-records');
  await region.getByRole('link', { name: 'Atlas', exact: true }).hover(); const popup = page.locator('.record-preview');
  await expect(popup).toBeVisible(); await expect(popup.locator('[data-current]')).toContainText('Maya Chen');
  await region.getByRole('link', { name: 'Harbour', exact: true }).hover();
  await expect(popup.locator('[data-current]')).toContainText('Eli Morgan');
  await expect(popup.locator('[data-current]')).toContainText('narrow screens');
  await expect(page.locator('.record-preview')).toHaveCount(1);
  await page.keyboard.press('Escape'); await expect(popup).toBeHidden();
});

test('controlled reference preview associates its popup with the link and completes closing', async ({ page }) => {
  await page.goto('/components/preview-card'); const region = await example(page, 'preview-controlled');
  await region.getByRole('button', { name: 'Show visual preview', exact: true }).click();
  const popup = page.locator('.controlled-preview'); await expect(popup).toBeVisible();
  await expect(region.getByRole('status')).toContainText('Visual preview open');
  await expect(region.getByRole('status')).toContainText('Preview entered');
  await region.getByRole('button', { name: 'Hide visual preview', exact: true }).click();
  await expect(popup).toBeHidden(); await expect(region.getByRole('status')).toContainText('Preview exited');
  await expect(region.getByRole('link', { name: 'source update checklist', exact: true })).toHaveAttribute('href', '#preview-controlled-reference');
});

test('optional metadata can fail, retry and settle after an aborted load', async ({ page }) => {
  await page.goto('/components/preview-card'); const region = await example(page, 'preview-async-reference');
  await region.getByRole('checkbox', { name: 'Simulate metadata failure', exact: true }).check();
  await region.getByRole('button', { name: 'Retry metadata', exact: true }).click();
  const popup = page.locator('.async-reference-preview'); await expect(popup).toBeVisible(); await expect(popup).toContainText('Metadata could not be loaded');
  await region.getByRole('checkbox', { name: 'Simulate metadata failure', exact: true }).uncheck();
  await region.getByRole('button', { name: 'Retry metadata', exact: true }).click();
  await expect(popup).toContainText('Loading optional metadata');
  await page.keyboard.press('Escape'); await expect(popup).toBeHidden();
  await region.getByRole('button', { name: 'Retry metadata', exact: true }).click();
  await expect(popup).toContainText('Updated 12 November 2026'); await expect(popup).not.toContainText('could not be loaded');
});

test('preview respects viewport bounds and live reduced motion without page overflow', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 }); await page.goto('/components/preview-card');
    const region = await example(page, 'preview-person'); await region.getByRole('link', { name: 'Maya Chen', exact: true }).hover();
    const popup = page.locator('.person-preview'); await expect(popup).toBeVisible(); const box = await popup.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    await page.emulateMedia({ reducedMotion: 'reduce' }); expect(await popup.evaluate(element => getComputedStyle(element).transitionDuration)).toMatch(/^0s(?:, 0s)*$/);
    await page.keyboard.press('Escape'); await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test.describe('touch navigation', () => {
  test.use({ hasTouch: true });
  test('touch follows the person link without requiring a hover preview', async ({ page }) => {
    await page.goto('/components/preview-card'); const region = await example(page, 'preview-person');
    await region.getByRole('link', { name: 'Maya Chen', exact: true }).tap();
    await expect(page).toHaveURL(/#preview-person-details$/); await expect(page.locator('.person-preview')).toBeHidden();
  });
});
