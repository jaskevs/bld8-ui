import { test, expect } from '@playwright/test';

test('tab indicator follows interrupted selection and keyboard input', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/motion');
  const tabs = page.getByRole('tablist', { name: 'Study stage' });
  const indicator = tabs.locator('.bui-tab-indicator');
  await tabs.getByRole('tab', { name: 'Building', exact: true }).click();
  expect(await indicator.evaluate(el => el.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);
  await tabs.getByRole('tab', { name: 'Review', exact: true }).click();
  await tabs.getByRole('tab', { name: 'Idea', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const active = tabs.getByRole('tab', { name: 'Building', exact: true });
  await expect(active).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Building', exact: true })).toContainText('Taking shape.');
  await expect(page.locator('.bui-tab-panel:visible')).toHaveCount(1);
  await expect.poll(async () => indicator.evaluate(el => {
    const selected = el.parentElement!.querySelector('[aria-selected="true"]')!.getBoundingClientRect();
    const line = el.getBoundingClientRect();
    return Math.abs(line.left - selected.left) < 1 && Math.abs(line.width - selected.width) < 1;
  })).toBe(true);
});

test('save feedback preserves the button size and hover target', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/motion');
  const button = page.getByRole('button', { name: 'Save preference' });
  await page.evaluate(() => document.fonts.ready);
  await button.scrollIntoViewIfNeeded();
  const initial = await button.boundingBox();
  const layout = await button.evaluate(el => ({ width: el.offsetWidth, height: el.offsetHeight }));
  await button.hover();
  await expect.poll(() => button.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  expect(await button.boundingBox()).toEqual(initial);
  await page.clock.install();
  await button.click();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toBeDisabled();
  expect(await button.evaluate(el => ({ width: el.offsetWidth, height: el.offsetHeight }))).toEqual(layout);
  await page.clock.fastForward(800);
  await expect(button).toBeEnabled();
  await expect(page.getByRole('status').filter({ hasText: 'Saved for this session.' })).toBeVisible();
});

test('animated dialogs and sheets dismiss and return focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/motion');
  for (const label of ['Open a dialog', 'Open a sheet']) {
    const trigger = page.getByRole('button', { name: label, exact: true });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test('reduced motion keeps state changes immediate', async ({ page }) => {
  await page.goto('/motion');
  await page.getByRole('tab', { name: 'Review', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Look a little closer.');
  const styles = await page.locator('.bui-tab-indicator').evaluate(el => ({ duration: getComputedStyle(el).transitionDuration, animations: el.getAnimations().length }));
  expect(styles).toEqual({ duration: '0s', animations: 0 });
  expect(await page.getByRole('switch', { name: 'Weekly digest' }).evaluate(el => getComputedStyle(el, '::after').transitionDuration)).toBe('0s');
  await page.getByRole('button', { name: 'Give the content room.' }).click();
  await expect(page.getByText('The panel opens from its own edge.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Open a dialog', exact: true }).click();
  expect(await page.getByRole('dialog').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
});