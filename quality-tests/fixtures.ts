import {test as base, expect, type Page, type TestInfo} from '@playwright/test';

export const test = base.extend({
  page: async ({page}, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // Changes Date only: animation frames, timers and save cancellation remain real.
    await page.clock.setFixedTime(new Date('2026-10-20T12:00:00.000Z'));
    await use(page);
    expect(errors, 'No uncaught browser errors during the workflow').toEqual([]);
  },
});
export {expect};

export async function openQualityPage(page: Page, path: string, info: TestInfo) {
  const theme = info.project.use.colorScheme === 'dark' ? 'dark' : 'light';
  await page.addInitScript(value => {
    document.addEventListener('DOMContentLoaded', () => { document.documentElement.dataset.uiTheme = value; }, {once:true});
  }, theme);
  await page.goto(path);
  expect(await page.evaluate(() => new Date().toISOString())).toBe('2026-10-20T12:00:00.000Z');
  await page.evaluate(value => { document.documentElement.dataset.uiTheme = value; }, theme);
  await expect(page.locator('html')).toHaveAttribute('data-ui-theme', theme);
  await page.evaluate(async () => { await document.fonts.ready; });
  // Both variable fonts ship locally via next/font/local; do not capture fallback fonts.
  await expect.poll(() => page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').length)).toBeGreaterThanOrEqual(2);
}

export async function expectContained(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'The page must fit the configured viewport').toBe(true);
}
