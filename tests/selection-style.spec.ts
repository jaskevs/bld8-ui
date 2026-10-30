import {test,expect,type Locator,type Page} from '@playwright/test';
import {THEME_PRESETS,contrastRatio,exportThemeCss,type ThemeMode} from '../packages/ui/src/theme-config';

function hex(css:string){
  const values=css.match(/[\d.]+/g)?.slice(0,3).map(Number);
  expect(values,'Computed sRGB colour').toHaveLength(3);
  return '#'+values!.map(value=>Math.round(value).toString(16).padStart(2,'0')).join('');
}
async function paint(locator:Locator){
  return locator.evaluate(element=>{
    let host:Element|null=element,background='';
    while(host){background=getComputedStyle(host).backgroundColor;if(background!=='transparent'&&!/^rgba\([^)]*,\s*0(?:\.0+)?\)$/.test(background))break;host=host.parentElement;}
    const style=getComputedStyle(element);
    return {foreground:style.color,background,shadow:style.boxShadow};
  });
}
async function readable(locator:Locator,description:string,minimum=4.5){
  const colors=await paint(locator);
  expect(contrastRatio(hex(colors.foreground),hex(colors.background)),description+' '+JSON.stringify(colors)).toBeGreaterThanOrEqual(minimum);
  return colors;
}
async function mode(page:Page,value:ThemeMode){
  await page.locator('html').evaluate((element,theme)=>element.setAttribute('data-ui-theme',theme),value);
}
async function customTheme(page:Page,shadow:'flat'|'soft'='soft'){
  await page.addStyleTag({content:exportThemeCss({...THEME_PRESETS[1].config,shadow})});
  await page.locator('html').evaluate(element=>element.classList.add('bld8-theme'));
  await page.evaluate(()=>document.fonts.ready);
}

test.beforeEach(async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  (page as Page & {selectionErrors?:string[]}).selectionErrors=errors;
});
test.afterEach(async({page})=>expect((page as Page & {selectionErrors?:string[]}).selectionErrors).toEqual([]));

test('persistent tree selection stays separate from focus, honours flat themes and survives forced colours',async({page})=>{
  await page.goto('/components/tree');await customTheme(page,'flat');
  const tree=page.getByRole('tree',{name:'Project files',exact:true});
  const selected=tree.getByRole('treeitem',{name:'README.md',exact:true}),first=tree.getByRole('treeitem',{name:'src',exact:true});
  const selectedRow=selected.locator('.bui-tree-row').first(),firstRow=first.locator('.bui-tree-row').first();
  const initial=await selectedRow.boundingBox();
  for(const theme of ['light','dark'] as const){
    await mode(page,theme);await selected.focus();await page.keyboard.press('Home');
    await expect(first).toBeFocused();await expect(selected).toHaveAttribute('aria-selected','true');
    const colors=await readable(selected.locator('.bui-tree-label').first(),theme+' selected tree text');
    expect(colors.background).not.toBe((await paint(firstRow)).background);
    expect(await selectedRow.evaluate(element=>getComputedStyle(element).boxShadow),theme+' flat selection shadow').toBe('none');
    const focus=await firstRow.evaluate(element=>({style:getComputedStyle(element).outlineStyle,width:parseFloat(getComputedStyle(element).outlineWidth)}));
    expect(focus.style).not.toBe('none');expect(focus.width).toBeGreaterThanOrEqual(1);
    const box=await selectedRow.boundingBox();expect(box!.width).toBeCloseTo(initial!.width,1);expect(box!.height).toBeCloseTo(initial!.height,1);
  }
  await page.emulateMedia({forcedColors:'active'});await first.focus();
  await expect(selected).toHaveAttribute('aria-selected','true');
  const forced=await readable(selected.locator('.bui-tree-label').first(),'Forced-colour selected text');
  expect(forced.background).not.toBe((await paint(firstRow)).background);
  expect(await firstRow.evaluate(element=>getComputedStyle(element).outlineStyle)).not.toBe('none');
});

