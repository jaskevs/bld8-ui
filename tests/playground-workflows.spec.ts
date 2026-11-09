import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readPlayground,writePlayground,playgroundInstall} from '../apps/docs/src/lib/playground-state';
import {chooseOption} from './helpers/controls';

const preview=(page:Page)=>page.getByRole('region',{name:'Component preview',exact:true});
const controls=(page:Page)=>page.getByRole('region',{name:'Playground controls',exact:true});
const code=(page:Page)=>page.locator('.playground-code code').first();
const filter=(value:string)=>({version:1 as const,match:'all' as const,rules:[{id:'name',field:'name',operator:'contains' as const,values:[value]}]});

test('versioned settings round-trip choices, disclosure and bounded table configuration',()=>{
  const settings=readPlayground('?component=DataTable&tableSelected=1,6,unknown,1&tableColumns=status,due&tableSort=due-desc&tablePage=2&tableStatus=Ready&groupRows=true');
  expect(settings.tableSelected).toEqual(['1','6']);expect(settings.tableColumns).toEqual(['name','status','due']);expect(readPlayground(writePlayground(settings))).toEqual(settings);
  expect(readPlayground('?v=1&component=Drawer&side=right').side).toBe('right');expect(readPlayground('?v=999&component=DataTable').component).toBe('Button');
  expect(readPlayground('?component=Accordion&accordionOpen=overview,keyboard,unknown&multiple=false').accordionOpen).toEqual(['overview']);
  expect(readPlayground('?component=DataTable&selectable=false&tableSelected=1').tableSelected).toEqual([]);
  expect(playgroundInstall(readPlayground('?component=DataTable'))).not.toContain('filter-builder');expect(playgroundInstall(readPlayground('?component=FilterBuilder'))).toContain('/table.json');
});

test('incomplete filter drafts survive URLs but cannot become applied queries',()=>{
  const incomplete={version:1,match:'all',rules:[{id:'draft',field:'due',operator:'between',values:['2026-10-20','']}]};
  const state=readPlayground('?component=FilterBuilder&filters='+encodeURIComponent(JSON.stringify(incomplete))+'&appliedFilters='+encodeURIComponent(JSON.stringify(incomplete)));
  expect(state.filters).toEqual(incomplete);expect(state.appliedFilters.rules).toEqual([]);expect(readPlayground(writePlayground(state))).toEqual(state);
  const invalid={version:1,match:'all',rules:[{id:'bad',field:'__proto__',operator:'contains',values:['x']}]};expect(readPlayground('?filters='+encodeURIComponent(JSON.stringify(invalid))).filters.rules).toEqual([]);
  for(const id of ['__proto__','constructor','toString'])expect(readPlayground('?filters='+encodeURIComponent(JSON.stringify({version:1,match:'all',rules:[{id,field:'name',operator:'contains',values:['x']}]}))).filters.rules).toEqual([]);
  const oversized={version:1,match:'all',rules:Array.from({length:7},(_,index)=>({id:'rule-'+index,field:'name',operator:'contains',values:['x']}))};expect(readPlayground('?filters='+encodeURIComponent(JSON.stringify(oversized))).filters.rules).toEqual([]);
});

test('checkbox mixed state and native keyboard changes update the shared configuration',async({page})=>{
  await page.goto('/playground?component=Checkbox&mixed=true');const checkbox=preview(page).getByRole('checkbox',{name:'Include archived',exact:true});await expect(checkbox).toHaveAttribute('aria-checked','mixed');await expect(checkbox).toHaveJSProperty('indeterminate',true);await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();await expect(checkbox).toHaveJSProperty('indeterminate',false);await expect.poll(()=>readPlayground(new URL(page.url()).search).checked).toBe(true);await expect(code(page)).toContainText('useState(true)');
  await page.reload();await expect(checkbox).toBeChecked();await expect(checkbox).toHaveAttribute('aria-checked','true');
});

