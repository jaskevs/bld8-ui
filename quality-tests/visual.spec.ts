import {test, expect, openQualityPage, expectContained} from './fixtures';
import type {Locator} from '@playwright/test';
import {readFileSync} from 'node:fs';

const documentBox = (target: Locator) => target.evaluate(element => {
  const box = element.getBoundingClientRect();
  return {x:box.x + scrollX, y:box.y + scrollY, width:box.width, height:box.height};
});

// CI and intentional updates run in the same pinned Linux image. Windows cannot
// accidentally write a different renderer's pixels into these Linux baselines.
test.beforeAll(() => {
  expect(process.platform, 'Visual comparisons require the documented Playwright Linux container; use smoke-* projects on Windows.').toBe('linux');
  expect(process.arch, 'Visual baselines use the Linux amd64 renderer.').toBe('x64');
});

test('shared control states', async ({page}, info) => {
  await openQualityPage(page, '/foundations#control-states', info);
  const controls = page.getByRole('region', {name:'Control standards', exact:true});
  await expect(controls.getByRole('textbox', {name:'Project title', exact:true})).toHaveValue('Interface notes');
  await expect(controls.getByRole('button', {name:'Saving changes', exact:true})).toBeDisabled();
  // Static HTML contains the build date's today marker. A real month round trip
  // re-renders it from the browser's fixed Date, without overriding calendar CSS.
  const calendar = controls.locator('.bui-calendar');
  await calendar.getByRole('button', {name:/next month/i}).click();
  await calendar.getByRole('button', {name:/previous month/i}).click();
  await expect(calendar.locator('.bui-calendar-today')).toHaveText('20');
  await expectContained(page);
  await controls.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const masks = [controls.locator('.bui-spinner'), controls.getByRole('group', {name:'Loading preview', exact:true})];
  // The first capture can flush renderer/font layout above this tall specimen.
  // Warm it with exactly the same policy, then fix the stable document clip.
  const beforeWarmup = await documentBox(controls);
  await controls.screenshot({
    animations:'disabled', caret:'hide', scale:'css',
    style:readFileSync(new URL('./screenshot.css', import.meta.url), 'utf8'),
    mask:masks, maskColor:'#888888',
  });
  const afterWarmup = await documentBox(controls);
  expect({x:afterWarmup.x, width:afterWarmup.width, height:afterWarmup.height}, 'Warm-up must preserve specimen size').toEqual({x:beforeWarmup.x, width:beforeWarmup.width, height:beforeWarmup.height});
  let box = await documentBox(controls);
  let previous = '';
  await expect.poll(async () => {
    box = await documentBox(controls);
    const current = JSON.stringify(box);
    const stable = current === previous;
    previous = current;
    return stable;
  }).toBe(true);
  const clip = {
    x:Math.floor(box.x), y:Math.floor(box.y),
    width:Math.ceil(box.x + box.width) - Math.floor(box.x),
    // At most one extra CSS pixel encloses any fractional top and full bottom.
    height:Math.ceil(box.height) + 1,
  };
  await expect(page).toHaveScreenshot('control-states.png', {
    fullPage:true, clip,
    // Dynamic loading decoration is intentionally excluded; its disabled/busy
    // semantics are asserted above and in the existing interaction suite.
    mask:masks,
    maskColor: '#888888',
  });
  expect(await documentBox(controls), 'Capture must preserve the complete CSS geometry').toEqual(box);
});

test('session preferences and aligned actions', async ({page}, info) => {
  await openQualityPage(page, '/blocks/session-setup', info);
  await page.getByRole('textbox', {name:'Workspace name', exact:true}).fill('Interface studies');
  await page.getByRole('button', {name:'Continue', exact:true}).click();
  await expect(page.getByRole('heading', {name:'Session preferences.', exact:true})).toBeFocused();
  await expect(page.getByRole('textbox', {name:'Session length', exact:true})).toHaveValue('45');
  await expect(page.getByRole('combobox', {name:'Preferred start', exact:true})).toContainText('09:30');
  await expectContained(page);
  const setup = page.getByRole('region', {name:'Session setup', exact:true});
  await setup.scrollIntoViewIfNeeded();
  // Focus and interruption are tested under normal motion in portable-smoke;
  // the resting image has no caret, pointer hover or transient heading focus.
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.mouse.move(0, 0);
  await expect(setup).toHaveScreenshot('session-preferences.png');
});

