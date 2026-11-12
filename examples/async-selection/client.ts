/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {validateAsyncPage,validateResolvedOptions,type AsyncOptionsLoader,type AsyncOptionsResolver} from '@bld8/ui/async-options';
import type {DirectoryPerson,DirectorySource} from './directory';

async function json(response:Response):Promise<unknown>{
  if(!response.ok)throw new Error('The directory could not be reached. Try again.');
  if(!response.body)throw new Error('The directory returned an incomplete response.');
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let length=0;
  try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>256_000){await reader.cancel();throw new Error('The directory response is too large.');}chunks.push(part.value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new Error('The directory returned an invalid response.');}
}
function person(value:unknown):DirectoryPerson{
  if(!value||typeof value!=='object'||!['role','description','initials'].every(key=>typeof (value as Record<string,unknown>)[key]==='string'))throw new Error('The directory returned an invalid person.');
  return value as DirectoryPerson;
}
/** Same contract as the generic controls; request cancellation is passed to fetch. */
export function createPeopleSource({source='product',endpoint='/api/examples/people',failNext}:{source?:DirectorySource;endpoint?:string;failNext?:()=>boolean}={}){
  const request=(params:URLSearchParams,signal:AbortSignal)=>{params.set('source',source);return fetch(endpoint+(endpoint.includes('?')?'&':'?')+params,{signal,cache:'no-store'}).then(json);};
  const loadOptions:AsyncOptionsLoader<DirectoryPerson>=async({query,cursor,signal})=>{
    const params=new URLSearchParams({query});if(cursor!==null)params.set('cursor',cursor);if(failNext?.())params.set('fail','1');
    const page=validateAsyncPage<DirectoryPerson>(await request(params,signal));page.items.forEach(person);return page;
  };
  const resolveOptions:AsyncOptionsResolver<DirectoryPerson>=async({values,signal})=>{
    const response=await request(new URLSearchParams({values:values.join(',')}),signal);
    const people=validateResolvedOptions<DirectoryPerson>(response,values);people.forEach(person);return people;
  };
  return {loadOptions,resolveOptions};
}
