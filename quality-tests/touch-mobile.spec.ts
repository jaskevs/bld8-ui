import {test,expect,openQualityPage,expectContained} from './fixtures';
import type {Locator} from '@playwright/test';

test('grid touch keeps scrolling available and native editor text selectable',async({page},info)=>{
  await openQualityPage(page,'/blocks/data-workspace',info);const grid=page.getByRole('grid',{name:'Issue data grid',exact:true}),cell=grid.getByRole('gridcell',{name:'Title for ISS-101',exact:true});
  await expect(cell).toBeVisible();await cell.tap();await expect(cell).toBeFocused();await expect(grid.locator('[aria-selected=true]')).toHaveCount(1);
  expect(await cell.evaluate(element=>{const event=new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:91,isPrimary:true,button:0});element.dispatchEvent(event);return event.defaultPrevented;})).toBe(false);
  expect(await cell.evaluate(element=>getComputedStyle(element).touchAction)).toBe('auto');const rowHeight=(await cell.boundingBox())!.height;await cell.press('Enter');const editor=grid.getByRole('textbox',{name:'Title for ISS-101',exact:true});await editor.fill('Native touch editing');await expect(editor).toHaveCSS('user-select','text');await expect(editor).toHaveCSS('outline-style','none');await expect(editor).toHaveCSS('box-shadow','none');expect((await cell.boundingBox())!.height).toBe(rowHeight);expect(await editor.evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  await editor.press('Control+A');expect(await editor.evaluate(element=>{const input=element as HTMLInputElement;return input.selectionStart===0&&input.selectionEnd===input.value.length;})).toBe(true);await editor.press('Escape');await expect(cell).toBeFocused();await expectContained(page);
  const assignee=grid.getByRole('gridcell',{name:'Assignee for ISS-101',exact:true});await assignee.scrollIntoViewIfNeeded();await assignee.tap();const choiceHeight=(await assignee.boundingBox())!.height;await assignee.press('Enter');
  const search=page.getByRole('combobox',{name:'Search Assignee for ISS-101 options',exact:true});await expect(search).toBeFocused();expect(await search.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);await search.fill('Sam');const option=page.getByRole('option',{name:'Sam Rivera',exact:true});expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await option.evaluate(element=>{const box=element.getBoundingClientRect(),base={bubbles:true,cancelable:true,pointerType:'touch',pointerId:97,isPrimary:true,clientX:box.x+box.width/2,clientY:box.y+box.height/2};element.dispatchEvent(new PointerEvent('pointerdown',base));element.dispatchEvent(new PointerEvent('pointermove',{...base,clientY:base.clientY+24}));element.dispatchEvent(new PointerEvent('pointerup',{...base,clientY:base.clientY+24}));});await expect(search).toBeVisible();await expect(grid.locator('[data-dirty]')).toHaveCount(0);
  await option.tap();await expect(assignee).toBeFocused();await expect(assignee).toContainText('Sam Rivera');expect((await assignee.boundingBox())!.height).toBe(choiceHeight);
  const priority=grid.getByRole('gridcell',{name:'Priority for ISS-101',exact:true});await priority.scrollIntoViewIfNeeded();await priority.tap();await priority.press('Enter');await page.getByRole('option',{name:'Urgent',exact:true}).tap();await expect(priority).toContainText('Urgent');await expect(priority).toBeFocused();await expect(grid.locator('[data-dirty]')).toHaveCount(2);await expectContained(page);
});

