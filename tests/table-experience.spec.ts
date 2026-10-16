import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdirSync} from 'node:fs';
import {projectAction,chooseOption} from './helpers/controls';
mkdirSync('.local/previews',{recursive:true});
const capture={caret:'initial' as const,style:'.site-header,.skip-link {visibility:hidden!important}'};

test('table values and headers share a grid without repeated edit actions',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/templates/outline');const region=page.getByRole('region',{name:'Outline projects',exact:true});await expect(region.locator('tbody tr')).toHaveCount(5);
  await expect(region.locator('tbody').getByText('Edit',{exact:true})).toHaveCount(0);await expect(region.locator('.bui-editable-trigger')).toHaveCount(0);
  const cells=await region.locator('tbody tr').first().locator('td').all();const headers=await region.locator('thead th').all();
  for(let index=0;index<cells.length;index++){const a=(await cells[index].boundingBox())!,b=(await headers[index].boundingBox())!;expect(a.x).toBeCloseTo(b.x,0);expect(a.width).toBeCloseTo(b.width,0);}
  expect((await cells[0].boundingBox())!.width).toBeCloseTo(48,0);
  const heights=await region.locator('tbody tr').evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().height));expect(Math.max(...heights)-Math.min(...heights)).toBeLessThan(1);
  const value=region.getByRole('button',{name:'Edit project name for Keyboard review',exact:true});await expect(value).toHaveText('Keyboard review');
  const labelStart=await headers[1].getByRole('button').evaluate(el=>{const range=document.createRange();range.selectNode(el.firstChild!);return range.getBoundingClientRect().x;});expect((await value.locator('.bblocks-project-name').boundingBox())!.x).toBeCloseTo(labelStart,0);
  const resize=region.getByRole('separator',{name:'Resize Project',exact:true});const before=Number(await resize.getAttribute('aria-valuenow'));await resize.focus();await resize.press('ArrowRight');await expect(resize).toHaveAttribute('aria-valuenow',String(before+10));expect((await headers[1].boundingBox())!.width).toBeCloseTo(before+10,0);
  await region.getByRole('heading',{name:'Project list',exact:true}).click();await region.screenshot({path:'.local/previews/outline-tighter-desktop.png',...capture});
});

test('direct editing and row menus preserve keyboard focus and draft recovery',async({page})=>{
  await page.goto('/templates/outline');const edit=page.getByRole('button',{name:'Edit project name for Keyboard review',exact:true});await edit.focus();await edit.press('F2');const input=page.getByRole('textbox',{name:'project name for Keyboard review',exact:true});await expect(input).toBeFocused();await input.fill('');await input.press('Enter');await expect(page.getByRole('alert').filter({hasText:'three characters'})).toBeVisible();await input.fill('A retained note');await input.press('Escape');await expect(edit).toBeFocused();await expect(edit).toHaveText('Keyboard review');
  await projectAction(page,'Keyboard review','Edit project');const dialog=page.getByRole('dialog',{name:'Edit project',exact:true});await expect(dialog.getByRole('textbox',{name:'Project name',exact:true})).toHaveValue('Keyboard review');await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('button',{name:'Actions for Keyboard review',exact:true})).toBeFocused();
  await page.getByRole('region',{name:'Outline projects',exact:true}).getByRole('button',{name:'Columns',exact:true}).click();await chooseOption(page,page.getByRole('combobox',{name:'Table density',exact:true}),'Compact');await expect(page.locator('.bui-data-table').first()).toHaveAttribute('data-density','compact');await page.keyboard.press('Escape');
});

test('resources align numeric text and selection, with consistent compact rows',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/templates/outline');await page.getByRole('navigation',{name:'Outline views'}).getByRole('button',{name:'Resources',exact:true}).click();const region=page.getByRole('region',{name:'Resource library',exact:true});const size=region.getByRole('columnheader',{name:'Size',exact:true});const textRight=await size.getByRole('button').evaluate(el=>{const range=document.createRange();range.selectNode(el.firstChild!);return range.getBoundingClientRect().right;});
  const cells=region.locator('tbody tr').first().locator('td');const value=cells.nth(3).locator('.bui-table-cell>span');expect((await value.boundingBox())!.x+(await value.boundingBox())!.width).toBeCloseTo(textRight,0);
  const checks=[region.getByRole('checkbox',{name:'Select current page',exact:true}),region.getByRole('checkbox',{name:'Select Interface brief.pdf',exact:true})];const boxes=await Promise.all(checks.map(check=>check.boundingBox()));expect(boxes[0]!.x+boxes[0]!.width/2).toBeCloseTo(boxes[1]!.x+boxes[1]!.width/2,0);
  await checks[1].check();await region.screenshot({path:'.local/previews/resources-tighter-desktop.png',...capture});
});

test('a service refresh retains visible records and an in-progress cell draft',async({page})=>{
  await page.goto('/examples/outline-http');const edit=page.getByRole('button',{name:'Edit project name for Keyboard review',exact:true});await expect(edit).toBeVisible();await edit.click();const input=page.getByRole('textbox',{name:'project name for Keyboard review',exact:true});await input.fill('Keep this draft');
  let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
  await page.route('**/api/examples/outline/projects?*',async route=>{await gate;await route.continue().catch(()=>{});});
  const table=page.getByRole('region',{name:'Outline projects',exact:true});const initial=(await table.locator('.bui-table-scroll').boundingBox())!;
  try{await table.getByRole('columnheader',{name:'Review date',exact:true}).getByRole('button').click();await expect(table.locator('.bui-data-table')).toHaveAttribute('aria-busy','true');await expect(input).toHaveValue('Keep this draft');await expect(table.getByRole('status').filter({hasText:'Updating records'})).toBeVisible();await expect(table.locator('tbody tr')).toHaveCount(5);expect((await table.locator('.bui-table-scroll').boundingBox())!.height).toBeCloseTo(initial.height,0);}finally{release();}
  await expect(table.locator('.bui-data-table')).not.toHaveAttribute('aria-busy','true');await expect(input).toHaveValue('Keep this draft');await input.press('Escape');await expect(edit).toBeFocused();
});

for(const theme of ['light','dark'])test('refined table workflows are accessible in '+theme,async({page})=>{
  test.setTimeout(60000);await page.goto('/templates/outline');if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();const region=page.getByRole('region',{name:'Outline projects',exact:true});await expect(region.locator('tbody tr')).toHaveCount(5);await page.getByRole('button',{name:'Actions for Keyboard review',exact:true}).click();const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);await page.keyboard.press('Escape');
  if(theme==='dark')await region.screenshot({path:'.local/previews/outline-tighter-dark.png',...capture});
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const scroll=region.locator('.bui-table-scroll');expect(await scroll.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);await scroll.focus();await scroll.press('ArrowRight');await expect.poll(()=>scroll.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);await region.screenshot({path:'.local/previews/outline-tighter-mobile-'+theme+'.png',...capture});
});
