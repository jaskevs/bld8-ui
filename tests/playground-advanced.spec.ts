import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import {readPlayground,writePlayground} from '../apps/docs/src/lib/playground-state';
import {playgroundCode} from '../apps/docs/src/lib/playground-code';
import {chooseOption} from './helpers/controls';
import {hasFullNotice,mitNotice} from '../scripts/license-policy.mjs';

const preview=(page:Page)=>page.getByRole('region',{name:'Component preview',exact:true});
const controls=(page:Page)=>page.getByRole('region',{name:'Playground controls',exact:true});
async function moveBrief(page:Page){
  await preview(page).getByRole('button',{name:'Move Prepare the brief',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Move item',exact:true});
  await chooseOption(page,dialog.getByRole('combobox',{name:'Destination column',exact:true}),'In progress');
  await dialog.getByRole('button',{name:'Move item',exact:true}).click();
}
test('workflow links validate bounded records and round-trip confirmed configuration',()=>{
  const state=readPlayground('?component=Kanban&kanbanOrder=brief:done,brief:active,__proto__:done,notes:bad&kanbanLimit=99&chartHeight=2&treeExpanded=src,assets,assets,unknown&treeSelected=private');
  expect(state.kanbanOrder).toEqual(['brief:done','keyboard:active','notes:planned','publish:done']);expect(state.kanbanLimit).toBe(4);expect(state.chartHeight).toBe(160);expect(state.treeExpanded).toEqual(['src','assets']);expect(state.treeSelected).toBe('');expect(readPlayground(writePlayground(state))).toEqual(state);
  expect(readPlayground('?component=Tree&treeSelected=tokens').treeSelected).toBe('');expect(readPlayground('?component=Tree&treeLoaded=true&treeSelected=tokens').treeSelected).toBe('tokens');
});
test('Kanban confirms a keyboard move, restores its order and exports the same source',async({page})=>{
  await page.goto('/playground?component=Kanban');await moveBrief(page);
  await expect(preview(page).getByRole('region',{name:'Project board',exact:true})).toHaveAttribute('aria-busy','true');
  await expect.poll(()=>readPlayground(new URL(page.url()).search).kanbanOrder).toContain('brief:active');
  await expect(preview(page).getByRole('button',{name:'Move Prepare the brief',exact:true})).toBeFocused();
  await page.reload();await expect(preview(page).locator('.bui-kanban-column').filter({has:page.getByRole('heading',{name:'In progress',exact:true})})).toContainText('Prepare the brief');
  const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Download example',exact:true}).click();const download=await waiting;expect(download.suggestedFilename()).toBe('kanban-example.tsx');const text=await readFile((await download.path())!,'utf8');expect(text.trim()).toBe(playgroundCode(readPlayground(new URL(page.url()).search)).trim());expect(text).not.toContain('@bld8/');
});
test('Kanban rejection rolls back, retries and aborts a move on configuration change',async({page})=>{
  await page.goto('/playground?component=Kanban&actionResult=Error');await moveBrief(page);await expect(preview(page).getByRole('alert')).toContainText('earlier order is restored');expect(readPlayground(new URL(page.url()).search).kanbanOrder).toContain('brief:planned');
  await preview(page).getByRole('button',{name:'Retry with a successful response',exact:true}).click();await expect.poll(()=>readPlayground(new URL(page.url()).search).kanbanOrder).toContain('brief:active');
  await page.goto('/playground?component=Kanban');await moveBrief(page);await chooseOption(page,controls(page).getByRole('combobox',{name:'Board layout',exact:true}),'backlog');await page.waitForTimeout(650);expect(readPlayground(new URL(page.url()).search).kanbanOrder).toContain('brief:planned');await expect(preview(page)).toContainText('cancelled because configuration changed');
});
test('Tree separates focus and selection and recovers an abortable lazy load',async({page})=>{
  await page.goto('/playground?component=Tree&treeFailure=true');const tree=preview(page).getByRole('tree',{name:'Project files',exact:true}),src=tree.getByRole('treeitem',{name:'src',exact:true}),assets=tree.getByRole('treeitem',{name:'assets',exact:true});
  await src.focus();await src.press('ArrowDown');await expect(tree.getByRole('treeitem',{name:'components',exact:true})).toBeFocused();expect(readPlayground(new URL(page.url()).search).treeSelected).toBe('readme');
  await assets.focus();await assets.press('ArrowRight');await expect(assets).toHaveAttribute('aria-busy','true');await expect(assets).toContainText('could not be loaded');await assets.press('ArrowRight');const tokens=tree.getByRole('treeitem',{name:'tokens.css',exact:true});await expect(tokens).toBeVisible();await tokens.click();await page.reload();await expect(tokens).toHaveAttribute('aria-selected','true');
  await page.goto('/playground?component=Tree');await assets.focus();await assets.press('ArrowRight');await expect(assets).toHaveAttribute('aria-busy','true');await assets.press('ArrowLeft');await page.waitForTimeout(650);expect(readPlayground(new URL(page.url()).search).treeLoaded).toBe(false);await expect(tokens).not.toBeVisible();
});
test('Chart shares supplied configuration and keeps exact missing data and keyboard exploration',async({page})=>{
  await page.goto('/playground?component=Chart&chartPeriod=fortnight&chartMissing=true&chartType=area');const sample=preview(page),points=sample.getByRole('group',{name:'Request outcomes observations',exact:true});
  await expect(points.getByRole('button')).toHaveCount(14);await points.getByRole('button').first().focus();await page.keyboard.press('End');await expect(points.getByRole('button').last()).toBeFocused();
  await sample.getByRole('button',{name:'Line',exact:true}).click();await expect(sample.locator('.bui-chart')).toHaveAttribute('data-chart-type','line');await sample.getByRole('button',{name:'Show data',exact:true}).click();await expect(sample.getByRole('table')).toContainText('Not recorded');
  await page.reload();await expect(sample.locator('.bui-chart')).toHaveAttribute('data-chart-type','line');await expect(points.getByRole('button')).toHaveCount(14);await expect(sample.getByRole('table')).not.toBeVisible();
});
for(const component of ['Kanban','Tree','Chart'])for(const state of ['Error','Empty'])test(component+' '+state+' has a usable recovery',async({page})=>{
  await page.goto('/playground?component='+component+'&state='+state);const sample=preview(page);await sample.getByRole('button',{name:state==='Error'?/^Retry /:/^Restore sample /}).click();await expect.poll(()=>readPlayground(new URL(page.url()).search).state).toBe('Default');await expect(sample.getByRole('alert')).toHaveCount(0);
});
for(const component of ['Kanban','Tree','Chart'])test(component+' fits a phone and passes automated accessibility in both themes',async({page})=>{
  await page.setViewportSize({width:390,height:844});for(const dark of [false,true]){await page.goto('/playground?component='+component+'&dark='+dark);await expect(preview(page)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await preview(page).evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);expect((await new AxeBuilder({page}).include('#playground-preview').analyze()).violations).toEqual([]);}
});


test('Checkbox copies and downloads the same complete licensed module',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/playground?component=Checkbox&mixed=true');
  const source=page.locator('.playground-code .code-block').filter({hasText:'export default function Example()'});
  await source.getByRole('button',{name:'Copy code',exact:true}).click();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  expect(hasFullNotice(copied,mitNotice())).toBe(true);
  expect(copied).toContain('indeterminate = mixed');
  expect(copied.trim()).toBe(playgroundCode(readPlayground(new URL(page.url()).search)).trim());
  const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Download example',exact:true}).click();
  const download=await waiting;expect(download.suggestedFilename()).toBe('checkbox-example.tsx');
  expect((await readFile((await download.path())!,'utf8')).trim()).toBe(copied.trim());
});
