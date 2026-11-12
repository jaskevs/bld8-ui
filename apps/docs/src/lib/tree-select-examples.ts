export const treeSelectExamples=[
  {
    "id": "tree-select-native",
    "componentId": "tree-select",
    "title": "Checked hierarchy with native form values",
    "description": "Select leaf IDs through a searchable tree. Parent states reflect loaded enabled children; native external forms retain values, controlled ownership and reset behaviour.",
    "keyboard": [
      "Arrow Down enters the tree from search. Arrow keys move, open and close branches.",
      "Space selects loaded leaf choices; Enter opens a branch or toggles a leaf. Escape closes.",
      "The application checks the required button field on submit and returns focus to it."
    ],
    "states": [
      "Mixed parent",
      "Disabled ancestor and child",
      "External native form",
      "Uncontrolled reset",
      "Controlled and read-only values",
      "Unknown IDs retained",
      "React prevented button reset"
    ],
    "source": "'use client';\nimport {useId,useRef,useState} from 'react';\nimport {Button,TreeSelect,UIProvider,type TreeSelectNode} from '@bld8/ui';\nconst nodes:TreeSelectNode[]=[\n  {id:'product',label:'Product',children:[\n    {id:'interface',label:'Interface',description:'UI foundations and components.'},\n    {id:'motion',label:'Motion',searchTerms:['animation','transitions']},\n    {id:'legacy',label:'Archived patterns',disabled:true}]},\n  {id:'research',label:'Research'},\n  {id:'restricted',label:'Restricted',disabled:true,children:[{id:'private-notes',label:'Private notes'}]}\n];\nexport default function TreeFormExample(){\n  const formId=useId(),field=useRef<HTMLButtonElement>(null);\n  const [owned,setOwned]=useState<string[]>(['research']),[status,setStatus]=useState(''),[error,setError]=useState(''),[changes,setChanges]=useState(0),[touched,setTouched]=useState(false),[preventReset,setPreventReset]=useState(false);\n  return <UIProvider><div style={{display:'grid',gap:16}}>\n    <label className=\"bui-choice\"><input className=\"bui-checkbox\" type=\"checkbox\" checked={preventReset} onChange={event=>setPreventReset(event.target.checked)}/>Prevent tree reset</label>\n    <form id={formId} aria-label=\"Tree selection form\" onReset={event=>{if(preventReset)event.preventDefault();}} onSubmit={event=>{\n      event.preventDefault();const data=new FormData(event.currentTarget),ids=data.getAll('access').map(String);\n      if(!ids.length){setError('Choose at least one team area.');field.current?.focus();return;}\n      setStatus(ids.join(',')+' | '+data.getAll('owned').join(',')+' | '+data.getAll('readonly').join(',')+' | '+data.getAll('disabled').length);\n    }}><div className=\"actions\"><Button type=\"submit\">Read tree values</Button><Button type=\"reset\" variant=\"secondary\">Reset tree values</Button></div></form>\n    <TreeSelect label=\"Team access\" nodes={nodes} name=\"access\" form={formId} defaultValue={['interface','unavailable-id']} defaultExpandedIds={['product','restricted']} required inputRef={field} error={error} hint=\"Parents select enabled leaf choices. Unavailable IDs are kept until you clear them.\" onBlur={()=>setTouched(true)} onValueChange={()=>{setError('');setChanges(count=>count+1);}}/>\n    <TreeSelect label=\"Application access\" nodes={nodes} name=\"owned\" form={formId} value={owned} onValueChange={setOwned}/>\n    <TreeSelect label=\"Read-only access\" nodes={nodes} name=\"readonly\" form={formId} defaultValue={['research']} readOnly/>\n    <TreeSelect label=\"Disabled access\" nodes={nodes} name=\"disabled\" form={formId} defaultValue={['interface']} disabled/>\n    <p role=\"status\" aria-label=\"Tree form values\">{status}</p>\n    <p role=\"status\" aria-label=\"Tree change count\">{changes}</p>\n    <p className=\"bui-hint\">Tree field touched: {touched?'yes':'no'}</p>\n  </div></UIProvider>;\n}"
  },
  {
    "id": "tree-select-lazy",
    "componentId": "tree-select",
    "title": "Lazy choices with cancellation and recovery",
    "description": "A source change cancels pending requests. A retry keeps existing IDs, and selecting a partial parent never selects future children.",
    "keyboard": [
      "Space on an unloaded branch opens and loads it without selecting a branch ID.",
      "Right Arrow expands or retries a branch. Space on a partial parent affects loaded enabled leaves only.",
      "Search matches loaded labels, descriptions and aliases; it does not issue remote search."
    ],
    "states": [
      "Loading",
      "Retry after failure",
      "Incomplete parent",
      "Empty branch",
      "Invalid returned IDs",
      "Source change and cancellation"
    ],
    "source": "'use client';\nimport {useCallback,useRef,useState} from 'react';\nimport {Button,TreeSelect,UIProvider,type TreeSelectNode,type TreeSelectLoadRequest} from '@bld8/ui';\nconst roots:TreeSelectNode[]=[{id:'workspace',label:'Workspace',children:[\n  {id:'guide',label:'Project guide'},\n  {id:'design',label:'Design system',hasChildren:true},\n  {id:'empty',label:'Empty collection',hasChildren:true},\n  {id:'invalid',label:'Invalid example',hasChildren:true}\n]}];\nfunction pause(signal:AbortSignal){\n  return new Promise<void>((resolve,reject)=>{\n    if(signal.aborted){reject(new DOMException('Cancelled','AbortError'));return;}\n    const abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};\n    const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},350);\n    signal.addEventListener('abort',abort,{once:true});\n  });\n}\nexport default function LazyTreeExample(){\n  const attempts=useRef(0),hold=useRef(false),[source,setSource]=useState('studio'),[values,setValues]=useState<string[]>(['guide']),[changes,setChanges]=useState(0),[aborted,setAborted]=useState(0);\n  const loadChildren=useCallback(async({id,signal}:TreeSelectLoadRequest)=>{\n    try{if(hold.current){hold.current=false;await new Promise<void>((_resolve,reject)=>{if(signal.aborted)reject(new DOMException('Cancelled','AbortError'));else signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true});});}else await pause(signal);}catch(error){if(signal.aborted)setAborted(count=>count+1);throw error;}\n    if(id==='empty')return [];\n    if(id==='invalid')return [{id:'guide',label:'Duplicate guide'}];\n    if(id==='design'&&attempts.current++===0)throw new Error('Illustrative connection failure.');\n    return [{id:source+'-colour',label:source==='studio'?'Colour system':'Colour archive',searchTerms:['palette']},{id:source+'-type',label:source==='studio'?'Type scale':'Type archive'}];\n  },[source]);\n  return <UIProvider><div style={{display:'grid',gap:16}}>\n    <TreeSelect label=\"Project areas\" nodes={roots} value={values} onValueChange={next=>{setValues(next);setChanges(count=>count+1);}} loadChildren={loadChildren} sourceKey={source} defaultExpandedIds={['workspace']} hint=\"The first Design system request fails. Retry keeps your selected guide.\"/>\n    <div className=\"actions\"><Button variant=\"secondary\" onClick={()=>{hold.current=true;}}>Simulate slow tree request</Button><Button variant=\"secondary\" onClick={()=>setSource(current=>current==='studio'?'archive':'studio')}>Switch tree source</Button><Button variant=\"ghost\" onClick={()=>setValues(['guide'])}>Restore guide selection</Button></div>\n    <p role=\"status\" aria-label=\"Lazy tree values\">{values.join(',')}</p>\n    <p role=\"status\" aria-label=\"Lazy tree changes\">{changes}</p>\n    <p role=\"status\" aria-label=\"Lazy tree source\">{source}</p>\n    <p role=\"status\" aria-label=\"Aborted tree requests\">{aborted}</p>\n    <p className=\"bui-hint\">Illustrative local loader. Search covers loaded choices; the host owns its remote service.</p>\n  </div></UIProvider>;\n}"
  }
];
