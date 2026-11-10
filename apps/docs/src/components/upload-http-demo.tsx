'use client';
import {useMemo,useRef,useState} from 'react';
import {Button,Checkbox,UploadQueue,createUploadHttpAdapter,type UploadQueueItem} from '@bld8/ui';
import {CodeBlock} from './code-block';

export function UploadHttpDemo(){
  const [fail,setFail]=useState(false),[disabled,setDisabled]=useState(false),[items,setItems]=useState<readonly UploadQueueItem[]>([]),[source,setSource]=useState(0),failRef=useRef(false);failRef.current=fail;
  const upload=useMemo(()=>{
    let session:string|undefined;
    return createUploadHttpAdapter({endpoint:'/api/examples/uploads',headers:()=>{
      session??=crypto.randomUUID();const rejectNext=failRef.current;failRef.current=false;if(rejectNext)setFail(false);
      const headers:Record<string,string>={'X-BLD8-Session':session};if(rejectNext)headers['X-BLD8-Fail']='1';return headers;
    }});
  },[source]);
  const receipts=items.flatMap(item=>item.receipt?[{file:item.file.name,...item.receipt}]:[]);
  return <section className="stack upload-http-example" aria-label="HTTP upload example">
    <div className="bui-calendar-demo-controls"><Checkbox label="Fail next upload" checked={fail} onChange={event=>setFail(event.currentTarget.checked)}/><Checkbox label="Disable new uploads" checked={disabled} onChange={event=>setDisabled(event.currentTarget.checked)}/><Button variant="ghost" size="sm" onClick={()=>setSource(value=>value+1)}>Replace upload adapter</Button></div>
    <UploadQueue label="Files to receive" maxFiles={5} maxSize={2*1024*1024} concurrency={2} onUploadFile={upload} onItemsChange={setItems} disabled={disabled} hint="Example receiver: up to 2 MiB per file. Bytes are discarded after a receipt is returned."/>
    {receipts.length>0&&<details className="upload-http-receipts"><summary>Inspect server receipts ({receipts.length})</summary><CodeBlock code={JSON.stringify(receipts,null,2)} language="json"/></details>}
    <p className="bui-hint">Receipts last up to five minutes in this server process. They do not provide file hosting or account access.</p>
  </section>;
}
