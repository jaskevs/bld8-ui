import {test,expect,openQualityPage,expectContained} from './fixtures';
import type {Locator} from '@playwright/test';

async function readable(field:Locator) {
  await expect(field).toBeVisible();
  expect(await field.evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
}

test('touch editing keeps readable text, native focus and unrestricted zoom',async({page},info)=>{
  expect(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches)).toBe(true);
  await openQualityPage(page,'/components',info);
  const viewport=page.locator('meta[name="viewport"]');
  await expect(viewport).toHaveAttribute('content',/width=device-width/);
  expect(await viewport.getAttribute('content')).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=/i);
  const search=page.getByRole('searchbox',{name:'Find a component',exact:true});
  await readable(search);await search.fill('input');await expect(search).toBeFocused();
  await search.blur();await expect(search).not.toBeFocused();await expectContained(page);

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

  await openQualityPage(page,'/components/number-field',info);
  const quantity=page.locator('.bui-number-input').first();await readable(quantity);await quantity.focus();await expect(quantity).toBeFocused();await quantity.blur();await expectContained(page);
  await openQualityPage(page,'/components/input',info);
  const compact=page.getByRole('textbox',{name:'Workspace ID',exact:true});await readable(compact);
  const email=page.getByRole('textbox',{name:'Email address',exact:true});await readable(email);
  await email.evaluate(element=>element.style.setProperty('--bui-text-control','20px'));
  expect(await email.evaluate(element=>getComputedStyle(element).fontSize)).toBe('20px');
  await email.fill('reader@example.test');await email.blur();await expectContained(page);
  await openQualityPage(page,'/themes',info);
  const accent=page.getByRole('textbox',{name:'Accent colour',exact:true});await readable(accent);
  expect(await accent.evaluate(element=>element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('Clipboard is blocked','NotAllowedError');}}});});
  await page.getByRole('button',{name:'Copy theme link',exact:true}).click();
  const link=page.getByRole('textbox',{name:'Theme link',exact:true});await readable(link);await link.focus();await expect(link).toBeFocused();await link.blur();await expectContained(page);
  // Desktop WebKit cannot reproduce UIKit keyboard zoom. Check its trigger and
  // native viewport contract here; a physical iPhone remains the release check.
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
