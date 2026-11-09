import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createOutlineRepository,outlineSeed,OutlineConflictError} from '../packages/blocks/dist/outline-repository.js';
import {createOutlineHttpRepository} from '../packages/blocks/dist/outline-http.js';
import {handleOutlineDemo} from '../examples/outline-http/demo-api';
import {chooseOption,projectAction} from './helpers/controls';

function storage(){const data=new Map<string,string>();return {data,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};}
const signal=()=>new AbortController().signal;
const drawer=(page:Page)=>page.getByRole('dialog',{name:'Edit project',exact:true});
const table=(page:Page)=>page.getByRole('region',{name:'Outline projects',exact:true});
const activity=(page:Page)=>drawer(page).getByRole('region',{name:'Project activity',exact:true});

test('legacy projects migrate on write and reversible status changes keep a real activity trail',async()=>{
  const store=storage();store.setItem('legacy',JSON.stringify(outlineSeed));const repo=createOutlineRepository(store as Storage,'legacy');
  expect(await repo.history!.list('keyboard',signal())).toEqual([]);expect(Array.isArray(JSON.parse(store.getItem('legacy')!))).toBe(true);
  const result=await repo.history!.changeStatus(['keyboard','forms'],'Ready',signal());expect(result.changed).toBe(1);expect(result.undo?.count).toBe(1);
  expect((await repo.get!('keyboard',signal()))?.version).toBe(2);expect((await repo.get!('forms',signal()))?.version).toBe(1);
  await repo.history!.undoStatus(result.undo!.id,signal());await repo.history!.undoStatus(result.undo!.id,signal());
  expect(await repo.get!('keyboard',signal())).toMatchObject({status:'Planned',version:3});expect((await repo.history!.list('keyboard',signal())).map(item=>item.kind)).toEqual(['undo','status']);
  expect(JSON.parse(store.getItem('legacy')!).schemaVersion).toBe(2);
});

test('undo is all-or-nothing when any changed project has a newer version',async()=>{
  const repo=createOutlineRepository(storage() as Storage),receipt=await repo.history!.changeStatus(['keyboard','interface'],'Archived',signal());
  const latest=(await repo.get!('interface',signal()))!;await repo.save({...latest,notes:'A later edit.'},latest,signal());
  await expect(repo.history!.undoStatus(receipt.undo!.id,signal())).rejects.toBeInstanceOf(OutlineConflictError);
  expect(await repo.get!('keyboard',signal())).toMatchObject({status:'Archived',version:2});expect(await repo.get!('interface',signal())).toMatchObject({notes:'A later edit.',status:'Archived',version:3});
  expect((await repo.history!.list('keyboard',signal())).map(item=>item.kind)).toEqual(['status']);
});

test('comment retries are idempotent, plain text and independent of the project version',async()=>{
  const repo=createOutlineRepository(storage() as Storage),id=crypto.randomUUID(),text='<img src=x onerror=alert(1)> Keep the keyboard path.';
  const first=await repo.history!.addComment('keyboard',text,id,signal());expect(await repo.history!.addComment('keyboard',text,id,signal())).toEqual(first);
  await expect(repo.history!.addComment('keyboard','Different text',id,signal())).rejects.toThrow('already saved');
  expect(await repo.get!('keyboard',signal())).toMatchObject({version:1});expect(await repo.history!.list('keyboard',signal())).toHaveLength(1);
  await expect(repo.history!.addComment('keyboard',' ',crypto.randomUUID(),signal())).rejects.toThrow('1,000');
  await expect(repo.history!.addComment('missing','A comment',crypto.randomUUID(),signal())).rejects.toBeInstanceOf(OutlineConflictError);
});

test('cancelled and full-storage writes cannot commit a partial project or history update',async()=>{
  const store=storage();store.setItem('data',JSON.stringify(outlineSeed));const original=store.getItem('data');const repo=createOutlineRepository({...store,setItem:()=>{throw Error('Full');}} as Storage,'data');
  await expect(repo.history!.changeStatus(['keyboard'],'Ready',signal())).rejects.toThrow('not been saved');expect(store.getItem('data')).toBe(original);
  expect(await repo.history!.list('keyboard',signal())).toEqual([]);
  const controller=new AbortController();controller.abort();await expect(repo.history!.addComment('keyboard','Keep me',crypto.randomUUID(),controller.signal)).rejects.toThrow();expect(store.getItem('data')).toBe(original);
});

test('activity and status receipt retention are bounded without erasing recent work',async()=>{
  const repo=createOutlineRepository(storage() as Storage);for(let index=0;index<105;index++)await repo.history!.addComment('keyboard','Comment '+index,crypto.randomUUID(),signal());
  const entries=await repo.history!.list('keyboard',signal());expect(entries).toHaveLength(100);expect(entries[0].text).toBe('Comment 104');expect(entries.at(-1)?.text).toBe('Comment 5');
  const first=await repo.history!.changeStatus(['keyboard'],'Ready',signal());for(let index=0;index<50;index++)await repo.history!.changeStatus(['keyboard'],index%2?'Ready':'Planned',signal());
  await expect(repo.history!.undoStatus(first.undo!.id,signal())).rejects.toThrow('no longer available');
});

