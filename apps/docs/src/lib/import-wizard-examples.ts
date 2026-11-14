/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const importWizardExamples = [
  {
    "id": "import-create-reviewed-batch",
    "componentId": "import-wizard",
    "title": "Map inventory CSV and recover a lost acknowledgement",
    "description": "Read a file or paste CSV, map typed fields and review one atomic batch. A local receipt fixture demonstrates retry without creating duplicate records.",
    "keyboard": [
      "Use Tab through source and mapping controls. Open choices with Enter; Escape dismisses.",
      "Row-error links move to the original CSV line in the paged preview.",
      "Review and confirm the batch before Apply. If acknowledgement is lost, Check import outcome reads the stored receipt; Retry reuses the same request ID."
    ],
    "states": [
      "quoted CSV",
      "typed column mapping",
      "required fields",
      "duplicate policies",
      "paginated preview",
      "atomic apply callback",
      "lost acknowledgement",
      "idempotent retry"
    ],
    "source": "'use client';\nimport {useRef,useState} from 'react';\nimport {Checkbox,ImportWizard,UIProvider,type ImportField,type ImportRequest,type ImportApplyResult} from '@bld8/ui';\nconst fields:ImportField[]=[{key:'id',label:'ID',type:'text',required:true,maxLength:40},{key:'name',label:'Name',type:'text',required:true,maxLength:120},{key:'quantity',label:'Quantity',type:'number',required:true,min:0,max:10000,validate:value=>Number.isInteger(value)?undefined:'Use a whole quantity.'},{key:'restock',label:'Restock',type:'date'},{key:'approved',label:'Approved',type:'boolean'}];\nexport default function CreateImportExample(){\n const rows=useRef(new Map<string,Record<string,unknown>>()),receipts=useRef(new Map<string,{signature:string;count:number}>());const [lost,setLost]=useState(false),[reject,setReject]=useState(false),[saved,setSaved]=useState<string[]>([]),[attempts,setAttempts]=useState<string[]>([]);\n async function apply(request:ImportRequest,{signal}:{signal:AbortSignal}):Promise<ImportApplyResult>{setAttempts(current=>[...current,request.requestId]);const signature=JSON.stringify(request.rows),receipt=receipts.current.get(request.requestId);if(receipt)return receipt.signature===signature?{ok:true,requestId:request.requestId,count:receipt.count}:{ok:false,message:'This request ID has different content.'};await new Promise(resolve=>setTimeout(resolve,250));if(signal.aborted)throw new DOMException('Aborted','AbortError');if(reject){setReject(false);return {ok:false,message:'The service rejected this batch. No rows were stored.',issues:[{sourceRow:request.rows[0].sourceRow,field:'quantity',message:'Review the quantity against your current stock policy.'}]};}for(const row of request.rows)if(rows.current.has(String(row.values.id)))return {ok:false,message:'An ID already exists. This create import was not applied.',issues:[{sourceRow:row.sourceRow,field:'id',message:'Use a new identity or an update import.'}]};const next=new Map(rows.current);for(const row of request.rows)next.set(String(row.values.id),{...row.values});rows.current=next;receipts.current.set(request.requestId,{signature,count:request.rows.length});setSaved([...next.keys()]);if(lost){setLost(false);throw Error('Illustrative acknowledgement loss');}return {ok:true,requestId:request.requestId,count:request.rows.length};}\n async function reconcile(request:ImportRequest):Promise<ImportApplyResult>{const receipt=receipts.current.get(request.requestId);return receipt&&receipt.signature===JSON.stringify(request.rows)?{ok:true,requestId:request.requestId,count:receipt.count}:{ok:false,message:'No matching receipt exists in this local fixture. No import was stored.'};}\n return <UIProvider><div style={{display:'grid',gap:24}}><div style={{display:'flex',flexWrap:'wrap',gap:20}}><Checkbox label=\"Lose next acknowledgement\" checked={lost} onCheckedChange={setLost}/><Checkbox label=\"Reject next batch\" checked={reject} onCheckedChange={setReject}/></div><ImportWizard label=\"Import inventory\" fields={fields} identityField=\"id\" onApply={apply} onReconcile={reconcile}/><output aria-live=\"polite\">Saved IDs: {saved.join(', ')||'none'}</output><p data-import-attempts style={{overflowWrap:'anywhere',fontSize:12}}>Request attempts: {attempts.join(' · ')||'none'}</p><p style={{fontSize:12}}>Local in-memory records and receipts demonstrate the contract. They reset on reload. A real service owns authorization, durable idempotency, identity checks and atomic persistence.</p></div></UIProvider>;\n}"
  },
  {
    "id": "import-update-existing-records",
    "componentId": "import-wizard",
    "title": "Update known identities with expected revisions",
    "description": "Keep create and update behavior explicit. A host validates every identity and expected revision before replacing the snapshot once.",
    "keyboard": [
      "Paste or choose a CSV and map ID, revision and editable columns.",
      "Use preview pages and linked errors to review the complete supplied batch.",
      "Apply only after reviewing. Re-importing an old revision is rejected without changing another row."
    ],
    "states": [
      "update mode",
      "canonical identities",
      "expected revisions",
      "atomic validation",
      "host-owned records",
      "retry receipt"
    ],
    "source": "'use client';\nimport {useRef,useState} from 'react';\nimport {ImportWizard,UIProvider,type ImportField,type ImportRequest,type ImportApplyResult} from '@bld8/ui';\nconst fields:ImportField[]=[{key:'id',label:'ID',type:'text',required:true},{key:'revision',label:'Revision',type:'number',required:true,min:1,validate:value=>Number.isSafeInteger(value)?undefined:'Use a whole revision.'},{key:'quantity',label:'Quantity',type:'number',required:true,min:0,max:1000,validate:value=>Number.isInteger(value)?undefined:'Use a whole quantity.'}];\nexport default function UpdateImportExample(){\n const records=useRef([{id:'SKU-101',revision:1,quantity:12},{id:'SKU-102',revision:1,quantity:8}]),receipts=useRef(new Map<string,{signature:string;count:number}>());const [summary,setSummary]=useState(records.current);\n async function apply(request:ImportRequest,{signal}:{signal:AbortSignal}):Promise<ImportApplyResult>{if(signal.aborted)throw new DOMException('Aborted','AbortError');const signature=JSON.stringify(request.rows),receipt=receipts.current.get(request.requestId);if(receipt)return receipt.signature===signature?{ok:true,requestId:request.requestId,count:receipt.count}:{ok:false,message:'The request ID was already used for other values.'};for(const row of request.rows){const current=records.current.find(record=>record.id===row.values.id);if(!current||current.revision!==row.values.revision)return {ok:false,message:'The source has changed. Reload its revisions before importing again.',issues:[{sourceRow:row.sourceRow,field:'revision',message:current?'Expected revision '+current.revision+'.':'This ID does not exist.'}]};}const next=records.current.map(record=>{const row=request.rows.find(row=>row.values.id===record.id);return row?{...record,revision:record.revision+1,quantity:Number(row.values.quantity)}:record;});records.current=next;receipts.current.set(request.requestId,{signature,count:request.rows.length});setSummary(next);return {ok:true,requestId:request.requestId,count:request.rows.length};}\n return <UIProvider><div style={{display:'grid',gap:24}}><ImportWizard label=\"Update stock counts\" mode=\"update\" identityField=\"id\" fields={fields} onApply={apply}/><output aria-live=\"polite\">{summary.map(row=>row.id+': '+row.quantity+' (revision '+row.revision+')').join(' · ')}</output><p style={{fontSize:12}}>The illustrative memory adapter validates the entire batch before replacing its snapshot. Production authorization, storage, idempotency and revision checks belong to your service.</p></div></UIProvider>;\n}"
  },
  {
    "id": "import-source-boundary",
    "componentId": "import-wizard",
    "title": "A destination change keeps prior-operation correlation",
    "description": "Changing the destination clears its source rows and prevents late acknowledgements from changing the new import. A bounded notice preserves operation IDs that the original service may need to reconcile.",
    "keyboard": [
      "Switch the destination while Apply is waiting, then inspect the retained operation ID.",
      "The new import starts with no previous rows. Completing the old callback does not advance its phase."
    ],
    "states": [
      "source boundary",
      "in-flight cancellation",
      "late acknowledgement",
      "bounded operation IDs",
      "no cross-destination retry"
    ],
    "source": "'use client';\nimport {useRef,useState} from 'react';\nimport {Button,ImportWizard,UIProvider,type ImportField,type ImportRequest,type ImportApplyResult} from '@bld8/ui';\nconst fields:ImportField[]=[{key:'id',label:'ID',type:'text',required:true},{key:'name',label:'Name',type:'text',required:true}];\nexport default function ImportBoundary(){const [destination,setDestination]=useState(1),[last,setLast]=useState('none'),pending=useRef<{request:ImportRequest;resolve:(result:ImportApplyResult)=>void}[]>([]);\nasync function apply(request:ImportRequest):Promise<ImportApplyResult>{setLast(request.requestId);return new Promise(resolve=>{pending.current.push({request,resolve});});}\nreturn <UIProvider><div style={{display:'grid',gap:20}}><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button variant=\"secondary\" onClick={()=>setDestination(value=>value+1)}>Switch import destination</Button><Button variant=\"ghost\" onClick={()=>{const first=pending.current.shift();if(first)first.resolve({ok:true,requestId:first.request.requestId,count:first.request.rows.length});}}>Complete previous callback</Button></div>\n<p>Destination {destination}</p><ImportWizard label=\"Destination import\" fields={fields} identityField=\"id\" sourceKey={String(destination)} onApply={apply}/><p data-boundary-request style={{overflowWrap:'anywhere'}}>Last request: {last}</p><p className=\"bui-hint\">A deferred local callback demonstrates client isolation. It does not store records. Reconcile real operation IDs with the service that received them.</p></div></UIProvider>;}"
  }
];
