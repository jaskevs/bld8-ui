/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import { OutlineValidationError,isOutlineActivity,isOutlineStatusChange,type OutlinePage, type OutlineProject, type OutlineRepository, type OutlineValues } from './outline-repository.js';

export interface OutlineHttpOptions {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  credentials?: RequestCredentials;
  draftKey?:string;
  /** Opt in only when the service implements activity, comments and reversible status changes. */
  history?:boolean;
}
export class OutlineHttpError extends Error {
  constructor(message:string, public status:number){super(message);this.name='OutlineHttpError';}
}
function project(value:unknown):value is OutlineProject {
  if(!value || typeof value!=='object')return false;
  const row=value as Record<string,unknown>;
  return typeof row.id==='string' && typeof row.name==='string' && typeof row.due==='string' && typeof row.notes==='string' && typeof row.status==='string' && ['Planned','Ready','Archived'].includes(row.status) && Number.isInteger(row.version) && Number(row.version)>0;
}

/** Fetch adapter for the documented Outline JSON contract. Authentication stays with the host app. */
export function createOutlineHttpRepository({baseUrl,fetch:transport=globalThis.fetch,headers,credentials='same-origin',draftKey,history=false}:OutlineHttpOptions):OutlineRepository {
  const base=baseUrl.replace(/\/$/,'');
  async function request(path:string,signal:AbortSignal,method='GET',body?:unknown){
    const supplied=typeof headers==='function'?await headers():headers;
    signal.throwIfAborted();const requestHeaders=new Headers(supplied);requestHeaders.set('Accept','application/json');
    if(body!==undefined)requestHeaders.set('Content-Type','application/json');
    const response=await transport(base+path,{method,headers:requestHeaders,credentials,signal,cache:'no-store',body:body===undefined?undefined:JSON.stringify(body)});
    if(response.status===204 && response.ok)return undefined;
    let data:unknown;try{data=await response.json();}catch{signal.throwIfAborted();throw new OutlineHttpError(response.ok?'The service returned an invalid response.':'The service could not complete this request. Try again.',response.status);}
    signal.throwIfAborted();
    if(!response.ok){
      const error=data && typeof data==='object'?data as Record<string,unknown>:{};
      if(response.status===422 && error.fieldErrors && typeof error.fieldErrors==='object'){
        const fields:Partial<Record<keyof OutlineValues,string>>={};
        for(const key of ['name','due','notes','status'] as const){const message=(error.fieldErrors as Record<string,unknown>)[key];if(typeof message==='string' && message.length<=1000)fields[key]=message;}
        if(Object.keys(fields).length)throw new OutlineValidationError(fields);
      }
      throw new OutlineHttpError(typeof error.error==='string' && error.error.length<=1000?error.error:'The service could not complete this request. Try again.',response.status);
    }
    return data;
  }
  return {
    draftKey,
    ...(history?{history:{
      async list(id:string,signal:AbortSignal){const result=await request('/projects/'+encodeURIComponent(id)+'/activity',signal) as {entries:unknown[]};if(!result||!Array.isArray(result.entries)||result.entries.length>100||!result.entries.every(item=>isOutlineActivity(item)&&item.projectId===id)||new Set(result.entries.map(item=>(item as {id:string}).id)).size!==result.entries.length)throw new OutlineHttpError('The service returned invalid project activity.',502);return result.entries as import('./outline-repository.js').OutlineActivity[];},
      async addComment(id:string,text:string,clientId:string,signal:AbortSignal){const result=await request('/projects/'+encodeURIComponent(id)+'/comments',signal,'POST',{text,clientId});if(!isOutlineActivity(result)||result.kind!=='comment'||result.projectId!==id||result.clientId!==clientId||result.text!==text.trim())throw new OutlineHttpError('The service returned an invalid comment.',502);return result;},
      async changeStatus(ids:string[],status:OutlineValues['status'],signal:AbortSignal){const result=await request('/projects/status',signal,'POST',{ids,status,reversible:true});if(!isOutlineStatusChange(result))throw new OutlineHttpError('The service returned an invalid status receipt.',502);return result;},
      async undoStatus(id:string,signal:AbortSignal){await request('/projects/status/undo',signal,'POST',{id});},
    }}:{}),
    async get(id,signal){
      let result:unknown;
      try{result=await request('/projects/'+encodeURIComponent(id),signal);}catch(error){if(error instanceof OutlineHttpError&&error.status===404)return null;throw error;}
      if(!project(result))throw new OutlineHttpError('The service returned an invalid project.',502);
      return result;
    },
    async list(query,signal){
      const params=new URLSearchParams({q:query.search,page:String(query.page),pageSize:String(query.pageSize)});
      if(query.filters.status)params.set('status',query.filters.status);
      if(query.sort){params.set('sort',query.sort.key);params.set('direction',query.sort.descending?'desc':'asc');}
      const result=await request('/projects?'+params,signal) as OutlinePage;
      if(!result || !Array.isArray(result.rows) || !result.rows.every(project) || !Number.isInteger(result.total) || result.total<0)throw new OutlineHttpError('The service returned an invalid project page.',502);
      return result;
    },
    async save(values,previous,signal){
      const result=await request(previous?'/projects/'+encodeURIComponent(previous.id):'/projects',signal,previous?'PATCH':'POST',{values,...(previous?{version:previous.version}:{})});
      if(!project(result))throw new OutlineHttpError('The service returned an invalid project.',502);
      return result;
    },
    async setStatus(ids,status,signal){await request('/projects/status',signal,'POST',{ids,status});},
    async remove(row,signal){await request('/projects/'+encodeURIComponent(row.id),signal,'DELETE',{version:row.version});},
  };
}
