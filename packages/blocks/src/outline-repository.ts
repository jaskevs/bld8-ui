import type { FormErrors, TableQuery } from '@bld8/ui';

export interface OutlineValues {name:string; due:string; notes:string; status:'Planned'|'Ready'|'Archived'}
export interface OutlineProject extends OutlineValues {id:string;version:number}
export interface OutlinePage {rows:OutlineProject[];total:number}
export interface OutlineActivity {id:string;projectId:string;at:string;kind:'created'|'updated'|'status'|'undo'|'comment';text:string;clientId?:string}
export interface OutlineStatusChange {changed:number;undo:{id:string;count:number}|null}
export interface OutlineHistoryRepository {
  list:(id:string,signal:AbortSignal)=>Promise<OutlineActivity[]>;
  addComment:(id:string,text:string,clientId:string,signal:AbortSignal)=>Promise<OutlineActivity>;
  changeStatus:(ids:string[],status:OutlineValues['status'],signal:AbortSignal)=>Promise<OutlineStatusChange>;
  undoStatus:(id:string,signal:AbortSignal)=>Promise<void>;
}
export interface OutlineRepository {
  /** Optional capability. Legacy adapters can continue to supply project CRUD only. */
  history?:OutlineHistoryRepository;
  /** Stable owner/workspace namespace for tab-local drafts. Omit for memory-only drafts. */
  draftKey?:string;
  get?:(id:string,signal:AbortSignal)=>Promise<OutlineProject|null>;
  list:(query:TableQuery,signal:AbortSignal)=>Promise<OutlinePage>;
  save:(values:OutlineValues,previous:OutlineProject|null,signal:AbortSignal)=>Promise<OutlineProject>;
  setStatus:(ids:string[],status:OutlineValues['status'],signal:AbortSignal)=>Promise<void>;
  remove:(project:OutlineProject,signal:AbortSignal)=>Promise<void>;
}
export class OutlineValidationError extends Error {
  constructor(public fields:FormErrors<OutlineValues>){super('Check the highlighted fields.');}
}
export class OutlineConflictError extends Error {}
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
interface StatusReceipt {id:string;used:boolean;changes:{id:string;status:OutlineValues['status'];version:number}[]}
interface Workspace {schemaVersion:2;projects:OutlineProject[];activity:OutlineActivity[];receipts:StatusReceipt[]}
const statuses=['Planned','Ready','Archived'];
export function isOutlineActivity(value:unknown):value is OutlineActivity {
  if(!value||typeof value!=='object')return false;const item=value as OutlineActivity;
  return typeof item.id==='string'&&item.id.length>0&&typeof item.projectId==='string'&&typeof item.at==='string'&&Number.isFinite(Date.parse(item.at))&&['created','updated','status','undo','comment'].includes(item.kind)&&typeof item.text==='string'&&item.text.length<=1000&&(item.clientId===undefined||typeof item.clientId==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(item.clientId));
}
export function isOutlineStatusChange(value:unknown):value is OutlineStatusChange {
  if(!value||typeof value!=='object')return false;const item=value as OutlineStatusChange;
  return Number.isSafeInteger(item.changed)&&item.changed>=0&&item.changed<=100&&(item.undo===null&&item.changed===0||!!item.undo&&typeof item.undo.id==='string'&&item.undo.id.length>0&&item.undo.count===item.changed&&item.changed>0);
}
function readWorkspace(storage:Storage,key:string):Workspace {
  const raw=storage.getItem(key);const value=raw?JSON.parse(raw):outlineSeed.map(row=>({...row}));
  const state:Workspace=Array.isArray(value)?{schemaVersion:2,projects:value,activity:[],receipts:[]}:value;
  const validProject=(row:OutlineProject)=>row&&typeof row.id==='string'&&typeof row.name==='string'&&typeof row.notes==='string'&&typeof row.due==='string'&&statuses.includes(row.status)&&Number.isSafeInteger(row.version)&&row.version>0;
  if(!state||state.schemaVersion!==2||!Array.isArray(state.projects)||!state.projects.every(validProject)||!Array.isArray(state.activity)||state.activity.length>1000||!state.activity.every(isOutlineActivity)||!Array.isArray(state.receipts)||state.receipts.length>50||!state.receipts.every(receipt=>receipt&&typeof receipt.id==='string'&&typeof receipt.used==='boolean'&&Array.isArray(receipt.changes)&&receipt.changes.length<=100&&receipt.changes.every(change=>change&&typeof change.id==='string'&&statuses.includes(change.status)&&Number.isSafeInteger(change.version)&&change.version>0)))throw new Error('Saved project data could not be read. Export or clear this site’s storage before starting again.');
  return state;
}
/** Browser-backed reference adapter. Replace this contract with your HTTP service. */
export function createOutlineRepository(storage:Storage,key='bld8-outline-projects-v1'):OutlineRepository {
  const read=()=>readWorkspace(storage,key);
  const write=(state:Workspace)=>{try{storage.setItem(key,JSON.stringify(state));}catch{throw new Error('Browser storage is unavailable or full. Your changes have not been saved. Try again.');}};
  const check=(signal:AbortSignal)=>signal.throwIfAborted();
  function record(state:Workspace,projectId:string,kind:OutlineActivity['kind'],text:string,clientId?:string){
    const entry:OutlineActivity={id:crypto.randomUUID(),projectId,kind,text,at:new Date().toISOString(),...(clientId?{clientId}:{})};
    const counts=new Map<string,number>();state.activity=[entry,...state.activity].filter(item=>{const count=(counts.get(item.projectId)??0)+1;counts.set(item.projectId,count);return count<=100;}).slice(0,1000);return entry;
  }
  const history:OutlineHistoryRepository={
    async list(id,signal){check(signal);const state=read();if(!state.projects.some(row=>row.id===id))throw new OutlineConflictError('This project is no longer available.');return state.activity.filter(item=>item.projectId===id);},
    async addComment(id,text,clientId,signal){
      check(signal);text=text.trim();if(!text||text.length>1000)throw new Error('Use between 1 and 1,000 characters.');if(!/^[a-zA-Z0-9-]{16,80}$/.test(clientId))throw new Error('A valid comment request ID is required.');
      const state=read();if(!state.projects.some(row=>row.id===id))throw new OutlineConflictError('This project is no longer available.');
      const existing=state.activity.find(item=>item.projectId===id&&item.kind==='comment'&&item.clientId===clientId);if(existing){if(existing.text!==text)throw new OutlineConflictError('This comment request already saved different text. Refresh before posting again.');return existing;}
      const entry=record(state,id,'comment',text,clientId);check(signal);write(state);return entry;
    },
    async changeStatus(ids,status,signal){
      check(signal);ids=[...new Set(ids)];if(!ids.length||ids.length>100||!statuses.includes(status))throw new Error('Choose up to 100 projects and a valid status.');
      const state=read();if(ids.some(id=>!state.projects.some(row=>row.id===id)))throw new OutlineConflictError('A selected project no longer exists. Refresh the list.');
      const changes=state.projects.filter(row=>ids.includes(row.id)&&row.status!==status).map(row=>({id:row.id,status:row.status,version:row.version+1}));
      if(!changes.length)return {changed:0,undo:null};
      state.projects=state.projects.map(row=>{if(!changes.some(change=>change.id===row.id))return row;record(state,row.id,'status',`Status changed from ${row.status} to ${status}.`);return {...row,status,version:row.version+1};});
      const receipt:StatusReceipt={id:crypto.randomUUID(),used:false,changes};state.receipts=[receipt,...state.receipts].slice(0,50);check(signal);write(state);return {changed:changes.length,undo:{id:receipt.id,count:changes.length}};
    },
    async undoStatus(id,signal){
      check(signal);const state=read(),receipt=state.receipts.find(item=>item.id===id);if(!receipt)throw new OutlineConflictError('This undo is no longer available. Refresh the list.');if(receipt.used)return;
      if(receipt.changes.some(change=>state.projects.find(row=>row.id===change.id)?.version!==change.version))throw new OutlineConflictError('A project changed after this action. Nothing was restored. Refresh the list to review the latest version.');
      state.projects=state.projects.map(row=>{const change=receipt.changes.find(item=>item.id===row.id);if(!change)return row;record(state,row.id,'undo',`Status restored to ${change.status}.`);return {...row,status:change.status,version:row.version+1};});receipt.used=true;check(signal);write(state);
    },
  };
  return {
    history,
    draftKey:'browser:'+key,
    async get(id,signal){check(signal);return read().projects.find(row=>row.id===id) ?? null;},
    async list(query,signal){
      check(signal);let rows=read().projects.filter(row=>(row.name+' '+row.notes).toLocaleLowerCase().includes(query.search.toLocaleLowerCase()) && (!query.filters.status || row.status===query.filters.status));
      const sort=query.sort;if(sort && ['name','due','status'].includes(sort.key)){const key=sort.key as 'name'|'due'|'status';rows.sort((a,b)=>a[key].localeCompare(b[key],undefined,{numeric:true})*(sort.descending?-1:1));}
      const total=rows.length;rows=rows.slice((query.page-1)*query.pageSize,query.page*query.pageSize);check(signal);return {rows,total};
    },
    async save(values,previous,signal){
      check(signal);const fields=validateOutline(values);const state=read(),rows=state.projects;
      if(rows.some(row=>row.id!==previous?.id && row.name.toLocaleLowerCase()===values.name.trim().toLocaleLowerCase()))fields.name='A project with this name already exists.';
      if(Object.values(fields).some(Boolean))throw new OutlineValidationError(fields);
      const existing=previous?rows.find(row=>row.id===previous.id):null;
      if(previous && existing?.version!==previous.version)throw new OutlineConflictError('This project changed in another tab. Load its latest version before saving. Your draft is still here.');
      const project={...values,name:values.name.trim(),notes:values.notes.trim(),id:previous?.id ?? crypto.randomUUID(),version:(previous?.version ?? 0)+1};
      state.projects=previous?rows.map(row=>row.id===previous.id?project:row):[project,...rows];
      const labels={name:'name',due:'review date',status:'status',notes:'notes'};
      const changed=(Object.keys(labels) as (keyof OutlineValues)[]).filter(key=>existing&&existing[key]!==project[key]).map(key=>labels[key]);
      record(state,project.id,previous?'updated':'created',previous?(changed.length?'Updated '+changed.join(', ')+'.':'Project saved.'):'Project created.');
      check(signal);write(state);return project;
    },
    async setStatus(ids,status,signal){await history.changeStatus(ids,status,signal);},
    async remove(project,signal){check(signal);const state=read();if(state.projects.find(row=>row.id===project.id)?.version!==project.version)throw new OutlineConflictError('This project changed. Refresh the list before deleting it.');state.projects=state.projects.filter(row=>row.id!==project.id);state.activity=state.activity.filter(item=>item.projectId!==project.id);check(signal);write(state);},
  };
}
