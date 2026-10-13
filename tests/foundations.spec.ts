import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {cn} from '../packages/ui/dist/utils.js';

test('prefixed utilities merge without losing consumer classes',()=>{
  expect(cn('bui:px-2','bui:px-4','custom-panel')).toBe('bui:px-4 custom-panel');
  expect(cn('bui:hover:bg-primary','bui:hover:bg-accent')).toBe('bui:hover:bg-accent');
});
test('drawer contains focus, keeps a draft and restores its trigger',async({page})=>{
  await page.goto('/components/drawer');const trigger=page.getByRole('button',{name:'Open drawer',exact:true});await trigger.click();
  const dialog=page.getByRole('dialog',{name:'A little room to plan.'});const input=dialog.getByRole('textbox',{name:'Note title'});
  await expect(input).toBeFocused();await input.fill('A lasting drawer draft');
  await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Keep draft'})).toBeFocused();
  await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Close drawer'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
  await trigger.click();await expect(input).toHaveValue('A lasting drawer draft');await dialog.getByRole('button',{name:'Keep draft'}).click();await expect(trigger).toBeFocused();
});
test('context menu shares actions, disabled state and checkbox with a visible menu',async({page})=>{
  await page.goto('/components/context-menu');const trigger=page.getByLabel('Interface notes actions');await trigger.click({button:'right'});
  const menu=page.getByRole('menu',{name:'Note actions',exact:true});await expect(menu).toBeVisible();await expect(menu.getByRole('menuitem',{name:'Share link'})).toHaveAttribute('aria-disabled','true');
  await menu.getByRole('menuitemcheckbox',{name:'Pinned'}).click();await expect(menu.getByRole('menuitemcheckbox',{name:'Pinned'})).toHaveAttribute('aria-checked','true');
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  await page.getByRole('button',{name:'Note actions',exact:true}).click();await page.getByRole('menuitem',{name:'Unpin note'}).click();await expect(page.getByRole('status').filter({hasText:'Not pinned.'})).toBeVisible();
  await trigger.focus();await page.keyboard.press('Shift+F10');await expect(menu).toBeVisible();await menu.getByRole('menuitem',{name:'Open note',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Opened interface notes.'})).toBeVisible();
});
test('context submenu supports radio selection with keyboard',async({page})=>{
  await page.goto('/components/context-menu');await page.getByLabel('Interface notes actions').click({button:'right'});
  const density=page.getByRole('menuitem',{name:'Density',exact:true});await density.focus();await page.keyboard.press('ArrowRight');
  const menu=page.getByRole('menu',{name:'Density',exact:true});await expect(menu).toBeVisible();
  const compact=page.getByRole('menuitemradio',{name:'Compact',exact:true});await compact.click();await expect(compact).toHaveAttribute('aria-checked','true');await page.keyboard.press('Escape');await expect(menu).not.toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('status').filter({hasText:'Compact spacing.'})).toBeVisible();
});
test('desktop sidebar collapses without losing names or navigation',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/components/sidebar');
  const nav=page.getByRole('navigation',{name:'Demo workspace'});await nav.getByRole('button',{name:'Resources',exact:true}).click();await expect(nav.getByRole('button',{name:'Resources',exact:true})).toHaveAttribute('aria-current','page');
  await page.getByRole('button',{name:'Collapse navigation'}).click();await expect(page.locator('.bui-sidebar')).toHaveAttribute('data-collapsed','true');
  await nav.getByRole('button',{name:'Settings',exact:true}).click();await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Expand navigation'}).click();await expect(nav.getByText('Settings',{exact:true})).toBeVisible();
});
test('mobile sidebar closes on selection, keeps state and restores focus',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/templates/outline');
  const trigger=page.getByRole('button',{name:'Open navigation',exact:true});await trigger.click();
  const drawer=page.getByRole('dialog',{name:'Outline views'});await drawer.getByRole('button',{name:'Settings',exact:true}).click();await expect(drawer).not.toBeVisible();await expect(trigger).toBeFocused();
  await page.getByRole('textbox',{name:'Display name',exact:true}).fill('A mobile draft');
  await trigger.click();await drawer.getByRole('button',{name:'Planning',exact:true}).click();await trigger.click();await drawer.getByRole('button',{name:'Settings',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Display name',exact:true})).toHaveValue('A mobile draft');
  await trigger.click();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const theme of ['light','dark'])test('new navigation passes axe and renders in '+theme,async({page},testInfo)=>{
  await page.setViewportSize({width:1440,height:1000});
  for(const id of ['sidebar','drawer','context-menu']){
    await page.goto('/components/'+id);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();
    if(id==='drawer')await page.getByRole('button',{name:'Open drawer',exact:true}).click();
    if(id==='context-menu')await page.getByLabel('Interface notes actions').click({button:'right'});
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),id).toEqual([]);
    await page.screenshot({path:testInfo.outputPath(id+'-'+theme+'.png'),fullPage:true});
  }
});
test('new motion respects reduced motion and mobile layout',async({page})=>{
  await page.setViewportSize({width:320,height:720});await page.goto('/components/drawer');await page.getByRole('button',{name:'Open drawer',exact:true}).click();
  expect(await page.locator('.bui-drawer').evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press('Escape');await page.goto('/components/sidebar');await page.getByRole('button',{name:'Open navigation'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test.describe('touch input',()=>{
  test.use({hasTouch:true});
  test('drawer dismisses by swiping the handle',async({page})=>{
    await page.setViewportSize({width:390,height:844});await page.goto('/components/drawer');await page.getByRole('button',{name:'Open drawer',exact:true}).tap();
    const drawer=page.getByRole('dialog',{name:'A little room to plan.'});await expect(drawer).toBeVisible();
    const handle=(await page.locator('.bui-drawer-handle').boundingBox())!;const x=handle.x+handle.width/2,y=handle.y+handle.height/2;
    const client=await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let step=1;step<=8;step++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+step*22}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect(drawer).not.toBeVisible();await client.detach();
  });
});
