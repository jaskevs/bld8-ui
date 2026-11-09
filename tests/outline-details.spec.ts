import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createOutlineDraftStore,parseOutlineDraft,projectValues,rebaseOutlineDraft} from '../packages/blocks/dist/outline-drafts.js';
import {outlineSeed} from '../packages/blocks/dist/outline-repository.js';
import {createOutlineHttpRepository} from '../packages/blocks/dist/outline-http.js';
import {projectAction} from './helpers/controls';

const editor=(page:Page)=>page.getByRole('dialog',{name:'Edit project',exact:true});
const draftKeys=(page:Page)=>page.evaluate(()=>Object.keys(sessionStorage).filter(key=>key.startsWith('bld8-outline-draft-v1:')));
function memoryStorage(){const map=new Map<string,string>();return{getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>map.set(key,value),removeItem:(key:string)=>map.delete(key)} as Storage;}

test('drafts round-trip only within their record and owner namespace',()=>{
  const storage=memoryStorage(),project=outlineSeed[0],values={...projectValues(project),name:'A useful draft'};
  const first=createOutlineDraftStore(storage,'owner-a:workspace-a');first.put(project,values);
  expect(createOutlineDraftStore(storage,'owner-a:workspace-a').get(project.id)?.values).toEqual(values);
  expect(createOutlineDraftStore(storage,'owner-b:workspace-a').get(project.id)).toBeNull();
  expect(first.get('another-record')).toBeNull();expect(first.get(null)).toBeNull();
  expect(parseOutlineDraft('{"schemaVersion":2}',project.id)).toBeNull();
  expect(parseOutlineDraft(JSON.stringify({...first.get(project.id),previous:{...project,version:-1}}),project.id)).toBeNull();
  expect(first.clear(project.id)).toBe(true);expect(createOutlineDraftStore(storage,'owner-a:workspace-a').get(project.id)).toBeNull();
});

test('rebasing retains unrelated remote edits and leaves the saved record unchanged',()=>{
  const baseline=projectValues(outlineSeed[0]),local={...baseline,notes:'Keep this decision.'},latest={...baseline,status:'Ready' as const,name:'Reviewed elsewhere'};
  expect(rebaseOutlineDraft(baseline,local,latest)).toEqual({...latest,notes:local.notes});
  expect(latest.notes).toBe('');expect(rebaseOutlineDraft(baseline,{...local,name:'My title'},latest).name).toBe('My title');
});

test('failed draft storage retains memory without claiming reload recovery',()=>{
  const storage={getItem:()=>null,setItem:()=>{throw Error('Full');},removeItem:()=>{throw Error('Blocked');}} as unknown as Storage;
  const drafts=createOutlineDraftStore(storage,'owner');drafts.put(outlineSeed[0],{...outlineSeed[0],notes:'Still here'});
  expect(drafts.recoverable).toBe(false);expect(drafts.problem).toContain('memory only');expect(drafts.get('keyboard')?.values.notes).toBe('Still here');
  expect(drafts.clear('keyboard')).toBe(false);expect(drafts.get('keyboard')).not.toBeNull();
  const ephemeral=createOutlineDraftStore(storage);ephemeral.put(null,{...projectValues(outlineSeed[0]),name:''});expect(ephemeral.get(null)?.values.name).toBe('');expect(ephemeral.recoverable).toBe(false);
});

test('single-project HTTP reads reject malformed data and distinguish missing records',async()=>{
  const malformed=createOutlineHttpRepository({baseUrl:'/api',fetch:async()=>Response.json({...outlineSeed[0],status:['Planned']})});
  await expect(malformed.get!('keyboard',new AbortController().signal)).rejects.toThrow('invalid project');
  const missing=createOutlineHttpRepository({baseUrl:'/api',fetch:async()=>Response.json({error:'Not found'},{status:404})});
  await expect(missing.get!('keyboard',new AbortController().signal)).resolves.toBeNull();
  let requested=false;const cancelled=createOutlineHttpRepository({baseUrl:'/api',fetch:async()=>{requested=true;return Response.json(outlineSeed[0]);}}),controller=new AbortController();controller.abort();
  await expect(cancelled.get!('keyboard',controller.signal)).rejects.toThrow();expect(requested).toBe(false);
});

