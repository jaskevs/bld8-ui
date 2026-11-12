import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {hasFullNotice,mitNotice} from '../scripts/license-policy.mjs';

test('icon directory searches, filters, paginates and resets empty results',async ({page}) => {
  await page.goto('/icons');await expect(page.locator('.icon-tile')).toHaveCount(72);
  await page.getByRole('navigation',{name:'Icon pages'}).getByRole('button',{name:'Next',exact:true}).click();
  await expect(page.getByText(/^Page 2 of \d+$/)).toBeVisible();
  await page.getByRole('searchbox',{name:'Search icons'}).fill('camera');
  await page.getByRole('group',{name:'Icon categories'}).getByRole('button',{name:'Media',exact:true}).click();
  await page.getByRole('button',{name:'Camera',exact:true}).click();
  await expect(page.getByRole('complementary',{name:'Selected icon'}).getByRole('heading',{name:'Camera',exact:true})).toBeVisible();
  await page.getByRole('searchbox',{name:'Search icons'}).fill('there-is-no-such-icon');
  await expect(page.getByRole('heading',{name:'No matching icons.'})).toBeVisible();
  await page.getByRole('button',{name:'Reset icon filters'}).click();await expect(page.locator('.icon-tile')).toHaveCount(72);
});

test('icon inspector provides usable React code and licensed SVG downloads',async ({page,context,request}) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/icons');
  await page.getByRole('group',{name:'Preview size'}).getByRole('button',{name:'20px',exact:true}).click();
  await page.getByRole('group',{name:'Stroke width'}).getByRole('button',{name:'1.5',exact:true}).click();
  await expect(page.locator('.icon-inspector .code-block code')).toContainText('size={20} strokeWidth={1.5}');
  await page.getByRole('button',{name:'Copy code',exact:true}).click();
  const copied=await page.evaluate(() => navigator.clipboard.readText());expect(copied).toContain('import { Camera }');expect(hasFullNotice(copied,mitNotice())).toBe(true);
  const source=await request.get('/icon-assets/camera-1.5.svg');expect(source.ok()).toBe(true);
  const svg=await source.text();expect(svg).toContain('ISC License');expect(svg).toContain('Cole Bemis');expect(svg).toContain('stroke-width="1.5"');expect(svg).not.toContain('<script');
  await page.getByRole('button',{name:'Copy SVG',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'SVG copied, with licence notices.'})).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('<svg');
});

test('shared icon API preserves labels, dimensions and dotted arrow identity',async ({page}) => {
  await page.goto('/components/icon');
  const camera=page.getByRole('img',{name:'Camera',exact:true});
  await expect(camera).toHaveAttribute('width','24');await expect(camera).toHaveAttribute('stroke-width','1.75');
  await expect(page.getByRole('button',{name:'Save note',exact:true}).locator('svg')).toHaveAttribute('aria-hidden','true');
  await expect(page.getByRole('button',{name:'Open camera',exact:true})).toBeVisible();
  await expect(page.getByRole('img',{name:'BLD8 dotted arrow'}).locator('circle')).toHaveCount(8);
});

test('input adornments keep native labels, clear actions and visible keyboard focus',async ({page}) => {
  await page.goto('/components/input-group');
  const search=page.getByRole('searchbox',{name:'Search library'});await search.fill('notes');
  const clear=page.getByRole('button',{name:'Clear search',exact:true});await clear.click();
  await expect(search).toHaveValue('');await expect(clear).toBeDisabled();
  await search.focus();const edge=await search.locator('..').evaluate(el=>({outline:getComputedStyle(el).outlineStyle,shadow:getComputedStyle(el).boxShadow}));expect(edge.outline).toBe('none');expect(edge.shadow).toContain('1px');
  await page.emulateMedia({forcedColors:'active'});expect(await search.locator('..').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');await page.emulateMedia({forcedColors:'none'});
  const invalid=page.getByRole('textbox',{name:'Account reference'});await expect(invalid).toHaveAttribute('aria-invalid','true');
  await expect(invalid).toHaveAttribute('aria-describedby',/.+/);
});

for(const theme of ['light','dark']) test('icon directory and extended controls are accessible in '+theme,async ({page}) => {
  for(const route of ['/icons','/components/icon','/components/input-group']) {
    await page.goto(route);if(theme==='dark') await page.getByRole('button',{name:'Switch to dark theme'}).click();
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(results.violations.map(item => ({id:item.id,targets:item.nodes.map(node => node.target)})),route).toEqual([]);
  }
});

for(const width of [1440,768,390,320]) test('icon directory stays crisp and contained at '+width+'px',async ({page}) => {
  await page.setViewportSize({width,height:900});await page.goto('/icons');
  expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('.icon-mask').first().evaluate(el => getComputedStyle(el).maskImage)).toContain('/icon-assets/');
  await expect(page.getByRole('searchbox',{name:'Search icons'})).toBeVisible();
  if(width>760) await expect(page.locator('.icon-inspector .code-block')).toBeVisible();
});

