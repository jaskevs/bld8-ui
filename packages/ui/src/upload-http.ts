import {validateUploadReceipt,type UploadFileHandler,type UploadReceipt} from './upload-state.js';

export interface UploadHttpOptions {
  endpoint:string;
  /** The host owns authorisation, session scope and CORS configuration. */
  headers?:Readonly<Record<string,string>>|(()=>Readonly<Record<string,string>>);
  withCredentials?:boolean;
  timeoutMs?:number;
}
export class UploadHttpError extends Error {
  readonly status:number;
  constructor(message:string,status=0){super(message);this.name='UploadHttpError';this.status=status;}
}
/** Raw-body XHR progress reports bytes sent. Only a correlated JSON acknowledgement completes the request. */
export function createUploadHttpAdapter({endpoint,headers,withCredentials=false,timeoutMs=45000}:UploadHttpOptions):UploadFileHandler {
  if(typeof endpoint!=='string'||!endpoint.trim()||endpoint.length>2048||/[\u0000-\u001f\u007f]/.test(endpoint)||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>300000)throw new Error('Use an upload endpoint and a timeout from 1–300000 ms.');
  return (file,{signal,requestId,onProgress})=>new Promise<UploadReceipt>((resolve,reject)=>{
    if(signal.aborted){reject(new DOMException('Upload cancelled.','AbortError'));return;}
    const xhr=new XMLHttpRequest();let settled=false;
    const cleanup=()=>{signal.removeEventListener('abort',abort);xhr.onload=xhr.onerror=xhr.ontimeout=xhr.onabort=xhr.onprogress=xhr.onreadystatechange=null;xhr.upload.onprogress=xhr.upload.onload=null;};
    const fail=(error:Error,stop=false)=>{if(settled)return;settled=true;cleanup();if(stop)xhr.abort();reject(error);};
    const abort=()=>fail(new DOMException('Upload cancelled.','AbortError'),true);
    const oversized=()=>fail(new UploadHttpError('The upload acknowledgement exceeded the response limit.'),true);
    signal.addEventListener('abort',abort,{once:true});
    try{
      xhr.open('POST',endpoint,true);xhr.responseType='text';xhr.timeout=timeoutMs;xhr.withCredentials=withCredentials;
      const custom=typeof headers==='function'?headers():headers;
      for(const [name,value] of Object.entries(custom??{}))if(!['content-type','x-bld8-request-id','x-bld8-file-name'].includes(name.toLowerCase()))xhr.setRequestHeader(name,value);
      xhr.setRequestHeader('Content-Type','application/octet-stream');xhr.setRequestHeader('X-BLD8-Request-Id',requestId);xhr.setRequestHeader('X-BLD8-File-Name',encodeURIComponent(file.name));
      xhr.upload.onprogress=event=>{if(!settled&&!signal.aborted)onProgress({loaded:event.loaded,...(event.lengthComputable?{total:event.total}:{})});};
      xhr.upload.onload=()=>{if(!settled&&!signal.aborted)onProgress({loaded:file.size,total:file.size});};
      xhr.onreadystatechange=()=>{if(xhr.readyState===2){const length=Number(xhr.getResponseHeader('Content-Length'));if(Number.isFinite(length)&&length>16384)oversized();}};
      xhr.onprogress=event=>{if(event.loaded>16384)oversized();};
      xhr.onerror=()=>fail(new UploadHttpError('The upload connection failed. Try again.'));
      xhr.ontimeout=()=>fail(new UploadHttpError('The upload timed out. Try again.'));
      xhr.onabort=()=>fail(new DOMException('Upload cancelled.','AbortError'));
      xhr.onload=()=>{
        if(settled||signal.aborted)return;
        if(new TextEncoder().encode(xhr.responseText).length>16384){oversized();return;}
        if(xhr.status<200||xhr.status>=300){fail(new UploadHttpError('The upload service rejected this request. Try again.',xhr.status));return;}
        try{
          const receipt=validateUploadReceipt(JSON.parse(xhr.responseText),requestId,file.size);
          settled=true;cleanup();resolve(receipt);
        }catch{fail(new UploadHttpError('The upload service returned an invalid acknowledgement.',xhr.status));}
      };
      if(signal.aborted){abort();return;}
      xhr.send(file);
    }catch{fail(new UploadHttpError('The upload request could not be started. Check its configuration.'));}
  });
}