async function readable(field:Locator) {
  await expect(field).toBeVisible();
  expect(await field.evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
}

test('touch catalogue search keeps native focus and unrestricted zoom',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/components',info);
  const viewport=page.locator('meta[name="viewport"]');
  await expect(viewport).toHaveAttribute('content',/width=device-width/);
  expect(await viewport.getAttribute('content')).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=/i);
  const search=page.getByRole('searchbox',{name:'Search components',exact:true});
  await readable(search);await search.fill('input');await expect(search).toBeFocused();
  await search.blur();await expect(search).not.toBeFocused();await expectContained(page);
  // Desktop WebKit cannot reproduce UIKit keyboard zoom. Check its trigger and
  // native viewport contract here; a physical iPhone remains the release check.
});
test('touch foundation fields and dialog keep native text readable',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/foundations#control-states',info);
  const controls=page.getByRole('region',{name:'Control standards',exact:true});
  for(const field of [controls.getByRole('textbox',{name:'Project title',exact:true}),controls.getByRole('combobox',{name:'Disciplines',exact:true}),controls.getByRole('combobox',{name:'Find a discipline',exact:true})]){
    await readable(field);await field.focus();await expect(field).toBeFocused();await page.keyboard.press('Escape');await field.blur();
  }
  await controls.getByRole('button',{name:'Review changes',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Review changes',exact:true});
  const notes=dialog.getByRole('textbox',{name:'Review context',exact:true});
  await readable(notes);await notes.fill('Readable on touch devices.');await expect(notes).toBeFocused();
  await dialog.getByRole('button',{name:'Done',exact:true}).click();await expectContained(page);
});
test('touch number entry keeps readable native text and focus',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/components/number-field',info);
  const quantity=page.locator('.bui-number-input').first();await readable(quantity);await quantity.focus();await expect(quantity).toBeFocused();await quantity.blur();await expectContained(page);
});
test('touch compact inputs preserve readable text and larger custom text',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/components/input',info);
  const compact=page.getByRole('textbox',{name:'Workspace ID',exact:true});await readable(compact);
  const email=page.getByRole('textbox',{name:'Email address',exact:true});await readable(email);
  await email.evaluate(element=>element.style.setProperty('--bui-text-control','20px'));
  expect(await email.evaluate(element=>getComputedStyle(element).fontSize)).toBe('20px');
  await email.fill('reader@example.test');await email.blur();await expectContained(page);
});
test('touch theme link fallback keeps readable text and native focus',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/themes',info);
  const accent=page.getByRole('textbox',{name:'Accent colour',exact:true});await readable(accent);
  expect(await accent.evaluate(element=>element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('Clipboard is blocked','NotAllowedError');}}});});
  await page.getByRole('button',{name:'Copy theme link',exact:true}).click();
  const link=page.getByRole('textbox',{name:'Theme link',exact:true});await readable(link);await link.focus();await expect(link).toBeFocused();await link.blur();await expectContained(page);
});

test('preview and template marks stay vector shapes in both themes',async({page},info)=>{
  await openQualityPage(page,'/blocks',info);
  const marks=page.locator('.art-mark');expect(await marks.count()).toBeGreaterThan(1);
  const headerPath=await page.locator('.brand-mark svg path').getAttribute('d');
  expect(headerPath).toBeTruthy();
  for(const mark of await marks.all()){
    await expect(mark).toHaveText('');await expect(mark.locator('svg')).toHaveAttribute('data-bui-icon','mark');
    await expect(mark.locator('svg')).toHaveAttribute('stroke','currentColor');
    await expect(mark.locator('path')).toHaveAttribute('d',headerPath!);
    expect(await mark.evaluate(element=>getComputedStyle(element).color)).not.toBe(await mark.evaluate(element=>getComputedStyle(element).backgroundColor));
  }
  await expectContained(page);
  await openQualityPage(page,'/templates/outline',info);
  const wordmark=page.locator('.bblocks-wordmark>span');
  await expect(wordmark.locator('svg')).toHaveAttribute('data-bui-icon','mark');
  await expect(wordmark.locator('svg path')).toHaveAttribute('d',headerPath!);
  await expectContained(page);
});


test('touch single-date editing keeps native text readable and zoom unrestricted',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/components/date-picker',info);
  const date=page.locator('[data-example-id="date-entry-lifecycle"]').getByRole('textbox',{name:'Review date',exact:true});
  await readable(date);await date.focus();await expect(date).toBeFocused();await date.blur();await expectContained(page);
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=/i);
});
test('touch range editing keeps both native fields readable and zoom unrestricted',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/components/date-range',info);
  const range=page.locator('[data-example-id="date-range-presets"]');
  for(const name of ['Start reporting period','End reporting period']){const field=range.getByRole('textbox',{name,exact:true});await readable(field);await field.focus();await expect(field).toBeFocused();await field.blur();}
  await expectContained(page);
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=/i);
});
test('touch hierarchical search keeps native text readable and zoom unrestricted',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/components/tree-select',info);
  const tree=page.locator('[data-example-id="tree-select-native"]');await tree.getByRole('button',{name:'Team access',exact:true}).tap();
  const popup=page.getByRole('dialog',{name:'Team access choices',exact:true}),search=popup.getByRole('searchbox');await readable(search);await search.focus();await expect(search).toBeFocused();await page.keyboard.press('Escape');
  await expect(popup).toBeHidden();await expectContained(page);
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=/i);
});
test('touch grid date editing retains native focus cancellation and unrestricted zoom',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/components/data-grid',info);
  const grid=page.locator('[data-example-id="grid-editor-mixed"]').getByRole('grid',{name:'Delivery editor grid',exact:true}),cell=grid.getByRole('gridcell',{name:'Due date for REC-1',exact:true});
  await cell.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await cell.tap();await cell.press('Enter');
  const panel=page.getByRole('dialog',{name:'Edit due date',exact:true}),field=panel.getByRole('textbox',{name:'Due date for REC-1',exact:true});await readable(field);await field.focus();await expect(field).toBeFocused();
  await panel.getByRole('button',{name:'Cancel',exact:true}).tap();await expect(panel).toBeHidden();await expect(cell).toBeFocused();await expectContained(page);
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=/i);
});
