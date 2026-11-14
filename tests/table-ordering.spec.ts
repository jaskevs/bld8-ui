import {test, expect, type Locator, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {applyTableRowMove} from '../packages/ui/src/table-row-order';
import {defaultIssueView, parseIssueView, serializeIssueView, issueTableView, withIssueTableView} from '../packages/blocks/src/issue-repository';

const route = '/examples/table-ordering';
const rowKeys = (table: Locator) => table.locator('tbody tr[data-row-key]').evaluateAll(rows => rows.map(row => row.getAttribute('data-row-key')));
const headers = (table: Locator) => table.locator('thead th[aria-label]').evaluateAll(columns => columns.map(column => column.getAttribute('aria-label')));
async function choose(page: Page, control: Locator, label: string) {
  await control.click();
  await page.getByRole('option', {name: label, exact: true}).click();
}
async function drag(page: Page, source: Locator, destination: Locator) {
  await source.scrollIntoViewIfNeeded(); await destination.scrollIntoViewIfNeeded();
  const from = await source.boundingBox(), target = await destination.boundingBox();
  expect(from && target).toBeTruthy();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height / 2, {steps: 18});
  await page.mouse.up();
}
async function columnPosition(page: Page, label: string, position: string) {
  await page.getByRole('button', {name: 'Columns', exact: true}).click();
  const handle = page.getByRole('button', {name: `Move ${label} column`, exact: true});
  await handle.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {name: 'Move column', exact: true});
  await expect(page.locator('.bui-popover')).not.toBeVisible();
  await choose(page, dialog.getByRole('combobox', {name: 'Column position', exact: true}), position);
  await dialog.getByRole('button', {name: 'Move column', exact: true}).click();
  await expect(dialog).not.toBeVisible();
  await page.keyboard.press('Escape');
}

test('row move intents retain records and reject stale anchors without mutating source', () => {
  const source = [{id: 'a', title: 'First'}, {id: 'end', title: 'Last'}, {id: 'c', title: 'Third'}];
  const moved = applyTableRowMove(source, {rowKey: 'c', targetKey: 'end', position: 'before'}, row => row.id);
  expect(moved.map(row => row.id)).toEqual(['a', 'c', 'end']);
  expect(moved[1]).toBe(source[2]); expect(source.map(row => row.id)).toEqual(['a', 'end', 'c']);
  for (const move of [{rowKey: 'c', targetKey: 'missing', position: 'before' as const}, {rowKey: 'a', targetKey: 'a', position: 'after' as const}]) {
    expect(() => applyTableRowMove(source, move, row => row.id)).toThrow();
  }
  expect(() => applyTableRowMove([...source, source[0]], {rowKey: 'a', targetKey: 'c', position: 'after'}, row => row.id)).toThrow();
});

test('keyboard row moves preserve selection and can target a real record with the key end', async ({page}) => {
  await page.goto(route);
  const table = page.getByRole('table', {name: 'Ordered projects', exact: true, includeHidden: true});
  await page.getByRole('checkbox', {name: 'Select Navigation study', exact: true}).check();
  const handle = page.getByRole('button', {name: 'Move Navigation study', exact: true});
  await handle.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {name: 'Move row', exact: true});
  await choose(page, dialog.getByRole('combobox', {name: 'Row position', exact: true}), 'Before Icon audit');
  await dialog.getByRole('button', {name: 'Save row position', exact: true}).click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => rowKeys(table)).toEqual(['forms', 'motion', 'navigation', 'end']);
  await expect(handle).toBeFocused();
  await expect(page.getByRole('checkbox', {name: 'Select Navigation study', exact: true})).toBeChecked();
});

test('rejected row persistence retains its draft, record order and retry focus', async ({page}) => {
  await page.goto(route);
  const table = page.getByRole('table', {name: 'Ordered projects', exact: true, includeHidden: true});
  await page.getByRole('checkbox', {name: 'Fail next row save', exact: true}).check();
  await page.getByRole('button', {name: 'Move Navigation study', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'Move row', exact: true});
  await choose(page, dialog.getByRole('combobox', {name: 'Row position', exact: true}), 'Before Motion notes');
  await dialog.getByRole('button', {name: 'Save row position', exact: true}).click();
  await expect(dialog.getByRole('alert')).toContainText('could not be saved');
  await expect.poll(() => rowKeys(table)).toEqual(['navigation', 'forms', 'motion', 'end']);
  await expect(dialog.getByRole('combobox', {name: 'Row position', exact: true})).toContainText('Before Motion notes');
  await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await dialog.getByRole('button', {name: 'Save row position', exact: true}).click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => rowKeys(table)).toEqual(['forms', 'navigation', 'motion', 'end']);
});

