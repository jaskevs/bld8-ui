import {test,expect,type Page,type Route} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {validateAsyncOption,validateAsyncPage,validateAsyncValues,validateResolvedOptions} from '../packages/ui/src/async-options';

const example='/examples/async-selection';
const person=(value:string,label=value)=>({value,label,description:'Engineering · Sample directory',role:'Engineering',initials:'SD'});
const delay=()=>{let finish!:()=>void;const promise=new Promise<void>(resolve=>{finish=resolve;});return {promise,finish};};
const fulfill=(route:Route,value:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
async function open(page:Page,label:string){await page.getByRole('button',{name:'Show '+label.toLowerCase()+' options',exact:true}).click();return page.getByRole('listbox',{name:label+' options',exact:true});}

test('async option payloads preserve records but reject malformed and sparse service data',()=>{
  const option=person('one','One'),page={items:[option],nextCursor:'next'};
  const parsed=validateAsyncPage(page);expect(parsed).toEqual(page);expect(parsed.items[0]).not.toBe(option);
  expect(validateResolvedOptions([option],['one'])).toEqual([option]);
  for(const value of [{...option,value:''},{...option,value:'__proto__'},{...option,label:' '},{...option,disabled:'yes'},{...option,description:'x'.repeat(501)}])expect(()=>validateAsyncOption(value)).toThrow();
  for(const value of [{items:Array(1),nextCursor:null},{items:[option,option],nextCursor:null},{items:[option],nextCursor:''},{items:[option],nextCursor:'x'.repeat(513)},{items:Array.from({length:101},(_,index)=>person(String(index))),nextCursor:null}])expect(()=>validateAsyncPage(value)).toThrow();
  expect(()=>validateAsyncValues(Array(1))).toThrow();expect(()=>validateResolvedOptions(Array(1),['one'])).toThrow();expect(()=>validateResolvedOptions([option],Array(1))).toThrow();
  expect(()=>validateResolvedOptions([person('other')],['one'])).toThrow();expect(()=>validateAsyncValues(['one','one'])).toThrow();
});

test('saved IDs resolve labels and native forms submit IDs rather than rich row content',async({page})=>{
  await page.goto(example);await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toHaveValue('Maya Chen');
  await expect(page.getByRole('button',{name:'Remove Sam Rivera',exact:true})).toBeVisible();
  const list=await open(page,'Assignee');await expect(list.getByRole('option')).toHaveCount(20);await expect(list.getByRole('option').filter({hasText:'Maya Chen'})).toContainText('Product studio');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Read form values',exact:true}).click();const result=page.getByLabel('Submitted IDs');await expect(result).toContainText('["assignee","maya"]');await expect(result).toContainText('["reviewers","sam"]');await expect(result).not.toContainText('Maya Chen');
  await page.getByRole('button',{name:'Clear assignee',exact:true}).click();await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toBeFocused();await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toHaveValue('');
});

test('remote multiple choices keep selected labels across queries and Escape',async({page})=>{
  await page.goto(example);const field=page.getByRole('combobox',{name:'Reviewers',exact:true});await field.fill('Oliver');
  await page.getByRole('option').filter({hasText:'Oliver Reed'}).click();await expect(page.getByRole('button',{name:'Remove Oliver Reed',exact:true})).toBeVisible();
  await field.fill('Casey');await expect(page.getByRole('option').filter({hasText:'Casey'})).toHaveCount(3);await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Remove Sam Rivera',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Remove Oliver Reed',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Read form values',exact:true}).click();await expect(page.getByLabel('Submitted IDs')).toContainText('["reviewers","oliver"]');
});

test('loading another page retains the query, selected records and deliberate focus',async({page})=>{
  await page.goto(example);const list=await open(page,'Reviewers');await expect(list.getByRole('option')).toHaveCount(20);
  await page.getByRole('button',{name:'Load more reviewers',exact:true}).click();await expect(list.getByRole('option')).toHaveCount(40);await expect(page.getByRole('combobox',{name:'Reviewers',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Load more reviewers',exact:true}).click();await expect(list.getByRole('option')).toHaveCount(60);await expect(page.getByRole('combobox',{name:'Reviewers',exact:true})).toBeFocused();
  await expect(list.getByRole('option').last()).toHaveAttribute('aria-disabled','true');await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Remove Sam Rivera',exact:true})).toBeVisible();
});

test('a failed first query retries without losing the saved selection',async({page})=>{
  await page.goto(example);await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toHaveValue('Maya Chen');await page.getByRole('checkbox',{name:'Fail next search',exact:true}).check();
  const list=await open(page,'Assignee');await expect(page.locator('.bui-async-popup').getByRole('alert')).toContainText('Options could not be loaded');await expect(list.getByRole('option')).toHaveCount(0);await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toHaveValue('Maya Chen');
  await page.getByRole('button',{name:'Retry assignee search',exact:true}).click();await expect(list.getByRole('option')).toHaveCount(20);await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toBeFocused();
});

test('failed pagination keeps loaded options and retries the same cursor',async({page})=>{
  let failed=false;await page.route('**/api/examples/people?**',route=>{const params=new URL(route.request().url()).searchParams;if(params.get('cursor')==='20'&&!failed){failed=true;return fulfill(route,{private:'Do not expose raw service details.'},503);}return route.continue();});
  await page.goto(example);const list=await open(page,'Reviewers');await expect(list.getByRole('option')).toHaveCount(20);await page.getByRole('button',{name:'Load more reviewers',exact:true}).click();
  const retry=page.getByRole('button',{name:'Retry reviewers search',exact:true});await expect(retry).toBeFocused();await expect(list.getByRole('option')).toHaveCount(20);await expect(page.getByText('Do not expose raw service details.',{exact:true})).toHaveCount(0);
  await retry.click();await expect(list.getByRole('option')).toHaveCount(40);await expect(page.getByRole('combobox',{name:'Reviewers',exact:true})).toBeFocused();
});

test('a superseded query cannot replace newer results or the typed text',async({page})=>{
  const gate=delay();let started=false;await page.route('**/api/examples/people?**',async route=>{const params=new URL(route.request().url()).searchParams;if(params.get('query')==='Maya'){started=true;await gate.promise;await fulfill(route,{items:[person('maya','Old Maya')],nextCursor:null}).catch(()=>{});}else await route.continue();});
  await page.goto(example);const field=page.getByRole('combobox',{name:'Assignee',exact:true});await expect(field).toHaveValue('Maya Chen');await field.fill('Maya');await expect(field).toHaveValue('Maya');await expect.poll(()=>started).toBe(true);await field.fill('Sam');await expect(page.getByRole('option').filter({hasText:'Sam Rivera'})).toBeVisible();gate.finish();
  await field.press('ArrowLeft');await expect(field).toHaveValue('Sam');await expect(page.getByRole('option').filter({hasText:'Old Maya'})).toHaveCount(0);await page.keyboard.press('Escape');await expect(field).toHaveValue('Maya Chen');
});

for(const rejected of [false,true])test(`query records supersede a late ${rejected?'failed':'outdated'} selected-label response`,async({page})=>{
  await page.addInitScript(()=>{const original=window.fetch;window.fetch=(input,init)=>{const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;return original(input,url.includes('/api/examples/people')&&url.includes('values=maya')?{...init,signal:undefined}:init);};});
  const gate=delay();let started=false;await page.route('**/api/examples/people?**',async route=>{const params=new URL(route.request().url()).searchParams;if(params.get('values')==='maya'){started=true;await gate.promise;await fulfill(route,rejected?{error:'Private resolver failure'}:[person('maya','Outdated Maya')],rejected?503:200);}else await route.continue();});
  await page.goto(example);await expect.poll(()=>started).toBe(true);const field=page.getByRole('combobox',{name:'Assignee',exact:true});await field.fill('Maya');await expect(page.getByRole('option').filter({hasText:'Maya Chen'})).toBeVisible();
  const response=page.waitForResponse(response=>new URL(response.url()).searchParams.get('values')==='maya');gate.finish();await (await response).finished();await field.press('ArrowLeft');await expect(field).toHaveValue('Maya');
  await expect(page.getByText('Selected labels could not be loaded. Their values are kept.',{exact:true})).toHaveCount(0);await page.keyboard.press('Escape');await expect(field).toHaveValue('Maya Chen');
});

test('source identity changes discard labels and results from the previous source',async({page})=>{
  await page.goto(example);await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toHaveValue('Maya Chen');const source=page.getByRole('combobox',{name:'Directory source',exact:true});await source.click();await page.getByRole('option',{name:'Research studio',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toHaveValue('Maya Field');await expect(page.getByRole('button',{name:'Remove Sam Ortiz',exact:true})).toBeVisible();
  const list=await open(page,'Assignee');await expect(list.getByRole('option').filter({hasText:'Maya Field'})).toBeVisible();await expect(list.getByRole('option').filter({hasText:'Maya Chen'})).toHaveCount(0);
});

test('label resolution retry preserves its action focus on failure and returns to the field on success',async({page})=>{
  let failures=0;await page.route('**/api/examples/people?**',route=>{if(new URL(route.request().url()).searchParams.get('values')==='maya'&&failures++<2)return fulfill(route,{error:'Unavailable'},503);return route.continue();});
  await page.goto(example);await expect(page.getByRole('button',{name:'Remove Sam Rivera',exact:true})).toBeVisible();const retry=page.getByRole('button',{name:'Retry selected labels',exact:true});await expect(retry).toBeVisible();await retry.click();await expect(retry).toBeFocused();await retry.click();await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toHaveValue('Maya Chen');await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toBeFocused();
});

test('remote results are bounded and ask for a narrower search at the loaded limit',async({page})=>{
  await page.route('**/api/examples/people?**',route=>{const params=new URL(route.request().url()).searchParams;if(params.has('values'))return route.continue();const cursor=Number(params.get('cursor')??0);return fulfill(route,{items:Array.from({length:100},(_,index)=>person('remote-'+(cursor+index),'Remote person '+(cursor+index))),nextCursor:String(cursor+100)});});
  await page.goto(example);const list=await open(page,'Reviewers');await expect(list.getByRole('option')).toHaveCount(100);for(let pageIndex=2;pageIndex<=5;pageIndex++){await page.getByRole('button',{name:'Load more reviewers',exact:true}).click();await expect(list.getByRole('option')).toHaveCount(pageIndex*100);}
  await expect(page.getByText('Narrow the search to see more options.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Load more reviewers',exact:true})).toHaveCount(0);
});

for(const mode of ['light','dark'] as const)test(`async choices stay usable and accessible on a phone in ${mode}`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto(example);if(mode==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toHaveValue('Maya Chen');await expect(page.getByRole('button',{name:'Remove Sam Rivera',exact:true})).toBeVisible();await page.getByRole('checkbox',{name:'Disable directory controls',exact:true}).check();await expect(page.getByRole('combobox',{name:'Assignee',exact:true})).toBeDisabled();await page.getByRole('checkbox',{name:'Disable directory controls',exact:true}).uncheck();
  const closedScan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(closedScan.violations.map(violation=>({id:violation.id,targets:violation.nodes.map(node=>node.target)}))).toEqual([]);
  await open(page,'Reviewers');await expect(page.getByRole('option')).toHaveCount(20);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const field=page.getByRole('combobox',{name:'Reviewers',exact:true}),selector=await field.evaluate(element=>'#'+CSS.escape(element.id));
  const popupScan=await new AxeBuilder({page}).include(selector).include('.bui-async-popup').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(popupScan.violations.map(violation=>({id:violation.id,targets:violation.nodes.map(node=>node.target)}))).toEqual([]);
  await field.focus();
  for(let step=0;step<8&&await page.locator('.bui-async-popup').isVisible();step++){await page.keyboard.press('Tab');await expect.poll(()=>page.evaluate(()=>!document.activeElement?.closest('[aria-hidden="true"]'))).toBe(true);}
  await expect(page.locator('.bui-async-popup')).not.toBeVisible();await expect.poll(()=>page.evaluate(()=>!document.activeElement?.closest('[aria-hidden="true"]'))).toBe(true);
});
