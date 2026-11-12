/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {emptyFilterQuery,filterRecords,type FilterValue} from '@bld8/ui/filter-query';
import {isDataId,isDataObject,parseDataQuery,validateDataChanges,type BatchResult,type DataBatchRequest,type DataColumn,type DataQuery,type DataSource} from '@bld8/ui/data-workspace-state';
import {issueFields,issuePeople,issuePriorities,issueSeed,issueStatuses,type Issue} from './issue-repository.js';

export const issueDataColumns:readonly DataColumn<Issue>[]=[
  {key:'id',label:'Issue',type:'text',editable:false},
  {key:'title',label:'Title',type:'text',editable:true,required:true,minLength:3,maxLength:120},
  {key:'status',label:'Status',type:'select',editable:true,options:issueStatuses,required:true},
  {key:'priority',label:'Priority',type:'select',editable:true,options:issuePriorities,required:true},
  {key:'assignee',label:'Assignee',type:'select',editable:true,options:issuePeople,searchable:true,required:true},
  {key:'estimate',label:'Estimate',type:'number',editable:true,min:0,max:999},
  {key:'due',label:'Due date',type:'date',editable:true},
];
export const defaultDataQuery=():DataQuery=>({search:'',filters:emptyFilterQuery(),sorts:[],page:1,pageSize:10});
interface IssueReceipt {requestId:string;signature:string;rows:Issue[]}
export interface IssueDataSnapshot {version:1;rows:Issue[];receipts:IssueReceipt[]}
const copy=(row:Issue):Issue=>({id:row.id,title:row.title,status:row.status,priority:row.priority,assignee:row.assignee,estimate:row.estimate,due:row.due,revision:row.revision});
const abort=(signal:AbortSignal)=>{if(signal.aborted)throw new DOMException('Request aborted.','AbortError');};
const invalid=(message:string):BatchResult<Issue>=>({ok:false,code:'validation',errors:[{id:'',key:'',message}]});
export function createIssueDataSnapshot(rows:readonly Issue[]=issueSeed):IssueDataSnapshot {
  if(!validRows(rows))throw new Error('The issue snapshot contains invalid records.');
  return {version:1,rows:rows.map(copy),receipts:[]};
}
/** A durable adapter must validate stored data before exposing it to a client. */
export function parseIssueDataSnapshot(input:unknown):IssueDataSnapshot|null {
  if(!isDataObject(input)||input.version!==1||!validRows(input.rows)||!Array.isArray(input.receipts)||input.receipts.length>100)return null;
  const receipts:IssueReceipt[]=[],ids=new Set<string>();
  for(const value of Array.from(input.receipts)){if(!isDataObject(value)||typeof value.requestId!=='string'||!validRequestId(value.requestId)||ids.has(value.requestId)||typeof value.signature!=='string'||value.signature.length>100000||!validRows(value.rows,100))return null;ids.add(value.requestId);receipts.push({requestId:value.requestId,signature:value.signature,rows:value.rows.map(copy)});}
  return {version:1,rows:input.rows.map(copy),receipts};
}
function validRows(input:unknown,max=10000):input is Issue[] {if(!Array.isArray(input)||input.length>max)return false;const ids=new Set<string>();for(const value of Array.from(input)){if(!isDataObject(value)||!isDataId(value.id)||ids.has(value.id)||!Number.isSafeInteger(value.revision)||Number(value.revision)<1)return false;ids.add(value.id);for(const column of issueDataColumns){if(column.key==='id')continue;const errors=validateDataChanges([{...value} as unknown as Issue],issueDataColumns,[{id:value.id,expectedRevision:Number(value.revision),values:{[column.key]:value[column.key]}}]);if(errors.length)return false;}}return true;}
const validRequestId=(value:string)=>/^[a-zA-Z0-9-]{16,80}$/.test(value);
export function queryIssueData(snapshot:IssueDataSnapshot,input:DataQuery):{rows:Issue[];total:number} {
  const query=parseDataQuery(input,issueDataColumns,issueFields);if(!query)throw new Error('Use a supported issue query.');
  let rows=filterRecords(snapshot.rows,query.filters,issueFields,(row,key)=>row[key as keyof Issue] as FilterValue).filter(row=>(row.id+' '+row.title).toLocaleLowerCase('en').includes(query.search.toLocaleLowerCase('en')));
  const compare=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
  rows.sort((a,b)=>{for(const sort of query.sorts){const av=a[sort.key as keyof Issue],bv=b[sort.key as keyof Issue];const value=typeof av==='number'&&typeof bv==='number'?av-bv:compare.compare(String(av),String(bv));if(value)return value*(sort.descending?-1:1);}return compare.compare(a.id,b.id);});
  const start=(query.page-1)*query.pageSize;return {rows:rows.slice(start,start+query.pageSize).map(copy),total:rows.length};
}
/** Pure transaction: callers publish next only after a durable atomic commit. */
export function saveIssueData(snapshot:IssueDataSnapshot,input:DataBatchRequest<Issue>):{result:BatchResult<Issue>;next:IssueDataSnapshot} {
  if(!isDataObject(input)||typeof input.requestId!=='string'||!validRequestId(input.requestId)||!Array.isArray(input.changes))return {result:invalid('Use a valid request ID and a batch of changes.'),next:snapshot};
  let signature:string;try{signature=JSON.stringify(input.changes);if(signature.length>100000)throw new Error();}catch{return {result:invalid('Use a smaller valid batch.'),next:snapshot};}
  const receipt=snapshot.receipts.find(item=>item.requestId===input.requestId);
  if(receipt)return {result:receipt.signature===signature?{ok:true,rows:receipt.rows.map(copy)}:invalid('This request ID has already been used for different changes.'),next:snapshot};
  const errors=validateDataChanges(snapshot.rows,issueDataColumns,input.changes);
  if(errors.length)return {result:{ok:false,code:'validation',errors},next:snapshot};
  const conflicts=snapshot.rows.filter(row=>input.changes.some(change=>change.id===row.id&&change.expectedRevision!==row.revision));
  if(conflicts.length)return {result:{ok:false,code:'conflict',conflicts:conflicts.map(copy)},next:snapshot};
  if(input.changes.some(change=>snapshot.rows.find(row=>row.id===change.id)!.revision===Number.MAX_SAFE_INTEGER))return {result:invalid('This record revision cannot be advanced.'),next:snapshot};
  const changed=new Map(input.changes.map(change=>[change.id,change])),updated:Issue[]=[];
  const rows=snapshot.rows.map(row=>{const change=changed.get(row.id);if(!change)return copy(row);const next={...row,...change.values,id:row.id,revision:row.revision+1};updated.push(next);return copy(next);});
  const next:IssueDataSnapshot={version:1,rows,receipts:[...snapshot.receipts.slice(-99),{requestId:input.requestId,signature,rows:updated.map(copy)}]};
  return {result:{ok:true,rows:updated.map(copy)},next};
}
export function createMemoryIssueDataSource(initial:readonly Issue[]=issueSeed):DataSource<Issue> {
  let snapshot=createIssueDataSnapshot(initial);
  return {async load(query,{signal}){abort(signal);return queryIssueData(snapshot,query);},async save(request,{signal}){abort(signal);const {result,next}=saveIssueData(snapshot,request);snapshot=next;return result;}};
}
/** The endpoint needs an authenticated host and an atomic durable transaction. */
export function createIssueDataHttpSource(baseUrl:string,fetcher:typeof fetch=fetch):DataSource<Issue> {
  const safeBase=baseUrl.replace(/\/$/,'');
  async function json(response:Response,signal:AbortSignal):Promise<unknown>{
    const declared=response.headers.get('content-length');if(declared&&(!/^\d+$/.test(declared)||Number(declared)>250000)){await response.body?.cancel();throw new Error('The issue service returned an oversized or invalid response.');}
    const reader=response.body?.getReader();if(!reader)throw new Error('The issue service returned an invalid response.');const decoder=new TextDecoder('utf-8',{fatal:true});let text='',bytes=0;
    try{for(;;){abort(signal);const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>250000){await reader.cancel();throw new Error('The issue service returned an oversized response.');}text+=decoder.decode(value,{stream:true});}abort(signal);text+=decoder.decode();return JSON.parse(text) as unknown;}catch(error){if(signal.aborted){await reader.cancel().catch(()=>{});abort(signal);}if(error instanceof Error&&error.message.includes('oversized'))throw error;throw new Error('The issue service returned an invalid response.');}finally{reader.releaseLock();}
  }
  async function call(method:string,input:unknown,signal:AbortSignal){abort(signal);const response=await fetcher(safeBase+(method==='GET'?'?'+new URLSearchParams({query:JSON.stringify(input)}):''),{method,signal,credentials:'same-origin',headers:method==='GET'?undefined:{'Content-Type':'application/json'},body:method==='GET'?undefined:JSON.stringify(input)});if(!response.ok&&![409,422].includes(response.status)){await response.body?.cancel();throw new Error(response.status===429?'The service is busy. Wait briefly and try again.':'The issue service could not complete this request. Your draft is still available.');}return json(response,signal);}
  return {
    async load(query,{signal}){if(!parseDataQuery(query,issueDataColumns,issueFields))throw new Error('Use a supported issue query.');const result=await call('GET',query,signal);if(!isDataObject(result)||!validRows(result.rows,100)||!Number.isSafeInteger(result.total)||Number(result.total)<result.rows.length||Number(result.total)>10000000)throw new Error('The issue service returned an invalid page.');return {rows:result.rows.map(copy),total:Number(result.total)};},
    async save(request,{signal}){
      const result=await call('PATCH',request,signal);if(!isDataObject(result)||typeof result.ok!=='boolean')throw new Error('The issue service returned an invalid save result.');
      if(result.ok){
        if(!validRows(result.rows,100)||result.rows.length!==request.changes.length||result.rows.some(row=>!request.changes.some(change=>change.id===row.id&&row.revision>change.expectedRevision&&Object.entries(change.values).every(([key,value])=>Object.is(row[key as keyof Issue],value)))))throw new Error('The issue service returned an invalid save receipt.');
        return {ok:true,rows:result.rows.map(copy)};
      }
      if(result.code==='conflict'){
        if(!validRows(result.conflicts,100)||!result.conflicts.length||result.conflicts.some(row=>!request.changes.some(change=>change.id===row.id)))throw new Error('The issue service returned an invalid conflict.');
        return {ok:false,code:'conflict',conflicts:result.conflicts.map(copy)};
      }
      if(result.code==='validation'&&Array.isArray(result.errors)&&result.errors.length<=700&&Array.from(result.errors).every(error=>isDataObject(error)&&typeof error.id==='string'&&error.id.length<=80&&typeof error.key==='string'&&error.key.length<=80&&typeof error.message==='string'&&error.message.length<=300))return {ok:false,code:'validation',errors:result.errors as {id:string;key:string;message:string}[]};
      throw new Error('The issue service returned an invalid save result.');
    },
  };
}
