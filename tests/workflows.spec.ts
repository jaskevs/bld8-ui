import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createTableCSV } from '../packages/ui/dist/data-table.js';

test('clearable controls keep focus and compact inputs retain their native state',async ({page})=>{
  await page.goto('/components/select');const select=page.getByRole('combobox',{name:'Project visibility'});await page.getByRole('button',{name:'Clear project visibility'}).click();await expect(select).toContainText('Select an option');await expect(select).toBeFocused();
  await select.click();await page.getByRole('option',{name:'Team',exact:true}).click();await expect(select).toContainText('Team');
  await page.goto('/components/combobox');const input=page.getByRole('combobox',{name:'Framework',exact:true});await input.fill('Angular');await page.getByRole('option',{name:'Angular',exact:true}).click();await page.getByRole('button',{name:'Clear framework'}).click();await expect(input).toHaveValue('');await expect(input).toBeFocused();
  await page.goto('/components/input');const compact=page.getByRole('textbox',{name:'Workspace ID',exact:true});await expect(compact).toHaveAttribute('data-density','compact');await expect(compact).toBeDisabled();
});

test('command palette searches keywords, acts with Enter and restores focus', async ({page})=>{
  await page.goto('/components/command');const trigger=page.getByRole('button',{name:'Open command palette'});await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Workspace actions'});const search=dialog.getByRole('combobox');await expect(search).toBeFocused();
  await search.fill('create');await expect(dialog.getByRole('option')).toHaveCount(1);await page.keyboard.press('Enter');
  await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();await expect(page.getByRole('status').filter({hasText:'New project action selected.'})).toBeVisible();
  await trigger.click();await expect(search).toHaveValue('');await search.fill('not-a-command');await expect(dialog.getByText('No matching actions. Try another search.')).toBeVisible();
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});
test('library shortcut navigates to components and blocks',async ({page})=>{
  await page.goto('/');await page.keyboard.press('Control+k');const search=page.getByRole('dialog',{name:'Search the library'}).getByRole('combobox');
  await expect(search).toBeFocused();await search.fill('Date range picker');await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/components\/date-range$/);
  await page.getByRole('button',{name:'Search the library',exact:true}).click();await search.fill('Resource library');await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/blocks\/resources$/);
});
test('multi-select uses stable values, removal and disabled options',async ({page})=>{
  await page.goto('/components/multi-select');const input=page.getByRole('combobox',{name:'Project disciplines',exact:true});await input.fill('Engineering');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'Remove Engineering'})).toBeVisible();await expect(page.getByRole('status').filter({hasText:'2 disciplines selected'})).toBeVisible();
  await page.getByRole('button',{name:'Remove Design'}).click();await expect(page.getByRole('button',{name:'Remove Design'})).not.toBeVisible();
  await expect(page.locator('input[name="disciplines"]')).toHaveValue('engineering');
  await input.fill('Archived');await expect(page.getByRole('option',{name:'Archived',exact:true})).toHaveAttribute('aria-disabled','true');
  await page.keyboard.press('Escape');await expect(page.getByRole('combobox',{name:'Read-only preview',exact:true})).toBeDisabled();
});
test('calendar bounds, keyboard navigation and date-only values work',async ({page})=>{
  await page.goto('/components/date-picker');const trigger=page.getByRole('button',{name:'Review date',exact:true});await trigger.click();
  const early=page.getByRole('button',{name:/Sunday, October 4th, 2026/});await expect(early).toBeDisabled();
  const day=page.getByRole('button',{name:/Tuesday, October 13th, 2026/});await day.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
  await expect(trigger).toContainText('14 Oct 2026');await expect(trigger).toBeFocused();await expect(page.locator('input[name="reviewDate"]')).toHaveValue('2026-10-14');
  await page.getByRole('button',{name:'Clear review date',exact:true}).click();await expect(page.locator('input[name="reviewDate"]')).toHaveValue('');await expect(trigger).toBeFocused();
  await expect(page.getByRole('button',{name:'Locked review date',exact:true})).toBeDisabled();
});
test('range selection keeps both endpoints and clears together',async ({page})=>{
  await page.goto('/components/date-range');const trigger=page.getByRole('button',{name:'Reporting period',exact:true});await trigger.click();
  await page.getByRole('button',{name:/Tuesday, October 13th, 2026/}).click();await page.getByRole('button',{name:/Friday, October 16th, 2026/}).click();await page.getByRole('button',{name:'Done',exact:true}).click();
  await expect(trigger).toBeFocused();await expect(page.locator('input[name="period.from"]')).toHaveValue('2026-10-13');await expect(page.locator('input[name="period.to"]')).toHaveValue('2026-10-16');
  await page.getByRole('button',{name:'Clear reporting period'}).click();await expect(page.locator('input[name="period.from"]')).toHaveValue('');await expect(page.locator('input[name="period.to"]')).toHaveValue('');await expect(trigger).toBeFocused();
});
test('file selection validates type, size, duplicates, count and removal',async ({page})=>{
  await page.goto('/components/file-upload');const input=page.getByLabel('Project attachments',{exact:true});const file={name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('A note')};
  await input.setInputFiles([file,{name:'program.exe',mimeType:'application/octet-stream',buffer:Buffer.from('x')},{name:'large.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(1024*1024+1)}]);
  await expect(page.getByRole('button',{name:'Remove notes.txt'})).toBeVisible();await expect(page.getByRole('alert').filter({hasText:/Check the files|Unable to load records|Enter a project name/})).toContainText('unsupported file type');await expect(page.getByRole('alert').filter({hasText:/Check the files|Unable to load records|Enter a project name/})).toContainText('exceeds');
  await input.setInputFiles(file);await expect(page.getByRole('alert').filter({hasText:/Check the files|Unable to load records|Enter a project name/})).toContainText('already selected');
  await input.setInputFiles(['two','three','four'].map(name=>({name:name+'.txt',mimeType:'text/plain',buffer:Buffer.from(name)})));await expect(page.locator('.bui-file-list li')).toHaveCount(3);await expect(page.getByRole('alert').filter({hasText:/Check the files|Unable to load records|Enter a project name/})).toContainText('limit of 3 files');
  await page.getByRole('button',{name:'Remove notes.txt'}).click();await expect(page.locator('.bui-file-list li')).toHaveCount(2);await expect(page.getByRole('button',{name:'Browse files'})).toBeFocused();
});
test('upload callback reports progress, aborts cleanly and retries failure',async ({page})=>{
  await page.goto('/components/file-upload');await page.clock.install();await page.getByLabel('Project attachments',{exact:true}).setInputFiles({name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('A note')});
  await page.getByRole('radio',{name:'Callback simulation',exact:true}).check();await page.getByRole('button',{name:'Upload 1 file',exact:true}).click();await page.clock.fastForward(300);
  await expect(page.getByRole('progressbar',{name:'Upload notes.txt'})).toHaveAttribute('value','30');await page.getByRole('button',{name:'Cancel upload'}).click();await page.clock.fastForward(2000);await expect(page.getByRole('status').filter({hasText:'Upload cancelled.'})).toBeVisible();
  await page.getByRole('radio',{name:'Retry simulation',exact:true}).check();await page.getByRole('button',{name:'Upload 1 file',exact:true}).click();await page.clock.fastForward(1100);await expect(page.getByRole('alert').filter({hasText:/Check the files|Unable to load records|Enter a project name/})).toContainText('Simulated service error');
  await page.getByRole('radio',{name:'Callback simulation',exact:true}).check();await page.getByRole('button',{name:'Upload 1 file',exact:true}).click();await page.clock.fastForward(1100);await expect(page.getByRole('status').filter({hasText:'Upload complete.'})).toBeVisible();
});
test('table selection survives pages and filters, columns and bulk changes work',async ({page})=>{
  await page.goto('/components/advanced-table');await page.getByRole('checkbox',{name:'Select Navigation study',exact:true}).check();await expect(page.getByRole('checkbox',{name:'Select current page'})).toHaveAttribute('aria-checked','mixed');
  await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('checkbox',{name:'Select current page'}).check();await expect(page.getByRole('status').filter({hasText:'4 selected'})).toBeVisible();
  await page.getByRole('combobox',{name:'Statuses',exact:true}).selectOption('Review');await expect(page.locator('tbody tr')).toHaveCount(2);await expect(page.getByRole('status').filter({hasText:'4 selected'})).toBeVisible();
  await page.getByRole('button',{name:'Columns',exact:true}).click();await page.getByRole('checkbox',{name:'Owner',exact:true}).uncheck();await expect(page.getByRole('columnheader',{name:'Owner'})).not.toBeVisible();await expect(page.getByRole('checkbox',{name:'Project',exact:true})).toBeDisabled();await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Mark ready',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'selected'})).not.toBeVisible();await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('radio',{name:'Compact',exact:true}).check();await expect(page.locator('.bui-data-table')).toHaveAttribute('data-density','compact');
  await page.getByRole('radio',{name:'Error',exact:true}).check();await expect(page.getByRole('alert').filter({hasText:/Check the files|Unable to load records|Enter a project name/})).toContainText('service could not be reached');await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('table')).toBeVisible();
});
test('planner validates and creates a reusable project record',async ({page})=>{
  await page.goto('/blocks/project-planner');await page.getByRole('button',{name:'Plan project',exact:true}).click();await page.getByRole('button',{name:'Add project',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:/Check the files|Unable to load records|Enter a project name/})).toContainText('Enter a project name.');
  await page.getByRole('textbox',{name:'Project name',exact:true}).fill('A useful small plan');await page.getByRole('button',{name:'Review date',exact:true}).click();await page.locator('.bui-calendar-day-button:not(:disabled)').filter({hasText:/^20$/}).first().click();
  await page.getByRole('button',{name:'Add project',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.getByRole('table')).toContainText('A useful small plan');await expect(page.getByRole('status').filter({hasText:'Attachments were not uploaded.'})).toBeVisible();
});
test('resource library exports chosen records and reverses archive',async ({page})=>{
  await page.goto('/blocks/resources');await page.getByRole('checkbox',{name:'Select Research notes.txt',exact:true}).check();const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV',exact:true}).click();const download=await downloading;expect(download.suggestedFilename()).toBe('resource-metadata.csv');
  const stream=await download.createReadStream();const chunks:Buffer[]=[];for await(const chunk of stream!) chunks.push(Buffer.from(chunk));expect(Buffer.concat(chunks).toString()).toContain('Research notes.txt');expect(Buffer.concat(chunks).toString()).not.toContain('Interface brief.pdf');
  await page.getByRole('button',{name:'Archive',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'1 resources archived.'})).toBeVisible();await page.getByRole('combobox',{name:'Statuses'}).selectOption('Archived');await expect(page.getByRole('table')).toContainText('Research notes.txt');
  await page.getByRole('button',{name:'Undo archive'}).click();await expect(page.getByRole('table')).not.toContainText('Research notes.txt');
});
test('Outline keeps local edits when switching views and command navigation works',async ({page})=>{
  await page.goto('/templates/outline');const nav=page.getByRole('navigation',{name:'Outline views'});await nav.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('textbox',{name:'Display name',exact:true}).fill('A lasting draft');
  await nav.getByRole('button',{name:'Planning',exact:true}).click();await nav.getByRole('button',{name:'Settings',exact:true}).click();await expect(page.getByRole('textbox',{name:'Display name',exact:true})).toHaveValue('A lasting draft');
  await page.getByRole('button',{name:'Find a view'}).click();await page.getByRole('dialog',{name:'Outline navigation'}).getByRole('combobox').fill('resources');await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Keep the references close.'})).toBeVisible();
});
test('CSV keeps quoted content and protects formula-leading fields',()=>{
  const csv=createTableCSV([{name:'=HYPERLINK("x")',amount:-12},{name:'a,"b"\nline',amount:10}],[{key:'name',header:'Name',cell:row=>row.name,exportValue:row=>row.name},{key:'amount',header:'Amount',cell:row=>row.amount,exportValue:row=>row.amount}]);
  expect(csv).toContain('"\'=HYPERLINK(""x"")"');expect(csv).toContain('"-12"');expect(csv).toContain('"a,""b""\nline"');
});
for(const theme of ['light','dark']) test('workflow controls and open overlays pass axe in '+theme,async ({page},testInfo)=>{
  for(const route of ['/components/multi-select','/components/calendar','/components/date-picker','/components/file-upload','/components/advanced-table','/blocks/project-planner','/blocks/resources','/templates/outline']) {
    await page.goto(route);if(theme==='dark') await page.getByRole('button',{name:'Switch to dark theme'}).click();const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)})),route).toEqual([]);if(route==='/templates/outline') await page.locator('.library-preview-frame').screenshot({path:testInfo.outputPath('outline-'+theme+'.png')});
  }
  await page.goto('/components/command');if(theme==='dark') await page.getByRole('button',{name:'Switch to dark theme'}).click();await page.getByRole('button',{name:'Open command palette'}).click();const command=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(command.violations.map(item=>item.id)).toEqual([]);
  await page.keyboard.press('Escape');await page.goto('/components/date-range');if(theme==='dark') await page.getByRole('button',{name:'Switch to dark theme'}).click();await page.getByRole('button',{name:'Reporting period',exact:true}).click();const range=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(range.violations.map(item=>item.id)).toEqual([]);
});
for(const width of [1440,768,390,320]) test('workflows and open calendars fit at '+width+'px',async ({page},testInfo)=>{
  await page.setViewportSize({width,height:900});const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const route of ['/components','/components/advanced-table','/blocks/project-planner','/blocks/resources','/templates/outline','/components/date-range']) {await page.goto(route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);if(route==='/templates/outline' && (width===1440 || width===390)) await page.locator('.library-preview-frame').screenshot({path:testInfo.outputPath('outline-'+width+'.png')});}
  await page.getByRole('button',{name:'Reporting period',exact:true}).click();const popup=await page.locator('.bui-calendar-popup').boundingBox();expect(popup!.x).toBeGreaterThanOrEqual(0);expect(popup!.x+popup!.width).toBeLessThanOrEqual(width);expect(errors).toEqual([]);
});
