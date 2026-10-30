import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('.local/previews',{recursive:true});

test('shared control geometry keeps icons, fields and loading aligned',async({page})=>{
  await page.goto('/foundations');const specimen=page.getByRole('region',{name:'Control standards'});await specimen.scrollIntoViewIfNeeded();
  for(const control of [specimen.getByRole('button',{name:'Save changes',exact:true}),specimen.getByRole('button',{name:'New note',exact:true}),specimen.getByRole('textbox',{name:'Contact email'}),specimen.getByRole('combobox',{name:'Review status'})]){
    expect((await control.boundingBox())!.height).toBeCloseTo(44,0);
  }
  for(const control of [specimen.getByRole('checkbox',{name:'Include archived',exact:true}),specimen.getByRole('radio',{name:'Comfortable',exact:true})]){
    const box=(await control.boundingBox())!;expect(box.width).toBe(20);expect(box.height).toBe(20);expect((await control.locator('..').boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  const toggle=specimen.getByRole('switch',{name:'Weekly digest',exact:true});const switchBox=(await toggle.boundingBox())!;expect(switchBox.width).toBe(44);expect(switchBox.height).toBe(26);
  expect(await toggle.evaluate(el=>getComputedStyle(el,'::after').backgroundColor)).toBe('rgb(23, 23, 23)');
  const icon=(await specimen.getByRole('button',{name:'New note',exact:true}).boundingBox())!;expect(icon.width).toBeCloseTo(icon.height,0);
  expect((await specimen.getByRole('button',{name:'Reset preview',exact:true}).boundingBox())!.height).toBeCloseTo(36,0);
  const loading=specimen.getByRole('button',{name:'Saving changes',exact:true});await expect(loading).toBeDisabled();await expect(loading).toHaveAttribute('aria-busy','true');
  await specimen.getByRole('textbox',{name:'Project title'}).focus();const edge=await specimen.locator('.bui-input-group').evaluate(el=>({outer:getComputedStyle(el).boxShadow,inner:getComputedStyle(el.querySelector('input')!).boxShadow}));expect(edge.outer).toContain('1px');expect(edge.inner).toBe('none');
  await specimen.getByRole('button',{name:'Save changes',exact:true}).click();await expect(specimen.getByRole('status').filter({hasText:'Changes saved'})).toHaveText('Changes saved in this preview.');
  await specimen.screenshot({path:'.local/previews/control-standards-light.png',caret:'initial',style:'.site-header,.skip-link { visibility:hidden !important; }'});
});

test('styled native choices retain keyboard behaviour and slider progress',async({page})=>{
  await page.goto('/foundations');const specimen=page.getByRole('region',{name:'Control standards'});const choice=specimen.getByRole('checkbox',{name:'Include archived',exact:true});await choice.focus();await page.keyboard.press('Space');await expect(choice).toBeChecked();
  const comfortable=specimen.getByRole('radio',{name:'Comfortable',exact:true});await comfortable.focus();await page.keyboard.press('ArrowDown');await expect(specimen.getByRole('radio',{name:'Compact',exact:true})).toBeChecked();await expect(specimen.getByRole('radio',{name:'Compact',exact:true})).toBeFocused();await page.keyboard.press('ArrowDown');await expect(comfortable).toBeChecked();
  const range=specimen.getByRole('slider',{name:'Preview scale'});await range.focus();await page.keyboard.press('Home');await expect(range).toHaveValue('25');expect(await range.evaluate(el=>el.style.getPropertyValue('--bui-slider-progress'))).toBe('0%');await page.keyboard.press('End');await expect(range).toHaveValue('100');expect(await range.evaluate(el=>el.style.getPropertyValue('--bui-slider-progress'))).toBe('100%');await page.keyboard.press('ArrowLeft');await expect(range).toHaveValue('95');
  await page.emulateMedia({forcedColors:'active'});await comfortable.focus();expect(await comfortable.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
  await range.focus();expect(await range.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
});

test('dropdown and context menus share geometry and preserve destructive states',async({page})=>{
  await page.goto('/foundations');const specimen=page.getByRole('region',{name:'Control standards'});await specimen.getByRole('button',{name:'More actions',exact:true}).click();const option=page.getByRole('menuitem',{name:'Open note',exact:true});const dropdown=await option.evaluate(el=>({height:el.getBoundingClientRect().height,padding:getComputedStyle(el).padding,font:getComputedStyle(el).fontSize,radius:getComputedStyle(el.closest('.bui-popup')!).borderRadius}));
  const destructive=page.getByRole('menuitem',{name:'Archive note',exact:true});await destructive.focus();const destructiveColours=await destructive.evaluate(el=>{
    const style=getComputedStyle(el),token=style.getPropertyValue('--bui-danger').trim(),probe=document.createElement('span');
    probe.style.color=token;document.body.append(probe);
    const expected=getComputedStyle(probe).color;probe.remove();
    return {actual:style.color,expected,token};
  });expect(destructiveColours.token).not.toBe('');expect(destructiveColours.actual).toBe(destructiveColours.expected);await page.keyboard.press('Escape');
  await page.goto('/components/context-menu');await page.getByLabel('Interface notes actions').click({button:'right'});const context=await page.getByRole('menuitem',{name:'Open note',exact:true}).evaluate(el=>({height:el.getBoundingClientRect().height,padding:getComputedStyle(el).padding,font:getComputedStyle(el).fontSize,radius:getComputedStyle(el.closest('.bui-context-menu')!).borderRadius}));expect(context).toEqual(dropdown);await page.keyboard.press('Escape');
});

for(const theme of ['light','dark'])test('control states are accessible and contained in '+theme,async({page})=>{
  test.setTimeout(60000);await page.goto('/foundations');if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();const specimen=page.getByRole('region',{name:'Control standards'});await specimen.scrollIntoViewIfNeeded();
  const result=await new AxeBuilder({page}).include('.control-standards').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  if(theme==='dark')await specimen.screenshot({path:'.local/previews/control-standards-dark.png',caret:'initial',style:'.site-header,.skip-link { visibility:hidden !important; }'});
  for(const label of ['Review changes','Open details']){const trigger=specimen.getByRole('button',{name:label,exact:true});await trigger.click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();expect(await dialog.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');await page.keyboard.press('Escape');await expect(trigger).toBeFocused();}
  await page.setViewportSize({width:320,height:740});await specimen.scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await specimen.screenshot({path:'.local/previews/control-standards-mobile-'+theme+'.png',caret:'initial',style:'.site-header,.skip-link { visibility:hidden !important; }'});
});

test('touch targets expand while press feedback keeps button geometry stable',async({browser})=>{
  const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844},reducedMotion:'no-preference'});const page=await context.newPage();await page.goto('http://127.0.0.1:'+String(process.env.BLD8_UI_TEST_PORT||3121)+'/foundations');const specimen=page.getByRole('region',{name:'Control standards'});const compact=specimen.getByRole('button',{name:'Reset preview',exact:true});expect((await compact.boundingBox())!.height).toBeCloseTo(44,0);
  await specimen.getByRole('button',{name:'More actions',exact:true}).click();expect((await page.getByRole('menuitem',{name:'Open note',exact:true}).boundingBox())!.height).toBeCloseTo(44,0);await page.keyboard.press('Escape');
  const button=specimen.getByRole('button',{name:'Save changes',exact:true});await button.scrollIntoViewIfNeeded();await button.hover();const bounds=await button.boundingBox();await page.mouse.down();expect(await button.evaluate(el=>getComputedStyle(el).transform)).toBe('none');expect(await button.boundingBox()).toEqual(bounds);await page.mouse.up();await context.close();
});
