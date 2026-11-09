import type {OutlineProject,OutlineValues} from './outline-repository.js';

export const outlineFields=['name','due','notes','status'] as const;
export const projectValues=(project:OutlineValues):OutlineValues=>({name:project.name,due:project.due,notes:project.notes,status:project.status});
export interface OutlineDraft {schemaVersion:1;previous:OutlineProject|null;values:OutlineValues;updatedAt:number}
function values(value:unknown):value is OutlineValues {
  if(!value||typeof value!=='object')return false;const row=value as Record<string,unknown>;
  return typeof row.name==='string'&&row.name.length<=80&&typeof row.notes==='string'&&row.notes.length<=1000&&typeof row.due==='string'&&row.due.length<=10&&typeof row.status==='string'&&['Planned','Ready','Archived'].includes(row.status);
}
export function parseOutlineDraft(raw:string|null,id:string|null):OutlineDraft|null {
  if(!raw||raw.length>8000)return null;
  try{const item=JSON.parse(raw) as OutlineDraft;
    if(item.schemaVersion!==1||!values(item.values)||!Number.isFinite(item.updatedAt)||item.updatedAt<=0)return null;
    if(id===null)return item.previous===null?item:null;
    return item.previous&&values(item.previous)&&item.previous.id===id&&Number.isSafeInteger(item.previous.version)&&item.previous.version>0?item:null;
  }catch{return null;}
}
/** Only fields edited in the draft replace values from the latest saved record. */
export function rebaseOutlineDraft(previous:OutlineValues,draft:OutlineValues,latest:OutlineValues):OutlineValues {
  const result=projectValues(latest);for(const key of outlineFields)if(draft[key]!==previous[key])Object.assign(result,{[key]:draft[key]});return result;
}
/** Tab-local recovery. Hosts opt in with a stable owner/workspace namespace. */
export function createOutlineDraftStore(storage?:Storage,namespace?:string){
  const memory=new Map<string,OutlineDraft>();let problem='';
  const comments=new Map<string,{text:string;clientId:string}>();
  const key=(id:string|null)=>id===null?'new':'project:'+id;
  const path=(id:string|null)=>'bld8-outline-draft-v1:'+encodeURIComponent(namespace!)+':'+encodeURIComponent(key(id));
  const durable=!!storage&&!!namespace;
  return {
    /** Unsent comments stay in this repository instance, not persistent browser storage. */
    getComment(id:string){return comments.get(id)??{text:'',clientId:''};},
    putComment(id:string,draft:{text:string;clientId:string}){if(draft.text)comments.set(id,{...draft});else comments.delete(id);},
    get problem(){return problem;},
    get recoverable(){return durable&&!problem;},
    get(id:string|null){
      if(memory.has(key(id)))return memory.get(key(id))!;
      if(durable)try{const raw=storage!.getItem(path(id));const draft=parseOutlineDraft(raw,id);if(draft)memory.set(key(id),draft);else if(raw)problem='The stored draft could not be read. The saved project is unchanged.';return draft;}catch{problem='Draft storage is unavailable. Changes can only be kept while this page stays open.';}
      return null;
    },
    put(previous:OutlineProject|null,values:OutlineValues){
      const draft:OutlineDraft={schemaVersion:1,previous:previous?{...previous}:null,values:projectValues(values),updatedAt:Date.now()};memory.set(key(previous?.id??null),draft);
      if(durable)try{storage!.setItem(path(previous?.id??null),JSON.stringify(draft));problem='';}catch{problem='Changes are kept in memory only. Reloading may restore an older draft.';}
      return draft;
    },
    clear(id:string|null){
      if(durable)try{storage!.removeItem(path(id));problem='';}catch{problem='The stored draft could not be removed. Try again before discarding it.';return false;}
      memory.delete(key(id));return true;
    },
  };
}
export type OutlineDraftStore=ReturnType<typeof createOutlineDraftStore>;
