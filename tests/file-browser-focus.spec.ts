import {test, expect, type Page} from '@playwright/test';
import {chooseOption} from './helpers/controls';

const browser = (page:Page) => page.getByRole('region', {name:'File browser', exact:true});
const folderHeading = (page:Page, name:string) => browser(page).getByRole('heading', {name, exact:true}).first();
const table = (page:Page, name:string) => browser(page).getByRole('table', {name:'Files in ' + name, exact:true});
const folderTree = (page:Page) => browser(page).getByRole('tree', {name:'Workspace folders', exact:true});
const treeItem = (page:Page, name:string) => folderTree(page).getByRole('treeitem', {name, exact:true});
const preview = (page:Page) => page.getByRole('combobox', {name:'File preview state', exact:true});
const search = (page:Page) => browser(page).getByRole('searchbox', {name:'Search this folder', exact:true});

async function openFolderWithKeyboard(page:Page, name:string) {
  const control = browser(page).getByRole('button', {name:'Open ' + name, exact:true});
  await control.focus();
  await control.press('Enter');
}

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test('folder navigation and empty-search recovery retain useful focus with ' + reducedMotion + ' motion', async ({page}) => {
    await page.emulateMedia({reducedMotion});
    await page.goto('/blocks/file-browser');
    await expect(table(page, 'Workspace')).toBeVisible();
    await openFolderWithKeyboard(page, 'Projects');
    await expect(table(page, 'Projects')).toBeVisible();
    await expect(folderHeading(page, 'Projects')).toBeFocused();
    await openFolderWithKeyboard(page, 'Interface kit');
    await expect(folderHeading(page, 'Interface kit')).toBeFocused();

    const breadcrumb = browser(page).getByRole('button', {name:'Show Workspace', exact:true});
    await breadcrumb.focus();
    await breadcrumb.press('Enter');
    await expect(table(page, 'Workspace')).toBeVisible();
    await expect(folderHeading(page, 'Workspace')).toBeFocused();

    await search(page).fill('no matching entry');
    const clear = browser(page).getByRole('button', {name:'Clear file search', exact:true});
    await expect(clear).toBeVisible();
    await clear.focus();
    await clear.press('Enter');
    await expect(search(page)).toBeFocused();
    await expect(search(page)).toHaveValue('');
    await expect(table(page, 'Workspace')).toBeVisible();
  });

  test('folder retry retains its destination focus through completion with ' + reducedMotion + ' motion', async ({page}) => {
    await page.emulateMedia({reducedMotion});
    await page.goto('/blocks/file-browser');
    await chooseOption(page, preview(page), 'Rejected folder load');
    await openFolderWithKeyboard(page, 'Archive');
    await expect(browser(page).getByRole('status').filter({hasText:'Folder could not be loaded'})).toBeVisible();
    await expect(folderHeading(page, 'Archive')).toBeFocused();
    const retry = browser(page).getByRole('button', {name:'Retry folder', exact:true});
    await retry.focus();
    await retry.press('Enter');
    await expect(folderHeading(page, 'Archive')).toBeFocused();
    const before = await folderHeading(page, 'Archive').boundingBox();
    await expect(table(page, 'Archive').getByRole('button', {name:'Inspect archived-brief.pdf', exact:true})).toBeVisible();
    await expect(folderHeading(page, 'Archive')).toBeFocused();
    const after = await folderHeading(page, 'Archive').boundingBox();
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.abs(after!.x - before!.x)).toBeLessThan(.5);
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(.5);
    expect(Math.abs(after!.height - before!.height)).toBeLessThan(.5);
  });
}

test('Tree selection and sorting preserve their existing keyboard focus', async ({page}) => {
  await page.goto('/blocks/file-browser');
  const projects = treeItem(page, 'Projects');
  await projects.focus();
  await projects.press('Space');
  await expect(table(page, 'Projects')).toBeVisible();
  await expect(projects).toBeFocused();
  const archive = treeItem(page, 'Archive');
  await archive.focus();
  await archive.press('Space');
  await expect(table(page, 'Archive').getByRole('button', {name:'Inspect archived-brief.pdf', exact:true})).toBeVisible();
  await expect(archive).toBeFocused();

  const sort = browser(page).getByRole('combobox', {name:'Sort files', exact:true});
  await sort.focus();
  await sort.press('Enter');
  const option = page.getByRole('option', {name:'Name Z–A', exact:true});
  await option.focus();
  await option.press('Enter');
  await expect(sort).toBeFocused();
  await expect(table(page, 'Archive').getByRole('button', {name:/^Inspect /}).first()).toHaveAttribute('aria-label', 'Inspect earlier-notes.txt');
});

test('explicit loading repairs focus without stealing it after a slow request', async ({page}) => {
  await page.goto('/blocks/file-browser');
  await page.clock.install();
  await chooseOption(page, preview(page), 'Slow folder load');
  const archive = treeItem(page, 'Archive');
  await archive.focus();
  await archive.press('Space');
  await expect(archive).toHaveAttribute('aria-busy', 'true');
  await archive.press('ArrowLeft');
  await expect(archive).toHaveAttribute('aria-expanded', 'false');
  const load = browser(page).getByRole('button', {name:'Load folder', exact:true});
  await expect(load).toBeVisible();
  await load.focus();
  await load.press('Enter');
  await expect(folderHeading(page, 'Archive')).toBeFocused();

  const up = browser(page).getByRole('button', {name:'Up one folder', exact:true});
  await up.focus();
  await page.clock.runFor(4000);
  await expect(table(page, 'Archive').getByRole('button', {name:'Inspect archived-brief.pdf', exact:true})).toBeVisible();
  await expect(up).toBeFocused();
});

test('initial and replacement metadata do not take focus from the host page', async ({page}) => {
  await page.goto('/blocks/file-browser');
  await expect(table(page, 'Workspace')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement === document.body)).toBe(true);
  await chooseOption(page, preview(page), 'Empty');
  await expect(browser(page).getByText('Nothing in this folder yet.', {exact:true})).toBeVisible();
  await expect(preview(page)).toBeFocused();
  await chooseOption(page, preview(page), 'Sample data');
  await expect(table(page, 'Workspace')).toBeVisible();
  await expect(preview(page)).toBeFocused();
  await expect(folderHeading(page, 'Workspace')).not.toBeFocused();
});

test('the showcase restores workspace retry focus across its keyed replacement', async ({page}) => {
  await page.goto('/blocks/file-browser');
  await chooseOption(page, preview(page), 'Connection error');
  const retry = browser(page).getByRole('button', {name:'Retry workspace', exact:true});
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press('Enter');
  await expect(table(page, 'Workspace')).toBeVisible();
  await expect(folderHeading(page, 'Workspace')).toBeFocused();
});
