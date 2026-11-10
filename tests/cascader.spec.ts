import {test,expect,type Page,type Route} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {validateCascaderValues,validateCascaderNode,validateCascaderPage,validateCascaderResolvedPath,type CascaderNode} from '../packages/ui/src/cascader-state';

const example='/examples/cascader';
const node=(value:string,parentValue:string|null=null,hasChildren=false):CascaderNode=>({value,label:value,parentValue,hasChildren});
const ids=['engineering','frontend','react'];
const chain=[node('engineering',null,true),node('frontend','engineering',true),node('react','frontend')];
const fulfill=(route:Route,value:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
const gate=()=>{let finish!:()=>void;const promise=new Promise<void>(resolve=>{finish=resolve;});return {promise,finish};};
async function ready(page:Page){await page.goto(example);await expect(page.getByRole('button',{name:'Project area',exact:true})).toContainText('Engineering / Frontend / React');}
async function open(page:Page){await page.getByRole('button',{name:'Project area',exact:true}).click();return page.locator('.bui-cascader-popup');}
async function submitted(page:Page,expected:string){await page.getByRole('button',{name:'Read path value',exact:true}).click();await expect(page.getByLabel('Submitted path',{exact:true})).toHaveText(expected);}

test('cascader paths use unique stable IDs and enforce the eight-node depth bound',()=>{
  expect(validateCascaderValues(ids)).toEqual(ids);expect(validateCascaderValues(ids)).not.toBe(ids);
  expect(validateCascaderValues(Array.from({length:8},(_,i)=>'node-'+i))).toHaveLength(8);
  for(const values of [['same','same'],['__proto__'],['constructor'],['x'.repeat(129)],['bad\u0000id'],Array(1),Array.from({length:9},(_,i)=>String(i))])expect(()=>validateCascaderValues(values)).toThrow();
  for(const depth of [0,9,1.5,NaN])expect(()=>validateCascaderValues([],depth)).toThrow();
  for(const value of [{...node('self'),parentValue:'self'},{...node('a'),parentValue:undefined},{...node('a'),hasChildren:'yes'},{...node('a'),label:' '}])expect(()=>validateCascaderNode(value)).toThrow();
});

test('cascader pages reject cross-branch records, cycles, sparse pages and unbounded cursors',()=>{
  const source={items:[node('frontend','engineering',true)],nextCursor:'2'};
  expect(validateCascaderPage(source,['engineering'],'engineering')).toEqual(source);
  for(const source of [{items:[node('frontend','design')],nextCursor:null},{items:[node('engineering','engineering')],nextCursor:null},{items:[node('frontend','engineering'),node('frontend','engineering')],nextCursor:null},{items:Array(1),nextCursor:null},{items:[],nextCursor:'x'.repeat(513)}])expect(()=>validateCascaderPage(source,['engineering'])).toThrow();
  expect(()=>validateCascaderPage({items:[],nextCursor:null},['engineering'],'design')).toThrow();
  expect(()=>validateCascaderPage({items:[],nextCursor:null},Array.from({length:8},(_,i)=>String(i)))).toThrow();
});

test('cascader resolution proves the full ordered chain and a final leaf without mutating service data',()=>{
  const restored=validateCascaderResolvedPath(chain,ids);expect(restored).toEqual(chain);expect(restored[0]).not.toBe(chain[0]);
  expect(validateCascaderResolvedPath([],[])).toEqual([]);
  expect(validateCascaderResolvedPath(chain.map((item,index)=>({...item,disabled:index===2})),ids).at(-1)?.disabled).toBe(true);
  for(const value of [chain.slice(1),[chain[1],chain[0],chain[2]],[...chain.slice(0,2),{...chain[2],hasChildren:true}],[{...chain[0],hasChildren:false},...chain.slice(1)],[chain[0],{...chain[1],parentValue:null},chain[2]],Array(3)])expect(()=>validateCascaderResolvedPath(value,ids)).toThrow();
});

test('a saved path resolves labels, commits a leaf and submits stable JSON values',async({page})=>{
  await ready(page);await submitted(page,JSON.stringify(ids));await open(page);
  await page.getByRole('button',{name:'Choose Angular',exact:true}).click();await expect(page.locator('.bui-cascader-popup')).not.toBeVisible();
  const trigger=page.getByRole('button',{name:'Project area',exact:true});await expect(trigger).toBeFocused();await expect(trigger).toContainText('Engineering / Frontend / Angular');await submitted(page,'["engineering","frontend","angular"]');
  await page.getByRole('button',{name:'Clear project area',exact:true}).click();await expect(trigger).toBeFocused();await submitted(page,'[]');
  await page.getByRole('checkbox',{name:'Disable project area',exact:true}).check();await expect(trigger).toBeDisabled();await submitted(page,'null');
});

test('native keyboard drill and back navigation keep branches uncommitted until a leaf is activated',async({page})=>{
  await ready(page);await open(page);await page.getByRole('button',{name:'All options',exact:true}).click();
  const engineering=page.getByRole('button',{name:'Open Engineering',exact:true});await engineering.focus();await engineering.press('ArrowRight');await expect(page.getByRole('button',{name:'Open Frontend',exact:true})).toBeFocused();
  await page.keyboard.press('End');await expect(page.getByRole('button',{name:'Open Backend',exact:true})).toBeFocused();await page.keyboard.press('ArrowRight');await expect(page.getByRole('button',{name:'Choose .NET',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowLeft');await expect(page.getByRole('button',{name:'Open Backend',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Project area',exact:true})).toContainText('Engineering / Frontend / React');
  await open(page);await page.getByRole('button',{name:'All options',exact:true}).click();await page.getByRole('button',{name:'Open Engineering',exact:true}).click();await page.getByRole('button',{name:'Open Backend',exact:true}).click();await expect(page.getByRole('button',{name:'Choose .NET',exact:true})).toBeFocused();await page.keyboard.press('Enter');await submitted(page,'["engineering","backend","dotnet"]');
});

test('current-level search and explicit paging never masquerade as descendant search',async({page})=>{
  await page.route('**/api/examples/locations?**',route=>{const p=new URL(route.request().url()).searchParams;if(p.get('path')==='[]'&&!p.get('query'))return fulfill(route,{items:p.has('cursor')?[{...node('operations'),label:'Operations',disabled:true}]:[{...node('engineering',null,true),label:'Engineering'},{...node('design',null,true),label:'Design'}],nextCursor:p.has('cursor')?null:'2'});return route.continue();});
  await ready(page);await open(page);const search=page.getByRole('searchbox',{name:'Search project area choices',exact:true});await search.fill('Engineering');await expect(page.getByText('No choices at this level.',{exact:true})).toBeVisible();await search.fill('Ang');await expect(page.getByRole('button',{name:'Choose Angular',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'All options',exact:true}).click();await expect(page.getByRole('button',{name:'Open Engineering',exact:true})).toBeVisible();await page.getByRole('button',{name:'Load more project area',exact:true}).click();await expect(page.getByRole('button',{name:'Choose Operations',exact:true})).toBeDisabled();await expect(search).toBeFocused();await expect(page.getByRole('button',{name:'Load more project area',exact:true})).toHaveCount(0);
});

test('query failure and a failed retry keep the committed path and repair action focus',async({page})=>{
  let failures=0;await page.route('**/api/examples/locations?**',route=>{const p=new URL(route.request().url()).searchParams;if(p.has('path')&&failures++<2)return fulfill(route,{error:'Private service detail'},503);return route.continue();});
  await ready(page);await open(page);const retry=page.getByRole('button',{name:'Retry project area choices',exact:true});await expect(retry).toBeVisible();await expect(page.getByText('Private service detail',{exact:true})).toHaveCount(0);await retry.click();await expect(retry).toBeFocused();await retry.click();await expect(page.getByRole('button',{name:'Choose React',exact:true})).toBeVisible();await expect(page.getByRole('searchbox',{name:'Search project area choices',exact:true})).toBeFocused();await page.keyboard.press('Escape');await submitted(page,JSON.stringify(ids));
});

test('an old branch response cannot replace a newly browsed branch or selected labels',async({page})=>{
  const pending=gate();let started=false;await page.route('**/api/examples/locations?**',async route=>{const p=new URL(route.request().url()).searchParams;if(p.get('path')==='["engineering","frontend"]'){started=true;await pending.promise;await fulfill(route,{items:[{...node('react','frontend'),label:'Outdated React'}],nextCursor:null}).catch(()=>{});}else await route.continue();});
  await ready(page);await open(page);await expect.poll(()=>started).toBe(true);await page.getByRole('button',{name:'All options',exact:true}).click();await page.getByRole('button',{name:'Open Design',exact:true}).click();await expect(page.getByRole('button',{name:'Choose Systems',exact:true})).toBeVisible();pending.finish();await page.getByRole('searchbox',{name:'Search project area choices',exact:true}).press('ArrowDown');await expect(page.getByRole('button',{name:'Choose Systems',exact:true})).toBeFocused();await expect(page.getByRole('button',{name:'Choose Outdated React',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Project area',exact:true})).toContainText('Engineering / Frontend / React');
});

test('selected-path recovery retains retry focus on failure and returns to the trigger on success',async({page})=>{
  let failures=0;await page.route('**/api/examples/locations?**',route=>{if(new URL(route.request().url()).searchParams.has('values')&&failures++<2)return fulfill(route,{error:'Unavailable'},503);return route.continue();});
  await page.goto(example);const retry=page.getByRole('button',{name:'Retry selected path',exact:true});await expect(retry).toBeVisible();await retry.click();await expect(retry).toBeFocused();await retry.click();const trigger=page.getByRole('button',{name:'Project area',exact:true});await expect(trigger).toContainText('Engineering / Frontend / React');await expect(trigger).toBeFocused();await submitted(page,JSON.stringify(ids));
});

test('new invalid selected metadata stays visibly unavailable after moving to another branch',async({page})=>{
  await page.route('**/api/examples/locations?**',route=>{if(new URL(route.request().url()).searchParams.get('path')==='["engineering","frontend"]')return fulfill(route,{items:[{...node('react','frontend',true),label:'React'}],nextCursor:null});return route.continue();});
  await ready(page);await open(page);const warning=page.getByText('The selected path is no longer available. Its value is kept.',{exact:true});await expect(warning).toBeVisible();await page.getByRole('button',{name:'All options',exact:true}).click();await expect(page.getByRole('button',{name:'Open Design',exact:true})).toBeVisible();await expect(warning).toBeVisible();await page.keyboard.press('Escape');await submitted(page,JSON.stringify(ids));
});

test('phone hierarchy navigation stays contained with crisp native controls and accessible contrast',async({page})=>{
  await page.setViewportSize({width:390,height:844});await ready(page);await open(page);await expect(page.getByRole('button',{name:'Choose React',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const popup=page.locator('.bui-cascader-popup');expect(await popup.evaluate(element=>{const r=element.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height<=innerHeight;})).toBe(true);
  expect(await page.getByRole('button',{name:'Choose React',exact:true}).evaluate(element=>element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);await expect(popup.getByRole('listbox')).toHaveCount(0);
  const scan=await new AxeBuilder({page}).include('.bui-cascader-popup').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(scan.violations.map(violation=>({id:violation.id,targets:violation.nodes.map(node=>node.target)}))).toEqual([]);
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Project area',exact:true})).toBeFocused();
});
