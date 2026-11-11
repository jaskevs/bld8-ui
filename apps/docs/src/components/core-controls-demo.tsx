'use client';
import {useState} from 'react';
import {OTPInput,RangeSlider,TagInput,ToggleGroup} from '@bld8/ui';
export function CoreControlDemo({id}:{id:string}) {
  const [code,setCode]=useState(''),[range,setRange]=useState<[number,number]>([20,70]),[tags,setTags]=useState(['Interface','Motion']),[alignment,setAlignment]=useState<string[]>(['start']);
  if(id==='otp-input')return <OTPInput label="Access code" value={code} onValueChange={setCode} hint="Paste or type a six-digit code."/>;
  if(id==='range-slider')return <RangeSlider label="Preview range" value={range} onValueChange={setRange} min={0} max={100} step={5} minGap={10}/>;
  if(id==='tag-input')return <TagInput label="Example topics" value={tags} onValueChange={setTags} hint="Enter adds a topic. Backspace focuses the last tag."/>;
  return <ToggleGroup label="Content alignment" value={alignment} onValueChange={setAlignment} options={[{value:'start',label:'Start'},{value:'center',label:'Centre'},{value:'end',label:'End'}]}/>;
}
