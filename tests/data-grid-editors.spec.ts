import {test,expect,type Page} from '@playwright/test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {dataValuesEqual,parseDataValue,parseDataTsv,stringifyDataTsv,validateDataChanges,type DataColumn} from '../packages/ui/src/data-workspace-state';
import {gridPasteEdits} from '../packages/ui/src/data-grid-state';
import {checkMixedGridEditors,checkCustomGridEditor} from '../scripts/check-grid-editing.mjs';

interface Row {id:string;revision:number;due:string;approved:boolean;assignees:string[]}
const people=[{value:'maya',label:'Maya Chen'},{value:'oliver',label:'Oliver Reed'},{value:'retired',label:'Former contributor',disabled:true}];
const bool:DataColumn<Row>={key:'approved',label:'Approved',type:'boolean',editable:true};
const multi:DataColumn<Row>={key:'assignees',label:'Assignees',type:'multi-select',editable:true,options:people,required:true,maxSelections:2};
const date:DataColumn<Row>={key:'due',label:'Due date',type:'date',editable:true,minDate:'2026-01-01',maxDate:'2027-12-31'};
const rows:Row[]=[{id:'REC-1',revision:1,due:'2026-11-20',approved:false,assignees:['maya']}];
const example=(page:Page,id:string)=>page.locator('[data-example-id="'+id+'"]');
async function open(page:Page,id='grid-editor-mixed'){await page.goto('/components/data-grid');const demo=example(page,id),run=demo.getByRole('button',{name:'Run example',exact:true});if(await run.count())await run.click();await expect(demo.getByRole('grid')).toBeVisible();return demo;}
async function canonical(page:Page,id='REC-1',custom=false){const output=example(page,custom?'grid-editor-custom':'grid-editor-mixed').getByLabel(custom?'Custom team canonical values':'Delivery canonical values',{exact:true});return JSON.parse((await output.textContent())||'[]').find((row:{id:string})=>row.id===id);}
async function edit(page:Page,label:string){const cell=example(page,'grid-editor-mixed').getByRole('gridcell',{name:label,exact:true});await cell.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await cell.click();await cell.press('Enter');return cell;}

test('boolean columns keep false distinct from null and enforce explicit approval requirements',()=>{
  for(const input of [false,'false','FALSE',''])expect(parseDataValue(bool,input)).toEqual({value:false});
  for(const input of [true,'true',' TRUE '])expect(parseDataValue(bool,input)).toEqual({value:true});
  for(const input of [null,undefined,0,1,'yes','0',[],{}])expect(parseDataValue(bool,input).error).toMatch(/true or false/);
  expect(parseDataValue({...bool,required:true},false).error).toMatch(/Confirm/);expect(parseDataValue({...bool,required:true},true)).toEqual({value:true});
});

test('multi-value columns validate bounded unique canonical IDs without mutating input',()=>{
  const input=['maya','oliver'],before=JSON.stringify(input);expect(parseDataValue(multi,input)).toEqual({value:['maya','oliver']});expect(JSON.stringify(input)).toBe(before);
  expect(parseDataValue(multi,'["maya","oliver"]')).toEqual({value:['maya','oliver']});expect(parseDataValue({...multi,required:false},'')).toEqual({value:[]});
  for(const value of ['maya,oliver','["maya","maya"]','["unknown"]','["retired"]','[1]','{}','null',[],['maya','oliver','retired']])expect(parseDataValue(multi,value).error,String(value)).toBeTruthy();
  expect(parseDataValue({...multi,minSelections:3,maxSelections:2},['maya']).error).toMatch(/limits/);
  expect(parseDataValue({...multi,required:false,options:[{value:'maya',label:'One'},{value:'maya',label:'Two'}]},['maya']).error).toMatch(/supported/);
  expect(parseDataValue({...multi,required:false,maxSelections:200,options:Array.from({length:101},(_,index)=>({value:'P-'+index,label:'Person '+index}))},Array.from({length:101},(_,index)=>'P-'+index)).error).toMatch(/100/);
});

test('date columns reject impossible dates and respect inclusive date-only bounds',()=>{
  expect(parseDataValue(date,'2026-01-01')).toEqual({value:'2026-01-01'});expect(parseDataValue(date,'2027-12-31')).toEqual({value:'2027-12-31'});expect(parseDataValue(date,'')).toEqual({value:''});
  for(const value of ['2026-02-29','2026-13-01','2026-1-01','2026-11-20T00:00:00Z'])expect(parseDataValue(date,value).error).toMatch(/YYYY-MM-DD/);
  expect(parseDataValue(date,'2025-12-31').error).toMatch(/later/);expect(parseDataValue(date,'2028-01-01').error).toMatch(/earlier/);
  expect(parseDataValue({...date,minDate:'bad'},'2026-11-20').error).toMatch(/limits/);expect(parseDataValue({...date,minDate:'2027-01-01',maxDate:'2026-12-01'},'2026-11-20').error).toMatch(/limits/);
  expect(parseDataValue({...date,required:true},'').error).toMatch(/Enter/);
});

