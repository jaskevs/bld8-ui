import { test, expect, type Page } from '@playwright/test';

async function example(page: Page, id: string) {
  const region = page.locator('[data-example-id="' + id + '"]');
  const run = region.getByRole('button', { name: 'Run example', exact: true });
  if (await run.isVisible()) await run.click();
  await expect(region.locator('[data-example-ready]')).toBeVisible();
  return region;
}

test('navigation keeps real links, disabled destinations and the current page distinct from its flyout', async ({ page }) => {
  await page.goto('/components/navigation-menu');
  const region = await example(page, 'navigation-product');
  await expect(region.getByRole('link', { name: 'Plan', exact: true })).toHaveAttribute('aria-current', 'page');
  const trigger = region.getByRole('button', { name: 'Product', exact: true });
  await trigger.focus(); await trigger.press('ArrowDown');
  const popup = page.getByRole('navigation', { name: 'Product destinations', exact: true });
  await expect(popup).toBeVisible();
  const disabled = popup.getByRole('link', { name: 'Audit log', exact: false });
  await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  await expect(disabled).not.toHaveAttribute('href');
  await popup.getByRole('link', { name: 'Projects', exact: false }).click();
  await expect(page).toHaveURL(/#nav-product-projects$/); await expect(popup).toBeHidden();
});

test('navigation enters links by keyboard and Escape restores its trigger', async ({ page }) => {
  await page.goto('/components/navigation-menu');
  const region = await example(page, 'navigation-documentation');
  const trigger = region.getByRole('button', { name: 'Documentation', exact: true });
  await trigger.focus(); await trigger.press('Enter');
  const popup = page.getByRole('navigation', { name: 'Documentation links', exact: true });
  await expect(popup).toBeVisible();
  await trigger.press('Tab');
  await expect(popup.getByRole('link', { name: 'Installation', exact: false })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(popup).toBeHidden(); await expect(trigger).toBeFocused();
});

test('navigation preserves shared popup dimensions through interrupted switching and close', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/components/navigation-menu');
  const region = await example(page, 'navigation-product');
  const product = region.getByRole('button', { name: 'Product', exact: true });
  const learn = region.getByRole('button', { name: 'Learn', exact: true });
  await product.click();
  const popup = page.locator('.bui-navigation-popup[aria-label="Product destinations"]');
  await expect(popup).toBeVisible();
  await expect.poll(async () => (await popup.boundingBox())?.height ?? 0).toBeGreaterThan(100);
  await learn.hover(); await expect(learn).toHaveAttribute('aria-expanded', 'true');
  await product.hover(); await expect(product).toHaveAttribute('aria-expanded', 'true');
  const before = await popup.boundingBox();
  await product.focus();
  await popup.evaluate(element => {
    const record = { size: null as { width: number; height: number } | null };
    (window as Window & { navigationExit?: typeof record }).navigationExit = record;
    const observer = new MutationObserver(() => {
      if (!element.hasAttribute('data-ending-style')) return;
      const box = element.getBoundingClientRect(); record.size = { width: box.width, height: box.height }; observer.disconnect();
    });
    observer.observe(element, { attributes: true, attributeFilter: ['data-ending-style'] });
  }); // The awaited evaluation acknowledges that the observer is installed before Escape.
  await page.keyboard.press('Escape');
  await expect(product).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => page.evaluate(() => (window as Window & { navigationExit?: { size: { width: number; height: number } | null } }).navigationExit?.size ?? null)).not.toBeNull();
  const during = await page.evaluate(() => (window as Window & { navigationExit?: { size: { width: number; height: number } | null } }).navigationExit?.size);
  expect(during!.width).toBeGreaterThan(before!.width * .7); expect(during!.height).toBeGreaterThan(before!.height * .7);
  await expect(popup).toBeHidden();
  await product.press('Enter'); await expect(popup).toBeVisible();
  await expect(popup.getByRole('link', { name: 'Projects', exact: false })).toBeVisible();
});

test('nested inline navigation changes its controlled directory and follows a nested destination', async ({ page }) => {
  await page.goto('/components/navigation-menu');
  const region = await example(page, 'navigation-nested');
  await region.getByRole('button', { name: 'Library', exact: true }).click();
  await expect(region.getByRole('status')).toHaveText('Open directory: Library');
  const popup = page.getByRole('navigation', { name: 'Library destinations', exact: true });
  await expect(popup.getByRole('link', { name: 'Design tokens', exact: false })).toBeVisible();
  await popup.getByRole('button', { name: 'Workflows', exact: true }).click();
  await expect(popup.getByRole('link', { name: 'Record review', exact: false })).toBeVisible();
  await expect(popup.getByRole('button', { name: 'Archive', exact: true })).toBeDisabled();
  await popup.getByRole('link', { name: 'Upload queue', exact: false }).click();
  await expect(page).toHaveURL(/#nav-nested-upload$/);
  await expect(region.getByRole('status')).toHaveText('Directory closed');
});

test('navigation contains grouped and long-label content on narrow screens and responds to live reduced motion', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 }); await page.goto('/components/navigation-menu');
    const directory = await example(page, 'navigation-documentation');
    await directory.getByRole('button', { name: 'Documentation', exact: true }).click();
    const popup = page.locator('.bui-navigation-popup[aria-label="Documentation links"]'); await expect(popup).toBeVisible();
    const box = await popup.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    await page.keyboard.press('Escape');
    const bounded = await example(page, 'navigation-boundary');
    const trigger = bounded.getByRole('button', { name: 'Administration and team permissions', exact: true });
    await trigger.click(); const panel = page.locator('.bui-navigation-popup[aria-label="Administration destinations"]'); await expect(panel).toBeVisible();
    const panelBox = await panel.boundingBox(); expect(panelBox!.x).toBeGreaterThanOrEqual(0); expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(width + 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await panel.evaluate(element => getComputedStyle(element).transitionDuration)).toMatch(/^0s(?:, 0s)*$/);
    await page.keyboard.press('Escape'); await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
