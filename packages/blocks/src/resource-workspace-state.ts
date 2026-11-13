/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {dataValuesEqual,isDataId,isDataObject,parseDataQuery,parseDataValue,validateDataChanges,type BatchResult,type DataBatchRequest,type DataCellError,type DataChange,type DataColumn,type DataEdit,type DataQuery,type DataRecord,type DataSource} from '@bld8/ui/data-workspace-state';
import {emptyFilterQuery,type FilterField} from '@bld8/ui/filter-query';

export type ResourceFilterField<T extends DataRecord>=Omit<FilterField,'id'>&{id:Extract<keyof T,string>};
export interface ResourceDraft<T extends DataRecord>{base:T;values:Record<string,unknown>}
export type ResourceDrafts<T extends DataRecord>=Record<string,ResourceDraft<T>>;
export interface ResourceWorkspaceState<T extends DataRecord>{
  query:DataQuery;rows:readonly T[];displayRows:readonly T[];total:number;loading:boolean;loadError:string;
  drafts:ResourceDrafts<T>;changes:readonly DataChange<T>[];errors:readonly DataCellError[];conflicts:readonly T[];
  dirtyCells:readonly {id:string;key:string}[];hasDrafts:boolean;canUndo:boolean;canRedo:boolean;
  saving:boolean;uncertain:boolean;editLocked:boolean;saveError:string;notice:string;
}
export interface ResourceControllerOptions<T extends DataRecord>{
  dataSource:DataSource<T>;columns:readonly DataColumn<T>[];fields:readonly ResourceFilterField<T>[];
  initialQuery?:DataQuery;unavailableMessage?:string;createRequestId?:()=>string;
}
export type ResourceSaveOutcome<T extends DataRecord>={status:'saved';rows:readonly T[]}|{status:'rejected'|'uncertain'|'ignored'};
export const createResourceQuery=():DataQuery=>({search:'',filters:emptyFilterQuery(),sorts:[],page:1,pageSize:10});
export function copyResourceRow<T extends DataRecord>(row:T):T{return Object.fromEntries(Object.entries(row).map(([key,value])=>[key,Array.isArray(value)?[...value]:value])) as T;}
const copyValues=(values:Record<string,unknown>)=>Object.fromEntries(Object.entries(values).map(([key,value])=>[key,Array.isArray(value)?[...value]:value]));
export const copyResourceDrafts=<T extends DataRecord>(drafts:ResourceDrafts<T>):ResourceDrafts<T>=>Object.fromEntries(Object.entries(drafts).map(([id,draft])=>[id,{base:copyResourceRow(draft.base),values:copyValues(draft.values)}]));
export const resourceDraftChanges=<T extends DataRecord>(drafts:ResourceDrafts<T>):DataChange<T>[]=>Object.entries(drafts).map(([id,draft])=>({id,expectedRevision:draft.base.revision,values:copyValues(draft.values) as DataChange<T>['values']}));
export function resourceDraftErrors<T extends DataRecord>(drafts:ResourceDrafts<T>,columns:readonly DataColumn<T>[]):DataCellError[]{
  if(!Object.keys(drafts).length)return [];
  const errors:DataCellError[]=[];
  for(const [id,draft]of Object.entries(drafts))for(const [key,value]of Object.entries(draft.values)){const column=columns.find(column=>column.key===key);if(!column){errors.push({id,key,message:'This field is not editable.'});continue;}const parsed=parseDataValue(column,value);if(parsed.error)errors.push({id,key,message:parsed.error});}
  for(const error of validateDataChanges(Object.values(drafts).map(draft=>draft.base),columns,resourceDraftChanges(drafts)))if(!errors.some(current=>current.id===error.id&&current.key===error.key))errors.push(error);
  return errors;
}
/** Validate bounded adapter results before presenting them or acknowledging a save. */
export function validResourceRows<T extends DataRecord>(value:unknown,columns:readonly DataColumn<T>[],maximum=100):value is T[]{
  if(!Array.isArray(value)||value.length>maximum)return false;const ids=new Set<string>();
  for(const row of Array.from(value)){if(!isDataObject(row)||!isDataId(row.id)||ids.has(row.id)||!Number.isSafeInteger(row.revision)||Number(row.revision)<1)return false;ids.add(row.id);for(const column of columns){if(column.editable!==true||column.key==='id'||column.key==='revision')continue;const parsed=parseDataValue(column,row[column.key]);if(parsed.error||!dataValuesEqual(parsed.value,row[column.key]))return false;}}
  return true;
}

