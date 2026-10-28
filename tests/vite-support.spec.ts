import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {library} from '../apps/docs/src/lib/generated/catalog';

test('starter menu offers working Next.js and Vite downloads with keyboard return',async({page})=>{
  await page.goto('/templates/outline');const trigger=page.getByRole('button',{name:'Download starter',exact:true});
  await trigger.focus();await page.keyboard.press('Enter');const popup=page.getByRole('dialog',{name:'Choose a starter'});
  await expect(popup.getByRole('link',{name:'Next.js',exact:false})).toHaveAttribute('href','/downloads/outline.zip');
  const vite=popup.getByRole('link',{name:'React + Vite',exact:false});await expect(vite).toHaveAttribute('href','/downloads/outline-vite.zip');
  const [download]=await Promise.all([page.waitForEvent('download'),vite.click()]);expect(download.suggestedFilename()).toBe('outline-vite.zip');
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});

test('every catalogue entry exposes both framework archives without changing the legacy download',async({request})=>{
  for(const item of [...library.blocks,...library.templates]){
    const manifest=await(await request.get('/sources/'+item.id+'.json')).json();
    expect(manifest.download).toBe('/downloads/'+item.id+'.zip');expect(manifest.downloads.nextjs).toBe(manifest.download);
    expect(manifest.downloads.vite).toBe('/downloads/'+item.id+'-vite.zip');expect(manifest.frameworks).toEqual(['React + Next.js','React + Vite']);
    for(const url of Object.values(manifest.downloads) as string[]){const response=await request.get(url);expect(response.ok(),url).toBe(true);expect((await response.body()).subarray(0,4).toString('hex')).toBe('504b0304');}
  }
});

test('framework guide explains both starters and the server migration boundary',async({page})=>{
  await page.goto('/');await page.getByRole('link',{name:'React, Vite & Next.js guide',exact:true}).click();await expect(page).toHaveURL(/\/frameworks$/);
  await page.getByRole('link',{name:'Vite setup',exact:true}).click();await expect(page).toHaveURL(/#vite$/);
  await expect(page.getByRole('link',{name:'Download Vite workspace'})).toHaveAttribute('href','/downloads/outline-vite.zip');
  await expect(page.getByRole('region',{name:'Framework migration guide'})).toContainText('Server Components, actions and API routes');
  await page.goto('/react-nextjs');await expect(page.getByRole('heading',{name:'React with Vite',exact:true})).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://ui.bld8.dev/frameworks');
});

for(const theme of ['light','dark'])test('framework choices and open download popup are accessible in '+theme,async({page})=>{
  for(const route of ['/frameworks','/blocks/activity-feed']){
    await page.goto(route);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();
    if(route.startsWith('/blocks'))await page.getByRole('button',{name:'Download starter',exact:true}).click();
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
});

for(const width of [1440,768,390,320])test('framework guide and download chooser fit at '+width,async({page})=>{
  await page.setViewportSize({width,height:1000});
  for(const route of ['/frameworks','/blocks/activity-feed']){
    await page.goto(route);if(route.startsWith('/blocks'))await page.getByRole('button',{name:'Download starter',exact:true}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
  }
});
