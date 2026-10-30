import {test, expect} from '@playwright/test';
import {buildTableRows, getTablePage, getTableWindow, type TableGrouping} from '../packages/ui/src/table-grouping';

type RecordRow = {id:string; status:string; title:string};
const rows: readonly RecordRow[] = Object.freeze([
  Object.freeze({id:'one',status:'review',title:'Review navigation'}),
  Object.freeze({id:'two',status:'backlog',title:'Write the notes'}),
  Object.freeze({id:'three',status:'review',title:'Check focus'}),
  Object.freeze({id:'four',status:'done',title:'Ship the example'}),
  Object.freeze({id:'five',status:'backlog',title:'Try a smaller screen'}),
]);
const key = (row:RecordRow) => row.id;
const grouping:TableGrouping<RecordRow> = {key:row=>row.status,label:value=>value==='review'?'In review':value};

test('grouping keeps first group and source row order without changing caller data',()=>{
  const snapshot=JSON.stringify(rows),nodes=buildTableRows(rows,key,grouping);
  expect(nodes.map(node=>node.id)).toEqual(['group:review','row:one','row:three','group:backlog','row:two','row:five','group:done','row:four']);
  const first=nodes[0];expect(first).toMatchObject({kind:'group',key:'review',label:'In review'});
  if(first.kind!=='group')throw new Error('Expected group');
  expect(first.rows).toEqual([rows[0],rows[2]]);expect(first.rows).not.toBe(rows);
  expect(nodes[1]).toMatchObject({kind:'row',key:'one',groupKey:'review',row:rows[0]});
  expect(JSON.stringify(rows)).toBe(snapshot);
  expect(buildTableRows(rows,key).map(node=>node.id)).toEqual(rows.map(row=>'row:'+row.id));
  expect(buildTableRows(rows,key).every(node=>node.kind==='row'&&!('groupKey' in node))).toBe(true);
});

test('collapse hides members but preserves complete group membership and harmless absent keys',()=>{
  const nodes=buildTableRows(rows,key,grouping,['review','absent']);
  expect(nodes.map(node=>node.id)).toEqual(['group:review','group:backlog','row:two','row:five','group:done','row:four']);
  expect(nodes[0].kind==='group'&&nodes[0].rows.map(row=>row.id)).toEqual(['one','three']);
  expect(buildTableRows(rows,key,grouping,['review','backlog','done'])).toHaveLength(3);
  expect(buildTableRows(rows,key,undefined,['review'])).toHaveLength(rows.length);
  expect(buildTableRows([],key,grouping,['review'])).toEqual([]);
});

test('group and row namespaces preserve adversarial but valid supplied identities',()=>{
  const unusual=[{id:'__proto__',status:'row:__proto__',title:'A'},{id:'group:constructor',status:'constructor',title:'B'},{id:'constructor',status:'row:__proto__',title:'C'}];
  const nodes=buildTableRows(unusual,key,grouping);
  expect(new Set(nodes.map(node=>node.id)).size).toBe(nodes.length);
  expect(nodes.filter(node=>node.kind==='group').map(node=>node.key)).toEqual(['row:__proto__','constructor']);
  expect(nodes.filter(node=>node.kind==='row').map(node=>node.key)).toEqual(['__proto__','constructor','group:constructor']);
});

test('identity validation applies to every row, including collapsed groups',()=>{
  expect(()=>buildTableRows([rows[0],rows[0]],key,grouping,['review'])).toThrow('unique');
  for(const invalid of ['', '  ', 'x'.repeat(257), null, 4]){
    expect(()=>buildTableRows(rows,()=>invalid as string)).toThrow('Row key');
    expect(()=>buildTableRows(rows,key,{...grouping,key:()=>invalid as string})).toThrow('Group key');
    expect(()=>buildTableRows(rows,key,{...grouping,label:()=>invalid as string})).toThrow('Group label');
    expect(()=>buildTableRows(rows,key,grouping,[invalid as string])).toThrow('Collapsed group key');
  }
  expect(()=>buildTableRows(rows,key,grouping,['review','review'])).toThrow('unique');
  expect(()=>buildTableRows(rows,key,{key:grouping.key} as TableGrouping<RecordRow>)).toThrow('group-label');
  expect(()=>buildTableRows(null as unknown as RecordRow[],key)).toThrow('20000');
});

test('bounded models support twenty thousand rows and distinct one-row groups',()=>{
  const large=Array.from({length:20_000},(_,index)=>({id:String(index),status:'group-'+index,title:'Issue '+index}));
  const nodes=buildTableRows(large,key,grouping);
  expect(nodes).toHaveLength(40_000);
  expect(nodes[0].id).toBe('group:group-0');expect(nodes.at(-1)?.id).toBe('row:19999');
  expect(()=>buildTableRows([...large,large[0]],key,grouping)).toThrow('20000');
  const window=getTableWindow(nodes.length,1e10,600,48,5);
  expect(window.end).toBe(nodes.length);expect(window.indices.length).toBeLessThanOrEqual(24);
});

