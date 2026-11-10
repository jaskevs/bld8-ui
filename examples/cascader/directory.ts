import type {CascaderNode} from '../../packages/ui/src/cascader-state.js';

/** A small authored hierarchy; these records do not describe an account. */
export const projectAreas:readonly CascaderNode[]=[
  {value:'engineering',label:'Engineering',parentValue:null,hasChildren:true},
  {value:'design',label:'Design',parentValue:null,hasChildren:true},
  {value:'operations',label:'Operations',parentValue:null,hasChildren:false,disabled:true},
  {value:'frontend',label:'Frontend',parentValue:'engineering',hasChildren:true},
  {value:'backend',label:'Backend',parentValue:'engineering',hasChildren:true},
  {value:'react',label:'React',description:'Web interfaces',parentValue:'frontend',hasChildren:false},
  {value:'angular',label:'Angular',description:'Application platforms',parentValue:'frontend',hasChildren:false},
  {value:'dotnet',label:'.NET',description:'Services and APIs',parentValue:'backend',hasChildren:false},
  {value:'nestjs',label:'NestJS',description:'Node services',parentValue:'backend',hasChildren:false},
  {value:'systems',label:'Systems',parentValue:'design',hasChildren:false},
  {value:'research',label:'Research',parentValue:'design',hasChildren:false},
];
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
function readPath(raw:string|null):string[] {
  const values:unknown=JSON.parse(raw??'[]');
  if(!Array.isArray(values)||values.length>8||Array.from(values).some(value=>typeof value!=='string'||!value||value.length>128)||new Set(values).size!==values.length)throw Error('Invalid path');
  let parent:string|null=null;
  for(const id of values){const node=projectAreas.find(item=>item.value===id&&item.parentValue===parent);if(!node||node.disabled)throw Error('Unknown path');parent=id;}
  return values;
}
export function handleProjectAreas(request:Request):Response {
  if(request.method!=='GET')return json({error:'Use GET.'},405);
  try{
    const params=new URL(request.url).searchParams,allowed=new Set(['path','values','query','cursor','fail']);
    for(const key of params.keys())if(!allowed.has(key)||params.getAll(key).length!==1)throw Error('Invalid parameters');
    if(params.get('fail')==='1')return json({error:'The example source is temporarily unavailable.'},503);
    if(params.has('fail')&&params.get('fail')!=='0')throw Error('Invalid failure flag');
    if(params.has('values')){
      if(params.has('path')||params.has('query')||params.has('cursor'))throw Error('Choose lookup or browse');
      const values=readPath(params.get('values'));
      if(values.length&&projectAreas.find(item=>item.value===values.at(-1))!.hasChildren)throw Error('Choose a leaf');
      return json(values.map(id=>projectAreas.find(item=>item.value===id)!));
    }
    const path=readPath(params.get('path')),parent=path.at(-1)??null;
    if(parent&&!projectAreas.find(item=>item.value===parent)!.hasChildren)throw Error('Cannot browse a leaf');
    const query=params.get('query')??'',cursor=params.get('cursor');
    if(query.length>1000||cursor!==null&&cursor!=='0')throw Error('Invalid page');
    return json({items:projectAreas.filter(item=>item.parentValue===parent&&item.label.toLocaleLowerCase('en-US').includes(query.trim().toLocaleLowerCase('en-US'))),nextCursor:null});
  }catch{return json({error:'Use a valid project-area path and bounded search.'},400);}
}