test('atomic change validation accepts canonical arrays by value and rejects unconverted clipboard strings',()=>{
  expect(dataValuesEqual(['maya'],['maya'])).toBe(true);expect(dataValuesEqual(['maya','oliver'],['oliver','maya'])).toBe(false);expect(dataValuesEqual(false,null)).toBe(false);
  expect(validateDataChanges(rows,[date,bool,multi],[{id:'REC-1',expectedRevision:1,values:{due:'2026-11-29',approved:true,assignees:['maya','oliver']}}])).toEqual([]);
  expect(validateDataChanges(rows,[multi],[{id:'REC-1',expectedRevision:1,values:{assignees:'["maya"]' as unknown as string[]}}])[0].message).toMatch(/canonical/);
  expect(validateDataChanges(rows,[multi],[{id:'REC-1',expectedRevision:1,values:{assignees:['retired']}}])[0].message).toMatch(/available/);
});

test('mixed clipboard cells round-trip as date-only strings, booleans and quoted JSON arrays',()=>{
  const text=stringifyDataTsv([['2026-11-29',true,['maya','oliver']],['',false,[]]]);
  expect(text).toBe('2026-11-29\ttrue\t"[""maya"",""oliver""]"\n\tfalse\t[]');
  const parsed=parseDataTsv(text);expect(parseDataValue(date,parsed[0][0])).toEqual({value:'2026-11-29'});expect(parseDataValue(bool,parsed[0][1])).toEqual({value:true});expect(parseDataValue(multi,parsed[0][2])).toEqual({value:['maya','oliver']});
  expect(gridPasteEdits(rows,[date,bool,multi],{row:0,column:0},parsed[0].map(value=>value.includes('"')?'"'+value.replace(/"/g,'""')+'"':value).join('\t'))).toEqual([{id:'REC-1',key:'due',value:'2026-11-29'},{id:'REC-1',key:'approved',value:'true'},{id:'REC-1',key:'assignees',value:'["maya","oliver"]'}]);
});

test('select columns enforce unavailable options as well as multi-select columns',()=>{
  const select:DataColumn<Row>={...date,type:'select',options:[{value:'2026-11-20',label:'Unavailable',disabled:true},{value:'2026-11-21',label:'Available'}]};expect(parseDataValue(select,'2026-11-20').error).toMatch(/supported/);expect(parseDataValue(select,'2026-11-21')).toEqual({value:'2026-11-21'});
});

test('presentational custom cells preserve grid focus semantics and allow deliberate empty rendering',async()=>{
  const {DataGrid}=await import('../packages/ui/dist/data-grid.js');
  const html=renderToStaticMarkup(createElement(DataGrid<Row>,{label:'Custom display',rows,columns:[date,bool,multi],renderCell:context=>context.column.key==='due'?null:context.column.key==='assignees'?createElement('strong',null,context.row.assignees.join(' + ')):undefined}));
  expect(html).toContain('role="grid"');expect(html.match(/tabindex="0"/g)).toHaveLength(1);expect(html).not.toContain('>2026-11-20</span>');expect(html).toContain('<strong>maya</strong>');expect(html).toContain('>No</span>');expect(html).not.toContain('type="checkbox"');
});

test('mixed editors preserve canonical values, native checkbox cancellation and atomic history',async({page})=>{await page.goto('/components/data-grid');await checkMixedGridEditors(page,id=>example(page,id));});

test('public custom editor hooks compose TreeSelect with explicit apply and outside-focus preservation',async({page})=>{await page.goto('/components/data-grid');await checkCustomGridEditor(page,id=>example(page,id));});

test('invalid or incomplete typed dates cannot apply the previous valid grid value',async({page})=>{
  await open(page);const cell=await edit(page,'Due date for REC-1'),panel=page.getByRole('dialog',{name:'Edit due date',exact:true}),field=panel.getByRole('textbox',{name:'Due date for REC-1',exact:true});
  await field.fill('2026-02-30');await field.press('Enter');await expect(panel).toBeVisible();await expect(field).toHaveAttribute('aria-invalid','true');expect((await canonical(page)).due).toBe('2026-11-20');
  await panel.getByRole('button',{name:'Apply changes',exact:true}).click();await expect(panel).toBeVisible();await expect(field).toBeFocused();expect(await field.evaluate(element=>(element as HTMLInputElement).checkValidity())).toBe(false);expect((await canonical(page)).due).toBe('2026-11-20');
  await field.fill('2026-11-');await panel.getByRole('button',{name:'Apply changes',exact:true}).click();await expect(panel).toBeVisible();expect((await canonical(page)).due).toBe('2026-11-20');
  await field.fill('2026-11-25');await panel.getByRole('button',{name:'Apply changes',exact:true}).click();await expect(panel).toBeHidden();await expect(cell).toBeFocused();await expect.poll(async()=>(await canonical(page)).due).toBe('2026-11-25');
});

test('date recovery retains new text while an editor measurement frame is pending',async({page})=>{
  await open(page);const cell=await edit(page,'Due date for REC-1'),panel=page.getByRole('dialog',{name:'Edit due date',exact:true}),field=panel.getByRole('textbox',{name:'Due date for REC-1',exact:true}),apply=panel.getByRole('button',{name:'Apply changes',exact:true});
  await expect(field).toBeFocused();
  // Keep the feedback resize measurement pending until the following input.
  // Its state update must share the bubbling change event without restoring old text.
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
  await field.fill('2026-02-30');await apply.click();await expect(panel).toBeVisible();await expect(field).toHaveAttribute('aria-invalid','true');expect((await canonical(page)).due).toBe('2026-11-20');
  const before=await apply.boundingBox();expect(before).not.toBeNull();await field.fill('2026-11-25');expect(await field.inputValue()).toBe('2026-11-25');
  const after=await apply.boundingBox();expect(after).not.toBeNull();expect(Math.abs(after!.x-before!.x)).toBeLessThanOrEqual(1);expect(Math.abs(after!.y-before!.y)).toBeLessThanOrEqual(1);
  await page.clock.resume();await apply.click();await expect(panel).toBeHidden();await expect(cell).toBeFocused();await expect.poll(async()=>(await canonical(page)).due).toBe('2026-11-25');
});

test('multi-value errors keep the buffer open and disabled choices cannot enter the draft',async({page})=>{
  await open(page);const cell=await edit(page,'Assignees for REC-1'),panel=page.getByRole('dialog',{name:'Edit assignees',exact:true}),search=panel.getByRole('combobox',{name:'Assignees for REC-1',exact:true});
  await search.fill('Former');await expect(page.getByRole('option',{name:'Former contributor',exact:true})).toHaveAttribute('aria-disabled','true');await search.press('Escape');
  await panel.getByRole('button',{name:'Remove Maya Chen',exact:true}).click();await panel.getByRole('button',{name:'Apply changes',exact:true}).click();await expect(panel).toBeVisible();await expect(panel.getByRole('alert')).toContainText('at least 1');expect((await canonical(page)).assignees).toEqual(['maya']);
  await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(panel).toBeHidden();await expect(cell).toBeFocused();expect((await canonical(page)).assignees).toEqual(['maya']);
});

test('the example rejects stale revisions atomically and restores the last saved records',async({page})=>{
  const demo=await open(page);await edit(page,'Approved for REC-1');const checkbox=demo.getByRole('checkbox',{name:'Approved for REC-1',exact:true});await checkbox.press('Space');await checkbox.press('Enter');
  await demo.getByRole('button',{name:'Simulate external revision',exact:true}).click();await demo.getByRole('button',{name:'Save delivery draft',exact:true}).click();await expect(demo.getByText('A revision changed. Restore the saved records before retrying; nothing was saved.',{exact:true})).toBeVisible();expect((await canonical(page)).approved).toBe(true);
  await demo.getByRole('button',{name:'Restore saved records',exact:true}).click();await expect.poll(async()=>(await canonical(page)).approved).toBe(false);await expect(demo.getByRole('button',{name:'Save delivery draft',exact:true})).toBeDisabled();
});

test('custom TreeSelect editors validate empty leaf sets without committing or losing cancellation',async({page})=>{
  const demo=await open(page,'grid-editor-custom'),cell=demo.getByRole('gridcell',{name:'Teams for OWN-1',exact:true});await cell.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await cell.click();await cell.press('Enter');
  const panel=page.getByRole('dialog',{name:'Choose delivery teams',exact:true});await expect(panel).toBeVisible();await panel.getByRole('button',{name:'Clear teams for own-1',exact:true}).click();await panel.getByRole('button',{name:'Apply teams',exact:true}).click();await expect(panel).toBeVisible();await expect(panel.getByRole('alert')).toContainText('at least 1');expect((await canonical(page,'OWN-1',true)).teams).toEqual(['design-ui']);
  await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(panel).toBeHidden();await expect(cell).toBeFocused();
});

test('nested assignee Escape closes the list before discarding the parent transaction',async({page})=>{
  await open(page);const cell=await edit(page,'Assignees for REC-1'),panel=page.getByRole('dialog',{name:'Edit assignees',exact:true}),input=panel.getByRole('combobox',{name:'Assignees for REC-1',exact:true});
  await input.fill('Sam');await page.getByRole('option',{name:'Sam Rivera',exact:true}).click();await input.press('ArrowDown');await expect(page.getByRole('listbox',{name:'Assignees for REC-1 options',exact:true})).toBeVisible();
  await input.press('Escape');await expect(page.getByRole('listbox',{name:'Assignees for REC-1 options',exact:true})).toBeHidden();await expect(panel).toBeVisible();await expect(input).toBeFocused();expect((await canonical(page)).assignees).toEqual(['maya']);
  await input.press('Escape');await expect(panel).toBeHidden();await expect(cell).toBeFocused();expect((await canonical(page)).assignees).toEqual(['maya']);
});