test('pointer handles reorder rows and columns independently', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 1100}); await page.goto(route);
  const table = page.getByRole('table', {name: 'Ordered projects', exact: true, includeHidden: true});
  await drag(page, page.getByRole('button', {name: 'Move Navigation study', exact: true}), page.getByRole('button', {name: 'Move Motion notes', exact: true}));
  await expect.poll(() => rowKeys(table)).toEqual(['forms', 'motion', 'navigation', 'end']);
  await page.getByRole('button', {name: 'Columns', exact: true}).click();
  await drag(page, page.getByRole('button', {name: 'Move Owner column', exact: true}), page.getByRole('button', {name: 'Move Project column', exact: true}));
  await page.keyboard.press('Escape');
  await expect.poll(() => headers(table)).toEqual(['Owner', 'Project', 'Status']);
  await expect.poll(() => rowKeys(table)).toEqual(['forms', 'motion', 'navigation', 'end']);
});

test('a pending pointer move does not steal focus from the next deliberate action', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 1100}); await page.goto(route);
  const table = page.getByRole('table', {name: 'Ordered projects', exact: true});
  await drag(page, page.getByRole('button', {name: 'Move Navigation study', exact: true}), page.getByRole('button', {name: 'Move Motion notes', exact: true}));
  const search = page.getByRole('searchbox', {name: 'Search ordered projects', exact: true});
  await search.focus();
  await expect(search).toHaveValue('');
  await expect.poll(() => rowKeys(table)).toEqual(['forms', 'motion', 'navigation', 'end']);
  await expect(search).toBeFocused();
});

test('column layouts keep keyed widths, visibility and pinning after keyboard moves', async ({page}) => {
  await page.goto(route);
  const table = page.getByRole('table', {name: 'Ordered projects', exact: true, includeHidden: true});
  const width = table.getByRole('separator', {name: 'Resize Status', exact: true});
  const previous = Number(await width.getAttribute('aria-valuenow'));
  await width.focus(); await page.keyboard.press('ArrowRight');
  await expect(width).toHaveAttribute('aria-valuenow', String(previous + 10));
  await columnPosition(page, 'Status', 'Before Project');
  await expect.poll(() => headers(table)).toEqual(['Status', 'Project', 'Owner']);
  await expect(width).toHaveAttribute('aria-valuenow', String(previous + 10));
  await page.getByRole('button', {name: 'Columns', exact: true}).click();
  await page.getByRole('checkbox', {name: 'Owner', exact: true}).uncheck();
  await page.keyboard.press('Escape');
  await expect.poll(() => headers(table)).toEqual(['Status', 'Project']);
  await page.getByRole('switch', {name: 'Pin project column', exact: true}).check();
  await expect(table.getByRole('columnheader', {name: 'Project', exact: true})).toHaveAttribute('data-pinned', 'start');
  await expect.poll(() => headers(table)).toEqual(['Project', 'Status']);
});

test('sorting, searching and facets disable ambiguous manual row moves', async ({page}) => {
  await page.goto(route);
  const handle = page.getByRole('button', {name: 'Move Navigation study', exact: true});
  await page.getByRole('columnheader', {name: 'Project', exact: true}).getByRole('button').click();
  await expect(handle).toBeDisabled();
  await expect(page.getByText('Clear sorting before moving rows.', {exact: true})).toBeVisible();
  await page.getByRole('columnheader', {name: 'Project', exact: true}).getByRole('button').click();
  await page.getByRole('columnheader', {name: 'Project', exact: true}).getByRole('button').click();
  await expect(handle).toBeEnabled();
  await page.getByRole('searchbox', {name: 'Search ordered projects', exact: true}).fill('Navigation');
  await expect(handle).toBeDisabled();
  await page.getByRole('searchbox', {name: 'Search ordered projects', exact: true}).fill('');
  await choose(page, page.getByRole('combobox', {name: 'Statuses', exact: true}), 'Review');
  await expect(handle).toBeDisabled();
  await choose(page, page.getByRole('combobox', {name: 'Statuses', exact: true}), 'All statuses');
  await expect(handle).toBeEnabled();
});

test('touch row dragging keeps the page usable outside the explicit move handle', async ({browser}) => {
  const context = await browser.newContext({viewport: {width: 1200, height: 1100}, hasTouch: true, isMobile: true, reducedMotion: 'reduce'});
  const page = await context.newPage();
  try {
    await page.goto(route);
    const fromHandle = page.getByRole('button', {name: 'Move Navigation study', exact: true});
    await fromHandle.scrollIntoViewIfNeeded();
    const from = await fromHandle.boundingBox(), target = await page.getByRole('button', {name: 'Move Motion notes', exact: true}).boundingBox();
    const cdp = await context.newCDPSession(page);
    const x = from!.x + from!.width / 2, y = from!.y + from!.height / 2;
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
    await page.waitForTimeout(230);
    for (let step = 1; step <= 12; step++) await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y + (target!.y + target!.height / 2 - y) * step / 12}]});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    const table = page.getByRole('table', {name: 'Ordered projects', exact: true, includeHidden: true});
    await expect.poll(() => rowKeys(table)).toEqual(['forms', 'motion', 'navigation', 'end']);
    expect(await table.locator('tbody td').nth(2).evaluate(element => getComputedStyle(element).touchAction)).toBe('auto');
  } finally { await context.close(); }
});

