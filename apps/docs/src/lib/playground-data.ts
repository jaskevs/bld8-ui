import {filterOperators,type FilterField,type FilterQuery} from '@bld8/ui/filter-query';

export interface PlaygroundProject {id:string;name:string;status:'Planned'|'Ready';due:string;effort:number}
export const playgroundRows:PlaygroundProject[]=[
  {id:'1',name:'Study tokens',status:'Planned',due:'2026-10-20',effort:2},
  {id:'2',name:'Review keyboard flow',status:'Ready',due:'2026-10-22',effort:3},
  {id:'3',name:'Write usage notes',status:'Planned',due:'2026-10-24',effort:1},
  {id:'4',name:'Test mobile layout',status:'Ready',due:'2026-10-26',effort:4},
  {id:'5',name:'Inspect form errors',status:'Planned',due:'2026-10-28',effort:2},
  {id:'6',name:'Refine motion',status:'Ready',due:'2026-10-30',effort:3},
];
export const playgroundFilterFields:readonly FilterField[]=[
  {id:'name',label:'Project name',kind:'text'},
  {id:'status',label:'Status',kind:'select',options:[{value:'Planned',label:'Planned'},{value:'Ready',label:'Ready'}]},
  {id:'due',label:'Review date',kind:'date'},
  {id:'effort',label:'Effort',kind:'number'},
];
export const playgroundDisclosures=[
  {value:'overview',title:'Keep the useful context',content:'A short summary belongs close to the action. Open another section to compare single and multiple expansion.'},
  {value:'keyboard',title:'Try it with the keyboard',content:'Tab reaches each heading. Enter or Space opens it; arrow keys move between headings.'},
  {value:'sharing',title:'Take the configuration with you',content:'The configuration link preserves which sections are open. The example below starts in the same state.'},
];
/** Retain bounded incomplete drafts, but never evaluate them before full validation. */
export function readPlaygroundFilterDraft(raw:string):FilterQuery|null {
  try{
    if(raw.length>8000)return null;const value=JSON.parse(raw) as FilterQuery;
    if(!value||value.version!==1||!['all','any'].includes(value.match)||!Array.isArray(value.rules)||value.rules.length>6)return null;
    const ids=new Set<string>();
    for(const rule of value.rules){
      if(!rule||typeof rule.id!=='string'||!/^[\w-]{1,64}$/.test(rule.id)||Object.prototype.hasOwnProperty.call(Object.prototype,rule.id)||ids.has(rule.id))return null;ids.add(rule.id);
      const field=playgroundFilterFields.find(item=>item.id===rule.field);
      if(!field||!filterOperators[field.kind].some(item=>item.value===rule.operator)||!Array.isArray(rule.values)||rule.values.length>2||rule.values.some(item=>typeof item!=='string'||item.length>200))return null;
    }
    return {version:1,match:value.match,rules:value.rules.map(({id,field,operator,values})=>({id,field,operator,values:[...values]}))};
  }catch{return null;}
}
