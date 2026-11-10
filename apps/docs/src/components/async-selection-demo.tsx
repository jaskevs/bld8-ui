'use client';
import {useMemo,useRef,useState} from 'react';
import {AsyncCombobox,AsyncMultiSelect,Avatar,Button,Checkbox,Select} from '@bld8/ui';
import {createPeopleSource} from '../../../../examples/async-selection/client';
import type {DirectoryPerson,DirectorySource} from '../../../../examples/async-selection/directory';

export function PeopleDirectoryDemo({multiple}:{multiple?:boolean}){
  const [source,setSource]=useState<DirectorySource>('product'),[assignee,setAssignee]=useState<string|null>('maya'),[reviewers,setReviewers]=useState<string[]>(['sam']);
  const [fail,setFail]=useState(false),[disabled,setDisabled]=useState(false),[submitted,setSubmitted]=useState('');const failure=useRef(false);
  const directory=useMemo(()=>createPeopleSource({source,failNext:()=>{const next=failure.current;if(next){failure.current=false;setFail(false);}return next;}}),[source]);
  const row=(person:DirectoryPerson)=><span className="bui-person-option"><span className="bui-person-avatar" aria-hidden="true"><Avatar name={person.label} size="sm"/></span><span><strong>{person.label}</strong><small>{person.description}</small></span></span>;
  return <section className="stack bui-directory-example" aria-label="People directory example"><div><h2>A person, not just a value.</h2><p className="bui-hint">Search a sample directory over HTTP. Selected IDs and labels stay available across result pages.</p></div>
    <div className="bui-directory-settings"><Select label="Directory source" value={source} options={[{value:'product',label:'Product studio'},{value:'research',label:'Research studio'}]} onValueChange={value=>setSource(value as DirectorySource)}/><Checkbox label="Fail next search" checked={fail} onChange={event=>{failure.current=event.target.checked;setFail(event.target.checked);}}/><Checkbox label="Disable directory controls" checked={disabled} onChange={event=>setDisabled(event.target.checked)}/></div>
    <form aria-label="Selection form" className="stack" onSubmit={event=>{event.preventDefault();const entries=[...new FormData(event.currentTarget).entries()];setSubmitted(JSON.stringify(entries));}}>
      {multiple!==true&&<AsyncCombobox label="Assignee" name="assignee" value={assignee} onValueChange={setAssignee} {...directory} sourceKey={source} renderOption={row} disabled={disabled} clearable hint="Starts from the ID maya; its label is resolved from the service."/>}
      {multiple!==false&&<AsyncMultiSelect label="Reviewers" name="reviewers" value={reviewers} onValueChange={setReviewers} {...directory} sourceKey={source} renderOption={row} disabled={disabled} hint="Try another search or load more; your reviewers remain selected."/>}
      <Button type="submit" variant="secondary">Read form values</Button><output aria-label="Submitted IDs" className="bui-hint">{submitted||'Selections are submitted as IDs.'}</output>
    </form>
  </section>;
}
