/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const recurrenceExamples = [
  {
    "id": "recurrence-finite-rule",
    "componentId": "recurrence-editor",
    "title": "Finite repeats across a time-zone transition",
    "description": "Stage a daily or weekly rule, inspect exact UTC instants and local offsets, then apply or discard it. The local reference source keeps revisions separate from the draft.",
    "keyboard": [
      "Use native field editing and Select keyboard navigation. Weekly choices use Tab and Space.",
      "Apply validates the complete finite rule and focuses a linked error. Escape or Cancel discards the staged change.",
      "The original wall-clock time and explicit DST policy determine each instant; no browser-zone conversion is inferred."
    ],
    "states": [
      "Daily and weekly",
      "Count or inclusive until date",
      "Explicit IANA zone",
      "DST disambiguation",
      "Staged Apply/Cancel",
      "Read only",
      "Scoped RTL"
    ],
    "source": "'use client';\nimport {useMemo,useState} from 'react';\nimport {Button,Checkbox,RecurrenceEditor,createMemoryRecurrenceSource,type RecurrenceSeries,type RecurrenceSource,UIProvider} from '@bld8/ui';\nconst initial:RecurrenceSeries={id:'review-series',revision:1,title:'Interface review',resourceId:'room-a',rule:{frequency:'daily',interval:1,startDate:'2026-10-01',time:'09:00',timeZone:'Australia/Melbourne',durationMinutes:45,count:5,disambiguation:'reject'},exceptions:[]};\nexport default function FiniteRecurrenceExample(){const store=useMemo(()=>createMemoryRecurrenceSource(initial),[]),[series,setSeries]=useState(initial),[readOnly,setReadOnly]=useState(false),[arabic,setArabic]=useState(false),[attempts,setAttempts]=useState(0);const source=useMemo<RecurrenceSource>(()=>({load:()=>store.load(),save:async(request,context)=>{setAttempts(value=>value+1);return store.save(request,context);}}),[store]);return <UIProvider locale={arabic?'ar':'en-AU'} direction={arabic?'rtl':'ltr'} messages={arabic?{'recurrence.scope':'نطاق التعديل','recurrence.entire':'السلسلة كاملة','recurrence.one':'موعد واحد','recurrence.rule':'قاعدة التكرار','recurrence.frequency':'التواتر','recurrence.daily':'يومي','recurrence.weekly':'أسبوعي','recurrence.every':'التكرار كل','recurrence.firstDate':'التاريخ الأول','recurrence.wallTime':'وقت البدء المحلي','recurrence.zone':'المنطقة الزمنية','recurrence.duration':'دقائق منقضية','recurrence.dst':'الأوقات المحلية المتكررة أو المفقودة','recurrence.end':'نهاية السلسلة','recurrence.byCount':'بعد عدد من المواعيد','recurrence.byDate':'حتى تاريخ','recurrence.count':'عدد المواعيد الأساسية','recurrence.preview':'معاينة المواعيد','recurrence.apply':'تطبيق التغيير','recurrence.cancel':'إلغاء المسودة'}:{}}><div style={{display:'grid',gap:24,maxWidth:900}}>\n  <div style={{display:'flex',gap:16,flexWrap:'wrap'}}><Checkbox label=\"Read-only recurrence\" checked={readOnly} onCheckedChange={setReadOnly}/><Button variant=\"ghost\" onClick={()=>setArabic(value=>!value)}>{arabic?'Use English recurrence':'Use Arabic recurrence'}</Button></div>\n  <RecurrenceEditor label=\"Review recurrence\" series={series} source={source} onSeriesChange={setSeries} readOnly={readOnly} resources={[{id:'room-a',label:'Review room'}]}/><p className=\"bui-hint\" data-recurrence-host>{'Host revision: '+series.revision+' | Save attempts: '+attempts}</p>\n</div></UIProvider>;}\n"
  },
  {
    "id": "recurrence-occurrence-receipts",
    "componentId": "recurrence-editor",
    "title": "One occurrence, revision conflicts and uncertain saves",
    "description": "Skip or override one original occurrence using explicit instants. An authored acknowledgement-loss and concurrent-change fixture demonstrates same-ID retry, receipt reconciliation and deliberate rebase.",
    "keyboard": [
      "Choose One occurrence, its original date and Skip or Override. Apply sends one explicitly scoped change.",
      "An uncertain response locks editing. Retry same request or Check request receipt resolves the original identity.",
      "A revision conflict preserves the draft. Review against the latest snapshot before applying again."
    ],
    "states": [
      "Occurrence or series scope",
      "Explicit UTC overrides",
      "Resource override",
      "Lost acknowledgement",
      "Same-ID retry",
      "Receipt reconciliation",
      "Concurrent revision",
      "Stale supplied snapshot"
    ],
    "source": "'use client';\nimport {useMemo,useRef,useState} from 'react';\nimport {Button,Checkbox,RecurrenceEditor,createMemoryRecurrenceSource,type RecurrenceSeries,type RecurrenceSource,type RecurrenceSaveResult,UIProvider} from '@bld8/ui';\nconst initial:RecurrenceSeries={id:'weekly-review',revision:1,title:'Weekly interface review',resourceId:'room-a',rule:{frequency:'weekly',interval:1,weekdays:[1],startDate:'2026-11-02',time:'09:00',timeZone:'UTC',durationMinutes:60,count:4,disambiguation:'reject'},exceptions:[]};\nexport default function OccurrenceReceiptExample(){const store=useMemo(()=>createMemoryRecurrenceSource(initial),[]),receipts=useRef(new Map<string,RecurrenceSaveResult>()),[series,setSeries]=useState(initial),[lose,setLose]=useState(false),[invalid,setInvalid]=useState(false),[staleLoad,setStaleLoad]=useState(false),[requests,setRequests]=useState<string[]>([]),[remoteRevision,setRemoteRevision]=useState(1);const flags=useRef({lose,invalid,staleLoad});flags.current={lose,invalid,staleLoad};const source=useMemo<RecurrenceSource>(()=>({load:()=>flags.current.staleLoad?initial:store.load(),receipt:async(id,{signal})=>signal.aborted?null:receipts.current.get(id)??null,save:async(request,context)=>{setRequests(values=>[...values,request.requestId]);const result=await store.save(request,context);if(result.ok){receipts.current.set(request.requestId,structuredClone(result));setRemoteRevision(store.load().revision);if(flags.current.lose){flags.current.lose=false;setLose(false);throw Error('The local acknowledgement was lost.');}if(flags.current.invalid){flags.current.invalid=false;setInvalid(false);return {...result,requestId:'mismatched-receipt'};}}return result;}}),[store]);\n  async function advance(){const current=store.load(),result=await store.save({requestId:'external-'+crypto.randomUUID(),change:{scope:'series',seriesId:current.id,expectedRevision:current.revision,rule:{...current.rule,durationMinutes:current.rule.durationMinutes+5}}},{signal:new AbortController().signal});if(result.ok)setRemoteRevision(result.series.revision);}\n  return <UIProvider><div style={{display:'grid',gap:24,maxWidth:900}}><div style={{display:'grid',gap:12}}><Checkbox label=\"Lose next recurrence acknowledgement\" checked={lose} onCheckedChange={setLose}/><Checkbox label=\"Return a mismatched next receipt\" checked={invalid} onCheckedChange={setInvalid}/><Checkbox label=\"Return stale source snapshot on load\" checked={staleLoad} onCheckedChange={setStaleLoad}/><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button variant=\"secondary\" onClick={()=>void advance()}>Advance source revision</Button><Button variant=\"ghost\" onClick={()=>setSeries(store.load())}>Supply current source snapshot</Button></div></div>\n    <RecurrenceEditor label=\"Occurrence editor\" series={series} source={source} onSeriesChange={setSeries} resources={[{id:'room-a',label:'Review room'},{id:'room-b',label:'Quiet room'}]}/>\n    <p className=\"bui-hint\" data-recurrence-revisions>{'Host revision: '+series.revision+' | Source revision: '+remoteRevision}</p><p className=\"bui-hint\" data-recurrence-attempts>{'Attempts: '+requests.length}</p><output data-recurrence-request-ids style={{overflowWrap:'anywhere'}}>{requests.join(' | ')}</output>\n    <p className=\"bui-hint\">Local reference data only. A production service owns authorization, atomic revisions and durable receipts.</p>\n  </div></UIProvider>;}\n"
  }
];
