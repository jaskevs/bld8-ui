import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('.local/previews',{recursive:true});

test('search fields expose required state, feedback and keyboard selection',async({page})=>{
  await page.goto('/foundations');const specimen=page.getByRole('region',{name:'Control standards'});
  const input=specimen.getByRole('combobox',{name:'Find a discipline',exact:true});
  await expect(input).toHaveAttribute('aria-invalid','true');await expect(input).toHaveAccessibleDescription('Search by name, then choose a result. Choose a discipline before continuing.');
  await expect(specimen.locator('label').filter({hasText:'Find a discipline'})).toContainText('*');await expect(specimen.locator('label').filter({hasText:'Delivery team'})).toContainText('*');
  await input.fill('Interface');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(input).toHaveValue('Interface engineering');
  const clear=specimen.getByRole('button',{name:'Clear find a discipline',exact:true});await clear.click();await expect(input).toHaveValue('');await expect(input).toBeFocused();await page.keyboard.press('Escape');
  await input.fill('Nothing matches');await expect(page.getByText('No matching options.',{exact:true})).toBeVisible();await page.keyboard.press('Escape');
});

test('long chips and menu labels stay contained and keep their full accessible names',async({page})=>{
  await page.setViewportSize({width:320,height:740});await page.goto('/foundations');const specimen=page.getByRole('region',{name:'Control standards'});
  const remove=specimen.getByRole('button',{name:'Remove Interface engineering and component systems',exact:true});await remove.scrollIntoViewIfNeeded();
  expect(await remove.locator('..').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await remove.click();await expect(remove).toHaveCount(0);
  await specimen.getByRole('button',{name:'More actions',exact:true}).click();const item=page.getByRole('menuitem',{name:'Open note',exact:true});await expect(item).toBeVisible();await expect(item.locator('kbd')).toHaveText('↵');
  const bounds=(await page.locator('.bui-menu').boundingBox())!;expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(320);await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('navigation controls preserve keyboard movement, disabled choices and pagination',async({page})=>{
  await page.goto('/foundations');const specimen=page.getByRole('region',{name:'Control standards'});
  const tabs=specimen.getByRole('tablist',{name:'Preview sections'});await tabs.getByRole('tab',{name:'Overview',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(tabs.getByRole('tab',{name:'Details',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(tabs.getByRole('tab',{name:'Details',exact:true})).toHaveAttribute('aria-selected','true');await page.keyboard.press('ArrowRight');const unavailable=tabs.getByRole('tab',{name:'History',exact:true});await expect(unavailable).toBeFocused();await expect(unavailable).toBeDisabled();await page.keyboard.press('Enter');await expect(tabs.getByRole('tab',{name:'Details',exact:true})).toHaveAttribute('aria-selected','true');expect(await unavailable.evaluate(el=>Number(getComputedStyle(el).opacity))).toBeLessThan(.5);await page.keyboard.press('Home');await expect(tabs.getByRole('tab',{name:'Overview',exact:true})).toBeFocused();
  const disclosure=specimen.getByRole('button',{name:'How is the spacing chosen?',exact:true});await disclosure.focus();await page.keyboard.press('Space');await expect(disclosure).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Space');await expect(disclosure).toHaveAttribute('aria-expanded','false');await expect(specimen.getByRole('button',{name:'More details soon'})).toBeDisabled();
  const pagination=specimen.getByRole('navigation',{name:'Preview pages'});await expect(pagination.getByRole('button',{name:'Previous'})).toBeDisabled();await pagination.getByRole('button',{name:'Next'}).click();await expect(pagination).toContainText('Page 2 of 3');await pagination.getByRole('button',{name:'Next'}).click();await expect(pagination.getByRole('button',{name:'Next'})).toBeDisabled();
});

test('dialog heading and close action remain reachable while its content scrolls',async({page})=>{
  await page.setViewportSize({width:390,height:620});await page.goto('/foundations');const trigger=page.getByRole('region',{name:'Control standards'}).getByRole('button',{name:'Review changes',exact:true});await trigger.click();const dialog=page.getByRole('dialog',{name:'Review changes',exact:true});await expect(dialog).not.toHaveAttribute('data-starting-style');const heading=dialog.getByRole('heading',{name:'Review changes',exact:true});const before=(await heading.boundingBox())!;const body=dialog.locator('.bui-dialog-body');expect(await body.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
  await dialog.getByRole('button',{name:'Done',exact:true}).focus();await expect(dialog.getByRole('button',{name:'Done',exact:true})).toBeInViewport();expect((await heading.boundingBox())!.y).toBeCloseTo(before.y,0);await expect(dialog.getByRole('button',{name:'Close dialog'})).toBeInViewport();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});

test('file selection preserves long names, removal focus and error feedback',async({page})=>{
  await page.goto('/foundations');const specimen=page.getByRole('region',{name:'Control standards'});const upload=specimen.locator('.bui-file-upload');const name='An-interface-review-with-a-deliberately-long-file-name.txt';await upload.locator('input[type=file]').setInputFiles({name,mimeType:'text/plain',buffer:Buffer.from('Notes')});await expect(upload.getByRole('status')).toHaveText('1 file selected.');await upload.getByRole('button',{name:'Remove '+name,exact:true}).click();await expect(upload.getByRole('button',{name:'Browse files'})).toBeFocused();await expect(upload.getByRole('list')).toHaveCount(0);
  await upload.locator('input[type=file]').setInputFiles({name:'image.exe',mimeType:'application/octet-stream',buffer:Buffer.from('Not allowed')});await expect(upload.getByRole('alert')).toContainText('unsupported file type');
});

for(const theme of ['light','dark'])test('whole control family is accessible in '+theme,async({page})=>{
  test.setTimeout(90000);await page.goto('/foundations');if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();const specimen=page.getByRole('region',{name:'Control standards'});await specimen.scrollIntoViewIfNeeded();const result=await new AxeBuilder({page}).include('.control-standards').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  for(const title of ['Fields','Navigation','Dates','Search & selection','Context & feedback']){const panel=specimen.locator('.control-standards-panel').filter({has:page.getByRole('heading',{name:title,exact:true})});await panel.screenshot({path:'.local/previews/family-'+title.replace(/[^a-z]/gi,'-')+'-'+theme+'.png',style:'.site-header,.skip-link{visibility:hidden!important}'});}
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test('choice and navigation hit areas expand on touch without extra motion',async({browser})=>{
  const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();await page.goto('http://127.0.0.1:'+String(process.env.BLD8_UI_TEST_PORT||3121)+'/foundations');const specimen=page.getByRole('region',{name:'Control standards'});expect((await specimen.getByRole('checkbox',{name:'Include archived',exact:true}).locator('..').boundingBox())!.height).toBeGreaterThanOrEqual(44);const tab=specimen.getByRole('tab',{name:'Overview',exact:true});expect((await tab.boundingBox())!.height).toBeGreaterThanOrEqual(44);expect(await tab.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');await context.close();
});
