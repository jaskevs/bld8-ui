/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Check,History,MessageSquare,RefreshCw,Send,Undo2} from 'lucide-react';
import {Alert,Button,Field,Icon,Reveal,Skeleton,Textarea,useUnsavedChanges} from '@bld8/ui';
import type {OutlineActivity,OutlineHistoryRepository} from './outline-repository.js';
import type {OutlineDraftStore} from './outline-drafts.js';

export function OutlineProjectActivity({projectId,history,drafts,disabled,onPendingChange}:{projectId:string;history:OutlineHistoryRepository;drafts:OutlineDraftStore;disabled:boolean;onPendingChange:(pending:boolean)=>void}){
  const [entries,setEntries]=useState<OutlineActivity[]>([]),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState('');
  const [draft,setDraft]=useState(()=>drafts.getComment(projectId)),[pending,setPending]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[visible,setVisible]=useState(10);
  const read=useRef<AbortController|null>(null),write=useRef<AbortController|null>(null),input=useRef<HTMLTextAreaElement>(null);
  useUnsavedChanges(!!draft.text.trim());
  async function load(){
    read.current?.abort();const controller=new AbortController();read.current=controller;setLoading(true);setLoadError('');
    try{const result=await history.list(projectId,controller.signal);if(!controller.signal.aborted)setEntries(result);}
    catch(cause){if(!controller.signal.aborted)setLoadError(cause instanceof Error?cause.message:'Activity could not be loaded. Try again.');}
    finally{if(read.current===controller){read.current=null;setLoading(false);}}
  }
  useEffect(()=>{void load();return()=>{read.current?.abort();write.current?.abort();onPendingChange(false);};},[history,projectId]);
  useEffect(()=>{if(!pending&&(message||error))input.current?.focus({preventScroll:true});},[pending,message,error]);
  async function post(event:FormEvent){
    event.preventDefault();if(write.current||disabled)return;
    if(!draft.text.trim()||draft.text.trim().length>1000){setError('Use between 1 and 1,000 characters.');input.current?.focus({preventScroll:true});return;}
    const controller=new AbortController();write.current=controller;setPending(true);onPendingChange(true);setError('');setMessage('');read.current?.abort();
    try{
      const entry=await history.addComment(projectId,draft.text,draft.clientId,controller.signal);if(controller.signal.aborted)return;
      setEntries(current=>[entry,...current.filter(item=>item.id!==entry.id)].slice(0,100));const empty={text:'',clientId:''};setDraft(empty);drafts.putComment(projectId,empty);setMessage('Comment added.');
    }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'The comment could not be saved. Your text is still here.');}
    finally{if(write.current===controller){write.current=null;setPending(false);onPendingChange(false);}}
  }
  return <section className="bblocks-project-activity" aria-label="Project activity">
    <header><div><p className="bblocks-kicker">THE CONTEXT, KEPT</p><h3>Activity</h3></div><Button size="sm" variant="ghost" leadingIcon={RefreshCw} loading={loading} disabled={pending||disabled} onClick={()=>void load()}>Refresh activity</Button></header>
    <p className="bblocks-note">Changes and comments saved in this workspace. Latest 100 entries per project.</p>
    <Reveal open={!!loadError}>{loadError?<Alert title="Could not load activity" tone="danger" live>{loadError}<Button size="sm" variant="ghost" disabled={pending||disabled} onClick={()=>void load()}>Retry activity</Button></Alert>:null}</Reveal>
    <div className="bblocks-project-activity-feed" aria-busy={loading||undefined}>
      {loading&&!entries.length?<div className="bblocks-stack" role="status" aria-label="Loading activity"><Skeleton height="2.5rem"/><Skeleton height="2.5rem"/></div>:!entries.length?<p className="bblocks-project-activity-empty"><Icon icon={History} size={18}/>{loadError?'Activity is unavailable. Your project is unchanged.':'Activity starts with your next change.'}</p>:<ol>{entries.slice(0,visible).map(entry=><li key={entry.id} data-kind={entry.kind}><span className="bblocks-project-activity-mark"><Icon icon={entry.kind==='comment'?MessageSquare:entry.kind==='undo'?Undo2:Check} size={14}/></span><div><span className="bblocks-project-activity-kind">{entry.kind==='comment'?'Comment':'Project update'}</span><p>{entry.text}</p><time dateTime={entry.at}>{new Date(entry.at).toLocaleString('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</time></div></li>)}</ol>}
    </div>
    {entries.length>visible&&<Button size="sm" variant="ghost" onClick={()=>setVisible(value=>value+10)}>Show earlier activity</Button>}
    <form className="bblocks-project-comment" onSubmit={post}>
      <Field label="Add a comment" error={error} hint="Plain text, up to 1,000 characters. Unsent comments stay while this page is open."><Textarea ref={input} value={draft.text} maxLength={1000} disabled={pending||disabled} onChange={event=>{const next={text:event.target.value,clientId:crypto.randomUUID()};setDraft(next);drafts.putComment(projectId,next);setError('');setMessage('');}}/></Field>
      <div><span className="bblocks-note" role="status">{message||`${draft.text.length.toLocaleString('en-AU')} / 1,000`}</span><Button type="submit" size="sm" leadingIcon={Send} loading={pending} disabled={disabled||!draft.text.trim()}>Post comment</Button></div>
    </form>
  </section>;
}
