import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readComponentExamples} from '../scripts/prepare-component-examples.mjs';
import {readExportLiteral} from '../scripts/prepare-agent-docs.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=(path:string)=>readFileSync(join(root,path),'utf8');
test('complete examples cover real component families without changing counting units',()=>{
  const examples=readComponentExamples(root),components=readExportLiteral(read('apps/docs/src/lib/catalog.ts'),'components') as {id:string}[];
  expect(new Set(examples.map(item=>item.id)).size).toBe(examples.length);
  expect([...new Set(examples.map(item=>item.componentId))].sort()).toEqual(components.map(item=>item.id).sort());
  for(const item of examples){expect(item.source).toContain("'use client'");expect(item.source).toContain('@bld8/ui/styles.css');expect(item.registrySource).not.toContain('@bld8/ui');expect(item.registrySource).toContain('@/components/ui/bld8/');expect(item.keyboard.length).toBeGreaterThan(0);expect(item.states.length).toBeGreaterThan(0);}
});
test('human and agent examples expose the same typechecked source modules',()=>{
  const examples=readComponentExamples(root),catalog=JSON.parse(read('apps/docs/public/agent/catalog.json'));
  for(const item of examples){const entry=catalog.entries.find((entry:{id:string;kind:string})=>entry.id===item.componentId&&entry.kind==='component'),example=entry.examples.find((example:{id:string})=>example.id===item.id);expect(example).toMatchObject({code:item.source,registryCode:item.registrySource,complete:true,keyboard:item.keyboard,states:item.states});expect(read('apps/docs/src/lib/generated/component-examples-src/'+item.id+'.tsx')).toBe(item.source);}
});
test('editable registry CSS contains the control fragments without unresolved fragment imports',()=>{
  const styles=JSON.parse(read('apps/docs/public/r/bld8-styles.json')),css=styles.files.find((file:{path:string})=>file.path.endsWith('/styles.css')).content as string;
  for(const selector of ['.bui-autocomplete','.bui-toolbar','.bui-alert-dialog','.bui-navigation-menu','.bui-preview-popup'])expect(css).toContain(selector);expect(css).toContain('.bui-range-slider');expect(css).toContain('.bui-tag-input');expect(css).not.toMatch(/@import.*(?:choice-controls|field-controls|menu-controls|data-grid-controls|autocomplete-controls|toolbar-alert-controls|navigation-preview-controls)/);
  for(const id of ['toggle-group','tag-input','range-slider','otp-input'])expect(JSON.parse(read('apps/docs/public/r/'+id+'.json')).registryDependencies).toContain('https://ui.bld8.dev/r/bld8-'+id+'.json');
});
test('named examples run inside their documented surface',async({page})=>{
  await page.goto('/components/button');const example=page.locator('[data-example-id="button-feedback"]');await expect(example).toBeVisible();await example.getByRole('button',{name:/save|submit/i}).first().click();await expect(example.getByRole('status')).toBeVisible();await example.locator('summary').click();await expect(example.getByRole('tab',{name:'Registry source',exact:true})).toBeVisible();
});

test('on-demand examples keep their action focused and mount editable handlers before use',async({page})=>{
  await page.goto('/components/textarea');const example=page.locator('[data-example-id="basic-textarea"]'),action=example.getByRole('button',{name:'Run example',exact:true});
  await action.click();const hide=example.getByRole('button',{name:'Hide example',exact:true});await expect(hide).toBeFocused();await expect(hide).toHaveAttribute('aria-expanded','true');
  const field=example.getByRole('textbox');await field.fill('Preview text stays attached to its handler.');await expect(field).toHaveValue('Preview text stays attached to its handler.');
  await hide.click();await expect(action).toBeFocused();await expect(action).toHaveAttribute('aria-expanded','false');await expect(field).not.toBeVisible();
});

test('fresh dynamic examples preserve fast edits after their native fields become available',async({browser,baseURL})=>{
  test.setTimeout(60000);
  for(let attempt=0;attempt<10;attempt++){
    const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
    try{await page.goto(baseURL+'/components/combobox');const example=page.locator('[data-choice-example="combobox-legacy-states"]'),field=example.getByRole('combobox',{name:'Legacy city strings',exact:true});await field.fill('Oslo');await field.press('ArrowDown');await field.press('Enter');await example.getByRole('button',{name:'Read legacy city',exact:true}).click();await expect(example.locator('output')).toHaveText('Oslo');}
    finally{await context.close();}
  }
});

test('fresh legacy previews attach multi-select handlers before accepting quick edits',async({browser,baseURL})=>{
  test.setTimeout(60000);
  for(let attempt=0;attempt<10;attempt++){
    const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
    try{await page.goto(baseURL+'/components/multi-select');const input=page.getByRole('combobox',{name:'Project disciplines',exact:true});await input.fill('Engineering');await input.press('ArrowDown');await input.press('Enter');await expect(page.getByRole('button',{name:'Remove Engineering',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Remove Design',exact:true})).toBeVisible();}
    finally{await context.close();}
  }
});
