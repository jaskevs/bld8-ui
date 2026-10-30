import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {chooseOption} from './helpers/controls';

const table=(page:Page)=>page.getByRole('table',{name:'Release records',exact:true});
const pane=(page:Page)=>page.getByRole('region',{name:'Release records scrolling table',exact:true});
const row=(page:Page,id:string)=>table(page).locator('[data-windowed-id="row:'+id+'"]');
const selection=(page:Page,text:string)=>page.locator('.windowed-demo-views').getByRole('status').filter({hasText:text});
async function option(page:Page,label:string,value:string){await chooseOption(page,page.getByRole('combobox',{name:label,exact:true}),value);}
async function ungroup(page:Page){await option(page,'Group records by','None');}
async function bounded(page:Page){expect(await table(page).locator('tr[data-windowed-id]').count()).toBeLessThanOrEqual(24);}
const errors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const found:string[]=[];errors.set(page,found);page.on('pageerror',error=>found.push(error.message));});
test.afterEach(async({page})=>{expect(errors.get(page),'No uncaught table errors').toEqual([]);});

test('ten and twenty thousand supplied records keep a bounded mounted window and logical indices',async({page})=>{
  await page.goto('/components/windowed-table');await ungroup(page);
  for(const count of [10000,20000]){
    await option(page,'Record count',count===10000?'10,000 records':'20,000 records');
    await expect(table(page)).toHaveAttribute('aria-rowcount',String(count+1));await bounded(page);
    const first=row(page,'ROW-00001');await first.focus();await first.press('End');
    const last=row(page,'ROW-'+String(count).padStart(5,'0'));await expect(last).toBeFocused();
    await expect(last).toHaveAttribute('aria-rowindex',String(count+1));await bounded(page);
    expect(await pane(page).evaluate(element=>element.scrollTop)).toBeGreaterThan(100000);
    await last.press('Home');await expect(first).toBeFocused();await expect(first).toHaveAttribute('aria-rowindex','2');
    await expect.poll(()=>pane(page).evaluate(element=>element.scrollTop)).toBe(0);
  }
});

test('row keys navigate, select and open external details with a stable return target',async({page})=>{
  await page.goto('/components/windowed-table');await ungroup(page);
  const first=row(page,'ROW-00001'),second=row(page,'ROW-00002');await first.focus();
  await first.press('ArrowDown');await expect(second).toBeFocused();await second.press('Space');
  await expect(table(page).getByRole('checkbox',{name:'Select ROW-00002',exact:true})).toBeChecked();
  await second.press('Enter');const dialog=page.getByRole('dialog',{name:'Record details',exact:true});await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('ROW-00002');await expect(dialog).toContainText('Field validation 2');
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(second).toBeFocused();
  await second.press('PageDown');expect(await table(page).locator('tr:focus').getAttribute('data-windowed-id')).not.toBe('row:ROW-00002');
  await page.keyboard.press('Home');await expect(first).toBeFocused();await bounded(page);
});

test('manual scrolling retains one focused row and checkbox targets stay native',async({page})=>{
  await page.goto('/components/windowed-table');await ungroup(page);await option(page,'Record count','10,000 records');
  const first=row(page,'ROW-00001');await first.focus();
  await pane(page).evaluate(element=>{element.scrollTop=240000;element.dispatchEvent(new Event('scroll'));});
  await expect.poll(()=>table(page).locator('[data-windowed-id]').evaluateAll(elements=>elements.some(element=>Number(element.getAttribute('aria-rowindex'))>4000))).toBe(true);
  await expect(first).toBeAttached();await expect(first).toBeFocused();await bounded(page);
  await first.press('ArrowDown');await expect(row(page,'ROW-00002')).toBeFocused();
  const checkbox=table(page).getByRole('checkbox',{name:'Select ROW-00002',exact:true});
  await checkbox.focus();await checkbox.press('Space');await expect(checkbox).toBeChecked();
  await expect(selection(page,'1 selected')).toBeVisible();
});

test('group selection covers supplied members beyond the mounted window and survives collapse',async({page})=>{
  await page.goto('/components/windowed-table');await option(page,'Record count','10,000 records');
  const group=table(page).locator('[data-windowed-id="group:Planned"]');
  await expect(group.getByRole('button',{name:'Collapse Planned group (3334 records)',exact:true})).toBeVisible();
  const choose=group.getByRole('checkbox',{name:'Select all Planned records',exact:true});await choose.check();
  await expect(selection(page,'3334 selected')).toBeVisible();
  await group.getByRole('button',{name:'Collapse Planned group (3334 records)',exact:true}).click();
  await expect(table(page)).toHaveAttribute('aria-rowcount','6670');await expect(choose).toBeChecked();
  await group.getByRole('button',{name:'Expand Planned group (3334 records)',exact:true}).click();
  await expect(table(page)).toHaveAttribute('aria-rowcount','10004');
  await expect(table(page).getByRole('checkbox',{name:'Select ROW-00001',exact:true})).toBeChecked();
  await bounded(page);await choose.uncheck();await expect(selection(page,'0 selected')).toBeVisible();
});

