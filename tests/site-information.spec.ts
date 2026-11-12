import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('portable package licence links resolve to the public usage terms', async ({ request }) => {
  const redirect = await request.get('/licensing', { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe('/plans');
  const page = await request.get('/licensing');
  expect(page.ok()).toBe(true);
  expect(await page.text()).toContain('MIT LICENCE / FREE SOURCE');
});

test('documentation navigation connects installation, agent guidance and source updates', async ({ page }) => {
  await page.goto('/docs');
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await expect(navigation.getByRole('link', { name: 'Docs', exact: true })).toHaveAttribute('aria-current', 'page');
  const main = page.getByRole('main');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  for (const [label, href] of [['Installation', '/getting-started'], ['Agents and MCP', '/agents'], ['Licence and usage', '/plans'], ['Source versions and updates', '/releases']]) {
    await expect(main.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href);
  }
  await main.getByRole('link', { name: 'React, Vite and Next.js', exact: true }).click();
  await expect(page).toHaveURL(/\/frameworks$/);
  await expect(navigation.getByRole('link', { name: 'Docs', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('scope labels describe examples without implying a paid upgrade or copyright transfer', async ({ page }) => {
  await page.goto('/blocks');
  const collection = page.getByRole('group', { name: 'Collection', exact: true });
  await expect(collection.getByRole('button', { name: 'Focused', exact: true })).toBeVisible();
  await collection.getByRole('button', { name: 'Complete', exact: true }).click();
  const cards = page.locator('.library-card');
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) await expect(card.locator('.collection-label')).toHaveText('MIT · Free');
  await page.goto('/plans');
  await expect(page.getByRole('main')).not.toContainText('Premium');
  await page.getByRole('button', { name: 'Do I need a visible BLD8 credit in my app?', exact: true }).click();
  await expect(page.getByText(/MIT does not require a visible BLD8 badge or footer credit/)).toBeVisible();
});
