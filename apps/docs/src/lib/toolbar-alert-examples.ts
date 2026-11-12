/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const toolbarAlertExamples=[
  {
    id:'toolbar-editor-actions',componentId:'toolbar',title:'Note actions with mixed controls',
    description:'Save a short note, choose emphasis and open secondary actions from one toolbar. The example keeps its data in memory.',
    keyboard:['Tab enters the toolbar once; Left and Right Arrow move across buttons, toggle choices, links and the menu trigger.','Enter or Space activates an action. The menu keeps its own keyboard navigation and restores its trigger on Escape.','Tab leaves the toolbar for the note field. Every icon action has an accessible name.'],
    states:['mixed roving focus','Button and IconButton composition','ToggleGroup composition','DropdownMenu composition','controlled formatting','local save'],
    source:`'use client';
import {useState} from 'react';
import {Bold,Italic,MoreHorizontal,Save} from 'lucide-react';
import {Button,DropdownMenu,Icon,IconButton,Textarea,ToggleGroup,UIProvider} from '@bld8/ui';
import {Toolbar,ToolbarButton,ToolbarLink,ToolbarSeparator} from '@bld8/ui/toolbar';
export default function NoteToolbarExample(){
  const [note,setNote]=useState('A clear release note starts with the outcome.'),[format,setFormat]=useState<string[]>([]),[status,setStatus]=useState('Unsaved note');
  return <UIProvider><div style={{display:'grid',gap:16,maxWidth:680}}>
    <Toolbar label="Note actions">
      <ToolbarButton render={<IconButton label="Save note" icon={Save} variant="ghost" size="sm"/>} onClick={()=>setStatus('Saved '+note.length+' characters in memory')}/>
      <ToolbarSeparator/>
      <ToggleGroup label="Note emphasis" multiple options={[{value:'bold',label:'Bold',icon:Bold},{value:'italic',label:'Italic',icon:Italic}]} value={format} onValueChange={setFormat}/>
      <ToolbarSeparator/>
      <ToolbarLink href="#note-toolbar-help">Writing guide</ToolbarLink>
      <DropdownMenu trigger={<ToolbarButton render={<Button variant="ghost" size="sm"/>}>More<Icon icon={MoreHorizontal} size={16}/></ToolbarButton>} items={[
        {label:'Restore example note',onSelect:()=>{setNote('A clear release note starts with the outcome.');setStatus('Example note restored');}},
        {label:'Clear emphasis',onSelect:()=>setFormat([]),disabled:!format.length}
      ]}/>
    </Toolbar>
    <Textarea aria-label="Release note" value={note} onChange={event=>setNote(event.target.value)} style={{fontWeight:format.includes('bold')?700:400,fontStyle:format.includes('italic')?'italic':'normal'}}/>
    <p role="status">{status}</p><p id="note-toolbar-help" className="bui-hint">Lead with the changed behaviour. This small note preview does not provide a rich text editor or persistence service.</p>
  </div></UIProvider>;
}`
  },
  {
    id:'toolbar-bulk-actions',componentId:'toolbar',title:'Selected row actions',
    description:'Select local review rows, archive the selection and restore it. Disabled actions stay discoverable without accepting activation.',
    keyboard:['Checkboxes select rows independently of toolbar navigation.','Tab enters the action toolbar; arrow keys visit its actions. Disabled buttons are announced but cannot run.','Archive clears the selection and reports the local result.'],
    states:['selection count','disabled group','focusable disabled action','archive and restore','local rows'],
    source:`'use client';
import {useState} from 'react';
import {Archive,RotateCcw} from 'lucide-react';
import {Button,Checkbox,Icon} from '@bld8/ui';
import {Toolbar,ToolbarButton,ToolbarGroup,ToolbarSeparator} from '@bld8/ui/toolbar';
const initial=[{id:'brief',label:'Product brief'},{id:'tokens',label:'Colour tokens'},{id:'review',label:'Review checklist'}];
export default function BulkToolbarExample(){
  const [rows,setRows]=useState(initial),[selected,setSelected]=useState<string[]>([]),[status,setStatus]=useState('Select rows to archive.');
  return <div style={{display:'grid',gap:16,maxWidth:560}}>
    <Toolbar label="Selected row actions">
      <span style={{padding:'0 8px',whiteSpace:'nowrap'}} aria-live="polite">{selected.length} selected</span>
      <ToolbarSeparator/>
      <ToolbarGroup disabled={!selected.length} aria-label="Selection actions"><ToolbarButton onClick={()=>{setRows(current=>current.filter(row=>!selected.includes(row.id)));setStatus('Archived '+selected.length+' local rows');setSelected([]);}}><Icon icon={Archive} size={16}/>Archive selected</ToolbarButton><ToolbarButton onClick={()=>setSelected([])}>Clear selection</ToolbarButton></ToolbarGroup>
      <ToolbarSeparator/>
      <ToolbarButton onClick={()=>{setRows(initial);setSelected([]);setStatus('All local rows restored');}}><Icon icon={RotateCcw} size={16}/>Restore rows</ToolbarButton>
    </Toolbar>
    <div style={{display:'grid',gap:12}}>{rows.map(row=><Checkbox key={row.id} label={row.label} checked={selected.includes(row.id)} onCheckedChange={checked=>setSelected(current=>checked?[...current,row.id]:current.filter(id=>id!==row.id))}/>)}</div>
    {!rows.length&&<p>No rows remain. Restore rows to try again.</p>}<p role="status">{status}</p>
    <Button variant="secondary" onClick={()=>setSelected(rows.map(row=>row.id))} disabled={!rows.length}>Select all visible rows</Button>
  </div>;
}`
  },
  {
    id:'toolbar-filter-actions',componentId:'toolbar',title:'Filter and submit native values',
    description:'Combine a search input, status choices and an explicit native submit action. Other toolbar actions keep type=button.',
    keyboard:['Tab enters the toolbar. Arrow keys move between actions and choices; the search input keeps native text editing.','Enter in the search field submits the form. Apply filters is also an explicit submit button.','Clear filters changes the draft without submitting.'],
    states:['native form values','search input','controlled toggle choice','explicit submit','clear without submit'],
    source:`'use client';
import {useState} from 'react';
import {Button,ToggleGroup} from '@bld8/ui';
import {Toolbar,ToolbarButton,ToolbarInput,ToolbarSeparator} from '@bld8/ui/toolbar';
const issues=[{title:'Review keyboard flow',status:'open'},{title:'Publish release notes',status:'closed'},{title:'Review mobile spacing',status:'open'}];
export default function FilterToolbarExample(){
  const [query,setQuery]=useState(''),[status,setStatus]=useState<string[]>(['all']),[applied,setApplied]=useState({query:'',status:'all'}),[submitted,setSubmitted]=useState('No filter submission');
  const visible=issues.filter(issue=>issue.title.toLowerCase().includes(applied.query.toLowerCase())&&(applied.status==='all'||issue.status===applied.status));
  return <form aria-label="Issue filters" style={{display:'grid',gap:16,maxWidth:760}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const next={query:String(data.get('query')??''),status:String(data.get('status')??'all')};setApplied(next);setSubmitted(next.query+' | '+next.status);}}>
    <Toolbar label="Issue filter actions"><ToolbarInput aria-label="Search issues" type="search" name="query" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search issues"/>
      <ToolbarSeparator/><ToggleGroup label="Issue status" name="status" options={[{value:'all',label:'All'},{value:'open',label:'Open'},{value:'closed',label:'Closed'}]} value={status} onValueChange={next=>setStatus(next.length?next:['all'])}/>
      <ToolbarButton type="submit" name="action" value="apply" render={<Button size="sm"/>}>Apply filters</ToolbarButton>
      <ToolbarButton onClick={()=>{setQuery('');setStatus(['all']);}}>Clear filters</ToolbarButton>
    </Toolbar>
    <ul>{visible.map(issue=><li key={issue.title}>{issue.title} · {issue.status}</li>)}</ul><output aria-label="Submitted filters">{submitted}</output><p className="bui-hint">Choices and search are drafts until Apply filters. Results are local sample data.</p>
  </form>;
}`
  },
  {
    id:'toolbar-vertical-tools',componentId:'toolbar',title:'Vertical tool strip with bounded focus',
    description:'Choose a review tool with Up and Down Arrow. Focus stops at each end, and a disabled tool is skipped.',
    keyboard:['Up and Down Arrow navigate vertically; loopFocus=false stops at the first and last item.','The locked drawing tool uses focusableWhenDisabled=false and is skipped.','Disabled toolbar buttons cannot activate. Its help link remains navigable, following Base UI links.'],
    states:['vertical orientation','no focus loop','skipped disabled tool','disabled toolbar','icon labels','navigable help link'],
    source:`'use client';
import {useState} from 'react';
import {Hand,MessageSquare,MousePointer2,Pencil} from 'lucide-react';
import {Checkbox,Icon} from '@bld8/ui';
import {Toolbar,ToolbarButton,ToolbarLink,ToolbarSeparator} from '@bld8/ui/toolbar';
export default function VerticalToolsExample(){
  const [tool,setTool]=useState('Select'),[disabled,setDisabled]=useState(false);
  return <div style={{display:'grid',gap:16}}><Checkbox label="Disable review tools" checked={disabled} onCheckedChange={setDisabled}/><div style={{display:'flex',alignItems:'flex-start',gap:20}}>
    <Toolbar label="Review tools" orientation="vertical" loopFocus={false} disabled={disabled}>
      {[{label:'Select',icon:MousePointer2},{label:'Pan',icon:Hand},{label:'Comment',icon:MessageSquare}].map(item=><ToolbarButton key={item.label} aria-label={item.label+' tool'} aria-pressed={tool===item.label} onClick={()=>setTool(item.label)}><Icon icon={item.icon} size={18}/></ToolbarButton>)}
      <ToolbarButton aria-label="Drawing tool locked" disabled focusableWhenDisabled={false}><Icon icon={Pencil} size={18}/></ToolbarButton>
      <ToolbarSeparator/><ToolbarLink href="#review-tool-help" aria-label="Tool help">?</ToolbarLink>
    </Toolbar><div><p role="status">Active tool: {tool}</p><p id="review-tool-help" className="bui-hint">Select inspects a review item, Pan moves its view, and Comment places a note. This example demonstrates tool selection only.</p></div>
  </div></div>;
}`
  },
  {
    id:'alert-dialog-delete',componentId:'alert-dialog',title:'Delete a local draft explicitly',
    description:'Cancel receives focus first. Only the explicit Delete draft action removes the local draft; no service deletion is implied.',
    keyboard:['Opening places focus on Cancel. Tab stays within the modal confirmation.','Escape cancels and returns focus. Clicking outside does not dismiss.','Delete draft runs the supplied callback and closes after it returns.'],
    states:['Cancel-first focus','explicit destructive confirmation','synchronous host callback','focus restoration','local result'],
    source:`'use client';
import {useRef,useState} from 'react';
import {Button,UIProvider} from '@bld8/ui';
import {AlertDialog} from '@bld8/ui/alert-dialog';
export default function DeleteDraftExample(){
  const [deleted,setDeleted]=useState(false),restore=useRef<HTMLButtonElement>(null);
  return <UIProvider><div style={{display:'grid',gap:16,maxWidth:460}}><strong>Release note draft</strong><p>{deleted?'This local draft has been deleted.':'A draft awaiting review.'}</p>
    <AlertDialog trigger={<Button variant="danger" disabled={deleted}>Delete draft</Button>} title="Delete this draft?" description="The local Release note draft will be removed from this example. This action cannot be undone here." confirmLabel="Delete draft" destructive finalFocus={()=>deleted?restore.current:true} onConfirm={()=>setDeleted(true)}/>
    <Button ref={restore} variant="secondary" onClick={()=>setDeleted(false)} disabled={!deleted}>Create another draft</Button><p role="status">{deleted?'Draft deleted locally':'Draft available'}</p>
  </div></UIProvider>;
}`
  },
  {
    id:'alert-dialog-pending-recovery',componentId:'alert-dialog',title:'Pending work, cancellation and retry',
    description:'An abortable local callback fails its first attempt and succeeds on retry. Cancel, Escape, reset and unmount invalidate pending results; hosts own service cancellation and rollback.',
    keyboard:['Cancel stays available during pending work. Escape also cancels the request.','A failed attempt keeps the dialog open and moves focus to Retry export.','Reset request starts a new confirmation session and aborts its pending callback.'],
    states:['pending','duplicate prevention','rejected callback','retry','AbortSignal','resetKey','noncooperative stale result','local sample task'],
    source:`'use client';
import {useRef,useState} from 'react';
import {Button,Checkbox,UIProvider} from '@bld8/ui';
import {AlertDialog} from '@bld8/ui/alert-dialog';
function pause(signal:AbortSignal,hold:boolean,ignoreAbort:boolean){
  return new Promise<void>((resolve,reject)=>{
    const finish=()=>{signal.removeEventListener('abort',abort);resolve();};
    const timer=hold?undefined:setTimeout(finish,650);
    const abort=()=>{if(ignoreAbort)return;if(timer)clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};
    if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});
  });
}
export default function PendingConfirmationExample(){
  const [session,setSession]=useState(0),[hold,setHold]=useState(false),[ignoreAbort,setIgnoreAbort]=useState(false),[requests,setRequests]=useState(0),[cancelled,setCancelled]=useState(0),[result,setResult]=useState('No export prepared'),[open,setOpen]=useState(false);
  const failures=useRef(0);
  return <UIProvider><div style={{display:'grid',gap:16,maxWidth:520}}>
    <AlertDialog trigger={<Button>Prepare export</Button>} open={open} onOpenChange={setOpen} title="Prepare a local export?" description="The first completed sample request fails. Retry uses the same confirmation; Cancel keeps your current data." confirmLabel="Retry export" pendingLabel="Preparing export…" resetKey={session} errorMessage={error=>error instanceof Error?error.message:'Export failed. Try again.'} onConfirm={async({signal})=>{
      setRequests(count=>count+1);try{await pause(signal,hold,ignoreAbort);}catch(error){if(signal.aborted)setCancelled(count=>count+1);throw error;}
      if(signal.aborted)return;
      if(failures.current++===0)throw new Error('The sample export failed. Retry to recover.');
      setResult('Local export prepared');
    }}>{({pending})=><div style={{display:'grid',gap:12}}>
      <Checkbox label="Hold request until cancelled" checked={hold} onCheckedChange={setHold} disabled={pending}/>
      <Checkbox label="Let the sample finish after cancellation" checked={ignoreAbort} onCheckedChange={setIgnoreAbort} disabled={pending||hold}/>
      <Button variant="secondary" onClick={()=>setSession(value=>value+1)}>Reset request</Button>
      <p className="bui-hint">These are local sample tasks. An aborted signal prevents this example from changing its data; a real service must define its own cancellation and transaction rules.</p>
    </div>}</AlertDialog>
    <p role="status" aria-label="Export result">{result}</p><p aria-label="Export request count">Requests: {requests}</p><p aria-label="Export cancellation count">Aborted tasks: {cancelled}</p>
  </div></UIProvider>;
}`
  },
  {
    id:'alert-dialog-type-confirm',componentId:'alert-dialog',title:'Type a target name before confirmation',
    description:'The host enables confirmation only when the exact project name matches, and resets the typed draft when opening or closing.',
    keyboard:['Cancel receives initial focus; Tab reaches the named confirmation field.','The confirmation action stays disabled until ARCHIVE matches exactly.','Escape cancels and clears the typed draft through controlled open state.'],
    states:['controlled open','host validation','disabled confirmation','typed target','reset on cancel','explicit archive'],
    source:`'use client';
import {useState} from 'react';
import {Button,Field,Input,UIProvider} from '@bld8/ui';
import {AlertDialog} from '@bld8/ui/alert-dialog';
export default function TypedConfirmationExample(){
  const [open,setOpen]=useState(false),[typed,setTyped]=useState(''),[archived,setArchived]=useState(false);
  return <UIProvider><div style={{display:'grid',gap:16,maxWidth:480}}>
    <AlertDialog trigger={<Button variant="danger" disabled={archived}>Archive project</Button>} open={open} onOpenChange={next=>{setTyped('');setOpen(next);}} title="Archive project ARCHIVE?" description="Archiving removes this local project from the active list. Type ARCHIVE to enable the explicit archive action." confirmLabel="Archive ARCHIVE" destructive confirmDisabled={typed!=='ARCHIVE'} onConfirm={()=>setArchived(true)}>
      {({pending})=><Field label="Project name" hint="Enter ARCHIVE exactly, including capital letters."><Input value={typed} autoComplete="off" spellCheck={false} disabled={pending} onChange={event=>setTyped(event.target.value)}/></Field>}
    </AlertDialog><p role="status">{archived?'ARCHIVE is archived locally':'ARCHIVE remains active'}</p><Button variant="secondary" disabled={!archived} onClick={()=>setArchived(false)}>Restore project</Button>
  </div></UIProvider>;
}`
  },
  {
    id:'alert-dialog-dirty-exit',componentId:'alert-dialog',title:'Confirm leaving an unsaved note',
    description:'Keep editing preserves the draft. Discard restores the last local save and returns focus to an explicit Open editor action.',
    keyboard:['Leave editor opens only after the note changes; Keep editing receives focus.','Escape preserves the draft and returns to Leave editor.','Discard changes restores the saved text and focuses Open editor. This example does not intercept browser navigation.'],
    states:['dirty draft','safe cancellation','explicit discard','custom final focus','local save','host navigation boundary'],
    source:`'use client';
import {useRef,useState} from 'react';
import {Button,Field,Textarea,UIProvider} from '@bld8/ui';
import {AlertDialog} from '@bld8/ui/alert-dialog';
export default function DirtyExitExample(){
  const [saved,setSaved]=useState('Review before publishing.'),[draft,setDraft]=useState('Review before publishing.'),[editing,setEditing]=useState(true),[status,setStatus]=useState('No unsaved changes');
  const reopen=useRef<HTMLButtonElement>(null),dirty=draft!==saved;
  return <UIProvider><div style={{display:'grid',gap:16,maxWidth:520}}>
    <Field label="Editor note"><Textarea value={draft} disabled={!editing} onChange={event=>{setDraft(event.target.value);setStatus('Draft changed');}}/></Field>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button disabled={!editing||!dirty} onClick={()=>{setSaved(draft);setStatus('Note saved locally');}}>Save note</Button>
      <AlertDialog trigger={<Button variant="secondary" disabled={!editing||!dirty}>Leave editor</Button>} title="Discard your unsaved changes?" description="Your current draft differs from the last local save. Keep editing preserves it; Discard changes restores the saved note." confirmLabel="Discard changes" cancelLabel="Keep editing" destructive finalFocus={()=>editing?true:reopen.current} onConfirm={()=>{setDraft(saved);setEditing(false);setStatus('Changes discarded; editor closed');}}/>
      <Button ref={reopen} variant="ghost" onClick={()=>{setEditing(true);setStatus('Editor open');}}>Open editor</Button></div>
    <p role="status">{status}</p><p className="bui-hint">The host decides when navigation needs confirmation. This local example does not install route or browser unload guards.</p>
  </div></UIProvider>;
}`
  }
];