test('mobile browsing opens an on-demand inspector and returns focus',async ({page}) => {
  await page.setViewportSize({width:390,height:900});await page.goto('/icons');
  const search=page.getByRole('searchbox',{name:'Search icons'});await search.fill('camera');
  const camera=page.getByRole('button',{name:'Camera',exact:true});await camera.click();
  const dialog=page.getByRole('dialog',{name:'Camera',exact:true});await expect(dialog).toBeVisible();
  await dialog.getByRole('group',{name:'Preview size'}).getByRole('button',{name:'20px',exact:true}).click();
  await expect(dialog.locator('.code-block code')).toContainText('size={20}');
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations.map(item => item.id)).toEqual([]);
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(camera).toBeFocused();
});


test('icon inspector customisation stays local while common controls keep their geometry',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});await page.goto('/icons');await page.evaluate(()=>document.fonts.ready);
  const inspector=page.getByRole('complementary',{name:'Selected icon'}),gallery=page.locator('.icon-grid .icon-mask').first();
  const examples=inspector.getByRole('region',{name:'Icon button examples'});
  const heights=await examples.locator('button').evaluateAll(buttons=>buttons.map(button=>(button as HTMLElement).offsetHeight));
  await expect(gallery).toHaveCSS('width','24px');expect(await gallery.evaluate(element=>getComputedStyle(element).maskImage)).toContain('-1.75.svg');
  await inspector.getByRole('group',{name:'Preview size',exact:true}).getByRole('button',{name:'32px',exact:true}).click();
  await inspector.getByRole('group',{name:'Stroke width',exact:true}).getByRole('button',{name:'2',exact:true}).click();
  const selected=inspector.locator('.icon-showcase .icon-mask').first();await expect(selected).toHaveCSS('width','32px');expect(await selected.evaluate(element=>getComputedStyle(element).maskImage)).toContain('camera-2.svg');
  await expect(gallery).toHaveCSS('width','24px');expect(await gallery.evaluate(element=>getComputedStyle(element).maskImage)).toContain('-1.75.svg');
  await expect(page.locator('.icon-search svg').first()).toHaveAttribute('stroke-width','1.75');
  await expect(inspector.getByRole('button',{name:'Copy SVG',exact:true}).locator('svg')).toHaveAttribute('stroke-width','1.75');
  await expect(examples.locator('.icon-mask')).toHaveCount(3);
  for(const mask of await examples.locator('.icon-mask').all()){await expect(mask).toHaveCSS('width','18px');expect(await mask.evaluate(element=>getComputedStyle(element).maskImage)).toContain('camera-2.svg');}
  expect(await examples.locator('button').evaluateAll(buttons=>buttons.map(button=>(button as HTMLElement).offsetHeight))).toEqual(heights);
});

