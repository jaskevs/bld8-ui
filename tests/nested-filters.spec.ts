import {test,expect,type Page} from '@playwright/test';
import {createServer} from 'node:http';
import AxeBuilder from '@axe-core/playwright';
import {countFilterRules,filterQueryKey,filterRecords,migrateFilterQuery,parseFilterQuery,serializeFilterQuery,validateFilterQuery,type FilterGroup,type FilterRule,type NestedFilterQuery,type AnyFilterQuery} from '../packages/ui/src/filter-query';
import {createIssueHttpRepository,createMemoryIssueRepository,defaultIssueView,issueFields,issueSeed,parseIssueView,serializeIssueView,type IssueListQuery} from '../packages/blocks/src/issue-repository';

const rule=(id:string,field='status',values=['review'],operator:FilterRule['operator']='anyOf'):FilterRule=>({id,field,operator,values});
const group=(id:string,children:(FilterRule|FilterGroup)[],match:'all'|'any'='all',not=false):FilterGroup=>({id,match,not,children});
const nested=(root:FilterGroup):NestedFilterQuery=>({version:2,root});
const example=()=>nested(group('root',[group('alternatives',[rule('review'),rule('urgent','priority',['urgent'])],'any'),rule('owner','assignee',['oliver'])]));
const apply=(value:AnyFilterQuery)=>filterRecords(issueSeed,value,issueFields,(row,key)=>row[key as keyof typeof row]);

test('nested all/any groups and group negation have explicit boolean semantics',()=>{
  expect(apply(example()).map(row=>row.id)).toEqual(['ISS-106']);
  const inverse=nested(group('root',[group('excluded',[rule('review'),rule('urgent','priority',['urgent'])],'any',true)]));
  expect(apply(inverse)).toHaveLength(9);
  expect(apply(inverse).every(row=>row.status!=='review'&&row.priority!=='urgent')).toBe(true);
  const ranges=nested(group('root',[group('estimates',[rule('estimate','estimate',['3','5'],'between'),rule('title','title',['dialog'],'contains')],'all'),rule('empty','due',[],'empty')],'any'));
  expect(apply(ranges).map(row=>row.id)).toEqual(issueSeed.filter(row=>(row.estimate>=3&&row.estimate<=5&&row.title.toLowerCase().includes('dialog'))||!row.due).map(row=>row.id));
  expect(countFilterRules(example())).toBe(3);
});

test('v1 migration preserves both empty query modes, IDs and scalar evaluation',()=>{
  for(const match of ['all','any'] as const){
    const old={version:1 as const,match,rules:[]};
    expect(apply(old)).toHaveLength(issueSeed.length);
    const next=migrateFilterQuery(old,issueFields);
    expect(next.root.match).toBe('all');expect(apply(next)).toHaveLength(issueSeed.length);
  }
  const old={version:1 as const,match:'any' as const,rules:[rule('group-root'),rule('one','assignee',['sam'])]};
  const copy=JSON.stringify(old),next=migrateFilterQuery(old,issueFields);
  expect(next.root.id).not.toBe('group-root');expect(next.root.children.map(node=>node.id)).toEqual(['group-root','one']);
  expect(apply(next)).toEqual(apply(old));expect(JSON.stringify(old)).toBe(copy);
});

test('nested parse is explicit, canonical, bounded and independent of input objects',()=>{
  const value=example(),before=JSON.stringify(value),text=serializeFilterQuery(value,issueFields);
  expect(parseFilterQuery(text,issueFields).query).toBeNull();
  expect(parseFilterQuery(text,issueFields,{allowNested:true}).query).toEqual(value);
  const parsed=parseFilterQuery(text,issueFields,{allowNested:true}).query!;
  expect(parsed).not.toBe(value);expect(JSON.stringify(value)).toBe(before);
  expect(filterQueryKey(value)).toBe(filterQueryKey({...value,root:{...value.root,id:'different-root'}}));
  const a=nested(group('root',[rule('one','status',['review','done'])]));
  const b=nested(group('root',[rule('other','status',['done','review'])]));
  expect(filterQueryKey(a)).toBe(filterQueryKey(b));
  expect(parseFilterQuery('x'.repeat(16001),issueFields,{allowNested:true}).query).toBeNull();
});

test('empty nested groups remain invalid drafts except an unnegated all-root',()=>{
  expect(apply(nested(group('root',[])))).toHaveLength(issueSeed.length);
  for(const value of [nested(group('root',[],'any')),nested(group('root',[],'all',true)),nested(group('root',[group('empty',[])]))]){
    expect(Object.keys(validateFilterQuery(value,issueFields)).length).toBeGreaterThan(0);
    expect(()=>apply(value)).toThrow('Invalid filter');
  }
});

