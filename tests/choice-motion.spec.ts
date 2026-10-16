import {test,expect} from '@playwright/test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Progress} from '../packages/ui/dist/core.js';

test('radio, checkbox and switch indicators animate and retarget without moving their hit areas',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/foundations');const specimen=page.getByRole('region',{name:'Control standards'});
  const radio=specimen.getByRole('radio',{name:'Compact',exact:true});const box=await radio.boundingBox();expect(await radio.evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('0');
  const activation=await radio.evaluate(el=>{(el as HTMLInputElement).click();return {shadow:getComputedStyle(el).boxShadow,animations:el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length};});expect(activation.shadow).not.toBe('none');expect(activation.animations).toBeGreaterThan(0);await expect(radio).toBeChecked();
  await expect.poll(()=>radio.evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('1');expect(await radio.boundingBox()).toEqual(box);
  const checkbox=specimen.getByRole('checkbox',{name:'Include archived',exact:true});expect(await checkbox.evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('0');const checkAnimations=await checkbox.evaluate(el=>{(el as HTMLInputElement).click();return el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length;});expect(checkAnimations).toBeGreaterThan(0);await expect.poll(()=>checkbox.evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('1');
  const toggle=specimen.getByRole('switch',{name:'Weekly digest',exact:true});const toggleBox=await toggle.boundingBox();const returnMotion=await toggle.evaluate(el=>{getComputedStyle(el,'::after').transform;(el as HTMLInputElement).click();return el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length;});expect(returnMotion).toBeGreaterThan(0);await expect(toggle).not.toBeChecked();
  // Reverse while the thumb is travelling, then let it settle to its real state.
  await toggle.evaluate(el=>(el as HTMLInputElement).click());await expect(toggle).toBeChecked();await expect.poll(()=>toggle.evaluate(el=>getComputedStyle(el,'::after').transform)).toBe('matrix(1, 0, 0, 1, 18, 0)');expect(await toggle.boundingBox()).toEqual(toggleBox);
  await specimen.locator('.control-standards-panel').filter({has:page.getByRole('heading',{name:'Choices',exact:true})}).screenshot({path:'.local/previews/choice-depth-light.png',style:'.site-header,.skip-link{visibility:hidden!important}'});
  await page.getByRole('button',{name:'Switch to dark theme'}).click();await specimen.locator('.control-standards-panel').filter({has:page.getByRole('heading',{name:'Choices',exact:true})}).screenshot({path:'.local/previews/choice-depth-dark.png',style:'.site-header,.skip-link{visibility:hidden!important}'});
});

test('choice motion becomes immediate with reduced motion and keeps forced-colour focus',async({page})=>{
  await page.goto('/foundations');const specimen=page.getByRole('region',{name:'Control standards'});const radio=specimen.getByRole('radio',{name:'Compact',exact:true});await radio.focus();await page.keyboard.press('Space');await expect(radio).toBeChecked();expect(await radio.evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('1');expect(await radio.evaluate(el=>getComputedStyle(el,'::after').transitionDuration)).toBe('0s');
  const toggle=specimen.getByRole('switch',{name:'Weekly digest',exact:true});await toggle.focus();await page.keyboard.press('Space');await expect(toggle).not.toBeChecked();expect(await toggle.evaluate(el=>getComputedStyle(el,'::after').transform)).toBe('none');expect(await toggle.evaluate(el=>getComputedStyle(el,'::after').transitionDuration)).toBe('0s');
  await page.emulateMedia({forcedColors:'active'});await radio.focus();expect(await radio.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');expect(await radio.evaluate(el=>getComputedStyle(el).boxShadow)).toBe('none');
});

test('progress clamps invalid ranges and keeps percentages consistent with native values',()=>{
  for(const [value,max,percentage,native] of [[140,100,'100%',100],[-10,100,'0%',0],[10,0,'10%',10],[NaN,100,'0%',0]] as const){const html=renderToStaticMarkup(createElement(Progress,{label:'Transfer',value,max}));expect(html).toContain(percentage);expect(html).toContain('value="'+native+'"');expect(html).toContain('max="100"');}
  const pending=renderToStaticMarkup(createElement(Progress,{label:'Transfer',value:null}));expect(pending).toContain('In progress');expect(pending).not.toContain('value="');
});
