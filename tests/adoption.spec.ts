import {chooseOption,chooseReviewDate,projectAction} from './helpers/controls';
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createOutlineRepository,OutlineValidationError,outlineSeed} from '../packages/blocks/dist/outline-repository.js';

test('the form workflow is usable in both the catalogue and its detail page',async({page})=>{
  for(const route of ['/components','/components/form']){await page.goto(route);await page.getByRole('button',{name:'Save workspace',exact:true}).click();await expect(page.getByText('Use at least three characters.',{exact:true})).toBeVisible();await page.getByRole('textbox',{name:'Workspace name',exact:true}).fill('Useful work');await page.getByRole('button',{name:'Save workspace',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Saved for this preview.'})).toBeVisible();}
});

test('playground reflects props in the live control and copied usage',async({page})=>{
  await page.goto('/playground');const controls=page.getByRole('region',{name:'Playground controls'});const preview=page.getByRole('region',{name:'Component preview'});
  await chooseOption(page,controls.getByRole('combobox',{name:'Variant',exact:true}),'accent');await chooseOption(page,controls.getByRole('combobox',{name:'Size',exact:true}),'lg');await controls.getByLabel('Button text',{exact:true}).fill('Review work');await controls.getByRole('switch',{name:'Trailing icon'}).check();
  await expect(preview.getByRole('button',{name:'Review work'})).toHaveClass(/bui-button--accent/);await preview.getByRole('button',{name:'Review work'}).click();await expect(preview.getByRole('status')).toHaveText('Button activated.');
  await expect(page.locator('.playground-code code').first()).toContainText('variant="accent" size="lg" trailingIcon={ArrowUpRight}');
  await chooseOption(page,controls.getByRole('combobox',{name:'State',exact:true}),'Loading');await expect(preview.getByRole('button')).toBeDisabled();await expect(preview.getByRole('button')).toHaveAttribute('aria-busy','true');
  await chooseOption(page,controls.getByRole('combobox',{name:'Component',exact:true}),'Input');await chooseOption(page,controls.getByRole('combobox',{name:'State',exact:true}),'Error');await expect(preview.getByRole('textbox')).toHaveAttribute('aria-invalid','true');
  await controls.getByRole('button',{name:'Reset'}).click();await expect(preview.getByRole('button',{name:'Save changes'})).toBeEnabled();
});

test('Outline validates, saves, reloads and protects an unsaved edit',async({page})=>{
  await page.goto('/templates/outline');await page.getByRole('button',{name:'Plan project',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Plan a project'});
  await dialog.getByRole('button',{name:'Add project',exact:true}).click();await expect(dialog.getByRole('textbox',{name:'Project name',exact:true})).toBeFocused();await expect(dialog.getByText('Use at least three characters.')).toBeVisible();
  await dialog.getByRole('textbox',{name:'Project name',exact:true}).fill('Keyboard review');await chooseReviewDate(page,dialog,'2026-12-01');await dialog.getByRole('button',{name:'Add project',exact:true}).click();await expect(dialog.getByText('A project with this name already exists.')).toBeVisible();
  await dialog.getByRole('textbox',{name:'Project name',exact:true}).fill('Registry adoption');await dialog.getByLabel('Notes to self',{exact:true}).fill('Check the installed source.');await dialog.getByRole('button',{name:'Add project',exact:true}).click();await expect(dialog).not.toBeVisible();
  await page.reload();await projectAction(page,'Registry adoption','Edit project');const editor=page.getByRole('dialog',{name:'Edit project'});await expect(editor.getByLabel('Notes to self',{exact:true})).toHaveValue('Check the installed source.');
  await editor.getByRole('textbox',{name:'Project name',exact:true}).fill('Unsaved name');await page.keyboard.press('Escape');await expect(editor.getByText('Discard this draft?')).toBeVisible();await editor.getByRole('button',{name:'Keep editing'}).click();await expect(editor.getByRole('textbox',{name:'Project name',exact:true})).toHaveValue('Unsaved name');
  await editor.getByRole('button',{name:'Cancel',exact:true}).click();await editor.getByRole('button',{name:'Discard changes'}).click();await expect(editor).not.toBeVisible();await expect(page.getByRole('button',{name:'Actions for Registry adoption',exact:true})).toBeFocused();
});

test('Outline keeps selected keys across service pages, resizes and applies bulk changes',async({page})=>{
  await page.goto('/templates/outline');const table=page.getByRole('region',{name:'Outline projects',exact:true});
  await table.getByRole('checkbox',{name:'Select Keyboard review',exact:true}).check();await table.getByRole('button',{name:'Next',exact:true}).click();await table.getByRole('checkbox',{name:'Select Usage guide',exact:true}).check();await expect(table.getByRole('status').filter({hasText:'2 selected'})).toBeVisible();await table.getByRole('button',{name:'Mark ready',exact:true}).click();
  await table.getByRole('button',{name:'Previous',exact:true}).click();await expect(table.getByRole('row').filter({hasText:'Keyboard review'})).toContainText('Ready');
  const resize=table.getByRole('separator',{name:'Resize Project',exact:true});const initialWidth=Number(await resize.getAttribute('aria-valuenow'));await resize.focus();await page.keyboard.press('ArrowRight');await expect(resize).toHaveAttribute('aria-valuenow',String(initialWidth+10));
  await table.getByRole('searchbox',{name:'Search outline projects'}).fill('Motion');await expect(table.getByRole('row')).toHaveCount(2);await expect(table.getByRole('button',{name:'Edit project name for Motion studies',exact:true})).toBeVisible();await expect(table.getByRole('navigation',{name:'Pagination'})).toContainText('Page 1 of 1');
});

test('failed storage keeps the draft and retry saves exactly once',async({page})=>{
  await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='bld8-outline-projects-v1' && !(window as any).allowSave)throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};});
  await page.goto('/templates/outline');await page.getByRole('button',{name:'Plan project',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Plan a project'});await dialog.getByRole('textbox',{name:'Project name',exact:true}).fill('Retry me');await chooseReviewDate(page,dialog,'2026-12-02');await dialog.getByRole('button',{name:'Add project'}).click();await expect(dialog.getByRole('alert')).toContainText('have not been saved');await expect(dialog.getByRole('textbox',{name:'Project name',exact:true})).toHaveValue('Retry me');
  await page.evaluate(()=>{(window as any).allowSave=true;});await dialog.getByRole('button',{name:'Add project'}).click();await expect(dialog).not.toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('bld8-outline-projects-v1')!).filter((row:any)=>row.name==='Retry me').length)).toBe(1);
});

