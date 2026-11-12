import { test, expect } from '@playwright/test';

test('homepage installation action copies the runnable command without source boilerplate', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy installation command', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('npx shadcn@latest add https://ui.bld8.dev/r/button.json');
  await expect(page.getByRole('status').filter({ hasText: 'Command copied.' })).toBeVisible();
});

test('homepage form preview validates, saves local changes and resets canonical values', async ({ page }) => {
  await page.goto('/');
  const preview = page.locator('.marketing-live-preview');
  await preview.getByRole('tab', { name: 'Forms', exact: true }).click();
  const name = preview.getByRole('textbox', { name: 'Workspace name', exact: true });
  await name.fill('');
  await preview.getByRole('button', { name: 'Save changes', exact: true }).click();
  expect(await name.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
  await expect(preview.getByRole('status')).not.toContainText('Changes saved');
  await name.fill('Personal workspace');
  const slug = preview.getByRole('textbox', { name: 'Workspace slug', exact: true });
  await slug.fill('invalid slug');
  await preview.getByRole('button', { name: 'Save changes', exact: true }).click();
  expect(await slug.evaluate(element => (element as HTMLInputElement).validity.patternMismatch)).toBe(true);
  await expect(preview.getByRole('status')).not.toContainText('Changes saved');
  await slug.fill('personal');
  await preview.getByRole('combobox', { name: 'Activity digest', exact: true }).click();
  await page.getByRole('option', { name: 'Every day', exact: true }).click();
  await preview.getByRole('switch', { name: 'Project notifications', exact: true }).uncheck();
  await preview.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(preview.getByRole('status')).toContainText('Changes saved in this preview.');
  await preview.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(name).toHaveValue('Studio workspace');
  await expect(preview.getByRole('textbox', { name: 'Workspace slug', exact: true })).toHaveValue('studio');
  await expect(preview.getByRole('combobox', { name: 'Activity digest', exact: true })).toContainText('Once a week');
  await expect(preview.getByRole('switch', { name: 'Project notifications', exact: true })).toBeChecked();
});

test('homepage preview uses real keyboard tabs and checklist progress', async ({ page }) => {
  await page.goto('/');
  const preview = page.locator('.marketing-live-preview');
  const tables = preview.getByRole('tab', { name: 'Data tables', exact: true });
  await tables.focus();
  await page.keyboard.press('ArrowRight');
  const workflows = preview.getByRole('tab', { name: 'Workflows', exact: true });
  await expect(workflows).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(workflows).toHaveAttribute('aria-selected', 'true');
  const progress = preview.getByRole('progressbar', { name: 'Release progress', exact: true });
  await expect(progress).toHaveJSProperty('value', 2);
  await preview.getByRole('checkbox', { name: 'Connect the save callback', exact: true }).check();
  await expect(progress).toHaveJSProperty('value', 3);
  await preview.getByRole('button', { name: 'Clear checklist', exact: true }).click();
  await expect(progress).toHaveJSProperty('value', 0);
  await preview.getByRole('button', { name: 'Complete all', exact: true }).click();
  await expect(progress).toHaveJSProperty('value', 4);
  await expect(preview.getByText('Ready for review', { exact: true })).toBeVisible();
  await tables.click();
  await expect(preview.getByRole('link', { name: 'Explore data tables', exact: true })).toHaveAttribute('href', '/components/table');
});

for (const width of [320, 390, 768, 1440]) for (const theme of ['light', 'dark']) test(`marketing and documentation keep their page width at ${width}px in ${theme}`, async ({ context }) => {
  const errors: string[] = [];
  // Keep each document alive through the assertions. Forced full-document navigation
  // can abort WebKit's in-flight same-origin route prefetches during teardown.
  for (const route of ['/', '/docs', '/plans']) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 900 });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('live reduced motion makes marketing reveals readable without animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reveals = page.locator('.marketing-reveal');
  expect(await reveals.count()).toBeGreaterThan(0);
  await expect.poll(() => reveals.evaluateAll(elements => elements.every(element => {
    const style = getComputedStyle(element);
    return style.opacity === '1' && style.transform === 'none' && style.transitionDuration.split(',').every(value => parseFloat(value) === 0);
  }))).toBe(true);
});

