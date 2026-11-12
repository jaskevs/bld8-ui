import {test,expect} from '@playwright/test';
import {gridApplySelectionEdits,gridFillDownEdits,type GridRange} from '../packages/ui/src/data-grid-state';
import type {DataColumn} from '../packages/ui/src/data-workspace-state';
import {checkGridBulk} from '../scripts/check-grid-bulk.mjs';

interface Row {id:string;revision:number;title:string;estimate:number;approved:boolean;people:string[]}
const columns:DataColumn<Row>[]=[
  {key:'id',label:'Record',type:'text',editable:true},
  {key:'title',label:'Task',type:'text',editable:true,required:true},
  {key:'estimate',label:'Estimate',type:'number',editable:true,min:0,max:20},
  {key:'approved',label:'Approved',type:'boolean',editable:true},
  {key:'people',label:'People',type:'multi-select',editable:true,options:[{value:'maya',label:'Maya'},{value:'sam',label:'Sam'},{value:'old',label:'Unavailable',disabled:true}]},
  {key:'revision',label:'Revision',type:'number',editable:true},
];
const rows:Row[]=[{id:'ONE',revision:1,title:'First',estimate:3,approved:true,people:['maya']},{id:'TWO',revision:2,title:'Second',estimate:5,approved:false,people:['sam']},{id:'THREE',revision:3,title:'Third',estimate:8,approved:false,people:[]}];
const range=(top:number,left:number,bottom:number,right=left):GridRange=>({anchor:{row:top,column:left},focus:{row:bottom,column:right}});

test('pure fill down validates canonical values, skips protected identities and leaves inputs untouched',()=>{
  const before=JSON.stringify(rows),edits=gridFillDownEdits(rows,columns,range(0,0,2,5));expect(edits).toHaveLength(8);expect(edits.every(edit=>edit.id!=='ONE'&&edit.key!=='id'&&edit.key!=='revision')).toBe(true);
  expect(edits.filter(edit=>edit.key==='estimate').map(edit=>edit.value)).toEqual([3,3]);expect(edits.filter(edit=>edit.key==='approved').map(edit=>edit.value)).toEqual([true,true]);
  const people=edits.filter(edit=>edit.key==='people').map(edit=>edit.value as string[]);expect(people).toEqual([['maya'],['maya']]);expect(people[0]).not.toBe(rows[0].people);expect(people[0]).not.toBe(people[1]);expect(JSON.stringify(rows)).toBe(before);
});

test('pure apply selection parses every destination and omits unchanged canonical values',()=>{
  expect(gridApplySelectionEdits(rows,columns,range(0,2,2),'9')).toEqual(rows.map(row=>({id:row.id,key:'estimate',value:9})));
  expect(gridApplySelectionEdits(rows,columns,range(0,2,2),3)).toEqual([{id:'TWO',key:'estimate',value:3},{id:'THREE',key:'estimate',value:3}]);
  expect(gridApplySelectionEdits(rows,columns,range(0,0,2,1),'Renamed').map(edit=>edit.key)).toEqual(['title','title','title']);
});

test('pure mixed destination failure rejects the entire operation with a useful location',()=>{
  const before=JSON.stringify(rows);expect(()=>gridApplySelectionEdits(rows,columns,range(0,1,2,2),'Updated')).toThrow('Estimate for ONE: Enter a decimal number');expect(JSON.stringify(rows)).toBe(before);
  const invalid=[{...rows[0],estimate:21},rows[1],rows[2]];expect(()=>gridFillDownEdits(invalid,columns,range(0,1,2,2))).toThrow('Estimate for TWO: Use 20 or less');expect(invalid[1].title).toBe('Second');
});

test('pure bulk edits reject stale or excessive loaded ranges instead of truncating',()=>{
  for(const bounds of [range(-1,1,1),range(0,1,3),range(0,1,1,6),range(0,.5,1)])expect(()=>gridFillDownEdits(rows,columns,bounds)).toThrow(/loaded rows and columns/);
  const manyRows=Array.from({length:100},(_,index)=>({...rows[0],id:'ROW-'+index}));const wide=Array.from({length:30},(_,index)=>({...columns[1],key:('field'+index) as keyof Row}));
  expect(()=>gridApplySelectionEdits(manyRows,wide,range(0,0,99,29),'Value')).toThrow(/2,000/);
  expect(()=>gridFillDownEdits([...manyRows,{...rows[0],id:'EXTRA'}],columns,range(0,1,1))).toThrow(/loaded page/);
  expect(()=>gridFillDownEdits([rows[0],rows[0]],columns,range(0,1,1))).toThrow(/unique/);
  expect(()=>gridFillDownEdits(rows,[columns[1],columns[1]],range(0,0,1))).toThrow(/unique/);
});

