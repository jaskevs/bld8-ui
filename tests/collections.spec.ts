import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { library } from '../apps/docs/src/lib/generated/catalog';

test('blocks filter by collection, use and search', async ({page}) => {
  await page.goto('/blocks');
  await expect(page.locator('.library-card')).toHaveCount(library.blocks.length);
  await page.getByRole('group',{name:'Collection',exact:true}).getByRole('button',{name:'Premium',exact:true}).click();
  await expect(page.locator('.library-card')).toHaveCount(library.blocks.filter(item=>item.tier==='Premium').length);
  await page.getByRole('searchbox',{name:'Search blocks'}).fill('team');
  await expect(page.locator('.library-card')).toHaveCount(1);
  await expect(page.getByRole('link',{name:'Team directory'})).toBeVisible();
  await page.getByRole('searchbox',{name:'Search blocks'}).fill('no-such-block');
  await expect(page.getByRole('heading',{name:'Nothing here yet.'})).toBeVisible();
  await page.getByRole('button',{name:'Reset filters'}).click();
  await page.getByRole('group',{name:'Categories',exact:true}).getByRole('button',{name:'Authentication'}).click();
  await expect(page.locator('.library-card')).toHaveCount(1);
  await expect(page.getByRole('link',{name:'Sign-in form'})).toBeVisible();
});

test('premium source and ZIP downloads have no access gate', async ({page,request}) => {
  await page.goto('/blocks/team');
  await page.getByRole('group',{name:'Explorer view'}).getByRole('button',{name:'Source',exact:true}).click();
  await expect(page.locator('.library-source .code-block code')).toContainText('export function TeamDirectory');
  await page.getByRole('group',{name:'Source file'}).getByRole('button',{name:'Styles',exact:true}).click();
  await expect(page.locator('.library-source .code-block code')).toContainText('.bblocks-panel');
  const registry = await request.get('/r/index.json');
  expect(registry.ok()).toBe(true);
  const index = await registry.json();
  expect(index.collections).toEqual({Free:0,Premium:0});
  expect(index.items).toHaveLength(library.blocks.length + library.templates.length);
  for(const item of index.items) {
    const manifest = await (await request.get(item.url)).json();
    expect(manifest.license).toBe('MIT');expect(manifest.price).toBe(0);
    expect(manifest.files.some((file:{path:string}) => file.path.endsWith('.tsx'))).toBe(true);
    const download = await request.get(manifest.download);
    expect(download.ok()).toBe(true);
    expect((await download.body()).subarray(0,4).toString('hex')).toBe('504b0304');
  }
});

