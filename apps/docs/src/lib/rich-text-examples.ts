/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const richTextExamples = [
  {
    "id": "rich-text-review-form",
    "componentId": "rich-text-editor",
    "title": "A structured note with native form ownership",
    "description": "Write and format a note, submit its canonical JSON through an external form, and reset without losing controlled ownership. Read-only text stays submitted; disabled text is excluded.",
    "keyboard": [
      "Tab enters the formatting toolbar and editable document. Standard editor shortcuts format and undo.",
      "Submitting an empty required note focuses the real editor. Reset restores defaults unless cancelled."
    ],
    "states": [
      "External form",
      "Required editor focus",
      "Native and prevented reset",
      "Read only",
      "Disabled exclusion",
      "Structured JSON submission"
    ],
    "source": "'use client';\nimport {useId,useState} from 'react';\nimport {Button,Checkbox,RichTextEditor,richTextToText,type RichTextDocument,UIProvider} from '@bld8/ui';\nconst locked:RichTextDocument={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Read-only reference.'}]}]};\nexport default function RichReviewForm(){const id=useId(),[prevent,setPrevent]=useState(false),[changes,setChanges]=useState(0),[status,setStatus]=useState('No note submitted.');return <UIProvider><div style={{display:'grid',gap:24,maxWidth:760}}>\n  <RichTextEditor label=\"Review note\" name=\"note\" form={id} required onValueChange={()=>setChanges(value=>value+1)} hint=\"A local note. Nothing is sent.\"/>\n  <RichTextEditor label=\"Locked reference\" name=\"locked\" form={id} defaultValue={locked} readOnly toolbar=\"none\"/>\n  <RichTextEditor label=\"Unavailable reference\" name=\"disabled\" form={id} defaultValue={locked} disabled toolbar=\"none\"/>\n  <Checkbox label=\"Prevent note reset\" checked={prevent} onCheckedChange={setPrevent}/>\n  <form id={id} aria-label=\"Review note form\" onReset={event=>{if(prevent){event.preventDefault();setStatus('Note reset prevented.');}else setStatus('Note defaults restored.');}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setStatus('Note: '+richTextToText(JSON.parse(String(data.get('note'))))+' | Locked: '+richTextToText(JSON.parse(String(data.get('locked'))))+' | Disabled: '+data.has('disabled'));}}>\n    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button type=\"submit\">Read note values</Button><Button type=\"reset\" variant=\"secondary\">Reset note</Button></div>\n  </form><p role=\"status\">{status}</p><p data-rich-changes>{'Changes: '+changes}</p>\n</div></UIProvider>;}\n"
  },
  {
    "id": "rich-text-controlled-document",
    "componentId": "rich-text-editor",
    "title": "Controlled content without cursor jumps",
    "description": "Echo a fresh JSON object on each edit while preserving the active selection. Apply a new document identity to start a separate history, and inspect escaped HTML output as text.",
    "keyboard": [
      "Edit in the middle of a sentence; controlled JSON echoes keep the caret in place.",
      "Use formatting or keyboard shortcuts, then Undo/Redo. Replace the document to begin a new history.",
      "Select text and use Edit link; unsafe destinations are rejected without changing the document."
    ],
    "states": [
      "Controlled JSON",
      "Selection-safe echoes",
      "Undo and redo",
      "Document identity",
      "Safe link editing",
      "Safe HTML serialization"
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Button,Checkbox,RichTextEditor,richTextToHtml,type RichTextDocument,UIProvider} from '@bld8/ui';\nconst first:RichTextDocument={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Keep the useful details together.'}]}]};\nexport default function ControlledRichText(){const [value,setValue]=useState(first),[identity,setIdentity]=useState(0),[readOnly,setReadOnly]=useState(false);return <UIProvider><div style={{display:'grid',gap:20,maxWidth:760}}>\n  <RichTextEditor label=\"Controlled note\" name=\"controlledNote\" value={value} onValueChange={next=>setValue(JSON.parse(JSON.stringify(next)))} documentKey={String(identity)} readOnly={readOnly}/>\n  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button variant=\"secondary\" onClick={()=>{setValue({type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'A separate review.'}]}]});setIdentity(value=>value+1);}}>Replace document</Button><Checkbox label=\"Read-only note\" checked={readOnly} onCheckedChange={setReadOnly}/></div>\n  <pre data-rich-html style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxWidth:'100%'}}>{richTextToHtml(value)}</pre>\n</div></UIProvider>;}\n"
  },
  {
    "id": "mentions-async-directory",
    "componentId": "mentions",
    "title": "Mention people with cancellation and recovery",
    "description": "Search a small authored directory, insert stable identities and recover a failed lookup. A deliberately slow source can ignore cancellation so stale-response protection is visible.",
    "keyboard": [
      "Type @ and a name. Arrow keys move through available people; Enter inserts a stable identity.",
      "Escape closes the suggestions without deleting the draft. Tab leaves the editor.",
      "After a lookup failure, Enter retries from the editor; the Retry search button is also available."
    ],
    "states": [
      "Async directory",
      "AbortSignal",
      "Late stale response",
      "Retry without draft loss",
      "Stable mention IDs",
      "Disabled people"
    ],
    "source": "'use client';\nimport {useCallback,useRef,useState} from 'react';\nimport {Button,Checkbox,Mentions,richTextToText,type RichTextMentionSource,UIProvider} from '@bld8/ui';\nconst people=[{id:'person-maya',label:'Maya Chen',description:'Interface engineering'},{id:'person-oliver',label:'Oliver Reed',description:'Documentation'},{id:'person-sam',label:'Sam Rivera',description:'Design systems'},{id:'person-leon',label:'Leon Park',description:'Not available for new reviews',disabled:true}];\nexport default function AsyncMentionsExample(){const [fail,setFail]=useState(false),[ignore,setIgnore]=useState(false),[lastQuery,setLastQuery]=useState('none'),[settled,setSettled]=useState('none'),[status,setStatus]=useState('No comment read.');const flags=useRef({fail,ignore});flags.current={fail,ignore};\n  const source=useCallback<RichTextMentionSource>(({query,signal})=>new Promise((resolve,reject)=>{setLastQuery(query);const failThis=flags.current.fail,ignoreThis=flags.current.ignore&&query==='ol';if(failThis){flags.current.fail=false;setFail(false);}const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);setSettled(query);if(failThis)reject(Error('Directory unavailable. Try again.'));else resolve(people.filter(person=>person.label.toLowerCase().includes(query.toLowerCase())));},query==='ol'?350:35);function cancel(){if(ignoreThis)return;clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));}if(signal.aborted)cancel();else signal.addEventListener('abort',cancel,{once:true});}),[]);\n  return <UIProvider><div style={{display:'grid',gap:20,maxWidth:760}}><div style={{display:'flex',gap:20,flexWrap:'wrap'}}><Checkbox label=\"Fail next directory lookup\" checked={fail} onCheckedChange={setFail}/><Checkbox label=\"Ignore cancellation for slow ol lookup\" checked={ignore} onCheckedChange={setIgnore}/></div>\n    <form aria-label=\"Mention comment form\" style={{display:'grid',gap:20}} onSubmit={event=>{event.preventDefault();const json=String(new FormData(event.currentTarget).get('comment'));setStatus('Comment: '+richTextToText(JSON.parse(json))+' | JSON: '+json);}}><Mentions label=\"Comment with people\" name=\"comment\" mentionSource={source} mentionDebounceMs={0} hint=\"Type @ to search. Mentioning someone sends no notification.\"/><Button type=\"submit\">Read comment values</Button></form>\n    <p className=\"bui-hint\" data-mention-request>{'Latest query: '+lastQuery}</p><p className=\"bui-hint\" data-mention-settled>{'Latest completed query: '+settled}</p><p role=\"status\" style={{overflowWrap:'anywhere'}}>{status}</p>\n  </div></UIProvider>;}\n"
  },
  {
    "id": "rich-text-scoped-arabic",
    "componentId": "rich-text-editor",
    "title": "A scoped Arabic editing surface",
    "description": "The editor, formatting popup and mention choices inherit an explicit local language, direction and theme. Host labels and directory identities remain application-owned.",
    "keyboard": [
      "Tab enters the toolbar; its directional arrows follow RTL. Editor shortcuts keep their native editing semantics.",
      "Type @ to search the authored Arabic directory. Escape closes suggestions and keeps the text."
    ],
    "states": [
      "Scoped RTL",
      "Dark theme",
      "Local message overrides",
      "Arabic directory labels",
      "Stable IDs",
      "Reduced motion"
    ],
    "source": "'use client';\nimport {RichTextEditor,UIProvider,type RichTextMentionSource,type RichTextDocument} from '@bld8/ui';\nconst content:RichTextDocument={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'تفاصيل صغيرة تجعل المراجعة أوضح.'}]}]};\nconst source:RichTextMentionSource=async({query,signal})=>signal.aborted?[]:[{id:'reviewer-maya',label:'مايا',description:'هندسة الواجهات'},{id:'reviewer-sam',label:'سام',description:'أنظمة التصميم'}].filter(person=>person.label.includes(query));\nexport default function ArabicRichText(){return <UIProvider theme=\"dark\" locale=\"ar\" direction=\"rtl\" motion=\"reduced\" messages={{'rich.formatting':'تنسيق النص','rich.bold':'غامق','rich.italic':'مائل','rich.strike':'يتوسطه خط','rich.block':'نمط النص','rich.paragraph':'فقرة','rich.heading1':'عنوان ١','rich.heading2':'عنوان ٢','rich.heading3':'عنوان ٣','rich.bullets':'قائمة نقطية','rich.ordered':'قائمة مرقمة','rich.codeBlock':'كتلة برمجية','rich.editLink':'تعديل الرابط','rich.linkAddress':'عنوان الرابط','rich.undo':'تراجع','rich.redo':'إعادة','rich.mention':'إشارة إلى شخص','rich.people':'أشخاص للإشارة','rich.noPeople':'لا توجد أسماء مطابقة.'}}><div style={{padding:24,background:'var(--bui-surface)',borderRadius:12}}><RichTextEditor label=\"ملاحظة المراجعة\" defaultValue={content} mentionSource={source} hint=\"الأسماء المعروضة لا تغيّر المعرّفات المخزنة.\"/></div></UIProvider>;}\n"
  },
  {
    "id": "rich-text-document-boundaries",
    "componentId": "rich-text-editor",
    "title": "Document boundaries and rejected controlled edits",
    "description": "Switch an uncontrolled document without carrying its defaults or history into another record. Rejected controlled edits restore the accepted JSON; unsupported content in a new document never reveals the previous document.",
    "keyboard": [
      "Tab enters either editor. Rejected controlled edits keep the accepted text and named form value aligned.",
      "Switch a document identity to start fresh defaults and history; native reset uses the current document default."
    ],
    "states": [
      "uncontrolled document identity",
      "fresh reset defaults",
      "controlled rejection",
      "invalid new document",
      "separate history",
      "native canonical JSON"
    ],
    "source": "'use client';\nimport {useId,useState} from 'react';\nimport {Button,Checkbox,RichTextEditor,type RichTextDocument,UIProvider} from '@bld8/ui';\nconst first:RichTextDocument={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Private document A.'}]}]};\nconst second:RichTextDocument={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Document B starts here.'}]}]};\nexport default function DocumentBoundaries(){const form=useId(),[record,setRecord]=useState('a'),[value,setValue]=useState(first),[identity,setIdentity]=useState('accepted'),[reject,setReject]=useState(true),[attempts,setAttempts]=useState(0);return <UIProvider><div style={{display:'grid',gap:24,maxWidth:760}}>\n<RichTextEditor label=\"Uncontrolled record\" name=\"record\" form={form} documentKey={record} defaultValue={record==='a'?first:second}/>\n<Button variant=\"secondary\" onClick={()=>setRecord('b')}>Open second uncontrolled document</Button>\n<RichTextEditor label=\"Controlled boundary note\" name=\"controlled\" form={form} documentKey={identity} value={value} onValueChange={next=>{setAttempts(count=>count+1);if(!reject)setValue(next);}}/>\n<Checkbox label=\"Reject controlled edits\" checked={reject} onCheckedChange={setReject}/>\n<div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button variant=\"secondary\" onClick={()=>{setValue({type:'doc',content:[{type:'image'}]} as unknown as RichTextDocument);setIdentity('unsupported');}}>Open unsupported controlled document</Button><Button variant=\"ghost\" onClick={()=>{setValue(second);setIdentity('second');}}>Open second controlled document</Button></div>\n<form id={form}><Button variant=\"secondary\" type=\"reset\">Reset boundary documents</Button></form><p data-rejected-attempts>{'Edit attempts: '+attempts}</p>\n</div></UIProvider>;}"
  }
];
