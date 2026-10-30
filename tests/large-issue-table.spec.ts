import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';

const workspace=(page:Page)=>page.getByRole('region',{name:'Large issue workspace',exact:true});
async function choose(page:Page,label:string,option:string){
  await page.getByRole('combobox',{name:label,exact:true}).click();
  await page.getByRole('option',{name:option,exact:true}).click();
}
async function open(page:Page){
  await page.goto('/blocks/large-issue-table');
  await expect(workspace(page).getByRole('status').filter({hasText:'10,000 of 10,000 issues'})).toBeVisible();
}
async function preview(page:Page,option:string){await choose(page,'Large issue preview state',option);}


async function containedWorkspaceControls(page:Page){
  await expect.poll(()=>workspace(page).evaluate(panel=>{
    const bounds=panel.getBoundingClientRect(),style=getComputedStyle(panel);
    const left=bounds.left+parseFloat(style.paddingLeft),right=bounds.right-parseFloat(style.paddingRight);
    const selector=[
      '.bblocks-heading>.bui-button','.bblocks-large-issue-toolbar>.bui-field',
      '.bblocks-large-issue-toolbar>.bui-button','.bblocks-large-issue-views',
      '.bblocks-large-issue-summary','.bblocks-large-issue-summary>.bui-button',
      '.bblocks-large-issue-selection-slot>.bui-table-selection',
      '.bblocks-large-issue-selection-actions>.bui-button',
      '.bblocks-large-issue-notice>.bui-alert','.bblocks-large-issue-notice>.bui-button',
      '.bblocks-large-issue-loading','.bui-data-table','.bui-table-footer>nav',
    ].join(',');
    return [...panel.querySelectorAll(selector)].filter(element=>element.getClientRects().length).flatMap(element=>{
      const box=element.getBoundingClientRect();
      return box.left<left-1||box.right>right+1?[{name:element.getAttribute('aria-label')||element.textContent?.trim().slice(0,60),left:Math.round(box.left-left),right:Math.round(box.right-right)}]:[];
    });
  }),{message:'Every toolbar field/action and state panel must fit its own workspace, independently of browser width'}).toEqual([]);
  expect(await workspace(page).evaluate(panel=>panel.scrollWidth<=panel.clientWidth+1),'Only the table scroll region may overflow horizontally').toBe(true);
}

// Mounted rows are deliberately a small window of the complete supplied source.
test('large issues keep a bounded window and preserve selected identities across reading views',async({page})=>{
  await open(page);const block=workspace(page),table=block.getByRole('table',{name:'Large issues',exact:true});
  await expect(table).toHaveAttribute('aria-rowcount','10005');
  expect(await table.locator('tr[data-windowed-id]').count()).toBeLessThan(40);
  await block.getByRole('checkbox',{name:'Select ISS-10001',exact:true}).check();
  await block.getByRole('button',{name:'Pages',exact:true}).click();
  await expect(block.getByRole('checkbox',{name:'Select ISS-10001',exact:true})).toBeChecked();
  await block.getByRole('button',{name:'Next',exact:true}).click();
  await expect(block.getByRole('status').filter({hasText:/^1 selected/})).toBeVisible();
  await block.getByRole('button',{name:'Scroll',exact:true}).click();
  await expect(block.getByRole('checkbox',{name:'Select ISS-10001',exact:true})).toBeChecked();
  await choose(page,'Group issues by','No grouping');
  await expect(table).toHaveAttribute('aria-rowcount','10001');
  await choose(page,'Sort issues by','ID');
  await block.getByRole('button',{name:'Sort descending',exact:true}).click();
  await expect(table.locator('tr[data-windowed-id]').first()).toHaveAttribute('data-windowed-id','row:ISS-20000');
  expect(await table.locator('tr[data-windowed-id]').count()).toBeLessThan(40);
});

test('group selection includes unmounted records, survives collapse and exports the complete selected set',async({page})=>{
  await open(page);const block=workspace(page);
  await block.getByRole('checkbox',{name:'Select all In review records',exact:true}).check();
  await expect(block.getByRole('status').filter({hasText:/^2,500 selected/})).toBeVisible();
  await block.getByRole('button',{name:'Collapse In review group (2500 records)',exact:true}).click();
  await expect(block.getByRole('checkbox',{name:'Select ISS-10001',exact:true})).toHaveCount(0);
  await expect(block.getByRole('checkbox',{name:'Select all In review records',exact:true})).toBeChecked();
  const downloadPromise=page.waitForEvent('download');await block.getByRole('button',{name:'Export selected CSV',exact:true}).click();
  const download=await downloadPromise;expect(download.suggestedFilename()).toBe('bld8-selected-issues.csv');
  const csv=await readFile((await download.path())!,'utf8');
  expect(csv.trim().split(/\r?\n/)).toHaveLength(2501);expect(csv).toContain('ISS-10001');expect(csv).toContain('ISS-19997');
  await block.getByRole('button',{name:'Clear selection',exact:true}).click();
  await expect(block.getByRole('button',{name:'Export selected CSV',exact:true})).toHaveCount(0);
});