test('semantic icon actions and result keyboard navigation preserve selection',async({page})=>{
  await page.goto('/icons');const search=page.getByRole('searchbox',{name:'Search icons'}),results=page.getByRole('group',{name:'Icon results'});
  await search.fill('remove bin');await expect(results.getByRole('button')).toHaveCount(1);await expect(results.getByRole('button',{name:'Trash',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Choose Save icon',exact:true}).click();await expect(search).toHaveValue('save');
  const inspector=page.getByRole('complementary',{name:'Selected icon'});await expect(inspector.getByRole('heading',{name:'Save',exact:true})).toBeVisible();
  await search.fill('camera');const tiles=results.getByRole('button');await expect.poll(()=>tiles.count()).toBeGreaterThan(1);
  const nextName=await tiles.nth(1).getAttribute('title');await tiles.first().focus();await page.keyboard.press('ArrowRight');await expect(tiles.nth(1)).toBeFocused();
  await expect(results.locator('button[tabindex="0"]')).toHaveCount(1);await expect(inspector.getByRole('heading',{name:'Save',exact:true})).toBeVisible();
  await page.keyboard.press('Enter');await expect(inspector.getByRole('heading',{name:nextName!,exact:true})).toBeVisible();
  await page.keyboard.press('Home');await expect(tiles.first()).toBeFocused();await page.keyboard.press('End');await expect(tiles.last()).toBeFocused();
});

test('saved icons, share links and SVG exports preserve selected settings',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('/icons');
  let inspector=page.getByRole('complementary',{name:'Selected icon'});
  await inspector.getByRole('group',{name:'Preview size',exact:true}).getByRole('button',{name:'20px',exact:true}).click();
  await inspector.getByRole('group',{name:'Stroke width',exact:true}).getByRole('button',{name:'1.5',exact:true}).click();
  await inspector.getByRole('group',{name:'Preview colour',exact:true}).getByRole('button',{name:'Accent',exact:true}).click();
  const examples=inspector.getByRole('region',{name:'Icon button examples'});await examples.getByRole('button',{name:'Copy import',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe("import { Camera } from 'lucide-react';");
  await examples.getByRole('button',{name:'Copy name',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('camera');
  await inspector.getByRole('button',{name:'Save icon',exact:true}).click();await expect(inspector.getByRole('button',{name:'Unsave icon',exact:true})).toHaveAttribute('aria-pressed','true');
  await inspector.getByRole('button',{name:'Copy link',exact:true}).click();const link=await page.evaluate(()=>navigator.clipboard.readText()),url=new URL(link);
  expect(url.pathname).toBe('/icons');expect(Object.fromEntries(url.searchParams)).toEqual({icon:'camera',size:'20',stroke:'1.5',tone:'Accent'});
  await page.reload();inspector=page.getByRole('complementary',{name:'Selected icon'});await expect(inspector.getByRole('button',{name:'Unsave icon',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Saved icons 1',exact:true}).click();await expect(page.locator('.icon-tile')).toHaveCount(1);await expect(page.getByRole('button',{name:'Camera',exact:true})).toBeVisible();
  await page.goto(link);inspector=page.getByRole('complementary',{name:'Selected icon'});
  for(const [group,label] of [['Preview size','20px'],['Stroke width','1.5'],['Preview colour','Accent']])await expect(inspector.getByRole('group',{name:group,exact:true}).getByRole('button',{name:label,exact:true})).toHaveAttribute('aria-pressed','true');
  const pending=page.waitForEvent('download');await inspector.getByRole('button',{name:'Download SVG',exact:true}).click();const download=await pending;expect(download.suggestedFilename()).toBe('camera.svg');
  const stream=await download.createReadStream();expect(stream).not.toBeNull();const chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(Buffer.from(chunk));const svg=Buffer.concat(chunks).toString('utf8');
  expect(svg).toContain('ISC License');expect(svg).toContain('Cole Bemis');
  expect(await page.evaluate(source=>{const parsed=new DOMParser().parseFromString(source,'image/svg+xml'),root=parsed.documentElement;return {name:root.localName,width:root.getAttribute('width'),height:root.getAttribute('height'),stroke:root.getAttribute('stroke-width'),colour:root.getAttribute('stroke'),scripts:parsed.querySelectorAll('script').length};},svg)).toEqual({name:'svg',width:'20',height:'20',stroke:'1.5',colour:'currentColor',scripts:0});
});


test('icon SVG export recovers from a failed prefetch without exporting stale source',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);let failed=false;
  await page.route('**/icon-assets/camera-2.svg',async route=>{
    if(!failed&&route.request().resourceType()==='fetch'){failed=true;await route.fulfill({status:503,contentType:'text/plain',body:'Temporary SVG unavailability'});return;}
    await route.continue();
  });
  await page.goto('/icons');const inspector=page.getByRole('complementary',{name:'Selected icon'}),copy=inspector.getByRole('button',{name:'Copy SVG',exact:true});
  await inspector.getByRole('group',{name:'Stroke width',exact:true}).getByRole('button',{name:'2',exact:true}).click();
  await expect(inspector.getByRole('status').filter({hasText:'SVG unavailable. Retry or use the React example.'})).toBeVisible();expect(failed).toBe(true);
  await expect(copy).toBeDisabled();await expect(inspector.getByRole('button',{name:'Download SVG',exact:true})).toBeDisabled();
  const recovered=page.waitForResponse(response=>response.url().endsWith('/icon-assets/camera-2.svg')&&response.request().resourceType()==='fetch'&&response.status()===200);
  await inspector.getByRole('button',{name:'Retry SVG',exact:true}).click();expect((await recovered).ok()).toBe(true);
  await expect(copy).toBeEnabled();await expect(inspector.getByRole('button',{name:'Retry SVG',exact:true})).toHaveCount(0);
  await copy.click();await expect(inspector.getByRole('status').filter({hasText:'SVG copied, with licence notices.'})).toBeVisible();
  const svg=await page.evaluate(()=>navigator.clipboard.readText());expect(svg).toContain('ISC License');expect(svg).toContain('stroke-width="2"');
});


test('removing the saved icon keeps mobile inspector dismissal focus recoverable',async({page})=>{
  await page.setViewportSize({width:390,height:900});await page.goto('/icons');
  await page.getByRole('searchbox',{name:'Search icons'}).fill('camera');
  let camera=page.getByRole('button',{name:'Camera',exact:true});await camera.focus();await page.keyboard.press('Enter');
  let dialog=page.getByRole('dialog',{name:'Camera',exact:true});await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Save icon',exact:true}).click();await expect(dialog.getByRole('button',{name:'Unsave icon',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(camera).toBeFocused();
  await page.getByRole('button',{name:'Saved icons 1',exact:true}).click();await expect(page.locator('.icon-tile')).toHaveCount(1);
  camera=page.getByRole('button',{name:'Camera',exact:true});await camera.focus();await page.keyboard.press('Enter');
  dialog=page.getByRole('dialog',{name:'Camera',exact:true});await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Unsave icon',exact:true}).click();await expect(page.locator('.icon-grid .icon-tile')).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
  const inspect=page.getByRole('button',{name:'Inspect Camera',exact:true});await expect(inspect).toBeVisible();await expect(inspect).toBeFocused();
});
