import { test, expect } from '@playwright/test';
import { createTreeIndex, findTreeTypeahead, getVisibleTreeItems, type TreeNode } from '../packages/ui/src/tree-state';

const nodes: readonly TreeNode[] = [
  {id:'src',label:'src',children:[
    {id:'components',label:'components',children:[{id:'button',label:'button.tsx'},{id:'dialog',label:'dialog.tsx'}]},
    {id:'app',label:'app.tsx'},
  ]},
  {id:'readme',label:'README.md'},
  {id:'private',label:'Private notes',disabled:true,children:[{id:'secret',label:'Hidden child'}]},
  {id:'references',label:'References',hasChildren:true},
  {id:'empty',label:'Empty folder',hasChildren:true,children:[]},
];

test('tree indexing keeps supplied order and truthful nesting without changing source data',()=>{
  const snapshot=JSON.stringify(nodes),index=createTreeIndex(nodes);
  expect(index.error).toBeNull();
  expect(index.items.map(item=>item.node.id)).toEqual(['src','components','button','dialog','app','readme','private','secret','references','empty']);
  expect(index.byId.get('button')).toMatchObject({parentId:'components',level:3,position:1,siblingCount:2,branch:false,disabled:false});
  expect(index.byId.get('src')).toMatchObject({parentId:null,level:1,position:1,siblingCount:5,branch:true});
  expect(index.byId.get('secret')?.disabled).toBe(true);
  expect(index.byId.get('references')?.branch).toBe(true);
  expect(index.byId.get('empty')?.branch).toBe(false);
  expect(JSON.stringify(nodes)).toBe(snapshot);
});

test('visible tree rows require every ancestor to be open but keep disabled rows in ARIA positions',()=>{
  const index=createTreeIndex(nodes);
  expect(getVisibleTreeItems(index,[]).map(item=>item.node.id)).toEqual(['src','readme','private','references','empty']);
  expect(getVisibleTreeItems(index,['components']).map(item=>item.node.id)).not.toContain('button');
  expect(getVisibleTreeItems(index,['src','components','missing']).map(item=>item.node.id)).toEqual(['src','components','button','dialog','app','readme','private','references','empty']);
  expect(getVisibleTreeItems(index,['src']).find(item=>item.node.id==='components')).toMatchObject({position:1,siblingCount:2});
  expect(getVisibleTreeItems(index,['private']).find(item=>item.node.id==='secret')?.disabled).toBe(true);
});

test('loaded empty children become a leaf and failed lazy branches remain expandable',()=>{
  const unloaded=createTreeIndex([{id:'remote',label:'Remote files',hasChildren:true}]);
  const empty=createTreeIndex([{id:'remote',label:'Remote files',hasChildren:true,children:[]}]);
  const loaded=createTreeIndex([{id:'remote',label:'Remote files',children:[{id:'note',label:'Note'}]}]);
  expect(unloaded.byId.get('remote')?.branch).toBe(true);
  expect(getVisibleTreeItems(unloaded,['remote'])).toHaveLength(1);
  expect(empty.byId.get('remote')?.branch).toBe(false);
  expect(getVisibleTreeItems(loaded,['remote']).map(item=>item.node.id)).toEqual(['remote','note']);
});

test('invalid identity, malformed children and cyclic trees fail as a whole',()=>{
  const cycle:TreeNode={id:'cycle',label:'Cycle'};
  cycle.children=[cycle];
  const invalid:readonly TreeNode[][]=[
    [{id:'same',label:'First'},{id:'same',label:'Second'}],
    [{id:'parent',label:'Parent',children:[{id:'parent',label:'Duplicate'}]}],
    [{id:' ',label:'Empty id'}],
    [{id:'empty-label',label:' '}],
    [cycle],
    [{id:'broken',label:'Broken',children:{} as readonly TreeNode[]}],
  ];
  for(const input of invalid){const index=createTreeIndex(input);expect(index.error).toBeTruthy();expect(index.items).toEqual([]);expect(index.byId.size).toBe(0);}
  expect(createTreeIndex([]).error).toBeNull();
});

test('typeahead wraps names, keeps a longer prefix on the current match and skips unavailable nodes',()=>{
  const index=createTreeIndex([{id:'alpha',label:'Alpha'},{id:'beta',label:'Beta',description:'Alpha metadata'},
    {id:'blocked',label:'Alpine',disabled:true},{id:'almanac',label:'Almanac'}]);
  const visible=getVisibleTreeItems(index,[]);
  expect(findTreeTypeahead(visible,'alpha','a')).toBe('almanac');
  expect(findTreeTypeahead(visible,'almanac','A')).toBe('alpha');
  expect(findTreeTypeahead(visible,'alpha','alph',true)).toBe('alpha');
  expect(findTreeTypeahead(visible,'alpha','alpi')).toBeNull();
  expect(findTreeTypeahead(visible,'alpha','beta')).toBe('beta');
  expect(findTreeTypeahead(visible,'missing','alpha')).toBe('alpha');
  expect(findTreeTypeahead(visible,null,'')).toBeNull();
  expect(findTreeTypeahead([],null,'a')).toBeNull();
});
