import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readComponentExamples} from '../scripts/prepare-component-examples.mjs';
import {hasFullNotice,mitNotice} from '../scripts/license-policy.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
test('every named example has a distinct installable composition and source-backed public URL',()=>{
  const examples=readComponentExamples(root),names=new Set<string>();
  for(const example of examples){
    expect(example.documentationPath).toBe('/components/'+example.componentId+'/examples/'+example.id);
    expect(names.has(example.registryName)).toBe(false);names.add(example.registryName);
    const item=JSON.parse(readFileSync(join(root,'apps/docs/public/r/'+example.registryName+'.json'),'utf8'));
    expect(item.name).toBe('example-'+example.id);expect(item.type).toBe('registry:block');expect(item.license).toBe('MIT');
    expect(item.files).toHaveLength(1);expect(item.files[0].type).toBe('registry:file');expect(item.files[0].target).toBe('@ui/bld8/examples/'+example.id+'.tsx');
    expect(item.files[0].content).not.toContain('@bld8/ui');expect(item.files[0].content).not.toContain('@bld8/blocks');expect(item.files[0].content).not.toContain('@/components/ui');expect(item.files[0].content).toContain("from '../");
    expect(hasFullNotice(item.files[0].content,mitNotice())).toBe(true);
    expect(item.registryDependencies.slice().sort()).toEqual(example.modules.map(module=>'https://ui.bld8.dev/r/bld8-'+module+'.json').concat((example.blockModules??[]).map(module=>'https://ui.bld8.dev/r/bld8-block-'+module+'.json')).sort());
    expect(item.provenance.sourcePaths.length).toBeGreaterThan(0);
  }
});
test('example discovery shares URL filters, history and a source-backed detail page',async({page})=>{
  await page.goto('/components/examples?component=autocomplete&campaign=share');
  const cards=page.locator('.example-catalog-card');await expect(cards).toHaveCount(5);
  const query=page.getByRole('searchbox',{name:'Search examples',exact:true});await query.fill('email');await expect(cards).toHaveCount(1);await expect(page).toHaveURL(/q=email/);
  await page.reload();await expect(query).toHaveValue('email');await expect(cards).toHaveCount(1);
  await cards.getByRole('link',{name:'Preview, source and install',exact:true}).click();await expect(page).toHaveURL(/components\/autocomplete\/examples\/autocomplete-email/);
  await expect(page.locator('[data-example-id="autocomplete-email"]')).toBeVisible();await expect(page.getByText(/npx shadcn@latest add .*example-autocomplete-email.json/)).toBeVisible();
  await page.goBack();await expect(query).toHaveValue('email');await expect(cards).toHaveCount(1);
  await page.getByRole('button',{name:'Clear example filters',exact:true}).click();expect(new URL(page.url()).searchParams.get('campaign')).toBe('share');await expect(page.getByRole('button',{name:'Component families',exact:true})).toContainText('All component families');
});
test('example catalogue is usable at 320px and its invalid filters recover without overflow',async({page})=>{
  await page.setViewportSize({width:320,height:900});await page.goto('/components/examples?component=unknown&category=All+components&q=not-a-real-pattern');
  await expect(page.getByRole('heading',{name:'No matching examples.',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Clear example filters',exact:true}).click();await expect(page.locator('.example-catalog-card').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('global search opens a specific example instead of only the component family',async({page})=>{
  await page.goto('/components');await page.getByRole('button',{name:'Search the library',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Search the library',exact:true});await dialog.getByRole('combobox').fill('email suggestions');
  const option=dialog.getByRole('option').filter({hasText:/email/i});await expect(option.first()).toBeVisible();await option.first().click();
  await expect(page).toHaveURL(/components\/autocomplete\/examples\/autocomplete-email/);
});

test('multiple categories match either category and preserve shared URLs and history',async({page})=>{
  await page.goto('/components/examples?campaign=share#catalog');
  await page.getByRole('button',{name:'Categories',exact:true}).click();const tree=page.getByRole('tree',{name:'Categories choices',exact:true});
  await tree.getByRole('treeitem',{name:'Forms',exact:true}).click();await tree.getByRole('treeitem',{name:'Data',exact:true}).click();
  await expect(tree.getByRole('treeitem',{name:'Forms',exact:true})).toHaveAttribute('aria-checked','true');await expect(tree.getByRole('treeitem',{name:'Data',exact:true})).toHaveAttribute('aria-checked','true');
  await page.locator('[data-example-category-picker]').getByRole('button',{name:'Done',exact:true}).click();
  expect(new URL(page.url()).searchParams.getAll('category')).toEqual(['Forms','Data']);
  const categories=await page.locator('.example-catalog-card>.bui-between>.bui-hint').allTextContents();expect(categories).toContain('Forms');expect(categories).toContain('Data');expect(categories.every(category=>['Forms','Data'].includes(category))).toBe(true);
  await page.reload();await expect(page.getByRole('button',{name:'Categories',exact:true})).toContainText('Forms, Data');
  await page.getByRole('button',{name:'Clear example filters',exact:true}).click();expect(new URL(page.url()).searchParams.get('campaign')).toBe('share');expect(new URL(page.url()).hash).toBe('#catalog');
  await page.goBack();await expect(page.getByRole('button',{name:'Categories',exact:true})).toContainText('Forms, Data');
});
test('family group selection stays open, selects all members and shows a mixed parent after one removal',async({page})=>{
  await page.goto('/components/examples');await page.getByRole('button',{name:'Component families',exact:true}).click();const tree=page.getByRole('tree',{name:'Component families choices',exact:true}),forms=tree.getByRole('treeitem',{name:'Forms',exact:true});
  await forms.click();await expect(forms).toHaveAttribute('aria-checked','true');await expect(tree).toBeVisible();expect(new URL(page.url()).searchParams.getAll('component')).toContain('checkbox');expect(new URL(page.url()).searchParams.getAll('component')).toContain('autocomplete');
  const search=page.getByRole('searchbox',{name:'Search component families choices',exact:true});await search.fill('Checkbox');const checkbox=tree.getByRole('treeitem',{name:'Checkbox',exact:true});await expect(checkbox).toHaveAttribute('aria-checked','true');await checkbox.click();await expect(forms).toHaveAttribute('aria-checked','mixed');expect(new URL(page.url()).searchParams.getAll('component')).not.toContain('checkbox');
  await page.locator('[data-example-family-picker]').getByRole('button',{name:'Done',exact:true}).click();
  const labels=await page.locator('.example-catalog-card>.bui-between>.bui-hint').allTextContents();expect(labels.length).toBeGreaterThan(5);expect(labels.every(label=>label==='Forms')).toBe(true);
});
test('keyboard leaf selection and intersecting categories retain an explicit recovery path',async({page})=>{
  await page.goto('/components/examples');const trigger=page.getByRole('button',{name:'Component families',exact:true});await trigger.click();const search=page.getByRole('searchbox',{name:'Search component families choices',exact:true});await search.fill('Checkbox');await search.press('ArrowDown');await page.keyboard.press('End');const leaf=page.getByRole('treeitem',{name:'Checkbox',exact:true});await expect(leaf).toBeFocused();await page.keyboard.press('Space');await expect(leaf).toHaveAttribute('aria-checked','true');await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  await page.getByRole('button',{name:'Categories',exact:true}).click();await page.getByRole('tree',{name:'Categories choices',exact:true}).getByRole('treeitem',{name:'Data',exact:true}).click();await page.keyboard.press('Escape');await expect(page.getByRole('heading',{name:'No matching examples.',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Clear category selection',exact:true}).click();await expect(page.locator('.example-catalog-card').first()).toBeVisible();expect(new URL(page.url()).searchParams.getAll('component')).toEqual(['checkbox']);expect(new URL(page.url()).searchParams.has('category')).toBe(false);
});
test('filter controls share one baseline and keep their position while a menu opens',async({page})=>{
  await page.goto('/components/examples');await expect(page.locator('[data-filter-ready]')).toBeVisible();const controls=page.locator('.example-catalog-filters .bui-input,.example-catalog-filters .bui-tree-select-control'),boxes=await controls.evaluateAll(nodes=>nodes.map(node=>{const box=node.getBoundingClientRect();return{x:box.x,y:box.y,height:box.height};}));
  expect(boxes).toHaveLength(3);for(const box of boxes){expect(Math.abs(box.y-boxes[0].y)).toBeLessThan(1);expect(Math.abs(box.height-boxes[0].height)).toBeLessThan(1);}
  const before=await page.getByRole('button',{name:'Component families',exact:true}).boundingBox();await page.getByRole('button',{name:'Component families',exact:true}).click();const after=await page.getByRole('button',{name:'Component families',exact:true}).boundingBox();expect(after!.x).toBeCloseTo(before!.x,1);expect(after!.y).toBeCloseTo(before!.y,1);
});

test('long mobile selection summaries keep their leading text and ellipse at the end',async({page})=>{
  await page.setViewportSize({width:320,height:900});await page.goto('/components/examples?component=autocomplete&component=toolbar&component=alert-dialog&component=navigation-menu&component=preview-card');
  const trigger=page.getByRole('button',{name:'Component families',exact:true});await expect(trigger).toContainText('Autocomplete, Toolbar +3');
  const summary=trigger.locator('.bui-button-content>span').first();const bounds=await summary.boundingBox(),button=await trigger.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(button!.x);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(button!.x+button!.width);
  expect(await summary.evaluate(node=>getComputedStyle(node).textOverflow)).toBe('ellipsis');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const clear=page.getByRole('button',{name:'Clear component families',exact:true});expect((await clear.boundingBox())!.width).toBeGreaterThanOrEqual(44);
});
test('family choices use accurate singular example descriptions',async({page})=>{
  await page.goto('/components/examples');await page.getByRole('button',{name:'Component families',exact:true}).click();await page.getByRole('searchbox',{name:'Search component families choices',exact:true}).fill('Toggle group');await expect(page.getByRole('treeitem',{name:'Toggle group',exact:true})).toHaveAccessibleDescription('1 example');
});