test('HTTP history is explicit and validates activity and receipts before exposing them',async()=>{
  expect(createOutlineHttpRepository({baseUrl:'/api'}).history).toBeUndefined();
  const repo=createOutlineHttpRepository({baseUrl:'/api',history:true,fetch:async()=>Response.json({entries:[{id:'a',projectId:'other',at:new Date().toISOString(),kind:'comment',text:'Wrong workspace'}]})});
  await expect(repo.history!.list('keyboard',signal())).rejects.toThrow('invalid project activity');
  const invalid=createOutlineHttpRepository({baseUrl:'/api',history:true,fetch:async()=>Response.json({changed:2,undo:null})});
  await expect(invalid.history!.changeStatus(['keyboard'],'Ready',signal())).rejects.toThrow('invalid status receipt');
});

test('the sample HTTP service persists comments, undo and session isolation',async()=>{
  const session=crypto.randomUUID(),other=crypto.randomUUID();
  const request=(path:string,body?:unknown,token=session)=>handleOutlineDemo(new Request('http://example.test/api/outline/projects'+path,{method:body?'POST':'GET',headers:{'X-Outline-Demo-Session':token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}));
  expect((await request('/keyboard/activity')).status).toBe(200);
  const change=await request('/status',{ids:['keyboard'],status:'Ready',reversible:true});expect(change.status).toBe(200);const receipt=await change.json();
  expect((await request('/status/undo',{id:receipt.undo.id},other)).status).toBe(409);
  const comment={text:'A service-side note.',clientId:crypto.randomUUID()};const first=await (await request('/keyboard/comments',comment)).json();expect(await (await request('/keyboard/comments',comment)).json()).toEqual(first);
  expect((await request('/status/undo',{id:receipt.undo.id})).status).toBe(204);expect((await request('/status/undo',{id:receipt.undo.id})).status).toBe(204);
  expect((await (await request('/keyboard/activity')).json()).entries.map((item:{kind:string})=>item.kind)).toEqual(['undo','comment','status']);expect((await (await request('/keyboard/activity',undefined,other)).json()).entries).toEqual([]);
});

test('comments survive drawer dismissal, render as text and persist after posting',async({page})=>{
  await page.goto('/templates/outline');await projectAction(page,'Keyboard review','Edit project');const feed=activity(page),input=feed.getByRole('textbox',{name:'Add a comment',exact:true});
  await expect(feed).toContainText('Activity starts with your next change.');await input.fill('<img src=x> Keep focus within reach.');await drawer(page).getByRole('button',{name:'Cancel',exact:true}).click();await expect(drawer(page)).not.toBeVisible();
  await projectAction(page,'Keyboard review','Edit project');await expect(input).toHaveValue('<img src=x> Keep focus within reach.');await feed.getByRole('button',{name:'Post comment',exact:true}).click();await expect(feed.getByText('Comment added.',{exact:true})).toBeVisible();await expect(input).toBeFocused();await expect(feed.locator('img')).toHaveCount(0);
  await drawer(page).getByRole('button',{name:'Cancel',exact:true}).click();await page.reload();await projectAction(page,'Keyboard review','Edit project');await expect(feed.getByText('<img src=x> Keep focus within reach.',{exact:true})).toBeVisible();await expect(input).toHaveValue('');
});

test('bulk undo preserves the current table view and selected records',async({page})=>{
  await page.goto('/templates/outline');const projects=table(page);await projects.getByRole('button',{name:'Next',exact:true}).click();
  await projects.getByRole('checkbox',{name:'Select Usage guide',exact:true}).check();await projects.getByRole('button',{name:'Archive',exact:true}).click();const undo=projects.getByRole('button',{name:'Undo status change',exact:true});await expect(undo).toBeVisible();
  await projects.getByRole('checkbox',{name:'Select Motion studies',exact:true}).check();await undo.click();await expect(projects).toContainText('1 project status restored.');await expect(projects.getByRole('checkbox',{name:'Select Motion studies',exact:true})).toBeChecked();await expect(projects.getByRole('navigation',{name:'Pagination'})).toContainText('Page 2 of 2');await expect(page.getByLabel('Project table updates',{exact:true})).toBeFocused();
  await projectAction(page,'Usage guide','Edit project');await expect(activity(page)).toContainText('Status changed from Planned to Archived.');await expect(activity(page)).toContainText('Status restored to Planned.');
});

test('undo refuses a later edit and refresh exposes the current record',async({page})=>{
  await page.goto('/templates/outline');const projects=table(page);await projects.getByRole('checkbox',{name:'Select Keyboard review',exact:true}).check();await projects.getByRole('button',{name:'Mark ready',exact:true}).click();await expect(projects.getByRole('button',{name:'Undo status change',exact:true})).toBeVisible();
  await projectAction(page,'Keyboard review','Edit project');await drawer(page).getByRole('textbox',{name:'Notes to self',exact:true}).fill('Changed after status update.');await drawer(page).getByRole('button',{name:'Save project',exact:true}).click();await expect(drawer(page)).not.toBeVisible();
  await projects.getByRole('button',{name:'Undo status change',exact:true}).click();await expect(projects.getByRole('alert')).toContainText('Nothing was restored.');await expect(projects.getByRole('button',{name:'Undo status change',exact:true})).toHaveCount(0);
  await projects.getByRole('button',{name:'Refresh projects',exact:true}).click();await projectAction(page,'Keyboard review','Edit project');await expect(drawer(page).getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('Changed after status update.');await expect(drawer(page).getByRole('combobox',{name:'Status',exact:true})).toContainText('Ready');
});

test('undo brings a project back into the existing filtered view',async({page})=>{
  await page.goto('/templates/outline');const projects=table(page),filter=projects.getByRole('combobox',{name:'Statuses',exact:true});await chooseOption(page,filter,'Ready');await projects.getByRole('checkbox',{name:'Select Form patterns',exact:true}).check();await projects.getByRole('button',{name:'Archive',exact:true}).click();await expect(projects.getByRole('checkbox',{name:'Select Form patterns',exact:true})).toHaveCount(0);
  await projects.getByRole('button',{name:'Undo status change',exact:true}).click();await expect(filter).toContainText('Ready');await expect(projects.getByRole('checkbox',{name:'Select Form patterns',exact:true})).toBeVisible();
});

test('failed HTTP undo retains the receipt for an explicit retry',async({page})=>{
  await page.goto('/examples/outline-http');const projects=table(page);await projects.getByRole('checkbox',{name:'Select Keyboard review',exact:true}).check();await projects.getByRole('button',{name:'Archive',exact:true}).click();await expect(projects.getByRole('button',{name:'Undo status change',exact:true})).toBeVisible();await page.getByRole('button',{name:'Fail next save',exact:true}).click();await projects.getByRole('button',{name:'Undo status change',exact:true}).click();await expect(projects.getByRole('alert')).toContainText('sample service rejected');await expect(projects.getByRole('button',{name:'Undo status change',exact:true})).toBeEnabled();await expect(projects.getByRole('button',{name:'Undo status change',exact:true})).toBeFocused();await projects.getByRole('button',{name:'Undo status change',exact:true}).click();await expect(projects).toContainText('1 project status restored.');
});

test('failed HTTP comments retain their text and pending writes block dismissal',async({page})=>{
  await page.goto('/examples/outline-http');await page.getByRole('button',{name:'Fail next save',exact:true}).click();await projectAction(page,'Keyboard review','Edit project');const feed=activity(page),input=feed.getByRole('textbox',{name:'Add a comment',exact:true});await input.fill('Keep this failed draft.');await feed.getByRole('button',{name:'Post comment',exact:true}).click();await expect(feed).toContainText('sample service rejected');await expect(input).toHaveValue('Keep this failed draft.');
  await page.route('**/projects/keyboard/comments',async route=>{await new Promise(resolve=>setTimeout(resolve,650));await route.continue();});await feed.getByRole('button',{name:'Post comment',exact:true}).click();await expect(drawer(page).getByRole('button',{name:'Cancel',exact:true})).toBeDisabled();await page.keyboard.press('Escape');await expect(drawer(page)).toBeVisible();await expect(feed.getByText('Comment added.',{exact:true})).toBeVisible();await expect(feed.locator('ol>li')).toHaveCount(1);
});

for(const theme of ['light','dark'] as const)test(`activity and undo fit narrow screens and retain accessible controls in ${theme}`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:theme,reducedMotion:'no-preference'});await page.goto('/templates/outline');await projectAction(page,'Keyboard review','Edit project');const feed=activity(page);await feed.getByRole('textbox',{name:'Add a comment',exact:true}).fill('A long reference '+ 'word'.repeat(100));await feed.getByRole('button',{name:'Post comment',exact:true}).click();await expect(feed.getByText('Comment added.',{exact:true})).toBeVisible();
  expect(await drawer(page).evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);const result=await new AxeBuilder({page}).include('.bblocks-project-drawer').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);
  await page.emulateMedia({reducedMotion:'reduce'});expect(await feed.locator('ol>li').first().evaluate(element=>getComputedStyle(element).animationName)).toBe('none');await page.keyboard.press('Escape');await expect(drawer(page)).not.toBeVisible();
});