test('saving details retains the table page, selection and return focus',async({page})=>{
  await page.goto('/templates/outline');const table=page.getByRole('region',{name:'Outline projects',exact:true});
  await table.getByRole('button',{name:'Next',exact:true}).click();await table.getByRole('checkbox',{name:'Select Usage guide',exact:true}).check();
  await projectAction(page,'Usage guide','Edit project');const drawer=editor(page);await expect(drawer).toHaveAttribute('data-side','right');await expect(drawer.getByRole('heading',{name:'Usage guide',exact:true})).toBeFocused();
  await drawer.getByRole('textbox',{name:'Notes to self',exact:true}).fill('Keep the current reading position.');await drawer.getByRole('button',{name:'Save project',exact:true}).click();await expect(drawer).not.toBeVisible();
  await expect(table.getByRole('navigation',{name:'Pagination'})).toContainText('Page 2 of 2');await expect(table.getByRole('checkbox',{name:'Select Usage guide',exact:true})).toBeChecked();
  await expect(table.getByRole('button',{name:'Actions for Usage guide',exact:true})).toBeFocused();expect(await draftKeys(page)).toHaveLength(0);
});

test('closing and reopening restores a draft without changing the project',async({page})=>{
  await page.goto('/templates/outline');await projectAction(page,'Keyboard review','Edit project');const drawer=editor(page);
  await drawer.getByRole('textbox',{name:'Project name',exact:true}).fill('Keep for later');await page.keyboard.press('Escape');await expect(drawer.getByRole('button',{name:'Keep editing',exact:true})).toBeFocused();
  await drawer.getByRole('button',{name:'Keep draft & close',exact:true}).click();await expect(drawer).not.toBeVisible();await expect(page.getByRole('button',{name:'Edit project name for Keyboard review',exact:true})).toBeVisible();
  await projectAction(page,'Keyboard review','Edit project');await expect(drawer.getByText('Recovered draft',{exact:true})).toBeVisible();await expect(drawer.getByRole('textbox',{name:'Project name',exact:true})).toHaveValue('Keep for later');
  await drawer.getByRole('button',{name:'Discard recovered draft',exact:true}).click();await expect(drawer.getByRole('textbox',{name:'Project name',exact:true})).toHaveValue('Keyboard review');
  await drawer.getByRole('button',{name:'Cancel',exact:true}).click();await expect(drawer).not.toBeVisible();expect(await draftKeys(page)).toHaveLength(0);
});

test('drafts recover after a reload and new-project drafts can be reset',async({page})=>{
  page.on('dialog',dialog=>dialog.accept());await page.goto('/templates/outline');await projectAction(page,'Keyboard review','Edit project');
  await editor(page).getByRole('textbox',{name:'Notes to self',exact:true}).fill('Recover after reload.');await expect.poll(()=>draftKeys(page)).toHaveLength(1);
  await page.reload();await projectAction(page,'Keyboard review','Edit project');await expect(editor(page).getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('Recover after reload.');
  await editor(page).getByRole('button',{name:'Cancel',exact:true}).click();await editor(page).getByRole('button',{name:'Discard changes',exact:true}).click();
  await expect(editor(page)).not.toBeVisible();await page.getByRole('button',{name:'Plan project',exact:true}).click();const create=page.getByRole('dialog',{name:'Plan a project',exact:true});
  await create.getByRole('textbox',{name:'Project name',exact:true}).fill('A new draft');await create.getByRole('button',{name:'Cancel',exact:true}).click();await create.getByRole('button',{name:'Keep draft & close',exact:true}).click();await expect(create).not.toBeVisible();
  await page.reload();await page.getByRole('button',{name:'Plan project',exact:true}).click();await expect(create.getByRole('textbox',{name:'Project name',exact:true})).toHaveValue('A new draft');
  await create.getByRole('button',{name:'Discard draft and start again',exact:true}).click();await expect(create.getByRole('textbox',{name:'Project name',exact:true})).toHaveValue('');
});

test('reverting a field removes the obsolete draft instead of resurrecting it later',async({page})=>{
  await page.goto('/templates/outline');await projectAction(page,'Keyboard review','Edit project');const drawer=editor(page),name=drawer.getByRole('textbox',{name:'Project name',exact:true});
  await expect(drawer.getByRole('button',{name:'Save project',exact:true})).toBeDisabled();await name.fill('An obsolete draft');await expect.poll(()=>draftKeys(page)).toHaveLength(1);
  await name.fill('Keyboard review');await expect.poll(()=>draftKeys(page)).toHaveLength(0);await expect(drawer.getByRole('button',{name:'Save project',exact:true})).toBeDisabled();
  await drawer.getByRole('button',{name:'Cancel',exact:true}).click();await expect(drawer).not.toBeVisible();await projectAction(page,'Keyboard review','Edit project');await expect(name).toHaveValue('Keyboard review');await expect(drawer.getByText('Recovered draft',{exact:true})).toHaveCount(0);
});

test('pending saves keep the drawer and its draft intact until the request finishes',async({page})=>{
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});let saving=false;
  await page.route('**/api/examples/outline/projects/keyboard',async route=>{if(route.request().method()==='PATCH'){saving=true;await gate;}await route.continue();});
  try{await page.goto('/examples/outline-http');await projectAction(page,'Keyboard review','Edit project');const drawer=editor(page);await drawer.getByRole('textbox',{name:'Notes to self',exact:true}).fill('Wait for this save.');await drawer.getByRole('button',{name:'Save project',exact:true}).click();await expect.poll(()=>saving).toBe(true);
    await expect(drawer.getByRole('button',{name:'Cancel',exact:true})).toBeDisabled();await expect(drawer.getByRole('button',{name:'Close drawer',exact:true})).toBeDisabled();await page.keyboard.press('Escape');await expect(drawer).toBeVisible();expect(await draftKeys(page)).toHaveLength(1);
    release();await expect(drawer).not.toBeVisible();expect(await draftKeys(page)).toHaveLength(0);
  }finally{release();}
});