test('invalid operators, duplicate/reserved IDs, hybrid nodes and cycles cannot execute',()=>{
  const cyclic=group('root',[]);cyclic.children.push(cyclic);
  const values:unknown[]=[nested(group('root',[rule('one'),rule('one')])),nested(group('__proto__',[rule('one')])),nested(group('root',[rule('constructor')])),nested(group('root',[{...rule('one'),children:[]} as any])),nested(group('root',[rule('one','missing')])),nested(group('root',[rule('one','status',['review'],'contains')])),nested(cyclic),{version:2,root:{...group('root',[rule('one')]),not:'yes'}},nested(group('root',[rule('one','title',['x'.repeat(201)],'contains')]))];
  for(const value of values){expect(Object.keys(validateFilterQuery(value,issueFields)).length).toBeGreaterThan(0);expect(()=>serializeFilterQuery(value as AnyFilterQuery,issueFields)).toThrow();}
  const inherited=Object.create({version:2,root:group('root',[rule('one')])});expect(validateFilterQuery(inherited,issueFields).query).toBeTruthy();
});

test('unknown match values and sparse legacy arrays return errors without coercion',()=>{
  for(const match of [{toString:null},null,{},'ALL',0]){
    expect(Object.keys(validateFilterQuery({version:1,match,rules:[]},issueFields)).length).toBeGreaterThan(0);
    expect(Object.keys(validateFilterQuery({version:2,root:{id:'root',match,children:[]}},issueFields)).length).toBeGreaterThan(0);
  }
  const sparse={version:1 as const,match:'all' as const,rules:Array(1) as FilterRule[]};
  expect(Object.keys(validateFilterQuery(sparse,issueFields)).length).toBeGreaterThan(0);
  expect(()=>apply(sparse)).toThrow('Invalid filter');
});

test('query bounds allow twenty rules, eight groups and root-zero depth three',()=>{
  const twenty=nested(group('root',Array.from({length:20},(_,i)=>rule('rule-'+i))));expect(validateFilterQuery(twenty,issueFields)).toEqual({});
  expect(validateFilterQuery(nested(group('root',[...twenty.root.children,rule('extra')])),issueFields).query).toBeTruthy();
  const eight=nested(group('root',Array.from({length:7},(_,i)=>group('group-'+i,[rule('rule-'+i)]))));expect(validateFilterQuery(eight,issueFields)).toEqual({});
  expect(Object.keys(validateFilterQuery(nested(group('root',[...eight.root.children,group('extra',[rule('extra-rule')])])),issueFields)).length).toBeGreaterThan(0);
  const depth=(last:number):NestedFilterQuery=>{let child:FilterGroup=group('depth-'+last,[rule('leaf')]);for(let at=last-1;at>=0;at--)child=group('depth-'+at,[child]);return nested(child);};
  expect(validateFilterQuery(depth(3),issueFields)).toEqual({});expect(Object.keys(validateFilterQuery(depth(4),issueFields)).length).toBeGreaterThan(0);
});

test('validation catches serialized-size limits before a draft can reach saved view serialization',()=>{
  const options=Array.from({length:50},(_,index)=>({value:index+'-'+ 'x'.repeat(180),label:String(index)}));
  const fields=[{id:'many',label:'Many',kind:'select' as const,options}];
  const value=nested(group('root',Array.from({length:20},(_,index)=>rule('rule-'+index,'many',options.map(option=>option.value)))));
  expect(validateFilterQuery(value,fields).query).toContain('smaller');expect(()=>serializeFilterQuery(value,fields)).toThrow('Complete');
});

test('Issue views save nested queries while accepting legacy links and rejecting invalid trees',()=>{
  const view={...defaultIssueView(),filters:example()},text=serializeIssueView(view);
  expect(parseIssueView(text)).toEqual(view);expect(parseIssueView(serializeIssueView(defaultIssueView()))).toEqual(defaultIssueView());
  expect(parseIssueView(JSON.stringify({...view,filters:nested(group('root',[group('unfinished',[])]))}))).toBeNull();
});

