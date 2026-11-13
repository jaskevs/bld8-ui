import {test,expect,type Page} from '@playwright/test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {dataGridWindow,flattenDataTree,summarizeDataRows,validDataSummarySnapshot,type DataSummarySpec} from '../packages/ui/src/advanced-data-state';
import type {DataColumn} from '../packages/ui/src/data-workspace-state';

type Row={id:string;revision:number;parent:string;value:number};
const rows:Row[]=[{id:'root',revision:1,parent:'',value:2},{id:'child',revision:1,parent:'root',value:4},{id:'leaf',revision:1,parent:'child',value:6},{id:'other',revision:1,parent:'',value:8}];
const parent=(row:Row)=>row.parent||null;
const specs:DataSummarySpec<Row>[]=[{id:'count',label:'Rows',operation:'count'},{id:'sum',label:'Value sum',operation:'sum',key:'value'},{id:'avg',label:'Value mean',operation:'average',key:'value'}];
const example=(page:Page,id:string)=>page.locator('[data-example-id="'+id+'"]');
async function open(page:Page,id:string){await page.goto('/components/data-grid/examples/'+id);const demo=example(page,id);await demo.scrollIntoViewIfNeeded();const run=demo.getByRole('button',{name:'Run example',exact:true});if(await run.count())await run.click();await expect(demo.locator('.bui-advanced-grid')).toBeVisible();return demo;}

test('virtual window stays bounded over twenty thousand records and retains explicit focus indices',()=>{
  for(const count of [10000,20000])for(const offset of [0,640,64000,640000]){
    const result=dataGridWindow(count,offset,480,64,4,[0,count-1,500]);
    expect(result.indices.length).toBeLessThanOrEqual(20);expect(result.indices).toContain(0);expect(result.indices).toContain(count-1);
    expect(result.indices.every(index=>index>=0&&index<count)).toBe(true);expect(result.indices).toEqual([...result.indices].sort((a,b)=>a-b));
  }
  expect(dataGridWindow(0,0,480,64,4).indices).toEqual([]);
  expect(dataGridWindow(10,NaN,0,0,100).height).toBe(240);expect(()=>dataGridWindow(20001,0,480,64,4)).toThrow();
});

test('tree identity, depth and visible scope remain explicit through collapse',()=>{
  const before=JSON.stringify(rows);
  expect(flattenDataTree(rows,parent,[]).map(node=>node.row.id)).toEqual(['root','other']);
  const expanded=flattenDataTree(rows,parent,['root','child']);
  expect(expanded.map(node=>[node.row.id,node.depth,node.expanded])).toEqual([['root',0,true],['child',1,true],['leaf',2,false],['other',0,false]]);
  expect(flattenDataTree(rows,parent,['child']).map(node=>node.row.id)).toEqual(['root','other']);
  expect(JSON.stringify(rows)).toBe(before);
  expect(()=>flattenDataTree([...rows,rows[0]],parent,[])).toThrow(/distinct/);
  expect(()=>flattenDataTree([{...rows[0],parent:'missing'}],parent,[])).toThrow(/parent/);
  expect(()=>flattenDataTree([{...rows[0],parent:'child'},rows[1]],parent,[])).toThrow(/cycle/);
  expect(()=>flattenDataTree(Array.from({length:9},(_,index)=>({id:'n'+index,revision:1,parent:index?'n'+(index-1):'',value:1})),parent,[])).toThrow(/eight/);
});

test('count, sum and average summarize the supplied scope without inventing absent values',()=>{
  expect(summarizeDataRows(rows,specs)).toEqual([{id:'count',value:4,count:4},{id:'sum',value:20,count:4},{id:'avg',value:5,count:4}]);
  expect(summarizeDataRows([],specs)).toEqual([{id:'count',value:0,count:0},{id:'sum',value:0,count:0},{id:'avg',value:null,count:0}]);
  expect(()=>summarizeDataRows([{...rows[0],value:NaN}],specs)).toThrow(/finite/);
  expect(()=>summarizeDataRows([{...rows[0],value:Number.MAX_VALUE},{...rows[1],value:Number.MAX_VALUE}],specs)).toThrow(/finite/);
});

test('service totals require the exact query and a complete canonical result',()=>{
  const snapshot={queryKey:'query-a',recordCount:4,values:summarizeDataRows(rows,specs)};
  expect(validDataSummarySnapshot(snapshot,'query-a',specs)).toBe(true);expect(validDataSummarySnapshot(snapshot,'query-b',specs)).toBe(false);
  for(const values of [snapshot.values.slice(1),[snapshot.values[0],snapshot.values[0],snapshot.values[2]],[{id:'count',value:3,count:4},...snapshot.values.slice(1)],new Array(3),[null,null,null]])expect(validDataSummarySnapshot({...snapshot,values} as typeof snapshot,'query-a',specs)).toBe(false);
});

