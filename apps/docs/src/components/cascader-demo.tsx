'use client';
import {useMemo,useRef,useState} from 'react';
import {Button,Cascader,Checkbox} from '@bld8/ui';
import {createProjectAreaSource} from '../../../../examples/cascader/client';

export function CascaderDemo() {
  const [value,setValue]=useState<readonly string[]>(['engineering','frontend','react']),[fail,setFail]=useState(false),[disabled,setDisabled]=useState(false),[submitted,setSubmitted]=useState('Not submitted');
  const failRef=useRef(false);failRef.current=fail;
  const source=useMemo(()=>createProjectAreaSource({failNext:()=>{if(!failRef.current)return false;failRef.current=false;setFail(false);return true;}}),[]);
  return <section className="stack bui-directory-example">
    <div className="bui-directory-settings"><Checkbox label="Fail next load" checked={fail} onChange={event=>setFail(event.currentTarget.checked)}/><Checkbox label="Disable project area" checked={disabled} onChange={event=>setDisabled(event.currentTarget.checked)}/></div>
    <form className="stack" aria-label="Project area form" onSubmit={event=>{event.preventDefault();setSubmitted(String(new FormData(event.currentTarget).get('area')));}}>
      <Cascader label="Project area" name="area" value={value} onValueChange={setValue} {...source} disabled={disabled} sourceKey="studio" hint="Browse to a final area. Search applies to the current level."/>
      <Button type="submit" variant="secondary">Read path value</Button><output aria-label="Submitted path" className="bui-hint">{submitted}</output>
    </form>
    <p className="bui-hint">Authored example areas. Each level and saved path is loaded over HTTP.</p>
  </section>;
}