test('HTTP failure keeps the draft and retry writes exactly once successfully',async({page})=>{
  await page.goto('/examples/outline-http');await page.getByRole('button',{name:'Fail next save',exact:true}).click();await projectAction(page,'Keyboard review','Edit project');const drawer=editor(page);
  await drawer.getByRole('textbox',{name:'Notes to self',exact:true}).fill('A retryable edit.');await drawer.getByRole('button',{name:'Save project',exact:true}).click();await expect(drawer.getByRole('alert').filter({hasText:'sample service rejected'})).toBeVisible();
  await expect(drawer.getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('A retryable edit.');await drawer.getByRole('button',{name:'Save project',exact:true}).click();await expect(drawer).not.toBeVisible();
  const token=await page.evaluate(()=>sessionStorage.getItem('bld8-outline-http-session')!);const response=await page.request.get('/api/examples/outline/projects/keyboard',{headers:{'X-Outline-Demo-Session':token}});expect(response.ok()).toBe(true);expect(await response.json()).toMatchObject({notes:'A retryable edit.',version:2});expect(await draftKeys(page)).toHaveLength(0);
});

test('a conflicting HTTP draft requires review and rebases only edited fields',async({page})=>{
  await page.goto('/examples/outline-http');await projectAction(page,'Keyboard review','Edit project');const drawer=editor(page);
  await drawer.getByRole('textbox',{name:'Notes to self',exact:true}).fill('Local context.');const token=await page.evaluate(()=>sessionStorage.getItem('bld8-outline-http-session')!);const headers={'X-Outline-Demo-Session':token};
  const remote=await page.request.patch('/api/examples/outline/projects/keyboard',{headers,data:{values:{...projectValues(outlineSeed[0]),status:'Ready'},version:1}});expect(remote.ok()).toBe(true);
  await drawer.getByRole('button',{name:'Save project',exact:true}).click();await expect(drawer.getByText('This project has changed',{exact:true})).toBeVisible();await expect(drawer.getByRole('button',{name:'Save project',exact:true})).toBeDisabled();
  await drawer.getByRole('button',{name:'Load latest project',exact:true}).click();await expect(drawer.getByRole('button',{name:'Keep my edits on latest',exact:true})).toBeVisible();
  await drawer.getByRole('button',{name:'Keep my edits on latest',exact:true}).click();await expect(drawer.getByRole('combobox',{name:'Status',exact:true})).toHaveText('Ready');await expect(drawer.getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('Local context.');
  await drawer.getByRole('button',{name:'Save project',exact:true}).click();await expect(drawer).not.toBeVisible();const saved=await page.request.get('/api/examples/outline/projects/keyboard',{headers});expect(await saved.json()).toMatchObject({notes:'Local context.',status:'Ready',version:3});
});

test('recovered stale drafts and deleted records stay recoverable without blind saves',async({page})=>{
  page.on('dialog',dialog=>dialog.accept());await page.goto('/templates/outline');await projectAction(page,'Keyboard review','Edit project');await editor(page).getByRole('textbox',{name:'Notes to self',exact:true}).fill('Keep this older draft.');await expect.poll(()=>draftKeys(page)).toHaveLength(1);
  await page.evaluate(()=>{const raw=localStorage.getItem('bld8-outline-projects-v1');const rows=raw?JSON.parse(raw):null;if(rows)throw Error('Expected an untouched seed');});
  await page.evaluate(rows=>localStorage.setItem('bld8-outline-projects-v1',JSON.stringify(rows)),outlineSeed.map(row=>row.id==='keyboard'?{...row,version:2,status:'Ready'}:row));
  await page.reload();await projectAction(page,'Keyboard review','Edit project');const drawer=editor(page);await expect(drawer.getByRole('button',{name:'Save project',exact:true})).toBeDisabled();await expect(drawer.getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('Keep this older draft.');
  await drawer.getByRole('button',{name:'Use saved project',exact:true}).click();await expect(drawer.getByRole('combobox',{name:'Status',exact:true})).toHaveText('Ready');await expect(drawer.getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('');
  await page.evaluate(rows=>localStorage.setItem('bld8-outline-projects-v1',JSON.stringify(rows.filter(row=>row.id!=='keyboard'))),outlineSeed);
  await drawer.getByRole('button',{name:'Load latest project',exact:true}).click();await expect(drawer.getByText('Project no longer available',{exact:true})).toBeVisible();await expect(drawer.getByRole('button',{name:'Save project',exact:true})).toBeDisabled();
});

test('a different HTTP session cannot recover the previous session draft',async({page})=>{
  page.on('dialog',dialog=>dialog.accept());await page.goto('/examples/outline-http');await projectAction(page,'Keyboard review','Edit project');await editor(page).getByRole('textbox',{name:'Notes to self',exact:true}).fill('Private to this demo session.');await expect.poll(()=>draftKeys(page)).toHaveLength(1);
  await page.evaluate(()=>sessionStorage.setItem('bld8-outline-http-session',crypto.randomUUID()));await page.reload();await projectAction(page,'Keyboard review','Edit project');await expect(editor(page).getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('');await expect(editor(page).getByText('Recovered draft',{exact:true})).toHaveCount(0);
});

test('blocked tab storage keeps editing usable and explains the recovery limit',async({page})=>{
  await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('bld8-outline-draft-v1:'))throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};});
  await page.goto('/templates/outline');await projectAction(page,'Keyboard review','Edit project');const drawer=editor(page);await drawer.getByRole('textbox',{name:'Notes to self',exact:true}).fill('Memory fallback.');await expect(drawer.getByText('Changes are kept in memory only. Reloading may restore an older draft.',{exact:true})).toBeVisible();
  await drawer.getByRole('button',{name:'Cancel',exact:true}).click();await drawer.getByRole('button',{name:'Keep draft & close',exact:true}).click();await expect(drawer).not.toBeVisible();await projectAction(page,'Keyboard review','Edit project');await expect(drawer.getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('Memory fallback.');
});

for(const mode of ['light','dark'] as const)test(`detail drawer remains accessible and contained in ${mode}`,async({page})=>{
  await page.emulateMedia({colorScheme:mode});await page.goto('/templates/outline');await projectAction(page,'Keyboard review','Edit project');const drawer=editor(page);
  for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:740});const save=drawer.getByRole('button',{name:'Save project',exact:true});await expect(save).toBeInViewport();const bounds=(await drawer.boundingBox())!;expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+.5);const field=(await drawer.getByRole('textbox',{name:'Project name',exact:true}).boundingBox())!,action=(await save.boundingBox())!;expect(field.x+field.width).toBeCloseTo(action.x+action.width,0);}
  const result=await new AxeBuilder({page}).include('.bblocks-project-drawer').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);
});

test('drawer exit eases before unmount and live reduced motion removes it',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/templates/outline');await projectAction(page,'Keyboard review','Edit project');const drawer=editor(page);
  await expect(drawer).not.toHaveAttribute('data-starting-style');expect(await drawer.evaluate(element=>getComputedStyle(element).transitionDuration)).toContain('0.32s');
  await drawer.getByRole('button',{name:'Cancel',exact:true}).click();await expect(drawer).toHaveAttribute('data-ending-style');await expect(drawer).not.toBeVisible();await expect(page.getByRole('button',{name:'Actions for Keyboard review',exact:true})).toBeFocused();
  await projectAction(page,'Keyboard review','Edit project');await page.emulateMedia({reducedMotion:'reduce'});expect(await drawer.evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
});