test('virtual SSR renders bounded cells and ordinary grid limits remain unchanged',async()=>{
  const {DataGrid}=await import('../packages/ui/dist/data-grid.js');
  const many=Array.from({length:10000},(_,index)=>({...rows[0],id:'row-'+index}));const columns:DataColumn<Row>[]=[{key:'id',label:'ID',type:'text'},{key:'value',label:'Value',type:'number',editable:true}];
  const html=renderToStaticMarkup(createElement(DataGrid<Row>,{label:'Virtual records',rows:many,columns,virtualization:{height:400}}));
  expect(html).toContain('aria-rowcount="10001"');expect(html.match(/role="gridcell"/g)!.length).toBeLessThan(40);expect(html).toContain('bui-data-grid-spacer');
  const ordinary=renderToStaticMarkup(createElement(DataGrid<Row>,{label:'Ordinary records',rows:many,columns}));expect(ordinary).toContain('100 records');expect(ordinary).not.toContain('role="gridcell"');
});

test('ten thousand editable rows keep DOM bounded and keyboard focus reaches an unmounted record',async({page})=>{
  const demo=await open(page,'data-grid-virtualized-10000'),grid=demo.getByRole('grid',{name:'Ten thousand editable records',exact:true});
  await expect(grid).toHaveAttribute('aria-rowcount','10001');expect(await grid.getByRole('gridcell').count()).toBeLessThan(150);
  const first=grid.getByRole('gridcell',{name:'Title for BIG-00001',exact:true});await first.focus();await first.press('Control+End');
  await expect(grid.getByRole('gridcell',{name:'Ready for BIG-10000',exact:true})).toBeFocused();expect(await grid.getByRole('gridcell').count()).toBeLessThan(150);
  await demo.getByRole('button',{name:'Focus the last record',exact:true}).click();const last=grid.getByRole('gridcell',{name:'Title for BIG-10000',exact:true});await expect(last).toBeFocused();await last.press('Enter');
  const input=grid.getByRole('textbox',{name:'Title for BIG-10000',exact:true});await input.fill('Keep this editor');
  await demo.locator('.bui-data-grid-scroll').evaluate(node=>{node.scrollTop=0;});await expect(input).toHaveCount(1);await expect(input).toBeFocused();await expect(input).toHaveValue('Keep this editor');
  expect(await grid.getByRole('gridcell').count()).toBeLessThan(150);await input.press('Enter');await expect(last).toContainText('Keep this editor');
});

test('virtual rows retain geometry, pinned columns and bounded clipboard operations',async({page})=>{
  const demo=await open(page,'data-grid-virtualized-10000'),grid=demo.getByRole('grid',{name:'Ten thousand editable records',exact:true}),scroll=demo.locator('.bui-data-grid-scroll');
  const sizes=await grid.locator('tbody tr[role="row"]').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().height));for(const size of sizes)expect(size).toBeCloseTo(64,1);
  const id=grid.getByRole('gridcell',{name:'Record for BIG-00001',exact:true});const before=(await id.boundingBox())!.x;await scroll.evaluate(node=>{node.scrollLeft=300;});expect((await id.boundingBox())!.x).toBeCloseTo(before,1);
  const title=grid.getByRole('gridcell',{name:'Title for BIG-00001',exact:true});await title.focus();await title.press('Control+a');await page.keyboard.press('Control+d');await expect(demo.locator('.bui-data-grid-status')).toContainText('100 records');
  await page.keyboard.press('Control+Home');await page.keyboard.press('ArrowRight');await title.evaluate(node=>{const data=new DataTransfer();data.setData('text/plain','Pasted one\nPasted two');node.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));});
  await expect(title).toContainText('Pasted one');await expect(grid.getByRole('gridcell',{name:'Title for BIG-00002',exact:true})).toContainText('Pasted two');
});

test('paged reading shares records and summaries with the windowed view',async({page})=>{
  const demo=await open(page,'data-grid-virtualized-10000');await demo.getByRole('button',{name:'Pages',exact:true}).click();
  const grid=demo.getByRole('grid',{name:'Ten thousand editable records',exact:true});await expect(grid).toHaveAttribute('aria-rowcount','21');await expect(demo.getByRole('region',{name:'Loaded record summaries',exact:true})).toContainText('This page');
  await demo.getByRole('navigation',{name:'Loaded record pages',exact:true}).getByRole('button',{name:'Next',exact:true}).click();await expect(grid.getByRole('gridcell',{name:'Title for BIG-00021',exact:true})).toBeVisible();
  await demo.getByRole('button',{name:'Scroll',exact:true}).click();await expect(grid).toHaveAttribute('aria-rowcount','10001');
});