test('repository rejects stale edits, validates duplicates and does not lose unrelated rows',async()=>{
  const values=new Map<string,string>();const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)} as Storage;
  const repository=createOutlineRepository(storage);const signal=new AbortController().signal;const previous=outlineSeed[0];await repository.save({...previous,name:'New title'},previous,signal);
  await expect(repository.save({...previous,name:'Stale title'},previous,signal)).rejects.toThrow('changed in another tab');await expect(repository.save({...previous,name:'New title'},null,signal)).rejects.toBeInstanceOf(OutlineValidationError);
  const result=await repository.list({search:'',filters:{},sort:null,page:1,pageSize:20},signal);expect(result.total).toBe(outlineSeed.length);expect(result.rows[0].name).toBe('New title');
});

test('Outline persists preferences and resource metadata, and confirms project deletion',async({page})=>{
  await page.goto('/templates/outline');const nav=page.getByRole('navigation',{name:'Outline views'});
  await nav.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('textbox',{name:'Display name',exact:true}).fill('Local workspace');await page.getByRole('button',{name:'Save profile'}).click();await expect(page.getByRole('status').filter({hasText:'Changes saved.'})).toBeVisible();
  await nav.getByRole('button',{name:'Resources',exact:true}).click();await page.getByRole('button',{name:'Add resources',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Add resources'});await dialog.locator('input[type=file]').setInputFiles({name:'release-note.txt',mimeType:'text/plain',buffer:Buffer.from('A useful note.')});await dialog.getByRole('button',{name:'Add to library'}).click();await expect(dialog).not.toBeVisible();
  await page.reload();await nav.getByRole('button',{name:'Settings',exact:true}).click();await expect(page.getByRole('textbox',{name:'Display name',exact:true})).toHaveValue('Local workspace');await nav.getByRole('button',{name:'Resources',exact:true}).click();await page.getByRole('searchbox',{name:'Search resources'}).fill('release-note');await expect(page.getByRole('cell',{name:'release-note.txt',exact:true})).toBeVisible();
  await nav.getByRole('button',{name:'Planning',exact:true}).click();await projectAction(page,'Keyboard review','Delete project');const deletion=page.getByRole('dialog',{name:'Delete project?'});await deletion.getByRole('button',{name:'Keep project'}).click();await expect(page.getByRole('button',{name:'Edit project name for Keyboard review',exact:true})).toBeVisible();await projectAction(page,'Keyboard review','Delete project');await deletion.getByRole('button',{name:'Delete project',exact:true}).click();await expect(deletion).not.toBeVisible();await expect(page.getByRole('button',{name:'Edit project name for Keyboard review',exact:true})).not.toBeVisible();
});

test('registry items have resolvable dependencies, source targets and licence files',async({request})=>{
  const registry=await(await request.get('/r/registry.json')).json();expect(registry.$schema).toContain('registry.json');const names=new Set(registry.items.map((item:any)=>item.name));
  for(const item of registry.items){expect((await request.get('/r/'+item.name+'.json')).ok()).toBe(true);for(const dependency of item.registryDependencies??[])expect(names.has(dependency.split('/').pop().replace('.json',''))).toBe(true);for(const file of item.files)expect(file.target.startsWith('@ui/bld8/')).toBe(true);}
  expect(registry.items.find((item:any)=>item.name==='bld8-styles').files.some((file:any)=>file.target.endsWith('SHADCN_LICENSE'))).toBe(true);
});

for(const theme of ['light','dark'])test(`new adoption surfaces have no automated accessibility violations in ${theme}`,async({page})=>{
  for(const route of ['/playground','/registry','/components/form','/templates/outline']){await page.goto(route);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();await expect(page.locator('h1')).toBeVisible();const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(scan.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)})),route).toEqual([]);}
});

test('playground and Outline remain contained on a narrow viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});for(const route of ['/playground','/registry','/templates/outline']){await page.goto(route);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);}
});
