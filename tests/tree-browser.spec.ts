import {test,expect,type Locator,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {chooseOption} from './helpers/controls';

const projectTree=(page:Page)=>page.getByRole('tree',{name:'Project files',exact:true});
const folders=(page:Page)=>page.getByRole('tree',{name:'Workspace folders',exact:true});
const node=(tree:Locator,label:string)=>tree.getByRole('treeitem',{name:label,exact:true});
const files=(page:Page,label:string)=>page.getByRole('table',{name:'Files in '+label,exact:true});
const openFolder=(page:Page,label:string)=>page.getByRole('button',{name:'Open '+label,exact:true});

test.beforeEach(async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  (page as Page & {treeErrors?:string[]}).treeErrors=errors;
});
test.afterEach(async({page})=>{
  expect((page as Page & {treeErrors?:string[]}).treeErrors,'No uncaught tree or file-browser errors').toEqual([]);
});

test('tree keyboard navigation opens branches without moving selection',async({page})=>{
  await page.goto('/components/tree');const tree=projectTree(page);
  const src=node(tree,'src'),components=node(tree,'components'),readme=node(tree,'README.md');
  await expect(src).toHaveAttribute('aria-expanded','true');
  await expect(readme).toHaveAttribute('aria-selected','true');
  await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);
  await readme.focus();await page.keyboard.press('Home');await expect(src).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(components).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(components).toHaveAttribute('aria-expanded','true');await expect(components).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(node(tree,'button.tsx')).toBeFocused();
  await page.keyboard.press('ArrowDown');await expect(node(tree,'dialog.tsx')).toBeFocused();
  await page.keyboard.press('ArrowLeft');await expect(components).toBeFocused();
  await page.keyboard.press('ArrowLeft');await expect(components).toHaveAttribute('aria-expanded','false');
  await expect(node(tree,'button.tsx')).toHaveCount(0);
  await page.keyboard.press('ArrowDown');await expect(node(tree,'app.tsx')).toBeFocused();
  await page.keyboard.press('ArrowUp');await expect(components).toBeFocused();
  await expect(readme).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('End');await expect(readme).toBeFocused();
  await page.keyboard.press('Home');await page.keyboard.press('s');await expect(node(tree,'styles.css')).toBeFocused();
  await expect(readme).toHaveAttribute('aria-selected','true');
});

test('tree selection, disabled nodes and child semantics are explicit',async({page})=>{
  await page.goto('/components/tree');const tree=projectTree(page);
  const src=node(tree,'src'),components=node(tree,'components'),privateNotes=node(tree,'Private notes');
  await expect(privateNotes).toHaveAttribute('aria-disabled','true');
  await src.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  const button=node(tree,'button.tsx');await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-level','3');await expect(button).not.toHaveAttribute('aria-expanded',/.*/);
  await expect(button).toHaveAttribute('aria-posinset','1');await expect(button).toHaveAttribute('aria-setsize','2');
  await page.keyboard.press('Space');await expect(button).toHaveAttribute('aria-selected','true');
  await expect(tree.locator('[aria-selected="true"]')).toHaveCount(1);
  await page.keyboard.press('Enter');await expect(page.getByRole('status').filter({hasText:'button.tsx activated.'})).toBeVisible();
  await node(tree,'README.md').focus();await page.keyboard.press('ArrowDown');await expect(node(tree,'README.md')).toBeFocused();await expect(privateNotes).not.toBeFocused();
  await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await expect(components).toBeFocused();
  await page.keyboard.press('Enter');await expect(components).toHaveAttribute('aria-selected','true');
  await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);
});

test('controlled collapse and removal repair focus to a surviving visible item',async({page})=>{
  await page.goto('/components/tree');const tree=projectTree(page);
  await node(tree,'components').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  await expect(node(tree,'button.tsx')).toBeFocused();
  // Simulate a host-controlled update while focus remains inside the affected branch.
  await page.getByRole('button',{name:'Collapse folders',exact:true}).evaluate(element=>(element as HTMLButtonElement).click());
  await expect(node(tree,'src')).toBeFocused();await expect(node(tree,'button.tsx')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await expect(node(tree,'components')).toBeFocused();
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');
  await expect(node(tree,'button.tsx')).toHaveAttribute('aria-selected','true');
  await page.getByRole('button',{name:'Remove selected item',exact:true}).evaluate(element=>(element as HTMLButtonElement).click());
  await expect(node(tree,'button.tsx')).toHaveCount(0);
  await expect.poll(()=>tree.evaluate(element=>element.contains(document.activeElement))).toBe(true);
  await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);
});