test('sign-in validates without claiming a real authenticated session', async ({page}) => {
  await page.goto('/blocks/sign-in');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByText('Enter a valid email address.',{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Email',exact:true}).fill('person@example.com');
  await page.getByLabel(/^Password/).fill('example-password');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Form validated.'})).toContainText('Connect your authentication service');
  await expect(page.getByLabel(/^Password/)).toHaveValue('');
});

test('account block validates and saves its local preferences', async ({page}) => {
  await page.goto('/blocks/account-settings');
  await page.getByRole('textbox',{name:'Display name',exact:true}).fill('');
  await page.getByRole('button',{name:'Save profile'}).click();
  await expect(page.getByText('Enter your name.',{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Display name',exact:true}).fill('Interface study');
  await page.getByRole('switch',{name:'Weekly summary'}).uncheck();
  await page.getByRole('button',{name:'Save profile'}).click();
  await expect(page.getByRole('status').filter({hasText:'Saved for this session.'})).toBeVisible();
  await expect(page.getByRole('switch',{name:'Weekly summary'})).not.toBeChecked();
});

test('metrics and activity filters change real displayed data', async ({page}) => {
  await page.goto('/blocks/workspace');
  await expect(page.getByText('8,420',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'This month',exact:true}).click();
  await expect(page.getByText('32,680',{exact:true})).toBeVisible();
  await page.getByRole('group',{name:'Activity filter'}).getByRole('button',{name:'Decisions',exact:true}).click();
  await expect(page.locator('.bblocks-activity li')).toHaveCount(1);
  await expect(page.locator('.bblocks-activity')).toContainText('Oliver Reed');
});

test('team invitation rejects duplicates and creates an in-memory row', async ({page}) => {
  await page.goto('/blocks/team');
  await page.getByRole('button',{name:'Invite person'}).click();
  await page.getByRole('textbox',{name:'Invite email',exact:true}).fill('maya@example.com');
  await page.getByRole('button',{name:'Add invitation'}).click();
  await expect(page.getByText('This email is already in the workspace.',{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Invite email',exact:true}).fill('newperson@example.com');
  await page.getByRole('button',{name:'Add invitation'}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('searchbox',{name:'Search team members'}).fill('newperson');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Invited');
  await expect(page.getByRole('status').filter({hasText:'No email was sent.'})).toBeVisible();
});

test('project board creates a task and moves it with a keyboard-selectable control', async ({page}) => {
  await page.goto('/blocks/project-board');
  await page.getByRole('button',{name:'New task'}).click();
  await page.getByRole('textbox',{name:'Task title',exact:true}).fill('Check the empty state');
  await page.getByRole('button',{name:'Add task',exact:true}).click();
  const task = page.locator('.bblocks-task').filter({hasText:'Check the empty state'});
  await task.getByRole('combobox').click();
  await page.getByRole('option',{name:'Done',exact:true}).click();
  await expect(page.getByRole('region',{name:'Done tasks'})).toContainText('Check the empty state');
  await expect(page.getByRole('status').filter({hasText:'Task moved to done.'})).toBeVisible();
});

test('workspace template switches between its working views', async ({page}) => {
  await page.goto('/templates/studio');
  const sections = page.getByRole('navigation',{name:'Studio sections'});
  await sections.getByRole('button',{name:'People',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Better, together.'})).toBeVisible();
  await sections.getByRole('button',{name:'Projects',exact:true}).click();
  await expect(page.getByRole('button',{name:'New task'})).toBeVisible();
  await sections.getByRole('button',{name:'Settings',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Display name',exact:true})).toBeVisible();
});

test('landing template opens its dialog and returns focus on dismissal', async ({page}) => {
  await page.goto('/templates/launch');
  const trigger = page.getByRole('button',{name:'Try the demo',exact:true});
  await trigger.click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});

for(const theme of ['light','dark']) test('new library pages and block controls are accessible in ' + theme, async ({page}) => {
  for(const route of ['/','/blocks','/templates','/plans','/blocks/team','/blocks/project-board','/templates/studio']) {
    await page.goto(route);if(theme === 'dark') await page.getByRole('button',{name:'Switch to dark theme'}).click();
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations.map(item => ({id:item.id,targets:item.nodes.map(node => node.target)})),route).toEqual([]);
  }
});

for(const width of [1440,768,390,320]) test('collections, previews and templates fit at ' + width + 'px', async ({page}) => {
  await page.setViewportSize({width,height:900});const errors:string[]=[];page.on('pageerror',error => errors.push(error.message));
  for(const route of ['/','/blocks','/templates','/plans','/blocks/metrics','/blocks/team','/blocks/project-board','/templates/studio','/templates/launch']) {
    await page.goto(route);expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),route).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('mobile preview uses its own width and reduced motion remains immediate', async ({page}) => {
  await page.goto('/templates/studio');
  await page.getByRole('group',{name:'Preview width'}).getByRole('button',{name:'Mobile',exact:true}).click();
  const frame = page.locator('.library-preview-frame');
  expect((await frame.boundingBox())!.width).toBeLessThanOrEqual(390);
  expect(await frame.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  expect(await page.locator('.bblocks-studio').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(1);
  expect((await page.goto('/blocks/not-a-block'))?.status()).toBe(404);
});
