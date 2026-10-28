import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('timeline keeps ordered steps, readable states and machine-readable times',async({page})=>{
  await page.goto('/components/timeline');
  const timeline=page.getByRole('list',{name:'Release steps'});
  await expect(timeline.getByRole('listitem')).toHaveCount(3);
  await expect(timeline.locator('[aria-current="step"]')).toContainText('Review the interface');
  await expect(timeline).toContainText('Complete');await expect(timeline).toContainText('Pending');
  await expect(timeline.locator('time').first()).toHaveAttribute('datetime','2026-10-28T09:00:00+11:00');
  await expect(page.getByRole('heading',{name:'TimelineItem'})).toBeVisible();
});

test('activity block reveals, searches and filters real rendered records',async({page})=>{
  await page.goto('/blocks/activity-feed');
  const feed=page.getByRole('region',{name:'Workspace activity'});
  const list=feed.getByRole('list',{name:'Activity events'});
  await expect(list.getByRole('listitem')).toHaveCount(4);
  const more=feed.getByRole('button',{name:'Show 2 more'});await more.focus();await page.keyboard.press('Enter');
  await expect(list.getByRole('listitem')).toHaveCount(6);await expect(feed.getByRole('button',{name:'Show fewer'})).toBeFocused();
  await feed.getByRole('button',{name:'Show fewer'}).click();await expect(list.getByRole('listitem')).toHaveCount(4);
  await feed.getByRole('combobox',{name:'Activity type'}).click();await page.getByRole('option',{name:'People',exact:true}).click();
  await expect(list.getByRole('listitem')).toHaveCount(2);await expect(list).toContainText('Project access updated');
  await feed.getByRole('searchbox',{name:'Search activity'}).fill('not a person');
  await expect(feed.getByRole('heading',{name:'No matching activity.'})).toBeVisible();
  await feed.getByRole('button',{name:'Clear activity filters'}).click();
  await expect(list.getByRole('listitem')).toHaveCount(4);
});

test('activity block shows loading, a recoverable error and a true empty state',async({page})=>{
  await page.goto('/blocks/activity-feed');
  const state=page.getByRole('combobox',{name:'Preview state'});
  const feed=page.getByRole('region',{name:'Workspace activity'});
  await state.click();await page.getByRole('option',{name:'Loading',exact:true}).click();
  await expect(feed).toHaveAttribute('aria-busy','true');await expect(feed.getByRole('status')).toHaveText('Loading activity…');
  await expect(feed.getByRole('searchbox')).toBeDisabled();
  await state.click();await page.getByRole('option',{name:'Service error',exact:true}).click();
  await expect(feed.getByRole('alert')).toContainText('Activity could not be loaded');
  await feed.getByRole('button',{name:'Try again'}).click();await expect(feed.getByRole('list')).toBeVisible();
  await state.click();await page.getByRole('option',{name:'Empty',exact:true}).click();
  await expect(feed.getByRole('heading',{name:'No activity yet.'})).toBeVisible();await expect(feed.getByRole('list')).toHaveCount(0);
});

test('React and Next guide, community entry points and source downloads are discoverable',async({page,request})=>{
  await page.goto('/');await page.getByRole('link',{name:'React, Vite & Next.js guide',exact:true}).click();
  await expect(page).toHaveURL(/\/frameworks$/);
  await page.getByRole('link',{name:'Next.js setup',exact:true}).click();await expect(page).toHaveURL(/#nextjs$/);
  await expect(page.getByRole('heading',{name:'Next.js App Router'})).toBeVisible();
  await page.getByRole('link',{name:'Contribute to the library'}).click();
  await expect(page.getByRole('link',{name:'Request a component or block'})).toHaveAttribute('href',/component-request.yml$/);
  const registry=await(await request.get('/r/timeline.json')).json();expect(registry.registryDependencies).toContain('https://ui.bld8.dev/r/bld8-timeline.json');
  const block=await(await request.get('/r/activity-feed.json')).json();expect(block.type).toBe('registry:block');
  const source=await(await request.get('/sources/activity-feed.json')).json();expect(source.license).toBe('MIT');expect(source.price).toBe(0);
  const zip=await request.get('/downloads/activity-feed.zip');expect(zip.ok()).toBe(true);expect((await zip.body()).subarray(0,2).toString()).toBe('PK');
  const sitemap=await(await request.get('/sitemap.xml')).text();expect(sitemap).toContain('/frameworks');expect(sitemap).toContain('/community');
});

for(const theme of ['light','dark'])test('community library accessibility in '+theme,async({page})=>{
  for(const route of ['/components/timeline','/blocks/activity-feed','/frameworks','/community']){
    await page.goto(route);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),route).toEqual([]);
  }
});

for(const width of [1440,768,390,320])test('community surfaces stay aligned at '+width,async({page})=>{
  await page.setViewportSize({width,height:1000});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const route of ['/','/components/timeline','/blocks/activity-feed','/frameworks','/community']){
    await page.goto(route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('timeline retains restrained motion and disables it for reduced-motion preferences',async({page})=>{
  await page.goto('/components/timeline');const marker=page.locator('.bui-timeline-marker').first();
  expect(await marker.evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
  await page.emulateMedia({reducedMotion:'no-preference'});expect(await marker.evaluate(element=>getComputedStyle(element).transitionTimingFunction)).toContain('0.16, 1, 0.3, 1');
});