test('fixed-height windows clamp scroll extents and cover exactly the viewport plus overscan',()=>{
  expect(getTableWindow(100,0,100,20,2)).toEqual({start:0,end:7,indices:[0,1,2,3,4,5,6]});
  expect(getTableWindow(100,100,100,20,2)).toEqual({start:3,end:12,indices:[3,4,5,6,7,8,9,10,11]});
  expect(getTableWindow(100,-400,100,20,2)).toEqual(getTableWindow(100,0,100,20,2));
  const end=getTableWindow(100,1e10,100,20,2);
  expect(end).toEqual({start:93,end:100,indices:[93,94,95,96,97,98,99]});
  expect(getTableWindow(0,100,100,20,2)).toEqual({start:0,end:0,indices:[]});
  expect(getTableWindow(3,100,1000,20,0)).toEqual({start:0,end:3,indices:[0,1,2]});
  expect(getTableWindow(3,0,30,20,0)).toEqual({start:0,end:2,indices:[0,1]});
});

test('retained focus adds one sorted unique row without inflating the contiguous range',()=>{
  const baseline=getTableWindow(100,100,100,20,1);
  expect(getTableWindow(100,100,100,20,1,1)).toEqual({...baseline,indices:[1,...baseline.indices]});
  expect(getTableWindow(100,100,100,20,1,99)).toEqual({...baseline,indices:[...baseline.indices,99]});
  expect(getTableWindow(100,100,100,20,1,5)).toEqual(baseline);
  for(const removed of [-1,100,999])expect(getTableWindow(100,100,100,20,1,removed)).toEqual(baseline);
});

test('window geometry rejects non-finite values and unsafe allocation ranges',()=>{
  for(const count of [-1,1.5,40_001,NaN,Infinity])expect(()=>getTableWindow(count,0,100,20,2)).toThrow();
  for(const offset of [NaN,Infinity,-Infinity])expect(()=>getTableWindow(10,offset,100,20,2)).toThrow('Scroll');
  for(const size of [0,-1,NaN,Infinity]){
    expect(()=>getTableWindow(10,0,size,20,2)).toThrow('Window');
    expect(()=>getTableWindow(10,0,100,size,2)).toThrow('Row height');
  }
  for(const overscan of [-1,1.5,101,NaN,Infinity])expect(()=>getTableWindow(10,0,100,20,overscan)).toThrow('Overscan');
  expect(()=>getTableWindow(10,0,100,Number.MAX_VALUE,2)).toThrow('extent');
  expect(()=>getTableWindow(10,0,100,20,2,1.5)).toThrow('Retained');
});

test('paged reading restores a continued group header without double-counting logical entries',()=>{
  const nodes=buildTableRows(rows,key,grouping);
  const second=getTablePage(nodes,2,2);
  expect(second).toMatchObject({page:2,pages:4,start:2,end:4,total:8});
  expect(second.nodes.map(node=>node.id)).toEqual(['group:review','row:three','group:backlog']);
  expect(getTablePage(nodes,3,2).nodes.map(node=>node.id)).toEqual(['group:backlog','row:two','row:five']);
  expect(getTablePage(nodes,4,2).nodes.map(node=>node.id)).toEqual(['group:done','row:four']);
  expect(getTablePage(nodes,999,2)).toEqual(getTablePage(nodes,4,2));
  expect(getTablePage(nodes,1,2).nodes.map(node=>node.id)).toEqual(['group:review','row:one']);
});

test('page boundaries handle ungrouped, collapsed and empty data without mutating nodes',()=>{
  const plain=buildTableRows(rows,key),snapshot=JSON.stringify(plain);
  expect(getTablePage(plain,2,2)).toMatchObject({page:2,pages:3,start:2,end:4,total:5});
  expect(getTablePage(plain,3,2).nodes.map(node=>node.key)).toEqual(['five']);
  expect(JSON.stringify(plain)).toBe(snapshot);
  const collapsed=buildTableRows(rows,key,grouping,['review','backlog','done']);
  expect(getTablePage(collapsed,2,2)).toMatchObject({page:2,pages:2,start:2,end:3,total:3});
  expect(getTablePage([],99,10)).toEqual({nodes:[],page:1,pages:1,start:0,end:0,total:0});
  for(const invalid of [0,-1,1.5,NaN,Infinity]){
    expect(()=>getTablePage(plain,invalid,2)).toThrow('Page');
    expect(()=>getTablePage(plain,1,invalid)).toThrow('Page size');
  }
});