test('file browser navigates folders, filters locally and inspects real metadata',async({page})=>{
  await page.goto('/blocks/file-browser');await expect(files(page,'Workspace')).toBeVisible();
  await openFolder(page,'Projects').click();await expect(files(page,'Projects')).toBeVisible();
  await openFolder(page,'Interface kit').click();const list=files(page,'Interface kit');await expect(list).toBeVisible();
  const search=page.getByRole('searchbox',{name:'Search this folder',exact:true});
  await search.fill('wireframe');await expect(list.getByRole('button',{name:'Inspect wireframe.png',exact:true})).toBeVisible();
  await expect(list.getByRole('button',{name:'Inspect interaction-notes.md',exact:true})).toHaveCount(0);
  await search.fill('');await chooseOption(page,page.getByRole('combobox',{name:'Sort files',exact:true}),'Name Z–A');
  const names=await list.getByRole('button',{name:/^Inspect /}).allTextContents();expect(names[0]).toContain('wireframe.png');
  await list.getByRole('button',{name:'Inspect wireframe.png',exact:true}).click();
  await expect(page.getByRole('region',{name:'File details',exact:true})).toContainText('wireframe.png');
  await page.getByRole('button',{name:'Up one folder',exact:true}).click();await expect(files(page,'Projects')).toBeVisible();
  await page.getByRole('button',{name:'Show Workspace',exact:true}).click();await expect(files(page,'Workspace')).toBeVisible();
});

test('file metadata columns share header edges and keep names inside their column',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});await page.goto('/blocks/file-browser');
  await openFolder(page,'Projects').click();await openFolder(page,'Interface kit').click();
  const table=files(page,'Interface kit');
  const geometry=await table.evaluate(element=>{
    const headers=Array.from(element.querySelectorAll('thead th')).map(header=>header.getBoundingClientRect());
    return Array.from(element.querySelectorAll('tbody tr')).map(row=>({
      cells:Array.from(row.querySelectorAll('td')).map((cell,index)=>{
        const bounds=cell.getBoundingClientRect();return {left:bounds.left-headers[index].left,right:bounds.right-headers[index].right};
      }),
      nameFits:(()=>{const cell=row.querySelector('td')!.getBoundingClientRect(),name=row.querySelector('button')!.getBoundingClientRect();return name.left>=cell.left&&name.right<=cell.right;})(),
    }));
  });
  expect(geometry).toHaveLength(2);
  for(const row of geometry){expect(row.nameFits).toBe(true);for(const cell of row.cells){expect(Math.abs(cell.left)).toBeLessThan(1);expect(Math.abs(cell.right)).toBeLessThan(1);}}
});

test('file browser tree selection and lazy folders share the visible directory',async({page})=>{
  await page.goto('/blocks/file-browser');const tree=folders(page),archive=node(tree,'Archive');
  await archive.focus();await page.keyboard.press('Space');
  await expect(archive).toHaveAttribute('aria-selected','true');
  const table=files(page,'Archive');await expect(table.getByRole('button',{name:'Inspect archived-brief.pdf',exact:true})).toBeVisible();
  await expect(table.getByRole('button',{name:'Inspect earlier-notes.txt',exact:true})).toBeVisible();
  await page.getByRole('searchbox',{name:'Search this folder',exact:true}).fill('no such file');
  await expect(page.getByText('No matching files.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Clear file search',exact:true}).click();
  await expect(table.getByRole('button',{name:'Inspect archived-brief.pdf',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Show Workspace',exact:true}).click();await openFolder(page,'Archive').click();
  await expect(table.getByRole('button',{name:'Inspect earlier-notes.txt',exact:true})).toBeVisible();
});

test('a rejected folder load is recoverable without losing the current folder',async({page})=>{
  await page.goto('/blocks/file-browser');await chooseOption(page,page.getByRole('combobox',{name:'File preview state',exact:true}),'Rejected folder load');
  await openFolder(page,'Archive').click();await expect(page.getByRole('status').filter({hasText:'Folder could not be loaded'})).toBeVisible();
  await expect(node(folders(page),'Archive')).toHaveAttribute('aria-selected','true');
  await page.getByRole('button',{name:'Retry folder',exact:true}).click();
  await expect(files(page,'Archive').getByRole('button',{name:'Inspect archived-brief.pdf',exact:true})).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'Folder could not be loaded'})).toHaveCount(0);
});