test('radio arrows skip a disabled option and survive reload',async({page})=>{
  await page.goto('/playground?component=RadioGroup&disabledOption=true');const sample=preview(page);await sample.getByRole('radio',{name:'Comfortable',exact:true}).focus();await page.keyboard.press('ArrowDown');await expect(sample.getByRole('radio',{name:'Compact',exact:true})).toBeChecked();await page.keyboard.press('ArrowDown');await expect(sample.getByRole('radio',{name:'Automatic',exact:true})).toBeDisabled();await expect(sample.getByRole('radio',{name:'Comfortable',exact:true})).toBeChecked();await page.reload();await expect(sample.getByRole('radio',{name:'Comfortable',exact:true})).toBeChecked();
});

test('Select and Tabs selections update their code and shared URLs',async({page})=>{
  await page.goto('/playground?component=Select');await chooseOption(page,preview(page).getByRole('combobox',{name:'Discipline',exact:true}),'Engineering');await page.reload();await expect(preview(page).getByRole('combobox',{name:'Discipline',exact:true})).toContainText('Engineering');await expect(code(page)).toContainText('useState<string | null>("engineering")');
  await chooseOption(page,controls(page).getByRole('combobox',{name:'Component',exact:true}),'Tabs');await preview(page).getByRole('tab',{name:'Activity',exact:true}).click();await page.reload();await expect(preview(page).getByRole('tab',{name:'Activity',exact:true})).toHaveAttribute('aria-selected','true');await expect(code(page)).toContainText('useState("activity")');
});

test('accordion open sections are shared and single expansion keeps one section',async({page})=>{
  await page.goto('/playground?component=Accordion&multiple=true');const sample=preview(page),first=sample.getByRole('button',{name:'Keep the useful context',exact:true}),second=sample.getByRole('button',{name:'Try it with the keyboard',exact:true});await second.click();await expect(first).toHaveAttribute('aria-expanded','true');await expect(second).toHaveAttribute('aria-expanded','true');await page.reload();await expect(second).toHaveAttribute('aria-expanded','true');await controls(page).getByRole('switch',{name:'Multiple open sections',exact:true}).uncheck();await expect(first).toHaveAttribute('aria-expanded','true');await expect(second).toHaveAttribute('aria-expanded','false');
});

test('table selection, pages, facets, sort and columns are restored from a link',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('/playground?component=DataTable&pageSize=3&tableSelected=1,6&tableColumns=name,status,due&tableSort=due-desc');const sample=preview(page);await expect(sample.getByRole('checkbox',{name:'Select Refine motion',exact:true})).toBeChecked();await expect(sample.getByRole('columnheader',{name:'Review date',exact:true})).toBeVisible();await sample.getByRole('button',{name:'Next',exact:true}).click();await expect(sample.getByRole('checkbox',{name:'Select Study tokens',exact:true})).toBeChecked();await chooseOption(page,sample.getByRole('combobox',{name:'Statuses',exact:true}),'Ready');await expect(sample.getByRole('status').filter({hasText:'2 selected'})).toBeVisible();await controls(page).getByRole('button',{name:'Copy configuration link',exact:true}).click();const link=await page.evaluate(()=>navigator.clipboard.readText());await page.goto('/');await page.goto(link);await expect(sample.getByRole('combobox',{name:'Statuses',exact:true})).toContainText('Ready');await expect(sample.getByRole('checkbox',{name:'Select Refine motion',exact:true})).toBeChecked();expect(readPlayground(new URL(page.url()).search).tableSelected).toEqual(['1','6']);
});