test('filtering from the end clamps the window and preserves focus in the search field',async({page})=>{
  await page.goto('/components/windowed-table');await ungroup(page);await option(page,'Record count','20,000 records');
  await row(page,'ROW-00001').focus();await page.keyboard.press('End');await expect(row(page,'ROW-20000')).toBeFocused();
  const search=page.getByRole('searchbox',{name:'Find records',exact:true});await search.fill('ROW-00003');
  await expect(search).toBeFocused();await expect(row(page,'ROW-00003')).toBeVisible();await expect(table(page)).toHaveAttribute('aria-rowcount','2');
  await expect.poll(()=>pane(page).evaluate(element=>element.scrollTop)).toBe(0);
  await search.fill('no matching record exists');await expect(page.getByText('No records in this view.',{exact:true})).toBeVisible();
  await expect(search).toBeFocused();await expect(table(page)).toHaveAttribute('aria-rowcount','1');
  await expect(table(page).getByRole('checkbox',{name:'Select all supplied records',exact:true})).toBeDisabled();
  await search.fill('');await expect(row(page,'ROW-00001')).toBeVisible();await expect(search).toBeFocused();await bounded(page);
});

test('a host filter reveals the repaired focus target without moving focus into search',async({page})=>{
  await page.goto('/components/windowed-table');
  await table(page).locator('[data-windowed-id="group:Planned"]').focus();await page.keyboard.press('End');
  await expect(row(page,'ROW-00999')).toBeFocused();
  // A host update can replace the supplied rows while keyboard focus stays in the table.
  await page.getByRole('searchbox',{name:'Find records',exact:true}).evaluate(input=>{
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'Navigation labels');
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const repaired=table(page).locator('[data-windowed-id="group:Ready"]');await expect(repaired).toBeFocused();
  await expect.poll(()=>pane(page).evaluate(element=>{
    const focused=document.activeElement;if(!focused||!element.contains(focused))return false;
    const frame=element.getBoundingClientRect(),record=focused.getBoundingClientRect();
    return record.top>=frame.top+44-.5&&record.bottom<=frame.bottom+.5;
  }),'Recovered keyboard focus stays visible below the sticky header').toBe(true);
  await expect(page.getByRole('searchbox',{name:'Find records',exact:true})).not.toBeFocused();await bounded(page);
});

test('scroll and paged reading share selected records and collapsed groups',async({page})=>{
  await page.goto('/components/windowed-table');
  await table(page).getByRole('checkbox',{name:'Select ROW-00001',exact:true}).check();
  const views=page.getByRole('group',{name:'Table display',exact:true});await views.getByRole('button',{name:'Pages',exact:true}).click();
  await expect(table(page).getByRole('checkbox',{name:'Select ROW-00001',exact:true})).toBeChecked();
  await expect(selection(page,'1 selected')).toBeVisible();
  await table(page).locator('button[data-table-group-key="Planned"]').click();
  await views.getByRole('button',{name:'Scroll',exact:true}).click();
  await expect(table(page).getByRole('button',{name:/^Expand Planned/})).toBeVisible();
  await expect(selection(page,'1 selected')).toBeVisible();
  await table(page).getByRole('button',{name:/^Expand Planned/}).click();await expect(table(page).getByRole('checkbox',{name:'Select ROW-00001',exact:true})).toBeChecked();
});

test('fixed row geometry aligns headers with cells before and after scrolling',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/components/windowed-table');await ungroup(page);
  const measure=()=>table(page).evaluate(element=>{
    const headers=Array.from(element.querySelectorAll('thead th')).map(header=>header.getBoundingClientRect());
    return Array.from(element.querySelectorAll('tr.bui-windowed-row')).map(row=>({height:row.getBoundingClientRect().height,cells:Array.from(row.querySelectorAll('td')).map((cell,index)=>{const box=cell.getBoundingClientRect();return {left:box.left-headers[index].left,width:box.width-headers[index].width};})}));
  });
  for(const scrollTop of [0,26000]){
    await pane(page).evaluate((element,value)=>{element.scrollTop=value;element.dispatchEvent(new Event('scroll'));},scrollTop);
    await expect.poll(async()=>{const measured=await measure();return measured.length>0&&measured.every(record=>Math.abs(record.height-52)<.6&&record.cells.every(cell=>Math.abs(cell.left)<.6&&Math.abs(cell.width)<.6));}).toBe(true);
    await bounded(page);
  }
  expect(await table(page).locator('.bui-windowed-row').first().evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
});

test('paged grouping scopes its headings to real row groups and selects the complete filtered group',async({page})=>{
  await page.goto('/components/advanced-table');await option(page,'Group projects by','Status');
  const projects=page.getByRole('table',{name:'Workspace projects',exact:true});
  await expect(projects.locator('tbody th[scope="rowgroup"]')).toHaveCount(1);
  await projects.getByRole('checkbox',{name:'Select all 2 records in Review',exact:true}).check();
  await expect(projects.getByRole('checkbox',{name:'Select Navigation study',exact:true})).toBeChecked();
  await expect(projects.getByRole('checkbox',{name:'Select Motion notes',exact:true})).toBeChecked();
  await projects.locator('button[data-table-group-key="Review"]').click();
  await expect(projects.getByRole('checkbox',{name:'Select Navigation study',exact:true})).toHaveCount(0);
  await projects.locator('button[data-table-group-key="Review"]').click();
  await expect(projects.getByRole('checkbox',{name:'Select Navigation study',exact:true})).toBeChecked();
});

test('group collapse keeps an active edit draft until it is saved or cancelled',async({page})=>{
  await page.goto('/components/advanced-table');await option(page,'Group projects by','Status');
  const projects=page.getByRole('table',{name:'Workspace projects',exact:true});
  const disclosure=projects.locator('button[data-table-group-key="Review"]');
  const edit=projects.getByRole('button',{name:'Edit project name for Navigation study',exact:true});
  await edit.focus();await edit.press('F2');
  const draft=projects.getByRole('textbox',{name:'project name for Navigation study',exact:true});await expect(draft).toBeFocused();await draft.fill('Keep this project draft');
  await disclosure.click();await expect(disclosure).toHaveAttribute('aria-expanded','true');await expect(draft).toHaveValue('Keep this project draft');await expect(draft).toBeFocused();
  await expect(page.getByRole('status').filter({hasText:'Save or cancel editing before collapsing this group.'})).toBeVisible();
  await draft.press('Escape');await expect(edit).toBeFocused();await expect(edit).toHaveText('Navigation study');
  await disclosure.click();await expect(disclosure).toHaveAttribute('aria-expanded','false');await expect(disclosure).toBeFocused();await expect(edit).toHaveCount(0);
  await disclosure.click();await edit.click();await draft.fill('');await draft.press('Enter');await expect(page.getByRole('alert').filter({hasText:'between 3 and 80'})).toBeVisible();
  await draft.fill('Updated navigation');await draft.press('Enter');const saved=projects.getByRole('button',{name:'Edit project name for Updated navigation',exact:true});await expect(saved).toBeFocused();await expect(saved).toHaveText('Updated navigation');
  await saved.click();const updated=projects.getByRole('textbox',{name:'project name for Updated navigation',exact:true});await updated.fill('Discard this change');await updated.press('Escape');await expect(saved).toHaveText('Updated navigation');
  await disclosure.click();await expect(disclosure).toHaveAttribute('aria-expanded','false');await expect(disclosure).toBeFocused();
});

for(const theme of ['light','dark'])test('windowed table keeps usable phone overflow and passes automated accessibility in '+theme,async({page})=>{
  await page.setViewportSize({width:390,height:1000});await page.goto('/components/windowed-table');
  if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
  await expect(table(page)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await pane(page).evaluate(element=>element.scrollWidth>element.clientWidth)).toBe(true);
  await expect(page.getByText('Scroll horizontally to see every column.',{exact:true})).toBeVisible();
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(results.violations.map(violation=>({id:violation.id,targets:violation.nodes.map(node=>node.target)}))).toEqual([]);
  await page.emulateMedia({forcedColors:'active'});const first=table(page).locator('[data-windowed-id]').first();await first.focus();await page.keyboard.press('ArrowDown');
  const focus=await table(page).locator('tr:focus').evaluate(element=>{const style=getComputedStyle(element);return {width:parseFloat(style.outlineWidth),style:style.outlineStyle};});
  expect(focus.width).toBeGreaterThanOrEqual(2);expect(focus.style).not.toBe('none');
});
