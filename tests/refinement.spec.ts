import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {chooseOption,chooseReviewDate} from './helpers/controls';
mkdirSync('.local/previews',{recursive:true});

test('Outline resource filters use shared aligned controls and one keyboard focus edge',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/templates/outline');
  await page.getByRole('navigation',{name:'Outline views'}).getByRole('button',{name:'Resources',exact:true}).click();
  const region=page.getByRole('region',{name:'Resource library'});const status=region.getByRole('combobox',{name:'Statuses',exact:true});
  await expect(status).toHaveText('All statuses');await expect(region.getByRole('combobox',{name:'Types',exact:true})).toHaveText('All types');
  const controls=[region.getByRole('searchbox'),status,region.getByRole('combobox',{name:'Types',exact:true}),region.getByRole('button',{name:'Columns',exact:true})];
  const boxes=await Promise.all(controls.map(control=>control.boundingBox()));for(const box of boxes){expect(box!.height).toBeCloseTo(44,0);expect(box!.y).toBeCloseTo(boxes[0]!.y,0);}
  await page.keyboard.press('Tab');await status.focus();const focus=await status.evaluate(element=>{const style=getComputedStyle(element);return {outline:style.outlineStyle,shadow:style.boxShadow};});expect(focus.outline).toBe('none');expect(focus.shadow).toContain('1px');
  await region.getByRole('checkbox',{name:'Select Interface brief.pdf',exact:true}).check();await region.getByRole('checkbox',{name:'Select Research notes.txt',exact:true}).check();
  await status.click();await expect(page.getByRole('listbox')).toBeVisible();await expect(page.getByRole('option',{name:'Archived',exact:true})).toBeVisible();await expect(region.locator('select')).toHaveCount(0);
  await page.screenshot({path:'.local/previews/refinement-resource-filters.png',fullPage:true,caret:'initial'});
  await page.getByRole('option',{name:'Archived',exact:true}).click();await expect(region.locator('.bui-table tbody tr')).toHaveCount(1);
});

test('Outline project fields align and validation focuses the actual date trigger',async({page})=>{
  await page.goto('/templates/outline');await page.getByRole('button',{name:'Plan project',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Plan a project'});
  await dialog.getByRole('textbox',{name:'Project name',exact:true}).fill('Aligned project');await dialog.getByRole('button',{name:'Add project',exact:true}).click();const date=dialog.getByRole('button',{name:'Review date',exact:true});await expect(date).toBeFocused();
  await expect(dialog.getByRole('alert')).toContainText('Choose a valid review date.');await chooseReviewDate(page,dialog,'2026-10-20');
  const a=(await date.boundingBox())!,b=(await dialog.getByRole('combobox',{name:'Status',exact:true}).boundingBox())!;expect(a.y).toBeCloseTo(b.y,0);expect(a.height).toBeCloseTo(b.height,0);expect(a.width).toBeCloseTo(b.width,0);
  await chooseOption(page,dialog.getByRole('combobox',{name:'Status',exact:true}),'Ready');await dialog.screenshot({path:'.local/previews/refinement-project-fields.png',caret:'initial'});
  await dialog.getByRole('button',{name:'Add project',exact:true}).click();await expect(page.getByRole('button',{name:'Edit project name for Aligned project',exact:true})).toBeVisible();
});

test('mobile forms and shared toolbars remain contained',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/templates/outline');await page.getByRole('button',{name:'Plan project',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Plan a project'});
  const date=(await dialog.getByRole('button',{name:'Review date',exact:true}).boundingBox())!,status=(await dialog.getByRole('combobox',{name:'Status',exact:true}).boundingBox())!;expect(status.y).toBeGreaterThan(date.y+date.height);expect(status.x).toBeCloseTo(date.x,0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await dialog.screenshot({path:'.local/previews/refinement-fields-mobile.png',caret:'initial'});
  await page.keyboard.press('Escape');await page.goto('/components/advanced-table');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('workspace view motion preserves drafts and respects reduced motion',async({page})=>{
  await page.goto('/templates/outline');const nav=page.getByRole('navigation',{name:'Outline views'});await nav.getByRole('button',{name:'Settings',exact:true}).click();const name=page.getByRole('textbox',{name:'Display name',exact:true});await name.fill('Keep this draft');
  await nav.getByRole('button',{name:'Resources',exact:true}).click();await nav.getByRole('button',{name:'Planning',exact:true}).click();await nav.getByRole('button',{name:'Settings',exact:true}).click();await expect(name).toHaveValue('Keep this draft');
  const active=page.locator('.bblocks-operations-view:not([hidden])');await expect(active).toHaveCount(1);expect(await active.evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
  await page.emulateMedia({reducedMotion:'no-preference'});await nav.getByRole('button',{name:'Resources',exact:true}).click();expect(await active.evaluate(element=>getComputedStyle(element).animationName)).toBe('bblocks-view-enter');await expect(active).toHaveCount(1);
});

test('Escape closes a cell select before cancelling the edit',async({page})=>{
  await page.goto('/templates/outline');const edit=page.getByRole('button',{name:'Edit status for Keyboard review',exact:true});await edit.click();const select=page.getByRole('combobox',{name:'status for Keyboard review',exact:true});await select.click();await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).not.toBeVisible();await expect(select).toBeVisible();await expect(select).toBeFocused();await page.keyboard.press('Escape');await expect(edit).toBeFocused();
});
