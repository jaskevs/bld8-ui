/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useId,useLayoutEffect,useRef,useState,type ChangeEvent} from 'react';
import {Check,File as FileIcon,Upload} from 'lucide-react';
import {Button,Icon,Progress,Spinner} from './core.js';
import {Reveal} from './reveal.js';
import {useReducedMotionPreference} from './motion-preference.js';
import {formatUploadBytes,uploadFileError,validateUploadLimits,validateUploadProgress,validateUploadReceipt,type UploadFileHandler,type UploadQueueItem} from './upload-state.js';

export interface UploadQueueProps {
  label:string;
  onUploadFile:UploadFileHandler;
  accept?:string;
  maxFiles?:number;
  maxSize?:number;
  concurrency?:number;
  autoStart?:boolean;
  disabled?:boolean;
  hint?:string;
  /** Observational snapshots; Files and receipts are not persisted by the queue. */
  onItemsChange?:(items:readonly UploadQueueItem[])=>void;
}
interface Attempt {controller:AbortController;attempt:number}
const activeStatus=(item:UploadQueueItem)=>item.status==='uploading'||item.status==='processing';
/** Bounded, per-file uploads. The host supplies transport and owns storage. */
export function UploadQueue({label,onUploadFile,accept='',maxFiles=5,maxSize=10*1024*1024,concurrency=2,autoStart=false,disabled=false,hint,onItemsChange}:UploadQueueProps) {
  const limits=validateUploadLimits({maxFiles,maxSize,concurrency});
  if(typeof onUploadFile!=='function'||typeof accept!=='string'||accept.length>1024)throw new Error('Supply an upload handler and a bounded accept string.');
  const id=useId(),root=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null),browse=useRef<HTMLButtonElement>(null),list=useRef<HTMLUListElement>(null);
  const [items,setItems]=useState<UploadQueueItem[]>([]),itemsRef=useRef(items),[errors,setErrors]=useState<string[]>([]),[dragging,setDragging]=useState(false),[announcement,setAnnouncement]=useState('');
  const reduced=useReducedMotionPreference(),[height,setHeight]=useState<number>(),positions=useRef(new Map<string,number>()),motions=useRef<Animation[]>([]);
  const active=useRef(new Map<string,Attempt>()),authorised=useRef(new Set<string>()),alive=useRef(true),handler=useRef(onUploadFile),renderedHandler=useRef(onUploadFile),callback=useRef(onItemsChange);callback.current=onItemsChange;renderedHandler.current=onUploadFile;
  const focus=useRef<{origin:HTMLElement;item?:string;mode:'row'|'remove'|'start'}|null>(null);
  const update=(change:(previous:UploadQueueItem[])=>UploadQueueItem[])=>{if(!alive.current)return;const next=change(itemsRef.current);itemsRef.current=next;setItems(next);};
  const recoverRow=(item:string)=>{const origin=document.activeElement;if(origin instanceof HTMLElement&&origin.dataset.uploadAction==='cancel'&&root.current?.contains(origin)&&origin.closest<HTMLElement>('[data-upload-id]')?.dataset.uploadId===item)focus.current={origin,item,mode:'row'};};
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;for(const run of active.current.values())run.controller.abort();active.current.clear();authorised.current.clear();};},[]);
  useLayoutEffect(()=>{const element=list.current;if(!element)return;const observer=new ResizeObserver(()=>setHeight(element.getBoundingClientRect().height));observer.observe(element);return()=>observer.disconnect();},[]);
  useLayoutEffect(()=>{
    if(reduced){for(const animation of motions.current)animation.cancel();motions.current=[];}
    const next=new Map<string,number>();
    for(const element of Array.from(list.current?.children??[]) as HTMLElement[]){const key=element.dataset.uploadId!,top=element.offsetTop;next.set(key,top);const previous=positions.current.get(key);if(!reduced&&previous!==undefined&&Math.abs(previous-top)>1){const style=getComputedStyle(element),raw=style.getPropertyValue('--bui-duration-slow').trim(),milliseconds=parseFloat(raw)*(raw.endsWith('ms')?1:1000),duration=Number.isFinite(milliseconds)?Math.max(0,milliseconds):320,easing=style.getPropertyValue('--bui-ease').trim()||'ease';motions.current.push(element.animate([{transform:`translateY(${previous-top}px)`},{transform:'translateY(0)'}],{duration,easing}));}}
    positions.current=next;motions.current=motions.current.filter(animation=>animation.playState!=='finished');
  },[items,reduced]);
  useEffect(()=>()=>{for(const animation of motions.current)animation.cancel();},[]);
  useEffect(()=>{callback.current?.(items.map(item=>({...item,...(item.receipt?{receipt:{...item.receipt}}:{})})));},[items]);
  useEffect(()=>{
    if(handler.current===onUploadFile)return;
    handler.current=onUploadFile;authorised.current.clear();for(const [key,run] of active.current){recoverRow(key);run.controller.abort();}active.current.clear();
    update(previous=>previous.map(item=>activeStatus(item)?{...item,status:'cancelled',error:undefined}:item));
    setAnnouncement('The upload source changed. Active requests were cancelled.');
  },[onUploadFile]);
  useLayoutEffect(()=>{
    const request=focus.current;if(!request)return;
    if(document.activeElement!==request.origin&&document.activeElement!==document.body){focus.current=null;return;}
    const row=request.item?Array.from(root.current?.querySelectorAll<HTMLElement>('[data-upload-id]')??[]).find(element=>element.dataset.uploadId===request.item):undefined;
    const target=request.mode==='start'?root.current?.querySelector<HTMLButtonElement>('[data-upload-action="cancel"]:not(:disabled)'):row?.querySelector<HTMLButtonElement>('[data-upload-action="retry"]:not(:disabled),[data-upload-action="cancel"]:not(:disabled),[data-upload-action="remove"]:not(:disabled)');
    (target??(!browse.current?.disabled?browse.current:root.current))?.focus({preventScroll:true});focus.current=null;
  },[items]);
  useEffect(()=>{
    if(disabled)return;
    for(const item of itemsRef.current){
      if(active.current.size>=limits.concurrency)break;
      if(item.status!=='queued'||!autoStart&&!authorised.current.has(item.id))continue;
      const abort=new AbortController(),attempt=item.attempt+1;active.current.set(item.id,{controller:abort,attempt});authorised.current.delete(item.id);
      update(previous=>previous.map(row=>row.id===item.id?{...row,status:'uploading',attempt,loaded:0,total:undefined,error:undefined,receipt:undefined}:row));
      setAnnouncement(item.file.name+' uploading.');
      const isCurrent=()=>alive.current&&!abort.signal.aborted&&renderedHandler.current===onUploadFile&&active.current.get(item.id)?.controller===abort;
      void(async()=>{
        try{
          const receipt=await onUploadFile(item.file,{signal:abort.signal,requestId:item.requestId,onProgress:progress=>{
            if(!isCurrent())return;
            const current=itemsRef.current.find(row=>row.id===item.id);if(!current||current.attempt!==attempt)return;
            const next=validateUploadProgress(progress,current,item.file.size);if(!next)return;
            const processing=next.total!==undefined&&next.loaded===next.total;
            update(previous=>previous.map(row=>row.id===item.id?{...row,...next,status:processing?'processing':row.status}:row));
            if(processing&&current.status!=='processing')setAnnouncement(item.file.name+' sent. Waiting for acknowledgement.');
          }});
          if(!isCurrent())return;
          const accepted=validateUploadReceipt(receipt,item.requestId,item.file.size);
          recoverRow(item.id);active.current.delete(item.id);update(previous=>previous.map(row=>row.id===item.id?{...row,status:'complete',receipt:accepted,error:undefined}:row));setAnnouncement(item.file.name+' acknowledged.');
        }catch{
          if(!isCurrent())return;
          recoverRow(item.id);active.current.delete(item.id);update(previous=>previous.map(row=>row.id===item.id?{...row,status:'error',error:'Upload failed. Try again.'}:row));setAnnouncement(item.file.name+' failed. Retry is available.');
        }
      })();
    }
  },[items,onUploadFile,disabled,autoStart,limits.concurrency]);
  function add(incoming:globalThis.File[]){
    if(disabled)return;
    const next=[...itemsRef.current],rejected:string[]=[];let omitted=0;
    const reject=(message:string)=>{if(rejected.length<20)rejected.push(message);else omitted++;};
    for(const file of incoming){const error=uploadFileError(file,accept,limits.maxSize);if(error){reject(file.name+': '+error);continue;}if(next.length>=limits.maxFiles){reject(file.name+': Limit of '+limits.maxFiles+' files reached.');continue;}const key=crypto.randomUUID();next.push({id:key,requestId:key,file,status:'queued',attempt:0,loaded:0});}
    if(omitted)rejected.push(omitted+' additional files could not be added.');
    const added=next.length-itemsRef.current.length;update(()=>next);setErrors(rejected);setAnnouncement(added+(added===1?' file added.':' files added.'));
  }
  const onFiles=(event:ChangeEvent<HTMLInputElement>)=>{add(Array.from(event.target.files??[]));event.target.value='';};
  function cancel(item:UploadQueueItem,origin:HTMLElement){focus.current={origin,item:item.id,mode:'row'};active.current.get(item.id)?.controller.abort();active.current.delete(item.id);authorised.current.delete(item.id);update(previous=>previous.map(row=>row.id===item.id?{...row,status:'cancelled',error:undefined}:row));setAnnouncement(item.file.name+' cancelled.');}
  function retry(item:UploadQueueItem,origin:HTMLElement){if(disabled)return;focus.current={origin,item:item.id,mode:'row'};authorised.current.add(item.id);update(previous=>previous.map(row=>row.id===item.id?{...row,status:'queued',loaded:0,total:undefined,error:undefined,receipt:undefined}:row));setAnnouncement(item.file.name+' queued for retry.');}
  function remove(item:UploadQueueItem,origin:HTMLElement){const index=itemsRef.current.findIndex(row=>row.id===item.id),next=itemsRef.current[index+1]??itemsRef.current[index-1];focus.current={origin,item:next?.id,mode:'remove'};active.current.get(item.id)?.controller.abort();active.current.delete(item.id);authorised.current.delete(item.id);update(previous=>previous.filter(row=>row.id!==item.id));setAnnouncement(item.file.name+' removed.');}
  const queued=items.filter(item=>item.status==='queued'),busy=items.some(activeStatus),complete=items.filter(item=>item.status==='complete').length;
  return <div ref={root} className="bui-upload-queue" role="group" tabIndex={-1} aria-labelledby={id+'-label'}>
    <div className="bui-upload-queue-heading"><div><span id={id+'-label'} className="bui-label">{label}</span><p id={id+'-hint'} className="bui-hint">{hint??'Add files, then start the queue. Your service acknowledges each file.'}</p></div><span className="bui-hint">{complete} of {items.length} acknowledged</span></div>
    <div className="bui-upload-queue-drop" data-dragging={dragging||undefined} data-disabled={disabled||undefined} onDragOver={event=>{event.preventDefault();if(!disabled){event.dataTransfer.dropEffect='copy';setDragging(true);}}} onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setDragging(false);}} onDrop={event=>{event.preventDefault();setDragging(false);add(Array.from(event.dataTransfer.files));}}>
      <Icon icon={Upload}/><div><strong>Drop files here</strong><p className="bui-hint">Up to {limits.maxFiles} files · {formatUploadBytes(limits.maxSize)} each{accept?' · '+accept:''}</p></div>
      <input ref={input} id={id} type="file" multiple={limits.maxFiles>1} accept={accept} disabled={disabled} tabIndex={-1} className="bui-sr-only" aria-label={label+' files'} aria-describedby={id+'-hint'} onChange={onFiles}/><Button ref={browse} size="sm" variant="secondary" disabled={disabled} onClick={()=>input.current?.click()}>Browse files</Button>
    </div>
    <Reveal open={!!errors.length}><div className="bui-upload-queue-errors" role="alert"><strong>Check the files</strong><ul>{errors.map((error,index)=><li key={index}>{error}</li>)}</ul></div></Reveal>
    <div className="bui-upload-queue-stage" data-reduced-motion={reduced||undefined} style={{height}}><ul ref={list} className="bui-upload-queue-list" aria-label={label+' queue'}>{items.map(item=>{
      const pending=activeStatus(item),percent=item.total!==undefined&&item.total>0?Math.round(item.loaded/item.total*100):null;
      const status=item.status==='processing'?'Sent · awaiting acknowledgement':item.status==='complete'?'Acknowledged':item.status==='uploading'?'Uploading':item.status==='queued'?'Queued':item.status==='cancelled'?'Cancelled':'Upload failed';
      return <li key={item.id} data-upload-id={item.id} data-upload-status={item.status} className="bui-upload-queue-item"><span className="bui-upload-queue-symbol" aria-hidden="true">{item.status==='complete'?<Icon icon={Check}/>:pending?<Spinner/>:<Icon icon={FileIcon}/>}</span><div className="bui-upload-queue-detail"><strong title={item.file.name}>{item.file.name}</strong><span className="bui-hint">{formatUploadBytes(item.file.size)} · {status}</span>{pending&&<Progress label={'Bytes sent for '+item.file.name} value={item.status==='processing'?100:percent}/>}{item.receipt?.sha256&&<code className="bui-upload-queue-hash" title={item.receipt.sha256}>SHA-256 {item.receipt.sha256}</code>}<Reveal open={!!item.error}><p className="bui-error">{item.error}</p></Reveal></div><div className="bui-upload-queue-actions">{(pending||item.status==='queued')&&<Button size="sm" variant="ghost" data-upload-action="cancel" aria-label={'Cancel '+item.file.name} onClick={event=>cancel(item,event.currentTarget)}>Cancel</Button>}{(item.status==='error'||item.status==='cancelled')&&<Button size="sm" variant="secondary" data-upload-action="retry" aria-label={'Retry '+item.file.name} disabled={disabled} onClick={event=>retry(item,event.currentTarget)}>Retry</Button>}<Button size="sm" variant="ghost" data-upload-action="remove" aria-label={'Remove '+item.file.name} disabled={disabled&&!pending} onClick={event=>remove(item,event.currentTarget)}>Remove</Button></div></li>;
    })}</ul></div>
    <div className="bui-upload-queue-footer"><span className="bui-hint">{busy?'Sending files. Completion requires a service acknowledgement.':queued.length?queued.length+' queued.':'Files stay in this session.'}</span><Button size="sm" disabled={disabled||!queued.length} onClick={event=>{focus.current={origin:event.currentTarget,mode:'start'};for(const item of queued)authorised.current.add(item.id);update(previous=>[...previous]);}}>Start queued</Button></div>
    <span className="bui-sr-only" role="status" aria-live="polite">{announcement}</span>
  </div>;
}
