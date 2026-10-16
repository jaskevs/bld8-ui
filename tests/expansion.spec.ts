import {chooseOption,chooseReviewDate} from './helpers/controls';
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createOutlineHttpRepository,OutlineHttpError} from '../packages/blocks/dist/outline-http.js';
import {OutlineValidationError} from '../packages/blocks/dist/outline-repository.js';
import {readPlayground,writePlayground} from '../apps/docs/src/lib/playground-state';
import {api} from '../apps/docs/src/lib/generated/api';
import {components} from '../apps/docs/src/lib/catalog';

test('playground links restore configuration and ignore invalid URL values',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/playground?component=Drawer&side=right&focus=close&state=Error&dark=true&mobile=true');
  const controls=page.getByRole('region',{name:'Playground controls'});
  await expect(controls.getByRole('combobox',{name:'Component',exact:true})).toHaveText('Drawer');await expect(controls.getByRole('combobox',{name:'Placement'})).toHaveText('right');await expect(controls.getByRole('switch',{name:'Dark preview'})).toBeChecked();
  await controls.getByRole('button',{name:'Copy configuration link'}).click();await expect(controls.getByRole('status')).toHaveText('Configuration link copied.');const link=await page.evaluate(()=>navigator.clipboard.readText());
  await page.goto('/');await page.goto(link);await expect(controls.getByRole('combobox',{name:'State'})).toHaveText('Error');await expect(controls.getByRole('switch',{name:'Narrow preview'})).toBeChecked();
  const invalid=readPlayground('?component=Bad&state=Wrong&variant=wat&value=999&pageSize=0&date=2026-02-30&selected=design,unknown,design');expect(invalid.component).toBe('Button');expect(invalid.state).toBe('Default');expect(invalid.value).toBe(100);expect(invalid.pageSize).toBe(1);expect(invalid.date).toBe('2026-10-20');expect(invalid.selected).toEqual(['design']);expect(readPlayground(writePlayground(invalid))).toEqual(invalid);
});

test('overlay playground preserves focus, switches feedback and dismisses from the keyboard',async({page})=>{
  for(const component of ['Dialog','Drawer']){
    await page.goto('/playground?component='+component+'&state=Error&focus=close');const trigger=page.getByRole('button',{name:'Open '+component.toLowerCase(),exact:true});await trigger.click();const dialog=page.getByRole('dialog',{name:'Project note'});await expect(dialog.getByRole('button',{name:'Done',exact:true})).toBeFocused();await expect(dialog.getByRole('alert')).toContainText('Unable to save');await dialog.getByRole('button',{name:'Retry note'}).click();await expect(dialog.getByRole('alert')).toHaveCount(0);await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
    await chooseOption(page,page.getByRole('combobox',{name:'State',exact:true}),'Loading');await trigger.click();await expect(dialog.getByRole('button',{name:'Save note'})).toBeDisabled();await expect(dialog.getByRole('textbox',{name:'Note title'})).toBeDisabled();await page.keyboard.press('Escape');
  }
});

test('multi-select, calendar bounds and table error states use the public controls',async({page})=>{
  await page.goto('/playground?component=MultiSelect&disabledOption=true');const preview=page.getByRole('region',{name:'Component preview'});const input=preview.getByRole('combobox',{name:'Disciplines',exact:true});await input.fill('Research');await expect(page.getByRole('option',{name:'Research',exact:true})).toHaveAttribute('aria-disabled','true');await page.keyboard.press('Escape');await input.fill('Engineering');await page.getByRole('option',{name:'Engineering',exact:true}).click();await expect(page).toHaveURL(/selected=design%2Cengineering/);
  await page.goto('/playground?component=DatePicker&minDate=2026-10-20&maxDate=2026-10-24');await page.getByRole('region',{name:'Component preview'}).getByRole('button',{name:'Review date',exact:true}).click();await expect(page.getByRole('button',{name:/Monday, October 19th, 2026/})).toBeDisabled();await page.keyboard.press('Escape');
  await page.goto('/playground?component=DataTable&state=Error');await expect(page.getByRole('region',{name:'Component preview'}).getByRole('alert')).toContainText('example service');await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('button',{name:'Next',exact:true})).toBeEnabled();await chooseOption(page,page.getByRole('combobox',{name:'State',exact:true}),'Empty');await expect(page.getByRole('heading',{name:'No records yet'})).toBeVisible();
});