test('chart series, readable values and resting exploration', async ({page}, info) => {
  await openQualityPage(page, '/components/chart', info);
  const specimen = page.getByRole('figure', {name:'Weekly requests', exact:true});
  await expect(specimen.locator('.bui-chart-point')).toHaveCount(7);
  await expect(specimen.getByRole('button', {name:'Completed series', exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(specimen.getByRole('button', {name:'Failed series', exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(specimen.getByRole('button', {name:'Show data', exact:true})).toHaveAttribute('aria-expanded','false');
  await expect.poll(() => specimen.locator('.bui-chart-canvas').evaluate(element => {
    const svg = element.querySelector('svg');return Number(svg?.getAttribute('width')) === element.clientWidth;
  })).toBe(true);
  await expectContained(page);
  await specimen.scrollIntoViewIfNeeded();
  await page.evaluate(() => {if(document.activeElement instanceof HTMLElement)document.activeElement.blur();});
  await page.mouse.move(0,0);
  const beforeWarmup = await documentBox(specimen);
  await specimen.screenshot({animations:'disabled',caret:'hide',scale:'css',style:readFileSync(new URL('./screenshot.css',import.meta.url),'utf8')});
  const afterWarmup = await documentBox(specimen);
  expect({x:afterWarmup.x,width:afterWarmup.width,height:afterWarmup.height},'Warm-up preserves chart geometry').toEqual({x:beforeWarmup.x,width:beforeWarmup.width,height:beforeWarmup.height});
  let box = await documentBox(specimen), previous = '';
  await expect.poll(async () => {
    box=await documentBox(specimen);const current=JSON.stringify(box),stable=current===previous;previous=current;return stable;
  }).toBe(true);
  await expect(page).toHaveScreenshot('chart-series.png',{fullPage:true,clip:{x:Math.floor(box.x),y:Math.floor(box.y),width:Math.ceil(box.x+box.width)-Math.floor(box.x),height:Math.ceil(box.height)+1}});
  expect(await documentBox(specimen),'Capture preserves the complete chart CSS geometry').toEqual(box);
});
test('grouped window keeps rows and selection aligned',async({page},info)=>{
  await openQualityPage(page,'/components/windowed-table',info);
  const specimen=page.locator('.windowed-demo');
  await expect(specimen.locator('tr[data-windowed-id="row:ROW-00001"]')).toBeVisible();
  await specimen.getByRole('checkbox',{name:'Select ROW-00001',exact:true}).check();
  await expect(specimen.locator('tr[data-windowed-id="row:ROW-00001"]')).toHaveAttribute('data-selected','true');
  await expectContained(page);await specimen.scrollIntoViewIfNeeded();
  await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();});
  await page.mouse.move(0,0);
  await expect(specimen).toHaveScreenshot('grouped-window.png');
});

test('day agenda aligns controls, time offsets and appointments',async({page},info)=>{
  await openQualityPage(page,'/blocks/schedule-planner',info);
  const specimen=page.getByRole('region',{name:'Schedule planner',exact:true});
  await expect(specimen.getByRole('button',{name:/^Book 09:00/}).first()).toBeVisible();
  await expectContained(page);await specimen.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
  await specimen.screenshot({animations:'disabled',caret:'hide',scale:'css',style:readFileSync(new URL('./screenshot.css',import.meta.url),'utf8')});
  let box=await documentBox(specimen),previous='';
  await expect.poll(async()=>{box=await documentBox(specimen);const current=JSON.stringify(box),stable=current===previous;previous=current;return stable;}).toBe(true);
  await expect(page).toHaveScreenshot('day-agenda.png',{fullPage:true,clip:{x:Math.floor(box.x),y:Math.floor(box.y),width:Math.ceil(box.x+box.width)-Math.floor(box.x),height:Math.ceil(box.height)+1}});
  expect(await documentBox(specimen)).toEqual(box);
});