test('issue layout additions preserve old links and reject invalid saved layout state', () => {
  const old = defaultIssueView(), text = serializeIssueView(old);
  expect(parseIssueView(text)).toEqual(old);
  expect(issueTableView(old).columnOrderKeys).toEqual(['id', 'title', 'status', 'priority', 'assignee', 'estimate', 'due']);
  const changed = withIssueTableView(old, {columnOrderKeys: ['assignee', 'id', 'title', 'status', 'priority', 'estimate', 'due'], columnWidths: {id: 142}, columnPinning: {title: 'start'}});
  expect(parseIssueView(serializeIssueView(changed))).toEqual(changed);
  expect(parseIssueView(JSON.stringify({...old, layout: {...changed.layout, version: 2}}))).toBeNull();
  expect(parseIssueView(JSON.stringify({...old, layout: {...changed.layout, columnOrderKeys: ['id', 'id']}}))).toBeNull();
});

test('issue saved views and URL links restore column order and resized widths', async ({page}) => {
  await page.goto('/blocks/issue-table?host=keep#layout');
  const table = page.getByRole('table', {name: 'Issues', exact: true});
  await expect(page.getByRole('cell', {name: 'ISS-101', exact: true})).toBeVisible();
  const resize = table.getByRole('separator', {name: 'Resize ID', exact: true});
  const initial = Number(await resize.getAttribute('aria-valuenow'));
  await resize.focus(); await page.keyboard.press('ArrowRight');
  await columnPosition(page, 'Assignee', 'Before ID');
  const expected = ['Assignee', 'ID', 'Issue', 'Status', 'Priority', 'Estimate', 'Due date'];
  await expect.poll(() => headers(table)).toEqual(expected);
  await page.getByRole('button', {name: 'Save view', exact: true}).click();
  const save = page.getByRole('dialog', {name: 'Save this view', exact: true});
  await save.getByRole('textbox', {name: 'View name', exact: true}).fill('Personal layout');
  await save.getByRole('button', {name: 'Save current view', exact: true}).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('bld8-issue-views-v1')!));
  expect(stored[0].view.layout.columnWidths.id).toBe(initial + 10);
  expect(stored[0].view.layout.columnOrderKeys[0]).toBe('assignee');
  await page.reload();
  await expect(page.getByRole('button', {name: 'Personal layout', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => headers(table)).toEqual(expected);
  await expect(resize).toHaveAttribute('aria-valuenow', String(initial + 10));
  const url = new URL(page.url());
  expect(url.searchParams.get('host')).toBe('keep'); expect(url.hash).toBe('#layout');
  expect(JSON.parse(url.searchParams.get('buiIssues')!).layout.columnWidths.id).toBe(initial + 10);
});

test('a legacy issue URL remains readable before any layout has been saved', async ({page}) => {
  const view = {...defaultIssueView(), columns: ['id', 'title', 'status']};
  await page.goto('/blocks/issue-table?' + new URLSearchParams({buiIssues: serializeIssueView(view), host: 'keep'}));
  const table = page.getByRole('table', {name: 'Issues', exact: true});
  await expect(page.getByRole('cell', {name: 'ISS-101', exact: true})).toBeVisible();
  await expect.poll(() => headers(table)).toEqual(['ID', 'Issue', 'Status']);
  expect(new URL(page.url()).searchParams.get('host')).toBe('keep');
});

test('the ordering example stays contained on a phone and exposes accessible actions', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844}); await page.goto(route);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('table tr').evaluateAll(rows => rows.some(row => Array.from(row.childNodes).some(node => node.nodeType === Node.TEXT_NODE)))).toBe(false);
  await page.getByRole('button', {name: 'Move Navigation study', exact: true}).click();
  await expect(page.getByRole('dialog', {name: 'Move row', exact: true})).toBeVisible();
  const scan = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(scan.violations.map(item => ({id: item.id, targets: item.nodes.map(node => node.target)}))).toEqual([]);
});


test('row-save recovery follows the committed enabled button after deferred rendering',async({page})=>{
  const {installRowSaveScheduler,exerciseDeferredRowSave}=await import('./helpers/row-save-scheduler');
  await installRowSaveScheduler(page);await page.goto(route);
  const observation=await exerciseDeferredRowSave(page);
  await test.info().attach('row-save-scheduler-order',{body:JSON.stringify(observation,null,2),contentType:'application/json'});
});

test('row-save recovery respects deliberate Close focus while saving is pending',async({page})=>{
  const {installRowSaveScheduler,exerciseDeferredRowSave}=await import('./helpers/row-save-scheduler');
  await installRowSaveScheduler(page);await page.goto(route);
  const observation=await exerciseDeferredRowSave(page,{keepCloseFocus:true});
  await test.info().attach('row-save-deliberate-focus',{body:JSON.stringify(observation,null,2),contentType:'application/json'});
});