test('rejected bulk updates preserve selection and return focus for recovery',async({page})=>{
  await page.goto('/playground?component=DataTable');const sample=preview(page);await sample.getByRole('button',{name:'Rejected update',exact:true}).click();const action=sample.getByRole('button',{name:'Mark ready',exact:true});await action.click();await expect(action).toBeDisabled();await expect(sample.getByRole('alert')).toContainText('No rows changed.');await expect(action).toBeFocused();await expect(sample.getByRole('checkbox',{name:'Select Study tokens',exact:true})).toBeChecked();await expect(code(page)).toContainText('const [rejectActions, setRejectActions] = useState(true)');await sample.getByRole('button',{name:'Use successful response',exact:true}).click();await expect(action).toBeFocused();await action.click();await expect(sample.getByRole('alert')).toHaveCount(0);await expect(sample.getByRole('row').filter({hasText:'Study tokens'})).toContainText('Ready');await expect(sample.getByRole('checkbox',{name:'Select Study tokens',exact:true})).not.toBeChecked();
});

test('bulk completion preserves a new selection made while the action is pending',async({page})=>{
  await page.goto('/playground?component=DataTable&tableSelected=1&pageSize=6');const sample=preview(page),button=sample.getByRole('button',{name:'Mark ready',exact:true});await button.click();await sample.getByRole('checkbox',{name:'Select Write usage notes',exact:true}).check();await expect(sample.getByRole('row').filter({hasText:'Study tokens'})).toContainText('Ready');await expect(sample.getByRole('checkbox',{name:'Select Write usage notes',exact:true})).toBeChecked();await expect(sample.getByRole('checkbox',{name:'Select Study tokens',exact:true})).not.toBeChecked();
});

test('switching examples cancels a pending action and reset restores local sample data',async({page})=>{
  await page.goto('/playground?component=DataTable&tableSelected=1&inlineEditing=true');const sample=preview(page);await sample.getByRole('button',{name:'Mark ready',exact:true}).click();await chooseOption(page,controls(page).getByRole('combobox',{name:'Component',exact:true}),'Checkbox');await page.waitForTimeout(600);await expect(sample.getByRole('checkbox',{name:'Include archived',exact:true})).toBeVisible();await expect(sample.locator('.playground-status')).not.toContainText('marked ready');
  await chooseOption(page,controls(page).getByRole('combobox',{name:'Component',exact:true}),'DataTable');await sample.getByRole('button',{name:'Edit Project name for Study tokens',exact:true}).click();const input=sample.getByRole('textbox',{name:'Project name for Study tokens',exact:true});await input.fill('Changed sample');await input.press('Enter');await expect(sample.getByRole('button',{name:'Edit Project name for Changed sample',exact:true})).toBeVisible();await sample.getByRole('button',{name:'Restore example',exact:true}).click();await expect(sample.getByRole('button',{name:'Edit Project name for Study tokens',exact:true})).toBeVisible();
});

test('filter drafts validate before applying and both draft and results reload correctly',async({page})=>{
  await page.goto('/playground?component=FilterBuilder');const sample=preview(page);await sample.getByRole('button',{name:'Add filter',exact:true}).click();await sample.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(sample.getByText('Enter a value.',{exact:true})).toBeVisible();const input=sample.getByRole('textbox',{name:'Filter 1 value',exact:true});await input.fill('keyboard');await sample.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(sample.getByRole('table')).toContainText('Review keyboard flow');await expect(sample.getByRole('checkbox',{name:'Select Study tokens',exact:true})).toHaveCount(0);await input.fill('motion');await expect(sample.getByText('Unapplied changes',{exact:true})).toBeVisible();await page.reload();await expect(input).toHaveValue('motion');await expect(sample.getByRole('table')).toContainText('Review keyboard flow');await sample.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(sample.getByRole('table')).toContainText('Refine motion');await expect(code(page)).toContainText('filterRecords');await sample.getByRole('button',{name:'Clear conditions',exact:true}).click();await expect(sample.getByRole('checkbox',{name:'Select Study tokens',exact:true})).toBeVisible();
});