test('selection stays visible outside an empty filter and remains exportable',async({page})=>{
  await open(page);const block=workspace(page);
  await block.getByRole('checkbox',{name:'Select ISS-10001',exact:true}).check();
  await block.getByRole('searchbox',{name:'Search issues',exact:true}).fill('Nothing matches this sentence');
  await expect(block.getByRole('heading',{name:'No matching issues.',exact:true})).toBeVisible();
  await expect(block.getByRole('status').filter({hasText:'1 selected · 1 outside this view'})).toBeVisible();
  const downloading=page.waitForEvent('download');await block.getByRole('button',{name:'Export selected CSV',exact:true}).click();
  const csv=await readFile((await (await downloading).path())!,'utf8');expect(csv.trim().split(/\r?\n/)).toHaveLength(2);expect(csv).toContain('ISS-10001');
  await block.getByRole('button',{name:'Clear filters',exact:true}).click();
  await expect(block.getByRole('checkbox',{name:'Select ISS-10001',exact:true})).toBeChecked();
});

test('a rejected detail write retains the draft, retries once and restores its trigger',async({page})=>{
  await open(page);await preview(page,'Rejected save');const block=workspace(page),trigger=block.getByRole('button',{name:'Open ISS-10001',exact:true});
  await trigger.click();const dialog=page.getByRole('dialog',{name:'Issue details',exact:true}),title=dialog.getByRole('textbox',{name:'Issue title',exact:true});
  await expect(title).toBeFocused();await title.fill('A retained large issue draft');
  await dialog.getByRole('button',{name:'Save issue',exact:true}).click();
  await expect(dialog.getByRole('alert')).toContainText('Your changes are still here');await expect(title).toHaveValue('A retained large issue draft');await expect(title).toBeFocused();
  await dialog.getByRole('button',{name:'Save issue',exact:true}).click();await expect(dialog).toHaveCount(0);
  await expect(block.getByRole('row').filter({hasText:'ISS-10001'})).toContainText('A retained large issue draft');
  await expect(trigger).toBeFocused();
  await trigger.click();await expect(title).toHaveValue('A retained large issue draft');await page.keyboard.press('Escape');
});

test('detail validation preserves its input and cancellation does not change the row',async({page})=>{
  await open(page);const block=workspace(page),trigger=block.getByRole('button',{name:'Open ISS-10001',exact:true});await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Issue details',exact:true}),title=dialog.getByRole('textbox',{name:'Issue title',exact:true});
  await title.fill('x');await dialog.getByRole('button',{name:'Save issue',exact:true}).click();
  await expect(dialog.getByText('Use a title between 3 and 120 characters.',{exact:true})).toBeVisible();await expect(title).toHaveValue('x');await expect(title).toBeFocused();
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(trigger).toBeFocused();
  await expect(block.getByRole('row').filter({hasText:'ISS-10001'})).toContainText('Refine dialog focus · 1');
});

