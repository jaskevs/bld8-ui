import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'node:http';
import {emptyFilterQuery,filterRecords,filterQueryKey,parseFilterQuery,serializeFilterQuery,validateFilterQuery,type FilterQuery} from '../packages/ui/src/filter-query';
import {createMemoryIssueRepository,createIssueHttpRepository,defaultIssueView,issueFields,issueSeed,parseIssueView,parseSavedIssueViews,type IssueListQuery} from '../packages/blocks/src/issue-repository';

const query=(field:string,operator:any,values:string[],match:'all'|'any'='all'):FilterQuery=>({version:1,match,rules:[{id:'one',field,operator,values}]});
test('filter evaluation handles all/any, choices, numeric ranges, dates and empty values',()=>{
  const apply=(value:FilterQuery)=>filterRecords(issueSeed,value,issueFields,(row,key)=>row[key as keyof typeof row]);
  expect(apply(query('status','anyOf',['review']))).toHaveLength(3);expect(apply(query('estimate','between',['2','5'])).every(row=>row.estimate>=2&&row.estimate<=5)).toBe(true);
  expect(apply(query('due','empty',[]))).toHaveLength(2);expect(apply(query('due','before',['2026-11-01']))).toHaveLength(2);
  expect(apply(query('title','contains',['DIALOG']))[0].id).toBe('ISS-101');expect(apply(emptyFilterQuery())).toHaveLength(12);
  const combined:FilterQuery={version:1,match:'all',rules:[{id:'one',field:'status',operator:'anyOf',values:['review']},{id:'two',field:'priority',operator:'anyOf',values:['urgent']}]};
  expect(apply(combined)).toHaveLength(1);expect(apply({...combined,match:'any'})).toHaveLength(3);
});
test('invalid filters cannot execute or round-trip as valid configurations',()=>{
  for(const value of [query('missing','equals',['x']),query('status','contains',['review']),query('estimate','between',['5','2']),query('estimate','equals',['Infinity']),query('due','equals',['2026-02-30']),query('title','contains',[]),query('status','anyOf',['missing'])]){
    expect(Object.keys(validateFilterQuery(value,issueFields)).length).toBeGreaterThan(0);expect(parseFilterQuery(JSON.stringify(value),issueFields).query).toBeNull();expect(()=>filterRecords(issueSeed,value,issueFields,()=>null)).toThrow();
  }
  const valid=query('status','noneOf',['done']);expect(parseFilterQuery(serializeFilterQuery(valid,issueFields),issueFields).query).toEqual(valid);
  expect(parseFilterQuery('{broken',issueFields).query).toBeNull();expect(parseFilterQuery('x'.repeat(16001),issueFields).query).toBeNull();
  expect(filterQueryKey(query('estimate','between',['2','5']))).not.toBe(filterQueryKey(query('estimate','between',['5','2'])));
});
test('view parsing rejects unsupported fields, columns and corrupt saved state',()=>{
  expect(parseIssueView(JSON.stringify(defaultIssueView()))).toEqual(defaultIssueView());expect(parseIssueView(JSON.stringify({...defaultIssueView(),columns:['status']}))).toBeNull();
  expect(parseSavedIssueViews(JSON.stringify([{id:'x',name:'One',view:defaultIssueView()},{id:'x',name:'Two',view:defaultIssueView()}]))).toBeNull();expect(parseSavedIssueViews('{bad')).toBeNull();
});
test('memory repository checks a complete batch before applying revisions and supports guarded undo',async()=>{
  const repository=createMemoryIssueRepository(),signal=new AbortController().signal;const first=issueSeed[0],second=issueSeed[1];
  await expect(repository.update([{id:first.id,expectedRevision:1,patch:{status:'done'}},{id:second.id,expectedRevision:999,patch:{status:'done'}}],signal)).rejects.toThrow('changed elsewhere');
  expect((await repository.list({view:defaultIssueView(),page:1},signal)).rows[0].status).toBe('review');
  const changed=await repository.update([{id:first.id,expectedRevision:1,patch:{status:'done'}}],signal);expect(changed[0].revision).toBe(2);
  await expect(repository.update([{id:first.id,expectedRevision:1,patch:{title:'Stale title'}}],signal)).rejects.toThrow('changed elsewhere');
  const restored=await repository.update([{id:first.id,expectedRevision:2,patch:{status:'review'}}],signal);expect(restored[0].status).toBe('review');
  const controller=new AbortController();controller.abort();await expect(repository.list({view:defaultIssueView(),page:1},controller.signal)).rejects.toMatchObject({name:'AbortError'});
});
test('HTTP adapter transmits the typed query, validates responses and keeps raw service errors private',async()=>{
  const memory=createMemoryIssueRepository();let seen:IssueListQuery|undefined,fail=false,malformed=false;
  const server=createServer(async(request,response)=>{response.setHeader('Content-Type','application/json');if(fail){response.statusCode=409;response.end(JSON.stringify({private:'raw-service-detail'}));return;}if(malformed){response.end(JSON.stringify({rows:[{id:'bad'}],total:1}));return;}if(request.method==='GET'){seen=JSON.parse(new URL(request.url!,'http://localhost').searchParams.get('query')!);response.end(JSON.stringify(await memory.list(seen!,new AbortController().signal)));return;}let body='';for await(const part of request)body+=part;const value=JSON.parse(body);response.end(JSON.stringify(request.method==='POST'?await memory.create(value,new AbortController().signal):await memory.update(value.changes,new AbortController().signal)));});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};const repository=createIssueHttpRepository('http://127.0.0.1:'+address.port+'/issues'),signal=new AbortController().signal;
  try{const view={...defaultIssueView(),filters:query('status','anyOf',['review'])};const result=await repository.list({view,page:1},signal);expect(result.total).toBe(3);expect(seen?.view.filters).toEqual(view.filters);const created=await repository.create({title:'HTTP-created issue',priority:'high',assignee:'maya'},signal);expect(created.revision).toBe(1);fail=true;await expect(repository.update([{id:created.id,expectedRevision:1,patch:{status:'done'}}],signal)).rejects.toThrow('changed elsewhere');fail=false;malformed=true;await expect(repository.list({view,page:1},signal)).rejects.toThrow('invalid response');}finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

async function addStatus(page:Page,label='In review'){
  await page.getByRole('button',{name:/^Filters/}).click();await page.getByRole('button',{name:'Add filter',exact:true}).click();
  const field=page.getByRole('combobox',{name:'Filter 1 field',exact:true});await field.click();await page.getByRole('option',{name:'Status',exact:true}).click();
  const values=page.getByRole('combobox',{name:'Filter 1 values',exact:true});await values.fill(label);await page.getByRole('option',{name:label,exact:true}).click();await expect(page.getByRole('button',{name:'Remove '+label,exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Remove '+label,exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Apply filters',exact:true}).click();
}
test('issue filters, saved views and share links round-trip without losing host URL state',async({page})=>{
  await page.goto('/blocks/issue-table?host=keep#view');await expect(page.getByRole('cell',{name:'ISS-101',exact:true})).toBeVisible();await addStatus(page);
  await expect(page.getByText('3 results',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Save view',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Save this view'});await dialog.getByRole('textbox',{name:'View name'}).fill('Review queue');await dialog.getByRole('button',{name:'Save current view'}).click();
  await expect(page.getByRole('button',{name:'Review queue',exact:true})).toHaveAttribute('aria-pressed','true');await page.reload();await expect(page.getByRole('button',{name:'Review queue',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByText('3 results',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Share view',exact:true}).click();const share=page.getByRole('dialog',{name:'Share this view'});const href=await share.getByRole('textbox',{name:'View link'}).inputValue();expect(new URL(href).searchParams.get('host')).toBe('keep');expect(new URL(href).hash).toBe('#view');await page.goto(href);await expect(page.getByText('3 results',{exact:true})).toBeVisible();
});
test('filter validation preserves the draft and keyboard focus survives removing a rule',async({page})=>{
  await page.goto('/blocks/issue-table');await page.getByRole('button',{name:/^Filters/}).click();await page.getByRole('button',{name:'Add filter',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Filter 1 field',exact:true})).toBeFocused();await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByText('Enter a value.',{exact:true})).toBeVisible();await expect(page.getByRole('textbox',{name:'Filter 1 value',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Remove filter 1'}).click();await expect(page.getByRole('button',{name:'Add filter',exact:true})).toBeFocused();
});
test('failed storage keeps a saved-view draft and does not claim success',async({page})=>{
  await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='bld8-issue-views-v1')throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};});
  await page.goto('/blocks/issue-table');await page.getByRole('button',{name:'Save view',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Save this view'});await dialog.getByRole('textbox',{name:'View name'}).fill('Keep this draft');await dialog.getByRole('button',{name:'Save current view'}).click();await expect(dialog.getByRole('alert')).toContainText('could not be saved');await expect(dialog.getByRole('textbox',{name:'View name'})).toHaveValue('Keep this draft');await expect(page.getByRole('button',{name:'Keep this draft',exact:true})).toHaveCount(0);
});
test('selection spans pages and a bulk status change can be undone',async({page})=>{
  await page.goto('/blocks/issue-table');await page.getByRole('checkbox',{name:'Select ISS-101',exact:true}).check();await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('checkbox',{name:'Select ISS-106',exact:true}).check();await page.getByRole('button',{name:'Mark done',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'2 issues updated.'})).toBeVisible();await page.getByRole('button',{name:'Undo last status change'}).click();await expect(page.getByRole('row').filter({hasText:'ISS-106'})).toContainText('In review');await page.getByRole('button',{name:'Previous',exact:true}).click();await expect(page.getByRole('row').filter({hasText:'ISS-101'})).toContainText('In review');
});
test('creation and inline editing are working workflows rather than static examples',async({page})=>{
  await page.goto('/blocks/issue-table');await page.getByRole('button',{name:'New issue',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Create an issue'});await dialog.getByRole('button',{name:'Create issue',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('at least three');await dialog.getByRole('textbox',{name:'New issue title'}).fill('A useful new issue');await dialog.getByRole('button',{name:'Create issue',exact:true}).click();const edit=page.getByRole('button',{name:'Edit Title for ISS-113',exact:true});await edit.click();await page.getByRole('textbox',{name:'Title for ISS-113',exact:true}).fill('A refined issue title');await page.keyboard.press('Enter');await expect(edit).toContainText('A refined issue title');
});
test('error and empty previews recover while failed inline writes keep their draft',async({page})=>{
  await page.goto('/blocks/issue-table');const mode=page.getByRole('combobox',{name:'Issue preview state'});await mode.click();await page.getByRole('option',{name:'Connection error',exact:true}).click();await expect(page.getByRole('region',{name:'Issue workspace',exact:true}).getByRole('alert')).toContainText('Issues could not be loaded');await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('cell',{name:'ISS-101',exact:true})).toBeVisible();
  await mode.click();await page.getByRole('option',{name:'Rejected save',exact:true}).click();await page.getByRole('button',{name:'Edit Title for ISS-101',exact:true}).click();const input=page.getByRole('textbox',{name:'Title for ISS-101',exact:true});await input.fill('A retained edit draft');await page.keyboard.press('Enter');await expect(input).toHaveValue('A retained edit draft');await expect(page.getByRole('alert').filter({hasText:'Example save rejected'}).last()).toBeVisible();await page.getByRole('button',{name:'Save Title for ISS-101',exact:true}).click();await expect(page.getByRole('button',{name:'Edit Title for ISS-101',exact:true})).toContainText('A retained edit draft');
  await mode.click();await page.getByRole('option',{name:'Empty',exact:true}).click();await expect(page.getByRole('heading',{name:'No issues yet.'})).toBeVisible();
});
for(const theme of ['light','dark'])test('issue workflow accessibility in '+theme,async({page})=>{
  for(const route of ['/blocks/issue-table','/components/filter-builder','/integrations/issues']){await page.goto(route);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();if(route.startsWith('/blocks')){await page.getByRole('button',{name:/^Filters/}).click();await page.getByRole('button',{name:'Add filter',exact:true}).click();}const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),route).toEqual([]);}
});
for(const width of [1440,768,390,320])test('issue controls and tables remain contained at '+width,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/blocks/issue-table');await page.getByRole('button',{name:/^Filters/}).click();await page.getByRole('button',{name:'Add filter',exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('normal-motion filter rows ease into place and reduced-motion removal stays immediate',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/components/filter-builder');
  const frames=await page.evaluate(async()=>{const button=Array.from(document.querySelectorAll('button')).find(button=>button.textContent?.trim()==='Add filter')!;button.click();const values:number[]=[];for(let index=0;index<24;index++){await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));const row=document.querySelector('.bui-filter-rule');if(row)values.push(row.getBoundingClientRect().height);}return values;});
  expect(new Set(frames.map(value=>Math.round(value))).size).toBeGreaterThan(2);expect(frames.some(value=>value>1&&value<Math.max(...frames)-1)).toBe(true);
  const row=page.locator('.bui-filter-rule');await expect(row).toBeVisible();await expect.poll(async()=>await row.evaluate(element=>Math.round(element.getBoundingClientRect().height))).toBeGreaterThan(60);await page.getByRole('button',{name:'Remove filter 1'}).click();await expect(page.getByRole('button',{name:'Add filter',exact:true})).toBeFocused();await expect(row).toHaveCount(0);await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Add filter',exact:true}).click();await expect(row).toBeVisible();await page.getByRole('button',{name:'Remove filter 1'}).click();await expect(row).toHaveCount(0);
});