test('Restore example discards an unsaved inline cell draft',async({page})=>{
  await page.goto('/playground?component=DataTable&inlineEditing=true');const sample=preview(page);await sample.getByRole('button',{name:'Edit Project name for Study tokens',exact:true}).click();await sample.getByRole('textbox',{name:'Project name for Study tokens',exact:true}).fill('Unsubmitted local draft');await sample.getByRole('button',{name:'Restore example',exact:true}).click();await expect(sample.getByRole('button',{name:'Edit Project name for Study tokens',exact:true})).toBeVisible();await expect(sample.getByRole('textbox',{name:'Project name for Study tokens',exact:true})).toHaveCount(0);
});

test('grouped-page presets keep selection while groups close and reopen',async({page})=>{
  await page.goto('/playground?component=DataTable');const sample=preview(page);await sample.getByRole('button',{name:'Grouped page',exact:true}).click();await expect(sample.getByRole('checkbox',{name:'Select Study tokens',exact:true})).toBeChecked();const group=sample.getByRole('button',{name:'Planned 2 records',exact:true});await group.click();await expect(sample.getByRole('checkbox',{name:'Select Study tokens',exact:true})).toHaveCount(0);await page.reload();await expect(group).toHaveAttribute('aria-expanded','false');await group.click();await expect(sample.getByRole('checkbox',{name:'Select Study tokens',exact:true})).toBeChecked();
});

test('downloaded examples include the selected configuration and source-install commands',async({page})=>{
  await page.goto('/playground'+writePlayground({...readPlayground('?component=FilterBuilder&inlineEditing=true'),filters:filter('motion'),appliedFilters:filter('motion')}));const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download example',exact:true}).click();const download=await pending;expect(download.suggestedFilename()).toBe('filter-builder-example.tsx');const stream=await download.createReadStream();let source='';for await(const chunk of stream!)source+=chunk.toString();expect(source).toContain('renderSelectedActions');expect(source).toContain('"motion"');expect(source).toContain('EditableCell');expect(source).not.toContain('@bld8/');await expect(page.locator('.playground-code code').last()).toContainText('/filter-query.json');
});

test('oversized filter configurations retain their draft and offer source download instead of a broken link',async({page})=>{
  await page.goto('/playground?component=FilterBuilder');const sample=preview(page);for(let index=1;index<=5;index++){await sample.getByRole('button',{name:'Add filter',exact:true}).click();await sample.getByRole('textbox',{name:`Filter ${index} value`,exact:true}).fill('色'.repeat(200));}
  await expect(controls(page).getByRole('button',{name:'Copy configuration link',exact:true})).toBeDisabled();await expect(controls(page).getByRole('status')).toContainText('Link not updated');await expect(sample.getByRole('textbox',{name:'Filter 5 value',exact:true})).toHaveValue('色'.repeat(200));await expect(page.getByRole('button',{name:'Download example',exact:true})).toBeEnabled();await sample.getByRole('button',{name:'Remove filter 5',exact:true}).click();await expect(controls(page).getByRole('button',{name:'Copy configuration link',exact:true})).toBeEnabled();
});

test('phone jump links connect configuration and preview without losing keyboard context',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/playground?component=DataTable');await page.getByRole('link',{name:'Jump to preview',exact:true}).click();await expect(preview(page)).toBeFocused();await expect.poll(async()=>Math.round((await preview(page).boundingBox())!.y)).toBeLessThanOrEqual(140);expect((await preview(page).boundingBox())!.y).toBeGreaterThan(90);await page.getByRole('link',{name:'Back to settings',exact:true}).click();await expect(controls(page)).toBeFocused();
});

for(const theme of ['light','dark'] as const)test(`expanded playground is contained and accessible in ${theme}`,async({page})=>{
  await page.setViewportSize({width:390,height:900});for(const component of ['Checkbox','RadioGroup','Accordion','DataTable','FilterBuilder']){
    await page.goto('/playground?component='+component+'&dark='+(theme==='dark')+'&mobile=true&tableSelected=1');await expect(controls(page).getByRole('combobox',{name:'Component',exact:true})).toContainText(component);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),component).toBe(true);const scan=await new AxeBuilder({page}).include('.playground').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(scan.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)})),component).toEqual([]);
  }
});
