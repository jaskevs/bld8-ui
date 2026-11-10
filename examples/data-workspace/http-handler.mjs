import {issueDataColumns} from '@bld8/blocks/issue-data-source';
import {issueFields} from '@bld8/blocks/issue-repository';
import {parseDataQuery} from '@bld8/ui/data-workspace-state';

const MAX_BODY=100000;
class RequestError extends Error {constructor(message,status){super(message);this.status=status;}}
function reply(value,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
async function readBody(request){
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new RequestError('Send application/json.',415);
  const length=request.headers.get('content-length');if(length&&(!/^\d+$/.test(length)||Number(length)>MAX_BODY))throw new RequestError('Use a batch below 100 KB.',413);
  const reader=request.body?.getReader();if(!reader)throw new RequestError('Send a JSON batch.',400);
  const decoder=new TextDecoder('utf-8',{fatal:true});let text='',bytes=0,timer,timedOut=false,onAbort;
  const deadline=new Promise((_,reject)=>{
    timer=setTimeout(()=>{timedOut=true;reject(new RequestError('Send the batch within ten seconds.',408));void reader.cancel().catch(()=>{});},10000);
    onAbort=()=>{reject(new DOMException('Request aborted.','AbortError'));void reader.cancel().catch(()=>{});};
    request.signal.addEventListener('abort',onAbort,{once:true});
  });
  try{
    if(request.signal.aborted)onAbort();
    for(;;){const {done,value}=await Promise.race([reader.read(),deadline]);if(timedOut)throw new RequestError('Send the batch within ten seconds.',408);if(request.signal.aborted)throw new DOMException('Request aborted.','AbortError');if(done)break;bytes+=value.byteLength;if(bytes>MAX_BODY){await reader.cancel();throw new RequestError('Use a batch below 100 KB.',413);}text+=decoder.decode(value,{stream:true});}
    if(timedOut)throw new RequestError('Send the batch within ten seconds.',408);if(request.signal.aborted)throw new DOMException('Request aborted.','AbortError');text+=decoder.decode();return JSON.parse(text);
  }catch(error){if(request.signal.aborted)throw new DOMException('Request aborted.','AbortError');if(error instanceof RequestError)throw error;throw new RequestError('Send a valid UTF-8 JSON batch.',400);}finally{clearTimeout(timer);request.signal.removeEventListener('abort',onAbort);reader.releaseLock();}
}
/** Authentication/record authorisation belong ahead of this reference handler. */
export function createIssueDataHandler(source,{allowedOrigins=[],path='/api/issues'}={}) {
  if(typeof path!=='string'||!path.startsWith('/')||path.includes('?')||path.includes('#'))throw new Error('Configure an exact issue API path.');
  return async request=>{
    try{
      const url=new URL(request.url);
      if(url.pathname!==path)return reply({error:'Route not found.'},404);
      if(request.method==='GET'){
        const text=url.searchParams.get('query');if(!text||text.length>24000)throw new RequestError('Send a supported issue query.',400);
        let raw;try{raw=JSON.parse(text);}catch{throw new RequestError('Send a supported issue query.',400);}
        const query=parseDataQuery(raw,issueDataColumns,issueFields);if(!query)throw new RequestError('Send a supported issue query.',400);
        return reply(await source.load(query,{signal:request.signal}));
      }
      if(request.method!=='PATCH')return new Response(null,{status:405,headers:{Allow:'GET, PATCH','Cache-Control':'no-store'}});
      const origin=request.headers.get('origin');if(origin&&origin!==url.origin&&!allowedOrigins.includes(origin)||!origin&&request.headers.get('sec-fetch-site')==='cross-site')throw new RequestError('Cross-origin writes are not accepted.',403);
      const body=await readBody(request);if(request.signal.aborted)throw new DOMException('Request aborted.','AbortError');const result=await source.save(body,{signal:request.signal});return reply(result,result.ok?200:result.code==='conflict'?409:422);
    }catch(error){if(request.signal.aborted)throw error;if(error instanceof RequestError)return reply({error:error.message},error.status);return reply({error:'The local issue service could not complete this request. Your draft is still available.'},503);}
  };
}