test('actual HTTP issue queries evaluate the same v2 tree and reject invalid input before transport',async()=>{
  const source=createMemoryIssueRepository();let received:IssueListQuery|undefined,calls=0;
  const server=createServer(async(request,response)=>{
    calls++;try{const query=JSON.parse(new URL(request.url!,'http://localhost').searchParams.get('query')!);received=query;const result=await source.list(query,new AbortController().signal);response.setHeader('Content-Type','application/json');response.end(JSON.stringify(result));}catch{response.statusCode=400;response.end(JSON.stringify({error:'Invalid issue query'}));}
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const endpoint='http://127.0.0.1:'+(server.address() as {port:number}).port+'/issues',repository=createIssueHttpRepository(endpoint),signal=new AbortController().signal;
  try{
    const view={...defaultIssueView(),filters:example()},result=await repository.list({view,page:1},signal);
    expect(received?.view.filters).toEqual(example());expect(result.rows).toEqual(apply(example()));expect(result.total).toBe(1);
    await expect(repository.list({view:{...view,filters:nested(group('root',[group('bad',[])]))},page:1},signal)).rejects.toThrow('Complete');
    expect(calls).toBe(1);
    const response=await fetch(endpoint+'?'+new URLSearchParams({query:JSON.stringify({view:{...view,filters:nested(group('root',[],'any'))},page:1})}));
    expect(response.status).toBe(400);
  }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

async function choose(page:Page,label:string,option:string){await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:option,exact:true}).click();}

test('nested Issue view links and named browser views survive reload with host URL state',async({page})=>{
  const url='/blocks/issue-table?'+new URLSearchParams({host:'keep',buiIssues:serializeIssueView({...defaultIssueView(),filters:example()})})+'#nested';
  await page.goto(url);await expect(page.getByText('1 results',{exact:true})).toBeVisible();await expect(page.getByRole('cell',{name:'ISS-106',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Save view',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Save this view',exact:true});await dialog.getByRole('textbox',{name:'View name'}).fill('Nested review');await dialog.getByRole('button',{name:'Save current view',exact:true}).click();
  await page.reload();await expect(page.getByRole('button',{name:'Nested review',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByText('1 results',{exact:true})).toBeVisible();
  expect(new URL(page.url()).searchParams.get('host')).toBe('keep');expect(new URL(page.url()).hash).toBe('#nested');
  await page.getByRole('button',{name:/^Filters/}).click();await expect(page.getByRole('combobox',{name:'Group 1 match',exact:true})).toContainText('Match any');
});

test('group drafts retain invalid values and focus; nested exclusion applies only after confirmation',async({page})=>{
  await page.goto('/blocks/issue-table');await expect(page.getByText('12 results',{exact:true})).toBeVisible();await page.getByRole('button',{name:/^Filters/}).click();
  await page.getByRole('button',{name:'Add group',exact:true}).click();await expect(page.getByRole('combobox',{name:'Filter 1 field',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByText('Enter a value.',{exact:true})).toBeVisible();await expect(page.getByRole('textbox',{name:'Filter 1 value',exact:true})).toBeFocused();await expect(page.getByText('12 results',{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Filter 1 value',exact:true}).fill('dialog');await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByText('1 results',{exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Exclude group 1',exact:true}).check();await expect(page.getByText('1 results',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByText('11 results',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Remove group 1',exact:true}).click();await expect(page.getByRole('button',{name:'Add filter',exact:true})).toBeFocused();
  await expect(page.getByRole('checkbox',{name:'Exclude matches',exact:true})).not.toBeChecked();
  await expect(page.getByRole('combobox',{name:'Match conditions',exact:true})).toContainText('Match all');
  await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByText('12 results',{exact:true})).toBeVisible();
});

test('removing the final condition from an excluded root resets to an editable match-all draft',async({page})=>{
  const filters=nested(group('root',[rule('title','title',['dialog'],'contains')],'all',true));
  await page.goto('/blocks/issue-table?'+new URLSearchParams({buiIssues:serializeIssueView({...defaultIssueView(),filters})}));
  await expect(page.getByText('11 results',{exact:true})).toBeVisible();await page.getByRole('button',{name:/^Filters/}).click();
  await expect(page.getByRole('checkbox',{name:'Exclude matches',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'Remove filter 1',exact:true}).click();
  await expect(page.getByRole('button',{name:'Add filter',exact:true})).toBeFocused();
  await expect(page.getByRole('checkbox',{name:'Exclude matches',exact:true})).not.toBeChecked();
  await expect(page.getByRole('combobox',{name:'Match conditions',exact:true})).toContainText('Match all');
  await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByText('12 results',{exact:true})).toBeVisible();
});

test('nested groups remain contained and keyboard accessible on a phone',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/blocks/issue-table');await page.getByRole('button',{name:/^Filters/}).click();await page.getByRole('button',{name:'Add group',exact:true}).click();
  await page.getByRole('button',{name:'Add group to group 1',exact:true}).click();await page.getByRole('button',{name:'Add group to group 2',exact:true}).click();
  await expect(page.getByRole('button',{name:'Add group to group 3',exact:true})).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(scan.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))).toEqual([]);
});
