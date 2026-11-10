import {createHash,randomUUID} from 'node:crypto';
import type {UploadReceipt} from '@bld8/ui/upload-state';

export const UPLOAD_DEMO_LIMITS={maxBytes:2*1024*1024,maxActive:8,receipts:100,receiptTtlMs:5*60*1000,readTimeoutMs:15000} as const;
interface Options {maxBytes?:number;maxActive?:number;receipts?:number;receiptTtlMs?:number;readTimeoutMs?:number;now?:()=>number}
interface StoredReceipt {receipt:UploadReceipt;fingerprint:string;expires:number}
class BoundaryError extends Error {constructor(readonly status:number,message:string){super(message);}}
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const requestIdPattern=/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const sessionPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Receive bounded bytes, return a temporary receipt, and discard the content. */
export function createUploadDemoApi(options:Options={}) {
  const limits={...UPLOAD_DEMO_LIMITS,...options},clock=options.now??Date.now,receipts=new Map<string,StoredReceipt>();let active=0;
  for(const [value,min,max] of [[limits.maxBytes,1,100*1024*1024],[limits.maxActive,1,8],[limits.receipts,1,100],[limits.receiptTtlMs,1,300000],[limits.readTimeoutMs,1,30000]])if(!Number.isSafeInteger(value)||value<min||value>max)throw Error('Use bounded upload example limits.');
  return async function handleUpload(request:Request):Promise<Response> {
    if(request.method!=='POST')return reply({error:'Use POST with a raw file body.'},405);
    let fileName:string,requestId:string,session:string,declared:number|null,fail:boolean;
    try{
      const url=new URL(request.url),origin=request.headers.get('origin'),host=request.headers.get('host')??url.host;
      // Next may use an internal bind hostname in request.url. Host retains the
      // browser-facing authority; use the runtime URL's protocol, not a caller's forwarded header.
      const audience=new URL(url.protocol+'//'+host);
      if(!/^(?:\[[0-9a-f:.]+\]|[a-z0-9.-]+)(?::\d{1,5})?$/i.test(host)||audience.pathname!=='/'||audience.search||audience.hash||audience.username||audience.password)throw new BoundaryError(400,'Use a valid request host.');
      if(origin&&origin!==audience.origin)return reply({error:'Use the same-origin example endpoint.'},403);
      if(url.search)throw new BoundaryError(400,'This example does not accept query parameters.');
      requestId=request.headers.get('X-BLD8-Request-Id')??'';session=request.headers.get('X-BLD8-Session')??'';
      if(!requestIdPattern.test(requestId)||['constructor','prototype'].includes(requestId)||!sessionPattern.test(session))throw new BoundaryError(400,'Supply a request ID and example session ID.');
      const encoded=request.headers.get('X-BLD8-File-Name')??'';
      if(encoded.length>3072)throw new BoundaryError(400,'Use a bounded file name.');
      try{fileName=decodeURIComponent(encoded);}catch{throw new BoundaryError(400,'Use an encoded file name.');}
      if(!fileName.trim()||fileName.length>255||/[\u0000-\u001f\u007f/\\]/.test(fileName))throw new BoundaryError(400,'Use a simple file name of at most 255 characters.');
      if(request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='application/octet-stream')throw new BoundaryError(415,'Send the raw file as application/octet-stream.');
      const length=request.headers.get('Content-Length');
      if(length!==null&&!/^(0|[1-9]\d*)$/.test(length))throw new BoundaryError(400,'Use a valid content length.');
      declared=length===null?null:Number(length);
      if(declared!==null&&(!Number.isSafeInteger(declared)||declared>limits.maxBytes))throw new BoundaryError(413,'The file exceeds this receiver\'s byte limit.');
      const failure=request.headers.get('X-BLD8-Fail');
      if(failure!==null&&failure!=='0'&&failure!=='1')throw new BoundaryError(400,'Use a valid example failure flag.');
      fail=failure==='1';
    }catch(error){return reply({error:error instanceof BoundaryError?error.message:'The upload headers could not be read.'},error instanceof BoundaryError?error.status:400);}
    if(active>=limits.maxActive)return reply({error:'The example receiver is busy. Try again.'},429);
    active++;
    let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;const hash=createHash('sha256');let bytes=0,finished=false;
    let rejectRead:(reason:unknown)=>void=()=>{};
    const interrupted=new Promise<never>((_,reject)=>{rejectRead=reject;});
    const abort=()=>rejectRead(new BoundaryError(499,'The upload was cancelled.'));
    const timer=setTimeout(()=>rejectRead(new BoundaryError(408,'The upload took too long. Try again.')),limits.readTimeoutMs);
    request.signal.addEventListener('abort',abort,{once:true});
    try{
      if(request.signal.aborted)throw new BoundaryError(499,'The upload was cancelled.');
      if(request.bodyUsed)throw new BoundaryError(400,'The file body has already been consumed.');
      reader=request.body?.getReader();
      if(reader)for(;;){
        const part=await Promise.race([reader.read(),interrupted]);if(part.done)break;
        if(!(part.value instanceof Uint8Array))throw new BoundaryError(400,'Send a byte stream.');
        bytes+=part.value.byteLength;if(bytes>limits.maxBytes)throw new BoundaryError(413,'The file exceeds this receiver\'s byte limit.');
        hash.update(part.value);
      }
      finished=true;
      if(request.signal.aborted)throw new BoundaryError(499,'The upload was cancelled.');
      if(declared!==null&&declared!==bytes)throw new BoundaryError(400,'The received size does not match the declared size.');
      if(fail)return reply({error:'The example receiver rejected this attempt. Retry the file.'},503);
      const sha256=hash.digest('hex'),fingerprint=sha256+':'+fileName,key=session+':'+requestId,now=clock();
      for(const [id,item] of receipts)if(item.expires<=now)receipts.delete(id);
      const previous=receipts.get(key);
      if(previous){
        if(previous.fingerprint!==fingerprint)return reply({error:'This request ID already acknowledges different bytes or a different name.'},409);
        return reply(previous.receipt);
      }
      if(receipts.size>=limits.receipts)return reply({error:'The temporary receipt limit is reached. Try again later.'},503);
      const receipt:UploadReceipt={id:'receipt-'+randomUUID(),requestId,bytes,sha256};
      receipts.set(key,{receipt,fingerprint,expires:now+limits.receiptTtlMs});
      return reply(receipt,201);
    }catch(error){return reply({error:error instanceof BoundaryError?error.message:'The file could not be received. Try again.'},error instanceof BoundaryError?error.status:400);}
    finally{
      clearTimeout(timer);request.signal.removeEventListener('abort',abort);
      if(reader){try{if(!finished)void reader.cancel().catch(()=>{});reader.releaseLock();}catch{ /* A closed or cancelled reader may already have released its lock. */ }}
      active--;
    }
  };
}
export const handleUploadDemo=createUploadDemoApi();