test('pure reverse selections preserve fill direction and empty/read-only changes stay empty',()=>{
  const selected=range(0,1,2,4);expect(gridFillDownEdits(rows,columns,{anchor:selected.focus,focus:selected.anchor})).toEqual(gridFillDownEdits(rows,columns,selected));
  expect(gridFillDownEdits(rows,columns,range(0,0,2))).toEqual([]);expect(gridApplySelectionEdits(rows,columns,range(0,5,2),99)).toEqual([]);expect(gridFillDownEdits(rows,columns,range(0,1,0,4))).toEqual([]);
  expect(gridApplySelectionEdits(rows,columns,range(0,1,2),'First').map(edit=>edit.id)).toEqual(['TWO','THREE']);
});

test('pure bulk validation keeps required approvals and disabled people out of the whole batch',()=>{
  expect(()=>gridApplySelectionEdits(rows,[{...columns[3],required:true}],range(0,0,2),false)).toThrow(/Confirm approved/);
  expect(()=>gridApplySelectionEdits(rows,columns,range(0,4,2),['old'])).toThrow(/available people/);
  expect(()=>gridApplySelectionEdits(rows,columns,range(0,4,2),['maya','maya'])).toThrow(/distinct option IDs/);
});

test('bulk range transactions validate atomically, preserve read-only cells and undo once',async({page})=>{
  await page.goto('/components/data-grid/examples/grid-bulk-operations');await checkGridBulk(page,id=>page.locator('[data-example-id="'+id+'"]'));
});

test('collapsing a pending selection makes bulk actions unavailable without changing the draft',async({page})=>{
  await page.goto('/components/data-grid/examples/grid-bulk-operations');const example=page.locator('[data-example-id="grid-bulk-operations"]'),run=example.getByRole('button',{name:'Run example',exact:true});if(await run.count())await run.click();const cell=example.getByRole('gridcell',{name:'Estimate for BULK-1',exact:true});await cell.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await cell.click();await cell.press('Shift+ArrowDown');await expect(example.getByRole('button',{name:'Fill down',exact:true})).toBeEnabled();await page.keyboard.press('Escape');await expect(example.getByRole('button',{name:'Fill down',exact:true})).toBeDisabled();await expect(example.getByRole('button',{name:'Apply value',exact:true})).toBeDisabled();await expect(example.getByLabel('Bulk transaction counts',{exact:true})).toHaveText('{"batches":0,"lastBatch":0,"saves":0}');
});

test('320px bulk action targets form stable paired rows with readable labels',async({page})=>{
  await page.setViewportSize({width:320,height:900});await page.goto('/components/data-grid/examples/grid-bulk-operations');const example=page.locator('[data-example-id="grid-bulk-operations"]');await expect(example.locator('[data-example-ready]')).toBeVisible();const actions=example.locator('[data-bulk-editing] .bui-data-grid-actions'),buttons=actions.locator('>.bui-button');
  await expect(buttons).toHaveCount(5);const boxes=await buttons.evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,overflow:node.scrollWidth>node.clientWidth};}));
  for(const box of boxes){expect(box.height).toBeGreaterThanOrEqual(44);expect(box.overflow).toBe(false);}expect(boxes[0].y).toBeCloseTo(boxes[1].y,1);expect(boxes[2].y).toBeCloseTo(boxes[3].y,1);expect(boxes[0].x).toBeCloseTo(boxes[2].x,1);expect(boxes[1].x).toBeCloseTo(boxes[3].x,1);expect(boxes[4].width).toBeGreaterThan(boxes[0].width);
  const before=await actions.boundingBox(),cell=example.getByRole('gridcell',{name:'Estimate for BULK-1',exact:true});await cell.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await cell.click();await cell.press('Shift+ArrowDown');const after=await actions.boundingBox();expect(after!.height).toBeCloseTo(before!.height,1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