test('malformed folder data is rejected without introducing duplicate tree identities',async({page})=>{
  await page.goto('/blocks/file-browser');const state=page.getByRole('combobox',{name:'File preview state',exact:true});
  await chooseOption(page,state,'Invalid folder data');await openFolder(page,'Archive').click();
  await expect(page.getByRole('status').filter({hasText:'Folder could not be loaded'})).toBeVisible();
  await expect(node(folders(page),'Archive')).toHaveCount(1);
  await expect(node(folders(page),'Workspace')).toHaveCount(1);
  await expect(folders(page).locator('[tabindex="0"]')).toHaveCount(1);
  await chooseOption(page,state,'Sample data');await openFolder(page,'Archive').click();
  await expect(files(page,'Archive').getByRole('button',{name:'Inspect archived-brief.pdf',exact:true})).toBeVisible();
});

test('changing a slow preview cannot apply its late folder response to the replacement',async({page})=>{
  await page.goto('/blocks/file-browser');await page.clock.install();
  const state=page.getByRole('combobox',{name:'File preview state',exact:true});
  await chooseOption(page,state,'Slow folder load');await openFolder(page,'Archive').click();
  await expect(node(folders(page),'Archive')).toHaveAttribute('aria-busy','true');
  await chooseOption(page,state,'Sample data');await expect(files(page,'Workspace')).toBeVisible();
  await page.clock.runFor(4000);
  await expect(files(page,'Workspace')).toBeVisible();
  await expect(node(folders(page),'Workspace')).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('button',{name:'Inspect archived-brief.pdf',exact:true})).toHaveCount(0);
});

test('file loading, empty and service-error previews offer working recovery',async({page})=>{
  await page.goto('/blocks/file-browser');const state=page.getByRole('combobox',{name:'File preview state',exact:true});
  await chooseOption(page,state,'Loading');await expect(page.getByRole('status').filter({hasText:/Loading workspace/})).toBeVisible();
  await chooseOption(page,state,'Empty');await expect(page.getByText('Nothing in this folder yet.',{exact:true})).toBeVisible();
  await chooseOption(page,state,'Connection error');await expect(page.getByRole('status').filter({hasText:'Workspace could not be loaded'})).toBeVisible();
  await page.getByRole('button',{name:'Retry workspace',exact:true}).click();await expect(files(page,'Workspace')).toBeVisible();
});

for(const width of [320,390])test('file navigation, controls and details fit at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/blocks/file-browser');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await openFolder(page,'Projects').click();await openFolder(page,'Interface kit').click();
  await page.getByRole('button',{name:'Inspect interaction-notes.md',exact:true}).click();
  await expect(page.getByRole('region',{name:'File details',exact:true})).toContainText('interaction-notes.md');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const tree=folders(page);expect(await tree.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await node(tree,'Workspace').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');
  await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);
});

for(const theme of ['light','dark'])test('tree and file browser have no automated accessibility violations in '+theme,async({page})=>{
  for(const route of ['/components/tree','/blocks/file-browser']){
    await page.goto(route);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
    if(route==='/components/tree'){await node(projectTree(page),'components').focus();await page.keyboard.press('ArrowRight');}
    else {await openFolder(page,'Projects').click();}
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations.map(violation=>({id:violation.id,targets:violation.nodes.map(item=>item.target)})),route).toEqual([]);
  }
});

test('tree expansion uses eased rigid rows and reacts to live reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/components/tree');
  const tree=projectTree(page),components=node(tree,'components');await expect(tree).toHaveAttribute('data-reduced-motion','false');
  const row=components.locator('.bui-tree-row').first(),height=(await row.boundingBox())!.height;await components.focus();await page.keyboard.press('ArrowRight');
  await expect(node(tree,'button.tsx')).toBeVisible();
  expect((await row.boundingBox())!.height).toBeCloseTo(height,1);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(tree).toHaveAttribute('data-reduced-motion','true');
  await components.focus();await page.keyboard.press('ArrowLeft');await expect(node(tree,'button.tsx')).toHaveCount(0);
  expect(await tree.evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length)).toBe(0);
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await expect(node(tree,'button.tsx')).toBeFocused();
  expect(height).toBeGreaterThanOrEqual(40);
});
