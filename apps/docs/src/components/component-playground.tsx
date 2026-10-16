'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {Link2,RotateCcw} from 'lucide-react';
import {Button,Checkbox,Field,Input,Select,Switch} from '@bld8/ui';
import {playgroundDefaults,playgroundKeyboard,playgroundModules,playgroundNames,readPlayground,statesFor,writePlayground,type PlaygroundName,type PlaygroundSettings} from '@/lib/playground-state';
import {playgroundCode} from '@/lib/playground-code';
import {CodeBlock} from './code-block';
import {PlaygroundPreview} from './playground-preview';

function Choice({label,value,options,onChange}:{label:string;value:string;options:readonly string[];onChange:(value:string)=>void}){
  return <Select label={label} value={value} options={options.map(value=>({value,label:value}))} onValueChange={next=>{if(next!==null)onChange(next);}} />;
}
export function ComponentPlayground({initialComponent='Button'}:{initialComponent?:PlaygroundName}){
  const [settings,setSettings]=useState<PlaygroundSettings>({...playgroundDefaults,component:initialComponent});
  const [ready,setReady]=useState(false);const [message,setMessage]=useState('');const [shareMessage,setShareMessage]=useState('');
  useEffect(()=>{
    const restore=()=>{const next=readPlayground(window.location.search,initialComponent);setSettings(next);document.documentElement.dataset.uiTheme=next.dark?'dark':'light';setReady(true);};
    restore();window.addEventListener('popstate',restore);
    const observer=new MutationObserver(()=>setSettings(current=>{const dark=document.documentElement.dataset.uiTheme==='dark';return current.dark===dark?current:{...current,dark};}));
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-ui-theme']});
    return()=>{window.removeEventListener('popstate',restore);observer.disconnect();};
  },[initialComponent]);
  useEffect(()=>{if(ready){const next=window.location.pathname+writePlayground(settings)+window.location.hash;window.history.replaceState(window.history.state,'',next);}},[settings,ready]);
  const update=(patch:Partial<PlaygroundSettings>)=>{setSettings(current=>readPlayground(writePlayground({...current,...patch})));setMessage('');setShareMessage('');};
  const component=settings.component;const states=statesFor(component);const dates=['Calendar','DatePicker','DateRangePicker'].includes(component);
  async function share(){try{const url=new URL(window.location.href);url.search=writePlayground(settings);await navigator.clipboard.writeText(url.toString());setShareMessage('Configuration link copied.');}catch{setShareMessage('Copy this configuration from the browser address bar.');}}
  function reset(){setSettings({...playgroundDefaults,component:initialComponent});document.documentElement.dataset.uiTheme='light';setMessage('Playground reset.');setShareMessage('');}
  return <div className="playground" aria-busy={!ready || undefined}>
    <section className="playground-controls" aria-label="Playground controls"><div className="playground-heading"><p className="eyebrow">THE DETAILS</p><Button variant="ghost" size="sm" leadingIcon={RotateCcw} onClick={reset}>Reset</Button></div>
      <Choice label="Component" value={component} options={playgroundNames} onChange={value=>update({component:value as PlaygroundName,state:'Default'})} />
      {states.length>1 && <Choice label="State" value={settings.state} options={states} onChange={state=>update({state})} />}
      {component==='Button' && <><Field label="Button text"><Input value={settings.label} maxLength={60} onChange={event=>update({label:event.target.value})} /></Field><Choice label="Variant" value={settings.variant} options={['primary','accent','secondary','ghost','danger']} onChange={variant=>update({variant:variant as PlaygroundSettings['variant']})} /><Choice label="Size" value={settings.size} options={['sm','md','lg']} onChange={size=>update({size:size as PlaygroundSettings['size']})} /><Switch label="Trailing icon" checked={settings.icon} onChange={event=>update({icon:event.target.checked})} /></>}
      {['Input','DataTable'].includes(component) && <Choice label="Density" value={settings.density} options={['comfortable','compact']} onChange={density=>update({density:density as PlaygroundSettings['density']})} />}
      {component==='Badge' && <Choice label="Tone" value={settings.tone} options={['neutral','accent','success','warning','danger']} onChange={tone=>update({tone:tone as PlaygroundSettings['tone']})} />}
      {component==='Progress' && <Field label="Progress value"><Input type="number" min={0} max={100} value={settings.value} onChange={event=>update({value:Number(event.target.value)})} /></Field>}
      {component==='Drawer' && <Choice label="Placement" value={settings.side} options={['bottom','left','right']} onChange={side=>update({side:side as PlaygroundSettings['side']})} />}
      {['Dialog','Drawer'].includes(component) && <Choice label="Initial focus" value={settings.focus} options={['input','close']} onChange={focus=>update({focus:focus as PlaygroundSettings['focus']})} />}
      {component==='MultiSelect' && <Checkbox label="Disable Research option" checked={settings.disabledOption} onChange={event=>update({disabledOption:event.target.checked})} />}
      {dates && <><Field label="Selected date"><Input type="date" value={settings.date} onChange={event=>update({date:event.target.value})} /></Field>{component==='DateRangePicker' && <Field label="End date"><Input type="date" value={settings.endDate} min={settings.date || undefined} onChange={event=>update({endDate:event.target.value})} /></Field>}<Field label="Minimum date"><Input type="date" value={settings.minDate} onChange={event=>update({minDate:event.target.value})} /></Field><Field label="Maximum date"><Input type="date" value={settings.maxDate} min={settings.minDate || undefined} onChange={event=>update({maxDate:event.target.value})} /></Field></>}
      {component==='DataTable' && <><Field label="Rows per page"><Input type="number" min={1} max={10} value={settings.pageSize} onChange={event=>update({pageSize:Number(event.target.value)})} /></Field><Switch label="Row selection" checked={settings.selectable} onChange={event=>update({selectable:event.target.checked})} /><Switch label="Resizable columns" checked={settings.resizable} onChange={event=>update({resizable:event.target.checked})} /><Switch label="Inline editing" checked={settings.inlineEditing} onChange={event=>update({inlineEditing:event.target.checked})} /></>}
      <div className="playground-environment"><Switch label="Narrow preview" checked={settings.mobile} onChange={event=>update({mobile:event.target.checked})} /><Switch label="Dark preview" checked={settings.dark} onChange={event=>{document.documentElement.dataset.uiTheme=event.target.checked?'dark':'light';update({dark:event.target.checked});}} /></div>
      <Button variant="secondary" size="sm" leadingIcon={Link2} onClick={share}>Copy configuration link</Button><p role="status" className="bui-hint">{shareMessage}</p>
      <p className="bui-hint">Links preserve component options, states, sample dates and selected disciplines. Use the preview to explore its keyboard behaviour.</p>
    </section>
    <div className="playground-workspace"><section className="playground-stage" aria-label="Component preview"><div className="preview-label"><span className="eyebrow">LIVE / {component.toUpperCase()}</span><span>{settings.mobile?'390 px max':'Full width'}</span></div><div className="playground-frame" data-narrow={settings.mobile}><div className="playground-sample" data-wide={component==='DataTable'}>{ready && <PlaygroundPreview key={component} settings={settings} update={update} onMessage={setMessage} />}</div></div><p role="status" className="playground-status">{message}</p></section>
      <aside className="playground-keyboard"><p className="eyebrow">KEYBOARD</p><p>{playgroundKeyboard(component)}</p><Link href={'/components/'+playgroundModules[component]} className="plain-link">Complete props and behaviour</Link></aside>
      <section className="playground-code"><div className="playground-heading"><h2>Your configuration.</h2><span className="eyebrow">REACT / TYPESCRIPT</span></div><CodeBlock code={playgroundCode(settings)} /><p className="bui-hint">A client component with local sample state. Connect persistence and retry actions to your own service.</p><CodeBlock code={`npx shadcn@latest add https://ui.bld8.dev/r/${playgroundModules[component]}.json${component==='DataTable'&&settings.inlineEditing?' https://ui.bld8.dev/r/editable-cell.json':''}`} /></section>
    </div>
  </div>;
}
