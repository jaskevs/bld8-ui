/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const visualCollectionExamples = [
  {
    "id": "text-reveal-reading-order",
    "componentId": "text-reveal",
    "title": "A restrained heading entrance",
    "description": "Reveal complete words in reading order, retaining real text and a visible server-rendered fallback.",
    "keyboard": [
      "The action remains a native button. Text is never replaced with a duplicate accessible label."
    ],
    "states": [
      "one viewport entrance",
      "bounded word delays",
      "explicit replay",
      "live reduced motion"
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Button,TextReveal} from '@bld8/ui';\nexport default function HeadingEntrance(){const [replay,setReplay]=useState(0);return <section><TextReveal key={replay} as=\"h3\" text=\"A little room for useful details.\" style={{fontSize:'clamp(24px,5vw,40px)',lineHeight:1.2,maxWidth:580}}/><p>Real text stays available while a short entrance introduces it.</p><Button variant=\"secondary\" onClick={()=>setReplay(value=>value+1)}>Replay heading entrance</Button></section>;}"
  },
  {
    "id": "stagger-keyed-cards",
    "componentId": "stagger",
    "title": "Keyed cards retain their entered values",
    "description": "Introduce a short collection without remounting inputs when its order changes.",
    "keyboard": [
      "Tab reaches each native field. Reorder retains keyed row drafts."
    ],
    "states": [
      "keyed child identity",
      "single entrance",
      "reorder",
      "reduced motion"
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Button,Field,Input,Stagger} from '@bld8/ui';\nconst seed=[{id:'one',title:'Keyboard review'},{id:'two',title:'Spacing review'},{id:'three',title:'Release notes'}];\nexport default function KeyedCards(){const [items,setItems]=useState(seed);return <section><Button variant=\"secondary\" onClick={()=>setItems(previous=>[...previous].reverse())}>Reverse review cards</Button><Stagger label=\"Review cards\" style={{marginTop:20,gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,180px),1fr))'}}>{items.map(item=><div key={item.id} style={{padding:20,background:'var(--bui-surface)',borderRadius:8}}><Field label={'Note for '+item.id}><Input defaultValue={item.title}/></Field></div>)}</Stagger></section>;}"
  },
  {
    "id": "bento-product-layout",
    "componentId": "bento",
    "title": "A product layout that follows its container",
    "description": "Mixed card spans collapse into a readable stack in narrow containers, with information available without hover.",
    "keyboard": [
      "Cards keep their semantic headings. Native actions remain reachable in document order."
    ],
    "states": [
      "container responsive",
      "mixed spans",
      "static readable content",
      "explicit actions"
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {BentoGrid,BentoItem,Button} from '@bld8/ui';\nexport default function ProductLayout(){const [result,setResult]=useState('Choose an example action.');return <section><BentoGrid role=\"group\" aria-label=\"Review features\" columns={3}><BentoItem columnSpan={2}><p className=\"bui-hint\">ONE REVIEW. FEWER LOOSE ENDS.</p><h3>Keep the changes together.</h3><p>Review a draft, correct a field and save the accepted batch.</p><Button onClick={()=>setResult('The local review example is ready.')}>Prepare a review</Button></BentoItem><BentoItem><h3>Keyboard paths</h3><p>Visible focus and predictable ways back.</p></BentoItem><BentoItem><h3>Clear feedback</h3><p>Loading, errors and empty states stay part of the interface.</p></BentoItem><BentoItem columnSpan={2}><h3>Make it your own</h3><p>Use scoped tokens and retain the same source contracts.</p></BentoItem></BentoGrid><p role=\"status\">{result}</p></section>;}"
  },
  {
    "id": "carousel-native-controls",
    "componentId": "carousel",
    "title": "Native slides with explicit rotation controls",
    "description": "Touch, trackpad and keyboard navigation share a native scroll region. Automatic rotation is opt-in and pauses for interaction or reduced motion.",
    "keyboard": [
      "Focus the slides and use arrows, Home or End. Previous and Next keep button focus.",
      "Focus stops automatic rotation until Start automatic rotation is selected again."
    ],
    "states": [
      "native touch scroll",
      "keyboard navigation",
      "opt-in autoplay",
      "pause and resume",
      "hover and visibility pause",
      "reduced motion"
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Button,Carousel,Checkbox} from '@bld8/ui';\nexport default function ReviewCarousel(){const [auto,setAuto]=useState(false),[result,setResult]=useState('No review opened.');return <section><Checkbox label=\"Enable automatic rotation\" checked={auto} onCheckedChange={setAuto}/><div style={{marginTop:20}}><Carousel label=\"Review stories\" autoplay={auto?3000:undefined} items={['Keyboard','Spacing','Recovery'].map((title,index)=>({id:title.toLowerCase(),label:title+' review',content:<article style={{padding:28,minHeight:240,background:index===0?'var(--bui-selected-bg)':'var(--bui-surface)',borderRadius:8}}><p className=\"bui-hint\">0{index+1} / INTERFACE REVIEW</p><h3>{title} review</h3><p>Keep the interaction clear, including the way back.</p><Button variant=\"secondary\" onClick={()=>setResult(title+' review opened in this local example.')}>Review {title.toLowerCase()}</Button></article>}))}/></div><p role=\"status\">{result}</p></section>;}"
  },
  {
    "id": "product-preview-workflow",
    "componentId": "product-preview",
    "title": "A product frame with a working detail action",
    "description": "Show a compact interface without screenshots, hidden hover content or decorative browser controls that appear clickable.",
    "keyboard": [
      "Open review details launches a real dialog. Escape returns to its trigger."
    ],
    "states": [
      "semantic caption",
      "responsive frame",
      "explicit dialog action",
      "crisp local interface",
      "reduced motion"
    ],
    "source": "'use client';\nimport {Button,Dialog,DialogClose,ProductPreview,UIProvider} from '@bld8/ui';\nexport default function ReviewPreview(){return <UIProvider><ProductPreview title=\"Review space\" description=\"A compact example for a product page or release note.\" address=\"workspace / review\" actions={<Dialog title=\"Review details\" description=\"An example action connected to real interface state.\" trigger={<Button size=\"sm\" variant=\"secondary\">Open review details</Button>}><p>Keyboard review and spacing checks are ready to inspect.</p><DialogClose>Back to preview</DialogClose></Dialog>}><div style={{padding:24,background:'var(--bui-bg)'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:24}}><strong>Interface review</strong><span style={{padding:'5px 8px',background:'var(--bui-selected-bg)',borderRadius:4,fontSize:12}}>3 ready</span></div>{['Keyboard paths','Field alignment','Save recovery'].map((title,index)=><div key={title} style={{display:'flex',gap:12,alignItems:'center',paddingBlock:14,borderTop:'1px solid var(--bui-line)'}}><span style={{width:8,height:8,borderRadius:'50%',background:index===0?'var(--bui-accent)':'var(--bui-muted)'}} aria-hidden=\"true\"/><span>{title}</span></div>)}</div></ProductPreview></UIProvider>;}"
  }
];