for (const width of [1024, 1440]) test(`marketing card artwork and titles align within each row at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  const rows = await page.locator('.marketing-card-grid').evaluateAll(grids => grids.flatMap(grid => {
    const cards = [...grid.querySelectorAll('.library-card')].map(card => {
      const artwork = card.querySelector('.library-art')!.getBoundingClientRect();
      const title = card.querySelector('h2')!.getBoundingClientRect();
      return { top: artwork.top, bottom: artwork.bottom, title: title.top };
    });
    const groups: typeof cards[] = [];
    for (const card of cards) {
      const group = groups.find(items => Math.abs(items[0].top - card.top) < 1);
      if (group) group.push(card); else groups.push([card]);
    }
    return groups.filter(group => group.length > 1);
  }));
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    expect(Math.max(...row.map(card => card.bottom)) - Math.min(...row.map(card => card.bottom))).toBeLessThanOrEqual(1);
    expect(Math.max(...row.map(card => card.title)) - Math.min(...row.map(card => card.title))).toBeLessThanOrEqual(1);
  }
});

test('small-screen checklist indices remain on a single line', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Workflows', exact: true }).click();
  const indices = page.locator('.marketing-checklist-row>span');
  await expect(indices).toHaveCount(4);
  const heights = await indices.evaluateAll(elements => elements.map(element => ({ height: element.getBoundingClientRect().height, line: parseFloat(getComputedStyle(element).lineHeight) })));
  for (const item of heights) expect(item.height).toBeLessThanOrEqual(item.line + 1);
});

test('preview resizing moves through intermediate frames, accepts interruption and cancels for reduced motion', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const stage = page.locator('.marketing-preview-stage');
  const preview = page.locator('.marketing-live-preview');
  await preview.getByRole('tab', { name: 'Data tables', exact: true }).focus();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const before = (await stage.boundingBox())!.height;
  await stage.evaluate(element => {
    const samples: number[] = [];
    (element as HTMLElement & { motionSamples: number[] }).motionSamples = samples;
    const observer = new MutationObserver(() => {
      if (element.getAttribute('data-resizing') !== 'true') return;
      observer.disconnect();
      const sample = () => { samples.push(element.getBoundingClientRect().height); if (samples.length < 8) requestAnimationFrame(sample); };
      requestAnimationFrame(sample);
    });
    observer.observe(element, { attributes: true, attributeFilter: ['data-resizing'] });
  });
  await preview.getByRole('tab', { name: 'Forms', exact: true }).click();
  const target = (await page.locator('.marketing-preview-stage-content').boundingBox())!.height;
  expect(Math.abs(before - target)).toBeGreaterThan(8);
  await expect.poll(() => stage.evaluate(element => (element as HTMLElement & { motionSamples: number[] }).motionSamples.length)).toBeGreaterThan(1);
  const samples = await stage.evaluate(element => (element as HTMLElement & { motionSamples: number[] }).motionSamples);
  expect(samples.some(height => height > Math.min(before, target) + 0.5 && height < Math.max(before, target) - 0.5)).toBe(true);
  await preview.getByRole('tab', { name: 'Data tables', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(stage).not.toHaveAttribute('data-resizing', 'true');
  await expect.poll(() => stage.evaluate(element => element.getAnimations().length)).toBe(0);
  expect(await stage.evaluate(element => (element as HTMLElement).style.height)).toBe('');
  await page.setViewportSize({ width: 390, height: 900 });
  await expect.poll(async () => Math.abs((await stage.boundingBox())!.height - (await page.locator('.marketing-preview-stage-content').boundingBox())!.height)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
