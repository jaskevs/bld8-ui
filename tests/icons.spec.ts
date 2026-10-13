import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('import { Camera }');
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
  await search.focus();expect(await search.locator('..').evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
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
