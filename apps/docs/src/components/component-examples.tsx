'use client';
import {useState} from 'react';
import Link from 'next/link';
import {siteUrl} from '@/lib/site';
import {Button,Reveal,Tabs} from '@bld8/ui';
import {componentPreviews} from '@/lib/generated/component-previews';
import type {ComponentExample} from '@/lib/component-examples';
import {CodeBlock} from './code-block';
export function ExamplePreview({id}:{id:string}){
  const Preview=componentPreviews[id as keyof typeof componentPreviews];
  return Preview?<Preview/>:null;
}
export function ExampleCard({example}:{example:ComponentExample}){
  const [running,setRunning]=useState(example.preview!=='on-demand');
  return <article className="component-example" data-example-id={example.id} {...{['data-'+example.family+'-example']:example.id}}>
    <header><h3><Link href={example.documentationPath}>{example.title}</Link></h3><p>{example.description}</p></header>
    {example.preview==='on-demand'&&<div className="component-example-start"><Button variant="secondary" aria-expanded={running} aria-controls={'example-preview-'+example.id} onClick={()=>setRunning(value=>!value)}>{running?'Hide example':'Run example'}</Button><span>Loads this example when you need it.</span></div>}<Reveal open={running} id={'example-preview-'+example.id}><div className="component-example-preview" role="region" aria-label={example.title+' preview'}><ExamplePreview id={example.id}/></div></Reveal>
    <div className="component-example-guidance"><div><h4>Keyboard</h4><ul>{example.keyboard.map(line=><li key={line}>{line}</li>)}</ul></div><div><h4>States covered</h4><ul>{example.states.map(line=><li key={line}>{line}</li>)}</ul></div></div>
    <div className="component-example-install"><p className="bui-hint">Install this complete example and its component dependencies.</p><CodeBlock code={`npx shadcn@latest add ${siteUrl}/r/${example.registryName}.json`} /></div><details className="component-example-code"><summary>Complete source</summary><Tabs label={example.title+' source format'} items={[{value:'workspace',label:'Workspace / starter',content:<CodeBlock code={example.source}/>},{value:'registry',label:'Registry source',content:<><p>Uses the default <code>@/components/ui</code> alias. Adjust it to your configured UI directory.</p><CodeBlock code={example.registrySource}/></>}]} /></details>
  </article>;
}
export function ComponentExamples({examples}:{examples:ComponentExample[]}){
  return <section id="component-examples" className="detail-section component-examples" aria-labelledby="component-examples-heading"><header><p className="eyebrow">COMPLETE EXAMPLES</p><h2 id="component-examples-heading">Use it in context.</h2><p>Each example includes its imports, data and state. The preview runs that same source. Include the stylesheet once in your application.</p></header>{examples.map(example=><ExampleCard key={example.id} example={example}/>)}</section>;
}
