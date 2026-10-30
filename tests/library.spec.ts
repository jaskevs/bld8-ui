import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { components } from '../apps/docs/src/lib/catalog';

test('catalog filters by category and query, with working detail pages', async ({ page }) => {
  await page.goto('/components');
  await page.getByRole('button', { name: 'Forms', exact: false }).click();
  await expect(page.locator('.component-card')).toHaveCount(components.filter(item => item.category === 'Forms').length);
  await page.getByRole('searchbox', { name: 'Find a component' }).fill('combobox');
  await expect(page.locator('.component-card')).toHaveCount(1);
  await page.locator('.component-bottom').getByRole('link', { name: 'Combobox' }).click();
  await expect(page.getByRole('heading', { name: 'Combobox.', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'API & behaviour' })).toBeVisible();
});
test('dialog validates input, traps focus, submits and restores focus', async ({ page }) => {
  await page.goto('/components/dialog');
  const trigger = page.getByRole('button', { name: 'New project' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'A place to start.' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Create project' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Enter a project name.');
  for (let i=0; i<7; i++) { await page.keyboard.press('Tab'); await expect(dialog).toContainText('A place to start.'); expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true); }
  await dialog.getByLabel('Project name', { exact: true }).fill('Keyboard study');
  await dialog.getByRole('button', { name: 'Create project' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByText('Keyboard study is ready to explore.')).toBeVisible();
  await trigger.click(); await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
});
test('select works from the keyboard', async ({ page }) => {
  await page.goto('/components/select');
  const select = page.getByRole('combobox', { name: 'Project visibility' });
  await select.focus(); await page.keyboard.press('Space');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(select).toContainText('Team');
});
test('combobox filters, handles empty results and selects', async ({ page }) => {
  await page.goto('/components/combobox');
  const input = page.getByRole('combobox', { name: 'Framework', exact: true });
  await input.fill('NoSuchFramework'); await expect(page.getByText('No matching options.')).toBeVisible();
  await input.fill('Ang'); await page.getByRole('option', { name: 'Angular', exact: true }).click();
  await expect(input).toHaveValue('Angular');
});
test('tabs and accordions support keyboard interaction', async ({ page }) => {
  await page.goto('/components/tabs');
  await page.getByRole('tab', { name: 'Overview', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Activity', exact: true })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByRole('tabpanel')).toContainText('updated today');
  await page.goto('/components/accordion');
  await page.getByRole('button', { name: 'What is included?' }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByText('React components, shared design tokens, typed APIs and working examples.')).toBeVisible();
});
test('native switches and checkboxes expose their state', async ({ page }) => {
  await page.goto('/components/switch'); const toggle = page.getByRole('switch', { name: 'Activity notifications' }); await expect(toggle).toBeChecked(); await toggle.uncheck(); await expect(toggle).not.toBeChecked();
  await page.goto('/components/checkbox'); const checkbox = page.getByRole('checkbox', { name: 'Weekly summary' }); await checkbox.check(); await expect(checkbox).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Managed by your organisation' })).toBeDisabled();
});
test('menu selection runs the action and closes', async ({ page }) => {
  await page.goto('/components/dropdown'); await page.getByRole('button', { name: 'Project actions' }).click();
  await page.getByRole('menuitem', { name: 'Duplicate', exact: true }).click(); await expect(page.getByRole('status').filter({ hasText: 'Project duplicated' })).toHaveText('Project duplicated'); await expect(page.getByRole('menu')).not.toBeVisible();
});
test('sheet and popover dismiss with Escape', async ({ page }) => {
  await page.goto('/components/sheet'); const trigger = page.getByRole('button', { name: 'Open project details' }); await trigger.click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
  await page.goto('/components/popover'); const popover = page.getByRole('button', { name: 'View preferences' }); await popover.click(); await expect(page.getByRole('switch', { name: 'Show completed' })).toBeVisible(); await page.keyboard.press('Escape'); await expect(popover).toBeFocused();
});
test('tooltip opens on focus and toast dismisses', async ({ page }) => {
  await page.goto('/components/tooltip'); await page.getByRole('button', { name: 'New project' }).focus(); await expect(page.getByRole('tooltip')).toHaveText('Create a new project');
  await page.goto('/components/toast'); await page.getByRole('button', { name: 'Show notification' }).click(); await expect(page.getByText('Your changes are up to date.', { exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Dismiss notification' }).click(); await expect(page.getByText('Your changes are up to date.', { exact: true })).not.toBeVisible();
});
test('table filters, sorts, paginates and resets an empty state', async ({ page }) => {
  await page.goto('/components/table');
  await expect(page.getByText('Page 1 of 3')).toBeVisible(); await page.getByRole('button', { name: 'Next', exact: true }).click(); await expect(page.getByText('Page 2 of 3')).toBeVisible();
  const search = page.getByRole('searchbox', { name: 'Search projects' }); await search.fill('Motion'); await expect(page.locator('.bui-table tbody tr')).toHaveCount(1); await expect(page.locator('.bui-table tbody')).toContainText('Motion notes');
  await search.fill('NotThere'); await expect(page.getByRole('heading', { name: 'No matching records' })).toBeVisible(); await page.getByRole('button', { name: 'Clear filter' }).click(); await page.getByRole('button', { name: 'Project', exact: false }).filter({hasText:'Project'}).first().click(); await expect(page.locator('th[aria-sort="ascending"]')).toContainText('Project'); await expect(page.locator('.bui-table tbody tr').first()).toContainText('Colour experiments');
});
test('project example creates a real in-memory record', async ({ page }) => {
  await page.goto('/examples'); await page.getByRole('button', { name: 'New project' }).click(); await page.getByRole('dialog').getByLabel('Project name', {exact:true}).fill('New interface study'); await page.getByRole('dialog').getByRole('button', { name: 'Create project' }).click(); await page.getByRole('searchbox', { name: 'Search workspace projects' }).fill('New interface study'); await expect(page.locator('.bui-table tbody tr')).toHaveCount(1); await expect(page.locator('.bui-table tbody')).toContainText('You');
});
test('profile example validates the email and confirms saving', async ({ page }) => {
  await page.goto('/examples'); const email = page.getByLabel('Email address', {exact:true}); await email.fill('invalid'); await page.getByRole('button', { name: 'Save changes' }).click(); await expect(page.getByRole('alert').filter({ hasText: 'Enter a valid email address.' })).toHaveText('Enter a valid email address.'); await email.fill('test@example.com'); await page.getByRole('button', { name: 'Save changes' }).click(); await expect(page.getByText('Saved for this session.')).toBeVisible();
});
for (const theme of ['light', 'dark']) for (const route of ['/components', '/examples', '/foundations', '/motion', '/components/dialog']) test('accessible catalog, examples and overlays in ' + theme + ' theme at ' + route, async ({ page }) => {
  await page.goto(route); if (theme === 'dark') await page.getByRole('button', {name:'Switch to dark theme'}).click();
  if (route.endsWith('/dialog')) await page.getByRole('button', {name:'New project'}).click();
  const results = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(results.violations.map(item => ({id:item.id, nodes:item.nodes.map(node => node.target)}))).toEqual([]);
});
for (const width of [1440, 768, 390, 320]) test('responsive layouts at ' + width + 'px', async ({ page }) => {
  await page.setViewportSize({width,height:1000}); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const route of ['/', '/components', '/foundations', '/examples', '/getting-started', '/motion', '/components/table']) {
    await page.goto(route); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test('reduced motion disables component animations and unknown routes return 404', async ({ page }) => {
  await page.goto('/components/loading'); expect(await page.locator('.bui-spinner').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  const response = await page.goto('/components/not-a-component'); expect(response?.status()).toBe(404); await expect(page.getByRole('heading', {name:'Nothing here.'})).toBeVisible();
});
