import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createTreeSelectIndex,filterTreeSelectItems,getTreeSelectStates,mergeTreeSelectChildren,type TreeSelectNode} from '../packages/ui/src/tree-select-state';
import {checkTreeSelectionExample,checkLazyTreeSelectionExample} from '../scripts/check-tree-selection.mjs';

test('tree selection state excludes disabled leaves and keeps incomplete parents mixed',()=>{
  const nodes:TreeSelectNode[]=[{id:'root',label:'Root',children:[{id:'a',label:'Alpha'},{id:'b',label:'Beta'},{id:'later',label:'Later',hasChildren:true},{id:'locked',label:'Locked',disabled:true,children:[{id:'secret',label:'Secret'}]}]}];
  const index=createTreeSelectIndex(nodes),states=getTreeSelectStates(index,new Set(['a','b','secret']));
  expect(states.get('root')).toEqual({checked:'mixed',leafIds:['a','b'],incomplete:true});expect(states.get('locked')?.leafIds).toEqual([]);expect(states.get('secret')?.checked).toBe(true);
  const loaded=mergeTreeSelectChildren(nodes,new Map([['later',[{id:'c',label:'Gamma'}]]]));
  expect(nodes[0].children?.[2].children).toBeUndefined();
  const next=createTreeSelectIndex(loaded);expect(getTreeSelectStates(next,new Set(['a','b'])).get('root')?.checked).toBe('mixed');
  expect(getTreeSelectStates(next,new Set(['a','b','c'])).get('root')?.checked).toBe(true);
  const empty=createTreeSelectIndex([{id:'folder',label:'Empty folder',hasChildren:true,children:[]}]);
  expect(empty.byId.get('folder')?.branch).toBe(true);expect(getTreeSelectStates(empty,new Set()).get('folder')?.leafIds).toEqual([]);
});

test('tree search keeps matching ancestors, branch descendants and semantic aliases',()=>{
  const index=createTreeSelectIndex([{id:'root',label:'Product',children:[{id:'a',label:'Alpha',searchTerms:['motion']},{id:'b',label:'Beta',description:'Keyboard choices.'}]},{id:'other',label:'Other'}]);
  expect([...filterTreeSelectItems(index,'motion')??[]]).toEqual(['a','root']);
  expect([...filterTreeSelectItems(index,'keyboard')??[]]).toEqual(['b','root']);
  expect([...filterTreeSelectItems(index,'Product')??[]].sort()).toEqual(['a','b','root']);
  expect(filterTreeSelectItems(index,'')).toBeNull();expect(filterTreeSelectItems(index,'unmatched')?.size).toBe(0);
});

test('tree data rejects duplicate IDs, cycles, malformed children and excessive depth',()=>{
  expect(createTreeSelectIndex([{id:'same',label:'A'},{id:'same',label:'B'}]).error).toMatch(/unique/);
  const cycle:TreeSelectNode={id:'cycle',label:'Cycle'};cycle.children=[cycle];expect(createTreeSelectIndex([cycle]).error).toMatch(/unique|cycles/);
  expect(createTreeSelectIndex([{id:'bad',label:'Bad',children:{} as TreeSelectNode[]}]).error).toMatch(/array/);
  let deep:TreeSelectNode={id:'end',label:'End'};for(let at=0;at<33;at++)deep={id:'n'+at,label:'Level '+at,children:[deep]};expect(createTreeSelectIndex([deep]).error).toMatch(/32 levels/);
  const nodes:TreeSelectNode[]=[{id:'parent',label:'Parent',hasChildren:true},{id:'existing',label:'Existing'}];
  expect(createTreeSelectIndex(mergeTreeSelectChildren(nodes,new Map([['parent',[{id:'existing',label:'Duplicate'}]]]))).error).toMatch(/unique/);
});

test('tree choices preserve forms, resets, errors and parent selection through real keyboard paths',async({page})=>{
  await page.goto('/components/tree-select');await checkTreeSelectionExample(page,id=>page.locator('[data-example-id="'+id+'"]'));
});

test('lazy tree choices expose recovery, loaded-only parents and abortable source changes',async({page})=>{
  await page.goto('/components/tree-select');await checkLazyTreeSelectionExample(page,id=>page.locator('[data-example-id="'+id+'"]'));
});

test('tree popup remains accessible and contained in both themes at narrow widths',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const theme of ['light','dark'])for(const width of [390,320]){
    await page.setViewportSize({width,height:844});await page.goto('/components/tree-select');await page.evaluate(value=>{document.documentElement.dataset.uiTheme=value;},theme);
    const example=page.locator('[data-example-id="tree-select-native"]'),run=example.getByRole('button',{name:'Run example',exact:true});if(await run.isVisible())await run.click();
    const field=example.getByRole('button',{name:'Team access',exact:true});await field.click();const dialog=page.getByRole('dialog',{name:'Team access choices',exact:true});await expect(dialog).toBeVisible();
    const box=await dialog.boundingBox();expect(box?.x).toBeGreaterThanOrEqual(0);expect((box?.x??0)+(box?.width??0)).toBeLessThanOrEqual(width);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const violations=(await new AxeBuilder({page}).include('.bui-tree-select-popup').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations;
    expect(violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);await page.keyboard.press('Escape');await expect(field).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test('IME confirmation keeps search focus and does not toggle a tree choice',async({page})=>{
  await page.goto('/components/tree-select');const example=page.locator('[data-example-id="tree-select-native"]'),run=example.getByRole('button',{name:'Run example',exact:true});if(await run.isVisible())await run.click();
  const field=example.getByRole('button',{name:'Team access',exact:true});await field.click();const panel=page.getByRole('dialog',{name:'Team access choices',exact:true}),search=panel.getByRole('searchbox',{name:'Search team access choices',exact:true});
  await search.fill('animation');await search.dispatchEvent('compositionstart',{data:'animation'});
  await search.dispatchEvent('keydown',{key:'Enter',code:'Enter',keyCode:229,which:229,isComposing:true,bubbles:true,cancelable:true});
  await expect(search).toBeFocused();const motion=panel.getByRole('treeitem',{name:'Motion',exact:true});await expect(motion).toHaveAttribute('aria-checked','false');
  const form=example.getByRole('form',{name:'Tree selection form',exact:true});expect(await form.evaluate(form=>new FormData(form as HTMLFormElement).getAll('access'))).toEqual(['interface','unavailable-id']);
  await search.dispatchEvent('compositionend',{data:'animation'});await search.press('ArrowDown');await page.keyboard.press('ArrowDown');await expect(motion).toBeFocused();
  await motion.dispatchEvent('keydown',{key:'Enter',code:'Enter',keyCode:229,which:229,isComposing:true,bubbles:true,cancelable:true});await expect(motion).toHaveAttribute('aria-checked','false');
  await motion.press('Enter');await expect(motion).toHaveAttribute('aria-checked','true');await page.keyboard.press('Escape');await expect(field).toBeFocused();
  await example.getByRole('button',{name:'Read tree values',exact:true}).click();await expect(example.getByRole('status',{name:'Tree form values',exact:true})).toHaveText('interface,unavailable-id,motion | research | research | 0');
});
