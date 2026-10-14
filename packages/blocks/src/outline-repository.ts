import type { FormErrors, TableQuery } from '@bld8/ui';

export interface OutlineValues {name:string; due:string; notes:string; status:'Planned'|'Ready'|'Archived'}
export interface OutlineProject extends OutlineValues {id:string;version:number}
export interface OutlinePage {rows:OutlineProject[];total:number}
export interface OutlineRepository {
  list:(query:TableQuery,signal:AbortSignal)=>Promise<OutlinePage>;
  save:(values:OutlineValues,previous:OutlineProject|null,signal:AbortSignal)=>Promise<OutlineProject>;
  setStatus:(ids:string[],status:OutlineValues['status'],signal:AbortSignal)=>Promise<void>;
  remove:(project:OutlineProject,signal:AbortSignal)=>Promise<void>;
}
export class OutlineValidationError extends Error {
  constructor(public fields:FormErrors<OutlineValues>){super('Check the highlighted fields.');}
}
export const outlineSeed:OutlineProject[]=[
  ['keyboard','Keyboard review','2026-10-20','Planned'],['interface','Interface studies','2026-10-24','Planned'],
  ['forms','Form patterns','2026-10-28','Ready'],['navigation','Navigation audit','2026-11-02','Planned'],
  ['tokens','Theme tokens','2026-11-06','Ready'],['docs','Usage guide','2026-11-10','Planned'],
  ['motion','Motion studies','2026-11-14','Planned'],['mobile','Mobile checks','2026-11-18','Ready'],
].map(([id,name,due,status])=>({id,name,due,status:status as OutlineValues['status'],notes:'',version:1}));
export function validateOutline(values:OutlineValues):FormErrors<OutlineValues> {
  const fields:FormErrors<OutlineValues>={};
  if(values.name.trim().length<3)fields.name='Use at least three characters.';
  if(values.name.trim().length>80)fields.name='Keep the name within 80 characters.';
  const parsed=Date.parse(values.due+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(values.due) || Number.isNaN(parsed) || new Date(parsed).toISOString().slice(0,10)!==values.due)fields.due='Choose a valid review date.';
  if(values.notes.length>1000)fields.notes='Keep notes within 1,000 characters.';
  if(!['Planned','Ready','Archived'].includes(values.status))fields.status='Choose a valid status.';
  return fields;
}
function readProjects(storage:Storage,key:string):OutlineProject[] {
  const raw=storage.getItem(key);if(!raw)return outlineSeed.map(row=>({...row}));
  const value:unknown=JSON.parse(raw);
  if(!Array.isArray(value) || !value.every(row=>row && typeof row.id==='string' && typeof row.name==='string' && typeof row.notes==='string' && typeof row.due==='string' && ['Planned','Ready','Archived'].includes(row.status) && Number.isInteger(row.version)))throw new Error('Saved project data could not be read. Export or clear this site’s storage before starting again.');
  return value;
}
/** Browser-backed reference adapter. Replace this contract with your HTTP service. */
export function createOutlineRepository(storage:Storage,key='bld8-outline-projects-v1'):OutlineRepository {
  const read=()=>readProjects(storage,key);
  const write=(rows:OutlineProject[])=>{try{storage.setItem(key,JSON.stringify(rows));}catch{throw new Error('Browser storage is unavailable or full. Your changes have not been saved. Try again.');}};
  const check=(signal:AbortSignal)=>signal.throwIfAborted();
  return {
    async list(query,signal){
      check(signal);let rows=read().filter(row=>(row.name+' '+row.notes).toLocaleLowerCase().includes(query.search.toLocaleLowerCase()) && (!query.filters.status || row.status===query.filters.status));
      const sort=query.sort;if(sort && ['name','due','status'].includes(sort.key)){const key=sort.key as 'name'|'due'|'status';rows.sort((a,b)=>a[key].localeCompare(b[key],undefined,{numeric:true})*(sort.descending?-1:1));}
      const total=rows.length;rows=rows.slice((query.page-1)*query.pageSize,query.page*query.pageSize);check(signal);return {rows,total};
    },
    async save(values,previous,signal){
      check(signal);const fields=validateOutline(values);const rows=read();
      if(rows.some(row=>row.id!==previous?.id && row.name.toLocaleLowerCase()===values.name.trim().toLocaleLowerCase()))fields.name='A project with this name already exists.';
      if(Object.values(fields).some(Boolean))throw new OutlineValidationError(fields);
      const existing=previous?rows.find(row=>row.id===previous.id):null;
      if(previous && existing?.version!==previous.version)throw new Error('This project changed in another tab. Close and reopen it before saving. Your draft is still here.');
      const project={...values,name:values.name.trim(),notes:values.notes.trim(),id:previous?.id ?? crypto.randomUUID(),version:(previous?.version ?? 0)+1};
      check(signal);write(previous?rows.map(row=>row.id===previous.id?project:row):[project,...rows]);return project;
    },
    async setStatus(ids,status,signal){check(signal);write(read().map(row=>ids.includes(row.id)?{...row,status,version:row.version+1}:row));},
    async remove(project,signal){check(signal);const rows=read();if(rows.find(row=>row.id===project.id)?.version!==project.version)throw new Error('This project changed. Refresh the list before deleting it.');write(rows.filter(row=>row.id!==project.id));},
  };
}