test('cancelling a slow save ignores its late result and keeps the current record unchanged',async({page})=>{
  await open(page);await preview(page,'Slow save');const block=workspace(page),trigger=block.getByRole('button',{name:'Open ISS-10001',exact:true});await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Issue details',exact:true});await dialog.getByRole('textbox',{name:'Issue title',exact:true}).fill('A cancelled write');
  await dialog.getByRole('button',{name:'Save issue',exact:true}).click();await expect(dialog.getByRole('button',{name:'Cancel save',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
  await expect(block.getByRole('status').filter({hasText:'Save cancelled in this view.'})).toBeVisible();
  await page.waitForTimeout(2100);await expect(block.getByRole('row').filter({hasText:'ISS-10001'})).toContainText('Refine dialog focus · 1');
  await trigger.click();await expect(dialog.getByRole('textbox',{name:'Issue title',exact:true})).toHaveValue('Refine dialog focus · 1');
});

test('loading, failed, empty and malformed sources are explicit and recovery keeps a useful focus target',async({page})=>{
  await open(page);await preview(page,'Loading');await expect(workspace(page).getByRole('status').filter({hasText:'Loading issues…'})).toBeVisible();
  await preview(page,'Connection error');const block=workspace(page);await expect(block.getByRole('alert')).toContainText('Issues could not be loaded');
  await block.getByRole('button',{name:'Retry loading issues',exact:true}).click();await expect(block.getByRole('heading',{name:'Keep the larger queue in view.',exact:true})).toBeFocused();
  await expect(block.getByRole('status').filter({hasText:'10,000 of 10,000 issues'})).toBeVisible();
  await preview(page,'Empty');await expect(block.getByRole('heading',{name:'No issues yet.',exact:true})).toBeVisible();
  await preview(page,'Invalid data');await expect(block.getByRole('alert')).toContainText('The issue records could not be read');await expect(block.getByRole('table',{name:'Large issues',exact:true})).toHaveCount(0);
  await preview(page,'Sample data');await expect(block.getByRole('status').filter({hasText:'10,000 of 10,000 issues'})).toBeVisible();
});

for(const theme of ['light','dark'])test('large issue toolbar and details stay contained and accessible on a phone in '+theme,async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page);
  if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await containedWorkspaceControls(page);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  await workspace(page).getByRole('button',{name:'Open ISS-10001',exact:true}).click();await expect(page.getByRole('dialog',{name:'Issue details',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const details=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(details.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});

test('a saved status that leaves the active filter restores focus to the workspace heading',async({page})=>{
  await open(page);await choose(page,'Status filter','In review');const block=workspace(page);
  await block.getByRole('button',{name:'Open ISS-10001',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Issue details',exact:true});await choose(page,'Issue status','Done');
  await dialog.getByRole('button',{name:'Save issue',exact:true}).click();await expect(dialog).toHaveCount(0);
  await expect(block.getByRole('checkbox',{name:'Select ISS-10001',exact:true})).toHaveCount(0);
  await expect(block.getByRole('heading',{name:'Keep the larger queue in view.',exact:true})).toBeFocused();
});


for(const theme of ['light','dark'])test('embedded Mobile preview contains large issue controls and selected actions on a desktop in '+theme,async({page})=>{
  await page.setViewportSize({width:1440,height:1100});await open(page);
  if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
  await page.getByRole('group',{name:'Preview width',exact:true}).getByRole('button',{name:'Mobile',exact:true}).click();
  const frame=page.locator('.library-preview-frame[data-width="Mobile"]');
  await expect.poll(()=>frame.evaluate(element=>Math.round(element.getBoundingClientRect().width))).toBe(390);
  await containedWorkspaceControls(page);
  const block=workspace(page);await block.getByRole('checkbox',{name:'Select ISS-10001',exact:true}).check();
  await expect(block.getByRole('button',{name:'Export selected CSV',exact:true})).toBeVisible();await containedWorkspaceControls(page);
  await block.getByRole('button',{name:'Pages',exact:true}).click();
  await expect(block.getByRole('checkbox',{name:'Select ISS-10001',exact:true})).toBeChecked();await containedWorkspaceControls(page);
  await page.getByRole('group',{name:'Preview width',exact:true}).getByRole('button',{name:'Desktop',exact:true}).click();
  await expect(block.getByRole('checkbox',{name:'Select ISS-10001',exact:true})).toBeChecked();await containedWorkspaceControls(page);
  await page.getByRole('group',{name:'Preview width',exact:true}).getByRole('button',{name:'Mobile',exact:true}).click();
  await containedWorkspaceControls(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('embedded Mobile loading and recovery fit the panel without hiding overflow',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});await open(page);
  await page.getByRole('group',{name:'Preview width',exact:true}).getByRole('button',{name:'Mobile',exact:true}).click();
  await preview(page,'Loading');await expect(workspace(page).getByRole('status').filter({hasText:'Loading issues…'})).toBeVisible();await containedWorkspaceControls(page);
  await preview(page,'Connection error');const block=workspace(page);await expect(block.getByRole('alert')).toContainText('Issues could not be loaded');await containedWorkspaceControls(page);
  await block.getByRole('button',{name:'Retry loading issues',exact:true}).click();await expect(block.getByRole('status').filter({hasText:'10,000 of 10,000 issues'})).toBeVisible();await containedWorkspaceControls(page);
  await preview(page,'Empty');await expect(block.getByRole('heading',{name:'No issues yet.',exact:true})).toBeVisible();await containedWorkspaceControls(page);
  await preview(page,'Invalid data');await expect(block.getByRole('alert')).toContainText('The issue records could not be read');await containedWorkspaceControls(page);
});