test('tree child retry preserves row identity and collapsed children leave selection scope',async({page})=>{
  const demo=await open(page,'data-grid-hierarchy-summaries'),grid=demo.getByRole('treegrid',{name:'Project task hierarchy',exact:true});
  await demo.getByRole('checkbox',{name:'Fail next child load',exact:true}).check();const parentCell=grid.getByRole('gridcell',{name:'Record for P-A',exact:true});await parentCell.focus();await parentCell.press('ArrowRight');
  const retry=demo.getByRole('button',{name:'Retry children for P-A',exact:true});await expect(retry).toBeVisible();await retry.focus();await retry.press('Enter');await expect(grid.getByRole('gridcell',{name:'Title for A-1',exact:true})).toBeVisible();await expect(parentCell).toBeFocused();
  // The has locator is relative to each candidate row, rather than requiring
  // another treegrid to exist inside that row.
  await expect(grid.getByRole('row').filter({has:page.getByRole('gridcell',{name:'Record for P-A',exact:true})})).toHaveAttribute('aria-expanded','true');await expect(grid.getByRole('row').filter({has:page.getByRole('gridcell',{name:'Record for A-1',exact:true})})).toHaveAttribute('aria-level','2');
  const child=grid.getByRole('gridcell',{name:'Record for A-1',exact:true});await child.focus();await child.press('ArrowLeft');await expect(parentCell).toBeFocused();await parentCell.press('ArrowLeft');await expect(child).toHaveCount(0);await expect(parentCell).toBeFocused();
  await expect(demo.getByRole('region',{name:'Loaded record summaries',exact:true})).toContainText('2');
});

test('a cancelled child response cannot repopulate a replacement source',async({page})=>{
  const demo=await open(page,'data-grid-hierarchy-summaries'),grid=demo.getByRole('treegrid',{name:'Project task hierarchy',exact:true});await demo.getByRole('checkbox',{name:'Ignore cancellation once',exact:true}).check();
  await grid.getByRole('button',{name:'Expand P-A',exact:true}).click();await expect(demo.getByText('Loading children for P-A…',{exact:true})).toBeVisible();await demo.getByRole('button',{name:'Reset tree source',exact:true}).click();
  await page.waitForTimeout(450);await expect(grid.getByRole('gridcell',{name:'Title for A-1',exact:true})).toHaveCount(0);await expect(grid.getByRole('row')).toHaveCount(3);
});

test('same-tick child responses reserve identities before a second host callback and retry recovers',async({page})=>{
  const demo=await open(page,'data-grid-hierarchy-summaries'),grid=demo.getByRole('treegrid',{name:'Project task hierarchy',exact:true});
  await demo.getByRole('checkbox',{name:'Concurrent duplicate children',exact:true}).check();
  await grid.getByRole('button',{name:'Expand P-A',exact:true}).click();await grid.getByRole('button',{name:'Expand P-B',exact:true}).click();
  await expect(demo.getByText('Loading children for P-A…',{exact:true})).toBeVisible();await expect(demo.getByText('Loading children for P-B…',{exact:true})).toBeVisible();
  // Both promises resolve synchronously in this one click handler, before React
  // can render the first accepted host/cache update.
  await demo.getByRole('button',{name:'Release pending child loads',exact:true}).click();
  const retry=demo.getByRole('button',{name:'Retry children for P-B',exact:true});await expect(retry).toBeVisible();
  await expect(demo.getByLabel('Accepted child batches',{exact:true})).toHaveText('["P-A"]');
  await expect(grid.getByRole('gridcell',{name:'Record for SHARED',exact:true})).toHaveCount(1);await expect(grid.getByRole('gridcell',{name:'Title for SHARED',exact:true})).toContainText('Shared child of P-A');
  await demo.getByRole('checkbox',{name:'Concurrent duplicate children',exact:true}).uncheck();await retry.click();await expect(grid.getByRole('gridcell',{name:'Title for B-1',exact:true})).toBeVisible();
  await expect(demo.getByLabel('Accepted child batches',{exact:true})).toHaveText('["P-A","P-B"]');await expect(grid.getByRole('gridcell',{name:'Title for SHARED',exact:true})).toContainText('Shared child of P-A');
});

test('service summaries reject stale queries and record details preserve return focus',async({page})=>{
  const demo=await open(page,'data-grid-hierarchy-summaries');const matching=demo.getByRole('region',{name:'All matching record summaries',exact:true});await expect(matching).toContainText('6 matching records');
  await demo.getByRole('checkbox',{name:'Show stale totals',exact:true}).check();await expect(matching.getByRole('alert')).toContainText('another query');
  const trigger=demo.getByRole('button',{name:'Open record',exact:true});await trigger.click();const details=demo.getByRole('region',{name:'Record details',exact:true});await expect(details).toContainText('Interface review');await details.getByRole('button',{name:'Close details',exact:true}).click();await expect(trigger).toBeFocused();
});

for(const width of [320,390])test('advanced data remains contained at '+width+' pixels',async({page})=>{
  await page.setViewportSize({width,height:844});const demo=await open(page,'data-grid-virtualized-10000');await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await demo.getByRole('gridcell').count()).toBeLessThan(150);
});
