import { createOutlineRepository, OutlineValidationError, validateOutline, type OutlineProject, type OutlineValues } from '@bld8/blocks/outline-repository';

// This sample store is bounded and process-local. A production service supplies
// authenticated ownership and a database with atomic version checks.
interface Session {values:Map<string,string>;lastUsed:number}
const state=globalThis as typeof globalThis & {bld8OutlineDemoSessions?:Map<string,Session>};
const sessions=state.bld8OutlineDemoSessions ??= new Map();
class HttpError extends Error {constructor(message:string,public status:number){super(message);}}
function reply(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store'}});}
async function body(request:Request){const text=await request.text();if(text.length>20000)throw new HttpError('This request is too large.',413);try{const value=JSON.parse(text);if(!value || typeof value!=='object' || Array.isArray(value))throw new Error();return value as Record<string,unknown>;}catch{throw new HttpError('Send a valid JSON object.',400);}}
function values(input:unknown):OutlineValues {
  if(!input || typeof input!=='object')throw new HttpError('Project values are required.',400);
  const value=input as Record<string,unknown>;
  if(['name','due','notes','status'].some(key=>typeof value[key]!=='string'))throw new HttpError('Project fields must be strings.',400);
  const result={name:value.name as string,due:value.due as string,notes:value.notes as string,status:value.status as OutlineValues['status']};
  const errors=validateOutline(result);if(Object.values(errors).some(Boolean))throw new OutlineValidationError(errors);return result;
}
function version(input:unknown){if(!Number.isSafeInteger(input) || Number(input)<1)throw new HttpError('A positive record version is required.',400);return Number(input);}

export async function handleOutlineDemo(request:Request):Promise<Response> {
  try{
    const token=request.headers.get('X-Outline-Demo-Session');
    if(!token || !/^[a-zA-Z0-9-]{16,80}$/.test(token))throw new HttpError('A demo session header is required.',400);
    const now=Date.now();for(const [key,session] of sessions)if(now-session.lastUsed>3600000)sessions.delete(key);
    let session=sessions.get(token);if(!session){if(sessions.size>=128)sessions.delete(sessions.keys().next().value!);session={values:new Map(),lastUsed:now};sessions.set(token,session);}session.lastUsed=now;
    const storage={getItem:(key:string)=>session!.values.get(key)??null,setItem:(key:string,value:string)=>{session!.values.set(key,value);}} as Storage;
    const repository=createOutlineRepository(storage);
    const url=new URL(request.url);const match=url.pathname.match(/\/projects(?:\/([^/]+))?\/?$/);if(!match)throw new HttpError('Route not found.',404);
    const id=match[1]?decodeURIComponent(match[1]):null;
    const signal=request.signal;
    if(request.method!=='GET' && request.headers.get('X-Outline-Demo-Fail')==='save')throw new HttpError('The sample service rejected this save. Your draft is still available; try again.',503);
    if(request.method==='GET' && !id){
      const integer=(name:string,fallback:number,max:number)=>{const raw=url.searchParams.get(name);const n=raw===null?fallback:Number(raw);if(!Number.isSafeInteger(n)||n<1||n>max)throw new HttpError('Invalid '+name+'.',400);return n;};
      const status=url.searchParams.get('status')??'',sort=url.searchParams.get('sort'),direction=url.searchParams.get('direction')??'asc';
      if(status && !['Planned','Ready','Archived'].includes(status) || sort && !['name','due','status'].includes(sort) || !['asc','desc'].includes(direction))throw new HttpError('Invalid project filter or sort.',400);
      return reply(await repository.list({search:(url.searchParams.get('q')??'').slice(0,200),filters:{status},sort:sort?{key:sort,descending:direction==='desc'}:null,page:integer('page',1,100000),pageSize:integer('pageSize',5,100)},signal));
    }
    const data=await body(request);
    if(request.method==='POST' && !id){const all=await repository.list({search:'',filters:{},sort:null,page:1,pageSize:1000},signal);if(all.total>=100)throw new HttpError('This sample workspace is limited to 100 projects.',409);return reply(await repository.save(values(data.values),null,signal),201);}
    if(request.method==='POST' && id==='status'){
      if(!Array.isArray(data.ids)||!data.ids.length||data.ids.length>100||!data.ids.every(id=>typeof id==='string')||!['Planned','Ready','Archived'].includes(String(data.status)))throw new HttpError('Choose project IDs and a valid status.',400);
      const all=await repository.list({search:'',filters:{},sort:null,page:1,pageSize:1000},signal);if(!data.ids.every(id=>all.rows.some(row=>row.id===id)))throw new HttpError('A selected project no longer exists.',404);
      await repository.setStatus(data.ids,data.status as OutlineValues['status'],signal);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
    }
    if(id && ['PATCH','DELETE'].includes(request.method)){
      const all=await repository.list({search:'',filters:{},sort:null,page:1,pageSize:1000},signal);const current=all.rows.find(row=>row.id===id);if(!current)throw new HttpError('Project not found.',404);
      const previous:OutlineProject={...current,version:version(data.version)};
      if(previous.version!==current.version)throw new HttpError('This project changed. Reload the list before saving your draft.',409);
      if(request.method==='PATCH')return reply(await repository.save(values(data.values),previous,signal));
      await repository.remove(previous,signal);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
    }
    throw new HttpError('Method not allowed.',405);
  }catch(error){
    if(error instanceof OutlineValidationError)return reply({fieldErrors:error.fields},422);
    if(error instanceof HttpError)return reply({error:error.message},error.status);
    if(request.signal.aborted)throw error;
    return reply({error:'The sample service could not complete this request.'},500);
  }
}
