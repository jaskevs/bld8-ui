import {emptyFilterQuery,filterRecords,isFilterDate,parseFilterQuery,serializeFilterQuery,filterQueryKey,type FilterField,type FilterQuery,type FilterValue} from '@bld8/ui/filter-query';

export interface Issue { id:string; title:string; status:'backlog'|'in-progress'|'review'|'done'; priority:'low'|'medium'|'high'|'urgent'; assignee:string; estimate:number; due:string; revision:number }
export interface IssueView { filters:FilterQuery; search:string; sort:{key:string;descending:boolean}|null; columns:string[]; density:'comfortable'|'compact'; pageSize:number }
export interface SavedIssueView { id:string; name:string; view:IssueView }
export interface IssueListQuery { view:IssueView; page:number }
export interface IssueChange { id:string; expectedRevision:number; patch:Partial<Pick<Issue,'title'|'status'>> }
export interface IssueRepository { list:(query:IssueListQuery,signal:AbortSignal)=>Promise<{rows:Issue[];total:number}>; create:(draft:Pick<Issue,'title'|'priority'|'assignee'>,signal:AbortSignal)=>Promise<Issue>; update:(changes:IssueChange[],signal:AbortSignal)=>Promise<Issue[]> }
export const issueStatuses=[{value:'backlog',label:'Backlog'},{value:'in-progress',label:'In progress'},{value:'review',label:'In review'},{value:'done',label:'Done'}];
export const issuePriorities=[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'},{value:'urgent',label:'Urgent'}];
export const issuePeople=[{value:'maya',label:'Maya Chen'},{value:'oliver',label:'Oliver Reed'},{value:'sam',label:'Sam Rivera'},{value:'unassigned',label:'Unassigned'}];
export const issueFields:readonly FilterField[]=[{id:'title',label:'Title',kind:'text'},{id:'status',label:'Status',kind:'select',options:issueStatuses},{id:'priority',label:'Priority',kind:'select',options:issuePriorities},{id:'assignee',label:'Assignee',kind:'select',options:issuePeople},{id:'estimate',label:'Estimate',kind:'number'},{id:'due',label:'Due date',kind:'date'}];
export const issueColumnKeys=['id','title','status','priority','assignee','estimate','due'];
export const defaultIssueView=():IssueView=>({filters:emptyFilterQuery(),search:'',sort:null,columns:[...issueColumnKeys],density:'comfortable',pageSize:5});
export function issueViewKey(view:IssueView){return JSON.stringify({...view,columns:issueColumnKeys.filter(key=>view.columns.includes(key)),filters:filterQueryKey(view.filters)});}
export function parseIssueView(text:string):IssueView|null {
  try{
    if(text.length>20000)return null;const value=JSON.parse(text);if(!value||typeof value!=='object'||typeof value.search!=='string'||value.search.length>200||!['comfortable','compact'].includes(value.density)||![5,10,20].includes(value.pageSize))return null;
    const filters=parseFilterQuery(JSON.stringify(value.filters),issueFields).query;if(!filters)return null;
    if(!Array.isArray(value.columns)||!value.columns.includes('title')||value.columns.length>issueColumnKeys.length||new Set(value.columns).size!==value.columns.length||value.columns.some((key:unknown)=>typeof key!=='string'||!issueColumnKeys.includes(key)))return null;
    if(value.sort!==null&&(!value.sort||!issueColumnKeys.includes(value.sort.key)||typeof value.sort.descending!=='boolean'))return null;
    return {filters,search:value.search,sort:value.sort?{key:value.sort.key,descending:value.sort.descending}:null,columns:issueColumnKeys.filter(key=>value.columns.includes(key)),density:value.density,pageSize:value.pageSize};
  }catch{return null;}
}
export function serializeIssueView(view:IssueView){serializeFilterQuery(view.filters,issueFields);const parsed=parseIssueView(JSON.stringify(view));if(!parsed)throw new Error('This view configuration is invalid.');return JSON.stringify(parsed);}
export function parseSavedIssueViews(text:string):SavedIssueView[]|null {
  try{if(text.length>200000)return null;const values=JSON.parse(text);if(!Array.isArray(values)||values.length>20)return null;const ids=new Set<string>(),names=new Set<string>();const result:SavedIssueView[]=[];
    for(const entry of values){if(!entry||typeof entry.id!=='string'||!/^[\w-]{1,64}$/.test(entry.id)||ids.has(entry.id)||typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>50||names.has(entry.name.trim().toLowerCase()))return null;const view=parseIssueView(JSON.stringify(entry.view));if(!view)return null;ids.add(entry.id);names.add(entry.name.trim().toLowerCase());result.push({id:entry.id,name:entry.name.trim(),view});}return result;
  }catch{return null;}
}
export const issueSeed:Issue[]=[
  ['Refine dialog focus','review','high','maya',3,'2026-11-02'],['Keyboard shortcuts','in-progress','medium','oliver',5,'2026-11-05'],['Empty-state copy','backlog','low','sam',1,''],['Upload retry feedback','in-progress','high','maya',5,'2026-11-07'],['Navigation contrast','done','medium','sam',2,'2026-10-26'],['Mobile table actions','review','urgent','oliver',3,'2026-11-01'],['Saved view naming','backlog','medium','unassigned',2,''],['Calendar range hints','backlog','low','maya',3,'2026-11-12'],['Loading skeleton rhythm','done','low','sam',1,'2026-10-27'],['Bulk update confirmation','in-progress','high','oliver',5,'2026-11-09'],['Profile field validation','review','medium','sam',2,'2026-11-06'],['Resource preview layout','backlog','high','unassigned',8,'2026-11-15'],
].map((row,index)=>({id:'ISS-'+(101+index),title:String(row[0]),status:row[1] as Issue['status'],priority:row[2] as Issue['priority'],assignee:String(row[3]),estimate:Number(row[4]),due:String(row[5]),revision:1}));
const clone=(issue:Issue):Issue=>({...issue});
const abort=(signal:AbortSignal)=>{if(signal.aborted)throw new DOMException('Request aborted.','AbortError');};
export function createMemoryIssueRepository(initial:readonly Issue[]=issueSeed):IssueRepository {
  if(!initial.every(validIssue)||new Set(initial.map(row=>row.id)).size!==initial.length)throw new Error('Invalid initial issue records.');
  let records=initial.map(clone),next=Math.max(100,...records.map(row=>Number(row.id.replace('ISS-',''))||100))+1;
  return {
    async list(query,signal){abort(signal);const view=parseIssueView(JSON.stringify(query.view));if(!view||!Number.isInteger(query.page)||query.page<1)throw new Error('Invalid issue query.');
      let filtered=filterRecords(records,view.filters,issueFields,(row,field)=>row[field as keyof Issue] as FilterValue).filter(row=>(row.id+' '+row.title).toLowerCase().includes(view.search.toLowerCase()));
      if(view.sort){const {key,descending}=view.sort;filtered.sort((a,b)=>{const av=a[key as keyof Issue],bv=b[key as keyof Issue];return (typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true}))*(descending?-1:1);});}
      const total=filtered.length,start=(query.page-1)*view.pageSize;return {rows:filtered.slice(start,start+view.pageSize).map(clone),total};},
    async create(draft,signal){abort(signal);if(draft.title.trim().length<3||draft.title.length>120)throw new Error('Use a title between 3 and 120 characters.');if(!issuePriorities.some(item=>item.value===draft.priority)||!issuePeople.some(item=>item.value===draft.assignee))throw new Error('Choose a supported priority and assignee.');const row:Issue={...draft,title:draft.title.trim(),id:'ISS-'+next++,status:'backlog',estimate:0,due:'',revision:1};records=[row,...records];return clone(row);},
    async update(changes,signal){abort(signal);if(!changes.length||changes.length>100||new Set(changes.map(change=>change.id)).size!==changes.length)throw new Error('Choose up to 100 distinct issues.');
      for(const change of changes){const previous=records.find(row=>row.id===change.id);if(!previous||previous.revision!==change.expectedRevision)throw new Error('An issue changed elsewhere. Reload the results before trying again.');if(Object.keys(change.patch).some(key=>!['title','status'].includes(key))||change.patch.title!==undefined&&(change.patch.title.trim().length<3||change.patch.title.length>120)||change.patch.status!==undefined&&!issueStatuses.some(item=>item.value===change.patch.status))throw new Error('Review the issue changes.');}
      const updated:Issue[]=[];records=records.map(row=>{const change=changes.find(change=>change.id===row.id);if(!change)return row;const result={...row,...change.patch,...(change.patch.title?{title:change.patch.title.trim()}:{}),revision:row.revision+1};updated.push(clone(result));return result;});return updated;},
  };
}
function validIssue(value:unknown):value is Issue {const row=value as Issue;return !!row&&typeof row.id==='string'&&row.id.length<=80&&typeof row.title==='string'&&row.title.length<=120&&issueStatuses.some(item=>item.value===row.status)&&issuePriorities.some(item=>item.value===row.priority)&&issuePeople.some(item=>item.value===row.assignee)&&Number.isFinite(row.estimate)&&row.estimate>=0&&typeof row.due==='string'&&(!row.due||isFilterDate(row.due))&&Number.isInteger(row.revision)&&row.revision>0;}
/** Host API must authenticate, authorise, validate queries and commit revision checks atomically. */
export function createIssueHttpRepository(baseUrl:string,fetcher:typeof fetch=fetch):IssueRepository {
  async function request(method:string,signal:AbortSignal,body?:unknown,query?:string){const response=await fetcher(baseUrl+(query?'?'+new URLSearchParams({query}):''),{method,signal,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,credentials:'same-origin'});if(!response.ok)throw new Error(response.status===409?'An issue changed elsewhere. Reload the results before trying again.':response.status===429?'Too many requests. Wait briefly and try again.':'The issue service could not complete this request. Try again.');try{return await response.json();}catch{throw new Error('The issue service returned an invalid response.');}}
  return {
    async list(query,signal){if(!Number.isInteger(query.page)||query.page<1)throw new Error('Invalid issue query.');serializeIssueView(query.view);const result=await request('GET',signal,undefined,JSON.stringify(query));if(!result||!Array.isArray(result.rows)||result.rows.length>100||!result.rows.every(validIssue)||new Set(result.rows.map((row:Issue)=>row.id)).size!==result.rows.length||!Number.isInteger(result.total)||result.total<result.rows.length)throw new Error('The issue service returned an invalid response.');return {rows:result.rows,total:result.total};},
    async create(draft,signal){const result=await request('POST',signal,draft);if(!validIssue(result))throw new Error('The issue service returned an invalid response.');return result;},
    async update(changes,signal){const result=await request('PATCH',signal,{changes});if(!Array.isArray(result)||result.length!==changes.length||!result.every(validIssue)||new Set(result.map((row:Issue)=>row.id)).size!==result.length||result.some((row:Issue)=>!changes.some(change=>change.id===row.id&&row.revision>change.expectedRevision&&(change.patch.status===undefined||row.status===change.patch.status)&&(change.patch.title===undefined||row.title===change.patch.title.trim()))))throw new Error('The issue service returned an invalid response.');return result;},
  };
}
