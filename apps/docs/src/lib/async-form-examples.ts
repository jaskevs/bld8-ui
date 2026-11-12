/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const asyncFormExamples = [
  {
    "id": "async-form-lifecycle",
    "componentId": "async-combobox",
    "title": "Remote choices with an external form",
    "description": "Single and multiple choices submit stable IDs to a separate form. Reset restores uncontrolled defaults without reporting edits; read-only values are kept, while disabled values are excluded.",
    "keyboard": [
      "Type in Assignee or Reviewers; Arrow Down and Enter choose an available person.",
      "Escape closes results and preserves the committed selection.",
      "Tab reaches the separate form submit/reset actions; locked choices remain readable and focusable."
    ],
    "states": [
      "External form ownership",
      "Uncontrolled reset",
      "Prevented reset",
      "Read-only submitted values",
      "Disabled excluded values",
      "Selected labels retained"
    ],
    "source": "'use client';\nimport {useCallback,useId,useRef,useState} from 'react';\nimport {AsyncCombobox,AsyncMultiSelect,Button,Checkbox,UIProvider,type AsyncOptionsLoader} from '@bld8/ui';\nconst people=[{value:'maya',label:'Maya Chen'},{value:'sam',label:'Sam Rivera'},{value:'oliver',label:'Oliver Reed'}];\nexport default function AsyncFormLifecycle(){\n  const formId=useId(),assignee=useRef<HTMLInputElement>(null);\n  const [locked,setLocked]=useState(false),[preventReset,setPreventReset]=useState(false),[changes,setChanges]=useState(0),[status,setStatus]=useState('No directory values submitted.');\n  const load=useCallback<AsyncOptionsLoader>(async({query,signal})=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return {items:people.filter(person=>person.label.toLowerCase().includes(query.toLowerCase())),nextCursor:null};},[]);\n  const changed=()=>setChanges(count=>count+1);\n  return <UIProvider><div style={{display:'grid',gap:20}}>\n    <p className=\"bui-hint\">Local directory data. The application owns transport and access control.</p>\n    <AsyncCombobox label=\"Assignee\" name=\"owner\" form={formId} defaultValue=\"maya\" selectedOptions={people} loadOptions={load} debounceMs={0} required readOnly={locked} inputRef={assignee} onValueChange={changed} hint=\"The selected ID belongs to the separate form below.\"/>\n    <AsyncMultiSelect label=\"Reviewers\" name=\"reviewers\" form={formId} defaultValue={['sam']} selectedOptions={people} loadOptions={load} debounceMs={0} readOnly={locked} onValueChange={changed}/>\n    <AsyncCombobox label=\"Approved by\" name=\"approvedBy\" form={formId} defaultValue=\"maya\" selectedOptions={people} loadOptions={load} readOnly hint=\"Read-only values are still submitted.\"/>\n    <AsyncMultiSelect label=\"Unavailable reviewers\" name=\"unavailable\" form={formId} defaultValue={['oliver']} selectedOptions={people} loadOptions={load} disabled hint=\"Disabled values are excluded from submission.\"/>\n    <Checkbox label=\"Lock directory fields\" checked={locked} onCheckedChange={setLocked}/>\n    <Checkbox label=\"Keep values on reset\" checked={preventReset} onCheckedChange={setPreventReset}/>\n    <form id={formId} onReset={event=>{if(preventReset){event.preventDefault();setStatus('Reset prevented.');}else setStatus('Reset requested.');}} onSubmit={event=>{event.preventDefault();setStatus(JSON.stringify([...new FormData(event.currentTarget).entries()]));}}>\n      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button type=\"submit\">Read directory values</Button><Button type=\"reset\" variant=\"secondary\">Reset directory values</Button><Button variant=\"ghost\" onClick={()=>assignee.current?.focus()}>Focus assignee</Button></div>\n    </form><p aria-label=\"Directory edit count\">Edits: {changes}</p><p role=\"status\" aria-label=\"Directory form result\">{status}</p>\n  </div></UIProvider>;\n}"
  },
  {
    "id": "async-controlled-form",
    "componentId": "async-multi-select",
    "title": "Controlled remote choices stay host owned",
    "description": "The host owns selected IDs through form reset and external updates. A read-only toggle prevents edits without disabling native submission.",
    "keyboard": [
      "Choose people with the keyboard, then reset the form without replacing the controlled values.",
      "Lock the fields to read selections without opening a picker or removing a chip.",
      "Host update replaces both controlled values explicitly."
    ],
    "states": [
      "Controlled reset ownership",
      "Explicit host update",
      "Read-only without mutation",
      "Native stable IDs"
    ],
    "source": "'use client';\nimport {useCallback,useState} from 'react';\nimport {AsyncCombobox,AsyncMultiSelect,Button,Checkbox,UIProvider,type AsyncOptionsLoader} from '@bld8/ui';\nconst people=[{value:'maya',label:'Maya Chen'},{value:'sam',label:'Sam Rivera'},{value:'oliver',label:'Oliver Reed'}];\nexport default function AsyncControlledForm(){\n  const [owner,setOwner]=useState<string|null>('maya'),[reviewers,setReviewers]=useState(['sam']),[locked,setLocked]=useState(false),[status,setStatus]=useState('Controlled values belong to this component.');\n  const load=useCallback<AsyncOptionsLoader>(async({query,signal})=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return {items:people.filter(person=>person.label.toLowerCase().includes(query.toLowerCase())),nextCursor:null};},[]);\n  return <UIProvider><form style={{display:'grid',gap:20}} onReset={()=>setStatus('Native reset kept host values.')} onSubmit={event=>{event.preventDefault();setStatus(JSON.stringify([...new FormData(event.currentTarget).entries()]));}}>\n    <AsyncCombobox label=\"Controlled assignee\" name=\"owner\" value={owner} onValueChange={setOwner} loadOptions={load} selectedOptions={people} readOnly={locked} debounceMs={0}/>\n    <AsyncMultiSelect label=\"Controlled reviewers\" name=\"reviewers\" value={reviewers} onValueChange={setReviewers} loadOptions={load} selectedOptions={people} readOnly={locked} debounceMs={0}/>\n    <Checkbox label=\"Lock controlled choices\" checked={locked} onCheckedChange={setLocked}/>\n    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button type=\"submit\">Read controlled choices</Button><Button type=\"reset\" variant=\"secondary\">Reset controlled choices</Button><Button variant=\"ghost\" onClick={()=>{setOwner('oliver');setReviewers(['maya','oliver']);}}>Host update</Button></div>\n    <p role=\"status\" aria-label=\"Controlled directory result\">{status}</p>\n  </form></UIProvider>;\n}"
  },
  {
    "id": "async-readonly-cancellation",
    "componentId": "async-combobox",
    "title": "Lock a field while its lookup is pending",
    "description": "Switching to read-only closes a pending lookup and cancels its request. Turn holding off before another search to load the local results; selected labels and canonical values stay available.",
    "keyboard": [
      "Leave Hold local lookups on, then type a query to start a pending request.",
      "Tab to Lock lookup; the popup closes while the field retains its committed label.",
      "Turn holding off before searching again to let the local result arrive."
    ],
    "states": [
      "Pending lookup cancellation",
      "Read-only transition",
      "Retained selected label",
      "Explicit local adapter"
    ],
    "source": "'use client';\nimport {useCallback,useEffect,useRef,useState} from 'react';\nimport {AsyncCombobox,AsyncMultiSelect,Button,Checkbox,UIProvider,type AsyncOptionsLoader} from '@bld8/ui';\nconst people=[{value:'maya',label:'Maya Chen'},{value:'sam',label:'Sam Rivera'}];\nexport default function AsyncReadOnlyCancellation(){\n  const [locked,setLocked]=useState(false),[held,setHeld]=useState(true),[waiting,setWaiting]=useState(0),[cancelled,setCancelled]=useState(0),[status,setStatus]=useState('No lookup submitted.');\n  const pending=useRef(new Map<symbol,()=>void>()),hold=useRef(true),alive=useRef(true);\n  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);\n  const load=useCallback<AsyncOptionsLoader>(async({query,signal})=>{\n    await new Promise<void>((resolve,reject)=>{const key=Symbol('lookup');let timer:ReturnType<typeof setTimeout>|undefined;const finish=()=>{clearTimeout(timer);pending.current.delete(key);signal.removeEventListener('abort',abort);if(alive.current)setWaiting(pending.current.size);resolve();};const abort=()=>{clearTimeout(timer);pending.current.delete(key);if(alive.current){setWaiting(pending.current.size);setCancelled(count=>count+1);}reject(new DOMException('Cancelled','AbortError'));};if(signal.aborted){abort();return;}pending.current.set(key,finish);signal.addEventListener('abort',abort,{once:true});setWaiting(pending.current.size);if(!hold.current)timer=setTimeout(finish,300);});\n    if(signal.aborted)throw new DOMException('Cancelled','AbortError');return {items:people.filter(person=>person.label.toLowerCase().includes(query.toLowerCase())),nextCursor:null};\n  },[]);\n  return <UIProvider><form style={{display:'grid',gap:20}} onSubmit={event=>{event.preventDefault();setStatus('Assignee ID: '+new FormData(event.currentTarget).get('owner'));}}>\n    <AsyncCombobox label=\"Pending assignee\" name=\"owner\" defaultValue=\"maya\" selectedOptions={people} loadOptions={load} debounceMs={0} readOnly={locked}/>\n    <AsyncMultiSelect label=\"Pending reviewers\" name=\"reviewers\" defaultValue={['sam']} selectedOptions={people} loadOptions={load} debounceMs={0} readOnly={locked}/>\n    <Checkbox label=\"Hold local lookups\" checked={held} onCheckedChange={next=>{hold.current=!!next;setHeld(!!next);}}/>\n    <Checkbox label=\"Lock lookup\" checked={locked} onCheckedChange={setLocked}/>\n    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button type=\"submit\">Read pending assignee</Button></div>\n    <p aria-label=\"Lookup activity\">Waiting: {waiting} · Cancelled: {cancelled}</p><p role=\"status\" aria-label=\"Pending directory result\">{status}</p>\n    <p className=\"bui-hint\">Held results demonstrate cancellation; turn holding off before another search to load the local directory. No external service is called.</p>\n  </form></UIProvider>;\n}"
  }
] as const;