test('all documentation entries have prop tables derived from their TypeScript APIs',async({page})=>{
  expect(Object.keys(api).sort()).toEqual(components.map(item=>item.id).sort());
  await page.goto('/components/dialog');const props=page.getByRole('region',{name:'Dialog props',exact:true});await expect(props.getByRole('row').filter({hasText:'initialFocus'})).toContainText('RefObject');await expect(props.getByRole('row').filter({hasText:/^title/})).toContainText('Required');
  await page.goto('/components/multi-select');await expect(page.getByRole('region',{name:'MultiSelect props'}).getByRole('row').filter({hasText:'inputRef'})).toContainText('HTMLInputElement');
  await page.goto('/components/button');await page.getByText('Forwarded React / HTML props',{exact:false}).click();await expect(page.getByRole('region',{name:'Button native props'}).getByRole('rowheader',{name:'onClick',exact:true}).locator('..')).toContainText('MouseEventHandler');
});

test('Outline inline edits validate, cancel, save and preserve a rejected draft',async({page})=>{
  await page.goto('/templates/outline');const edit=page.getByRole('button',{name:'Edit project name for Keyboard review',exact:true});await edit.click();const input=page.getByRole('textbox',{name:'project name for Keyboard review',exact:true});await expect(input).toBeFocused();await input.fill('');await input.press('Enter');await expect(page.getByText('Use at least three characters.',{exact:true})).toBeVisible();await input.fill('Interface studies');await input.press('Enter');await expect(page.getByText('A project with this name already exists.',{exact:true})).toBeVisible();await expect(input).toHaveValue('Interface studies');await input.press('Escape');await expect(edit).toBeFocused();
  await edit.click();await input.fill('Inline review');await input.press('Enter');await expect(page.getByRole('button',{name:'Edit project name for Inline review',exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:'Edit project name for Inline review',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Edit status for Inline review',exact:true}).click();await chooseOption(page,page.getByRole('combobox',{name:'status for Inline review',exact:true}),'Ready');await page.getByRole('button',{name:'Save status for Inline review',exact:true}).click();await expect(page.getByRole('row').filter({hasText:'Inline review'})).toContainText('Ready');
});

test('HTTP example sends real queries and recovers from a failed inline save',async({page})=>{
  const mutations:string[]=[];page.on('request',request=>{if(request.url().includes('/api/examples/outline/projects')&&request.method()==='PATCH')mutations.push(request.url());});
  await page.goto('/examples/outline-http');await page.getByRole('button',{name:'Fail next save',exact:true}).click();await page.getByRole('button',{name:'Edit project name for Keyboard review',exact:true}).click();const input=page.getByRole('textbox',{name:'project name for Keyboard review',exact:true});await input.fill('HTTP review');await input.press('Enter');await expect(page.getByRole('alert').filter({hasText:'sample service rejected'})).toBeVisible();await expect(input).toHaveValue('HTTP review');await expect(input).toBeFocused();await input.press('Enter');await expect(page.getByRole('button',{name:'Edit project name for HTTP review',exact:true})).toBeVisible();expect(mutations).toHaveLength(2);await page.reload();await expect(page.getByRole('button',{name:'Edit project name for HTTP review',exact:true})).toBeVisible();
});

test('two simultaneous cell drafts retain the version captured when editing began',async({page})=>{
  await page.goto('/templates/outline');await page.getByRole('button',{name:'Edit project name for Keyboard review',exact:true}).click();const name=page.getByRole('textbox',{name:'project name for Keyboard review',exact:true});await name.fill('Older draft');
  await page.getByRole('button',{name:'Edit review date for Keyboard review',exact:true}).click();const date=page.locator('input[aria-label="review date for Keyboard review"]');await date.fill('2026-12-03');await date.press('Enter');await expect(name.locator('xpath=ancestor::tr')).toContainText('03 Dec 2026');
  await page.getByRole('button',{name:'Save project name for Keyboard review',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'changed in another tab'})).toBeVisible();await expect(name).toHaveValue('Older draft');
});

test('sample HTTP contract validates payloads, isolates sessions and rejects stale writes',async({request})=>{
  const token=crypto.randomUUID(),headers={'X-Outline-Demo-Session':token};const base='/api/examples/outline/projects';
  const list=await request.get(base+'?page=1&pageSize=100',{headers});expect(list.status()).toBe(200);const rows=(await list.json()).rows;
  const invalid=await request.post(base,{headers,data:{values:{name:'x',due:'2026-02-30',notes:'',status:'Planned'}}});expect(invalid.status()).toBe(422);expect((await invalid.json()).fieldErrors).toHaveProperty('due');
  const row=rows[0];const save=await request.patch(base+'/'+row.id,{headers,data:{values:{...row,name:'API saved'},version:row.version}});expect(save.status()).toBe(200);
  const stale=await request.patch(base+'/'+row.id,{headers,data:{values:{...row,name:'Stale'},version:row.version}});expect(stale.status()).toBe(409);
  const other=await request.get(base+'?pageSize=100',{headers:{'X-Outline-Demo-Session':crypto.randomUUID()}});expect((await other.json()).rows[0].name).toBe(row.name);
  expect((await request.get(base+'?pageSize=0',{headers})).status()).toBe(400);expect((await request.get(base)).status()).toBe(400);
});

test('HTTP adapter maps service errors, checks payloads and propagates cancellation',async()=>{
  const signal=new AbortController().signal;
  const invalid=createOutlineHttpRepository({baseUrl:'https://example.test',fetch:async()=>Response.json({fieldErrors:{name:'Already used',unexpected:'Ignore'}},{status:422})});await expect(invalid.save({name:'abc',due:'2026-10-20',notes:'',status:'Planned'},null,signal)).rejects.toBeInstanceOf(OutlineValidationError);
  const malformed=createOutlineHttpRepository({baseUrl:'https://example.test',fetch:async()=>Response.json({rows:[],total:-1})});await expect(malformed.list({search:'',filters:{},sort:null,page:1,pageSize:5},signal)).rejects.toBeInstanceOf(OutlineHttpError);
  const interrupted=new AbortController();const interruptedBody=createOutlineHttpRepository({baseUrl:'https://example.test',fetch:async()=>({ok:true,status:200,json:async()=>{interrupted.abort();throw new DOMException('Aborted','AbortError');}} as Response)});await expect(interruptedBody.list({search:'',filters:{},sort:null,page:1,pageSize:5},interrupted.signal)).rejects.toMatchObject({name:'AbortError'});
  const cancelled=new AbortController();cancelled.abort();await expect(malformed.list({search:'',filters:{},sort:null,page:1,pageSize:5},cancelled.signal)).rejects.toMatchObject({name:'AbortError'});
});

test('React Hook Form keeps validation, native focus and controlled values across a failed submit',async({page})=>{
  await page.goto('/integrations/react-hook-form');await page.getByRole('button',{name:'Save project',exact:true}).click();const name=page.getByRole('textbox',{name:'Project name',exact:true});await expect(name).toBeFocused();await expect(page.getByText('Enter a project name.',{exact:true})).toBeVisible();await name.fill('RHF project');await page.getByRole('combobox',{name:'Primary discipline',exact:true}).click();await page.getByRole('option',{name:'Design',exact:true}).click();await page.getByRole('button',{name:'Review date',exact:true}).click();await page.locator('.bui-calendar-popup').getByRole('button',{name:/Tuesday, October 20th, 2026/}).click();const tags=page.getByRole('combobox',{name:'Project tags',exact:true});await tags.fill('Engineering');await page.getByRole('option',{name:'Engineering',exact:true}).click();await tags.press('Tab');
  await page.getByRole('button',{name:'Fail next save',exact:true}).click();await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'sample service rejected'})).toBeVisible();await expect(name).toHaveValue('RHF project');await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Project saved through the sample HTTP API.'})).toBeVisible();
  await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.getByText('A project with this name already exists.',{exact:true})).toBeVisible();await expect(name).toBeFocused();
});

for(const theme of ['light','dark'])test(`expanded controls and integration examples pass automated accessibility in ${theme}`,async({page})=>{
  for(const route of ['/playground?component=DataTable&inlineEditing=true','/components/dialog','/components/react-hook-form','/integrations/react-hook-form','/examples/outline-http']){
    await page.goto(route);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();await expect(page.locator('h1')).toBeVisible();const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(scan.violations.map(violation=>({id:violation.id,targets:violation.nodes.map(node=>node.target)})),route).toEqual([]);
  }
});

for(const width of [390,1440])test('expanded previews and docs fit at '+width,async({page})=>{
  await page.setViewportSize({width,height:950});for(const route of ['/playground?component=Calendar','/playground?component=DataTable&inlineEditing=true','/components/table','/integrations/react-hook-form','/examples/outline-http']){await page.goto(route);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);}
});