/** One source-bound draft lifecycle; service writes happen only through save(). */
export class ResourceWorkspaceController<T extends DataRecord>{
  private options:ResourceControllerOptions<T>;private active=false;private generation=0;private loadingRequest:AbortController|null=null;private mutation:AbortController|null=null;
  private listeners=new Set<()=>void>();private cache=new Map<string,T>();private past:ResourceDrafts<T>[]=[];private future:ResourceDrafts<T>[]=[];
  private drafts:ResourceDrafts<T>={};private rows:T[]=[];private total=0;private loading=true;private loadError='';private saving=false;private uncertain=false;private saveError='';private notice='';private serverErrors:DataCellError[]=[];private conflicts:T[]=[];
  private request:{fingerprint:string;batch:DataBatchRequest<T>}|null=null;private query:DataQuery;private snapshot:ResourceWorkspaceState<T>;
  constructor(options:ResourceControllerOptions<T>){
    if(!options.columns.length||options.columns.length>30||new Set(options.columns.map(column=>column.key)).size!==options.columns.length)throw Error('Provide 1 to 30 unique resource columns.');
    if(new Set(options.fields.map(field=>field.id)).size!==options.fields.length||options.fields.some(field=>!options.columns.some(column=>column.key===field.id)))throw Error('Resource filters must reference distinct configured columns.');
    const query=parseDataQuery(options.initialQuery??createResourceQuery(),options.columns,options.fields);if(!query)throw Error('Provide a supported initial resource query.');this.options=options;this.query=query;this.snapshot=this.derive();
  }
  private derive():ResourceWorkspaceState<T>{const changes=resourceDraftChanges(this.drafts),local=resourceDraftErrors(this.drafts,this.options.columns),errors=[...local,...this.serverErrors.filter(error=>!local.some(current=>current.id===error.id&&current.key===error.key))];return {query:this.query,rows:this.rows,displayRows:this.rows.map(row=>this.drafts[row.id]?{...this.drafts[row.id].base,...this.drafts[row.id].values} as T:row),total:this.total,loading:this.loading,loadError:this.loadError,drafts:this.drafts,changes,errors,conflicts:this.conflicts,dirtyCells:Object.entries(this.drafts).flatMap(([id,draft])=>Object.keys(draft.values).map(key=>({id,key}))),hasDrafts:changes.length>0,canUndo:this.past.length>0,canRedo:this.future.length>0,saving:this.saving,uncertain:this.uncertain,editLocked:this.saving||this.uncertain,saveError:this.saveError,notice:this.notice};}
  private emit(){this.snapshot=this.derive();for(const listener of this.listeners)listener();}
  getSnapshot=()=>this.snapshot;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  /** Start/stop can be paired again by React Strict Mode without reusing stale requests. */
  start=()=>{this.active=true;this.generation++;void this.reload();return()=>this.stop();};
  stop=()=>{this.active=false;this.generation++;this.loadingRequest?.abort();this.loadingRequest=null;if(this.mutation){this.mutation.abort();this.mutation=null;this.saving=false;this.uncertain=true;this.saveError='Stopped waiting for the service. The batch may already have committed. Retry the unchanged draft to reconcile the same request ID.';} };
  setNotice=(message:string)=>{this.notice=message;this.emit();};
  clearSaveError=()=>{if(!this.uncertain){this.saveError='';this.emit();}};
  getRecord=(id:string)=>{const draft=this.drafts[id];return draft?{...draft.base,...draft.values} as T:this.cache.get(id);};
  setQuery=(input:DataQuery)=>{if(this.saving||this.uncertain)return false;const query=parseDataQuery(input,this.options.columns,this.options.fields);if(!query){this.setNotice('Choose a supported resource view. Pending drafts are kept.');return false;}if(JSON.stringify(query)===JSON.stringify(this.query))return true;this.query=query;this.emit();if(this.active)void this.reload();return true;};
  reload=async()=>{
    this.loadingRequest?.abort();const controller=new AbortController(),generation=this.generation,key=JSON.stringify(this.query),query=this.query;this.loadingRequest=controller;this.loading=true;this.loadError='';this.emit();
    const current=()=>this.active&&!controller.signal.aborted&&this.loadingRequest===controller&&generation===this.generation&&key===JSON.stringify(this.query);
    try{const result=await this.options.dataSource.load(query,{signal:controller.signal});if(!current())return;if(!isDataObject(result)||!validResourceRows(result.rows,this.options.columns)||!Number.isSafeInteger(result.total)||Number(result.total)<result.rows.length)throw Error('Invalid resource page.');const loaded=result.rows.map(row=>copyResourceRow(row as T));for(const row of loaded)this.cache.set(row.id,row);if(this.cache.size>500){const keep=new Set([...loaded.map(row=>row.id),...Object.keys(this.drafts)]);for(const id of this.cache.keys())if(!keep.has(id))this.cache.delete(id);}this.rows=loaded;this.total=Number(result.total);const last=Math.max(1,Math.ceil(this.total/query.pageSize));if(query.page>last){this.query={...query,page:last};this.emit();void this.reload();return;}}
    catch{if(current())this.loadError=this.options.unavailableMessage??'The resource service is unavailable. Your view and pending changes are kept.';}
    finally{if(current()){this.loading=false;this.loadingRequest=null;this.emit();}}
  };
  private commitDrafts(next:ResourceDrafts<T>,message:string){if(this.saving||this.uncertain||JSON.stringify(next)===JSON.stringify(this.drafts))return;this.past=[...this.past,copyResourceDrafts(this.drafts)].slice(-50);this.drafts=next;this.future=[];this.request=null;this.serverErrors=[];this.conflicts=[];this.saveError='';this.notice=message;this.emit();}
  edit=(edits:readonly DataEdit<T>[])=>{
    if(this.saving||this.uncertain||!edits.length)return false;if(edits.length>2000){this.setNotice('Change up to 2,000 loaded cells at a time.');return false;}
    const next=copyResourceDrafts(this.drafts),targets: {edit:DataEdit<T>;base:T;column:DataColumn<T>}[]=[];
    for(const edit of Array.from(edits)){const column=edit&&this.options.columns.find(column=>column.key===edit.key&&column.editable===true&&column.key!=='id'&&column.key!=='revision'),base=edit&&(next[edit.id]?.base??this.rows.find(row=>row.id===edit.id));if(!column||!base){this.setNotice('Paste only into editable cells from the loaded page. No changes were applied.');return false;}targets.push({edit,base,column});}
    for(const {edit,base,column}of targets){const parsed=parseDataValue(column,edit.value),value=parsed.error?(Array.isArray(edit.value)?[...edit.value]:edit.value):parsed.value,draft=next[edit.id]??{base:copyResourceRow(base),values:{}};if(dataValuesEqual(value,base[edit.key]))delete draft.values[edit.key];else draft.values[edit.key]=value;if(Object.keys(draft.values).length)next[edit.id]=draft;else delete next[edit.id];}
    if(Object.keys(next).length>100){this.setNotice('Keep a batch to 100 records. No changes from this action were applied.');return false;}
    this.commitDrafts(next,edits.length>1?edits.length+' cells added to your draft.':'Draft updated. Review before saving.');return true;
  };
  undo=()=>{if(this.saving||this.uncertain||!this.past.length)return;this.future=[copyResourceDrafts(this.drafts),...this.future].slice(0,50);this.drafts=this.past.at(-1)!;this.past=this.past.slice(0,-1);this.request=null;this.serverErrors=[];this.conflicts=[];this.saveError='';this.notice='Draft change undone. Saved records are unchanged.';this.emit();};
  redo=()=>{if(this.saving||this.uncertain||!this.future.length)return;this.past=[...this.past,copyResourceDrafts(this.drafts)].slice(-50);this.drafts=this.future[0];this.future=this.future.slice(1);this.request=null;this.serverErrors=[];this.conflicts=[];this.saveError='';this.notice='Draft change restored.';this.emit();};
  save=async():Promise<ResourceSaveOutcome<T>>=>{
    if(!this.active||this.saving||!Object.keys(this.drafts).length)return {status:'ignored'};
    const invalid=resourceDraftErrors(this.drafts,this.options.columns);if(invalid.length){this.serverErrors=[];this.saveError='Correct the marked fields before saving. Your draft is kept.';this.emit();return {status:'rejected'};}
    const changes=resourceDraftChanges(this.drafts),fingerprint=JSON.stringify(changes);if(!this.request||this.request.fingerprint!==fingerprint)this.request={fingerprint,batch:{requestId:this.options.createRequestId?.()??crypto.randomUUID(),changes}};
    const batch=this.request.batch,controller=new AbortController(),generation=this.generation;this.mutation=controller;this.saving=true;this.saveError='';this.serverErrors=[];this.conflicts=[];this.emit();
    const current=()=>this.active&&!controller.signal.aborted&&this.mutation===controller&&generation===this.generation;
    try{const result:BatchResult<T>=await this.options.dataSource.save({requestId:batch.requestId,changes:batch.changes.map(change=>({...change,values:copyValues(change.values) as DataChange<T>['values']}))},{signal:controller.signal});if(!current())return {status:'ignored'};
      if(!isDataObject(result)||typeof result.ok!=='boolean')throw Error('Invalid save acknowledgement.');
      if(result.ok){
        if(!validResourceRows(result.rows,this.options.columns)||result.rows.length!==batch.changes.length||result.rows.some(row=>{const change=batch.changes.find(change=>change.id===row.id);return !change||row.revision<=change.expectedRevision||Object.entries(change.values).some(([key,value])=>!dataValuesEqual(row[key as keyof T],value));}))throw Error('Incomplete save acknowledgement.');
        const rows=result.rows.map(copyResourceRow),confirmed=new Map(rows.map(row=>[row.id,row]));for(const row of rows)this.cache.set(row.id,row);this.rows=this.rows.map(row=>confirmed.get(row.id)??row);this.drafts={};this.past=[];this.future=[];this.request=null;this.uncertain=false;this.notice=rows.length+' '+(rows.length===1?'record':'records')+' saved in one batch.';return {status:'saved',rows};
      }
      if(result.code==='conflict'){
        if(result.conflicts!==undefined&&(!validResourceRows(result.conflicts,this.options.columns)||result.conflicts.some(row=>!batch.changes.some(change=>change.id===row.id))))throw Error('Invalid conflict acknowledgement.');
        this.conflicts=(result.conflicts??[]).map(copyResourceRow);this.saveError='Some records changed after you started editing. Nothing in this batch was saved. Compare the latest values before trying again.';
      }else if(result.code==='validation'){
        if(result.errors!==undefined&&(!Array.isArray(result.errors)||result.errors.length>3000||result.errors.some(error=>!isDataObject(error)||typeof error.id!=='string'||typeof error.key!=='string'||typeof error.message!=='string'||error.message.length>1000||error.id&&!batch.changes.some(change=>change.id===error.id)||error.key&&!this.options.columns.some(column=>column.key===error.key))))throw Error('Invalid validation acknowledgement.');
        this.serverErrors=(result.errors??[]).map(error=>({...error}));this.saveError='The service rejected this batch. Correct the marked fields; none of the changes were saved.';
      }else throw Error('Invalid save result.');
      this.uncertain=false;return {status:'rejected'};
    }catch{if(current()){this.uncertain=true;this.saveError='The save could not be confirmed. Your draft is kept. Retry sends the same request ID so a committed batch can be reconciled.';}return {status:'uncertain'};}
    finally{if(current()){this.mutation=null;this.saving=false;this.emit();if(!this.uncertain&&!Object.keys(this.drafts).length)void this.reload();}}
  };
  stopWaiting=()=>{if(!this.mutation)return;this.uncertain=true;this.mutation.abort();this.mutation=null;this.saving=false;this.saveError='Stopped waiting for the service. The batch may already have committed. Retry the unchanged draft to reconcile the same request ID.';this.emit();};
  rebase=()=>{if(this.saving||this.uncertain)return Object.keys(this.drafts).length;const next=copyResourceDrafts(this.drafts);for(const latest of this.conflicts){const draft=next[latest.id];if(!draft)continue;this.cache.set(latest.id,copyResourceRow(latest));draft.base=copyResourceRow(latest);for(const key of Object.keys(draft.values))if(dataValuesEqual(draft.values[key],latest[key as keyof T]))delete draft.values[key];if(!Object.keys(draft.values).length)delete next[latest.id];}const remaining=Object.keys(next).length;this.commitDrafts(next,remaining?'Drafts now use the latest revisions. Review them again before saving.':'The latest records already contain your draft values. No further write is needed.');this.conflicts=[];this.saveError='';this.emit();if(this.active)void this.reload();return remaining;};
  discard=()=>{if(this.saving||this.uncertain)return false;this.drafts={};this.past=[];this.future=[];this.request=null;this.serverErrors=[];this.conflicts=[];this.saveError='';this.notice='Pending changes discarded. Saved records are unchanged.';this.emit();return true;};
}
export const createResourceWorkspaceController=<T extends DataRecord>(options:ResourceControllerOptions<T>)=>new ResourceWorkspaceController(options);