test('keyboard option highlight preserves the committed value and readable destructive menu actions',async({page})=>{
  for(const theme of ['light','dark'] as const){
    await page.goto('/foundations');await customTheme(page);await mode(page,theme);
    const specimen=page.getByRole('region',{name:'Control standards',exact:true});
    const trigger=specimen.getByRole('combobox',{name:'Review status',exact:true});await trigger.focus();await page.keyboard.press('ArrowDown');
    const planned=page.getByRole('option',{name:'Planned',exact:true}),ready=page.getByRole('option',{name:'Ready',exact:true});
    await expect(planned).toHaveAttribute('aria-selected','true');
    await expect(planned).toHaveAttribute('data-highlighted','');
    await expect(planned).toBeFocused();
    const before=await ready.boundingBox();await page.keyboard.press('ArrowDown');
    await expect(ready).toHaveAttribute('data-highlighted','');
    await expect(planned).toHaveAttribute('aria-selected','true');await expect(ready).toHaveAttribute('aria-selected','false');
    await readable(ready,theme+' highlighted option text');await readable(planned,theme+' selected option text');
    await readable(planned.locator('svg').first(),theme+' selected option check',3);
    const after=await ready.boundingBox();expect(after!.width).toBeCloseTo(before!.width,1);expect(after!.height).toBeCloseTo(before!.height,1);
    await page.keyboard.press('Enter');await expect(trigger).toContainText('Ready');await expect(trigger).toBeFocused();
    const menuTrigger=specimen.getByRole('button',{name:'More actions',exact:true});await menuTrigger.focus();await menuTrigger.press('ArrowDown');
    const ordinary=page.getByRole('menuitem',{name:'Open note',exact:true}),destructive=page.getByRole('menuitem',{name:'Archive note',exact:true});
    await expect(ordinary).toBeFocused();
    await page.keyboard.press('End');await expect(destructive).toBeFocused();
    const danger=await readable(destructive,theme+' highlighted destructive action');
    expect(danger.foreground).not.toBe((await paint(ordinary)).foreground);
    await page.keyboard.press('Escape');
  }
});

test('tab, sidebar and selected table treatments keep their targets rigid and text legible',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});
  for(const theme of ['light','dark'] as const){
    await page.goto('/foundations');await mode(page,theme);await page.evaluate(()=>document.fonts.ready);
    const tabs=page.getByRole('tablist',{name:'Preview sections',exact:true}),details=tabs.getByRole('tab',{name:'Details',exact:true});
    const tabBefore=await details.boundingBox();await details.click();await expect(details).toHaveAttribute('aria-selected','true');
    await readable(details,theme+' selected tab');const tabAfter=await details.boundingBox();
    expect(tabAfter!.width).toBeCloseTo(tabBefore!.width,1);expect(tabAfter!.height).toBeCloseTo(tabBefore!.height,1);

    await page.goto('/components/sidebar');await mode(page,theme);await page.evaluate(()=>document.fonts.ready);
    const sidebar=page.getByRole('navigation',{name:'Demo workspace',exact:true}),resources=sidebar.getByRole('button',{name:'Resources',exact:true});
    const sideBefore=await resources.boundingBox();await resources.click();await expect(resources).toHaveAttribute('aria-current','page');
    await readable(resources,theme+' current sidebar item');const sideAfter=await resources.boundingBox();
    expect(sideAfter!.width).toBeCloseTo(sideBefore!.width,1);expect(sideAfter!.height).toBeCloseTo(sideBefore!.height,1);

    await page.goto('/components/advanced-table');await mode(page,theme);await page.evaluate(()=>document.fonts.ready);
    const table=page.getByRole('table',{name:'Workspace projects',exact:true}),row=table.locator('tbody tr').first(),cell=row.locator('td').nth(1);
    const cellBefore=await cell.boundingBox(),unselected=await paint(cell);
    await row.getByRole('checkbox').check();await page.mouse.move(0,0);await expect.poll(()=>row.getAttribute('data-selected')).not.toBeNull();
    const chosen=await readable(cell,theme+' selected table cell');expect(chosen.background).not.toBe(unselected.background);
    const cellAfter=await cell.boundingBox();expect(cellAfter!.width).toBeCloseTo(cellBefore!.width,1);expect(cellAfter!.height).toBeCloseTo(cellBefore!.height,1);
    await expect(row.getByRole('checkbox')).toBeChecked();
  }
});
