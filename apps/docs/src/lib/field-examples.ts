export const fieldExamples=[
  {id:'input-validation',componentId:'input',title:'Validation with a clear return path',description:'Native email validation, linked feedback and focus on the field that needs attention.',keyboard:['Tab reaches the email field and submit action.','Enter submits; invalid input keeps its value and receives focus.'],states:['Empty required field','Invalid email','Saved feedback'],source:`'use client';
import {useRef,useState} from 'react';
import {Button,Field,Input} from '@bld8/ui';
export default function ContactExample(){
  const [email,setEmail]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState('');
  const input=useRef<HTMLInputElement>(null);
  return <form noValidate onSubmit={event=>{
    event.preventDefault();
    if(!input.current?.validity.valid){setError('Enter a valid contact email.');input.current?.focus();return;}
    setStatus('Contact details saved for this example.');
  }}>
    <Field label="Contact email" required hint="Use an address where you can receive replies." error={error}>
      <Input ref={input} type="email" name="contactEmail" value={email} onChange={event=>{setEmail(event.target.value);setError('');setStatus('');}}/>
    </Field>
    <Button type="submit">Save contact example</Button><p role="status">{status}</p>
  </form>;
}`},
  {id:'button-feedback',componentId:'button',title:'A stable pending action',description:'The action keeps its dimensions while loading and confirms completion beside the button.',keyboard:['Tab focuses the action.','Enter or Space starts one save; the pending action is disabled.'],states:['Idle','Pending','Saved'],source:`'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@bld8/ui';
export default function ButtonFeedbackExample(){
  const [busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  return <div><Button loading={busy} onClick={()=>{
    setBusy(true);setStatus('');
    timer.current=setTimeout(()=>{setBusy(false);setStatus('Draft saved for this example.');},600);
  }}>Save draft example</Button><p role="status">{status}</p></div>;
}`},
  {id:'checkbox-mixed',componentId:'checkbox',title:'Select a complete group',description:'A native indeterminate checkbox represents a partial choice without replacing the input semantics.',keyboard:['Tab visits each native checkbox.','Space toggles the focused choice; the parent reflects none, some or all.'],states:['Partially selected','All selected','None selected'],source:`'use client';
import {useState} from 'react';
import {Checkbox} from '@bld8/ui';
export default function ChannelExample(){
  const [selected,setSelected]=useState(['product']);
  const options=[{value:'product',label:'Product news channel'},{value:'research',label:'Research notes channel'}];
  return <fieldset style={{border:0,padding:0,margin:0,display:'grid',gap:12}}>
    <legend className="bui-label">Notification channels</legend>
    <Checkbox label="Include all channels" hint="A dash means some channels are included."
      checked={selected.length===options.length} indeterminate={selected.length>0&&selected.length<options.length}
      onCheckedChange={checked=>setSelected(checked?options.map(option=>option.value):[])}/>
    {options.map(option=><Checkbox key={option.value} name="channels" value={option.value} label={option.label}
      checked={selected.includes(option.value)} onCheckedChange={checked=>setSelected(checked?[...selected,option.value]:selected.filter(value=>value!==option.value))}/>)}
    <p role="status">{selected.length} channels included</p>
  </fieldset>;
}`},
  {id:'radio-preference',componentId:'radio',title:'One choice, with context',description:'Native radio navigation with descriptions, a required group and an unavailable choice.',keyboard:['Tab enters the selected option.','Arrow keys move and select within the native radio group.'],states:['Selected','Unselected','Disabled'],source:`'use client';
import {useState} from 'react';
import {RadioGroup} from '@bld8/ui';
export default function CadenceExample(){
  const [value,setValue]=useState('weekly');
  return <RadioGroup label="Delivery cadence" name="deliveryCadence" value={value} onValueChange={setValue}
    required hint="Choose one schedule. Arrow keys move within the group."
    options={[{value:'daily',label:'Daily summary',description:'A short update each day.'},
      {value:'weekly',label:'Weekly summary',description:'One collected update each week.'},
      {value:'off',label:'No summary',disabled:true}]}/>;
}`},
  {id:'switch-preference',componentId:'switch',title:'A setting with validation',description:'A native switch input preserves its form value, required state and linked error.',keyboard:['Space changes the setting.','Submit returns focus to the switch if the required setting is off.'],states:['Off','On','Invalid'],source:`'use client';
import {useRef,useState} from 'react';
import {Button,Switch} from '@bld8/ui';
export default function QuietHoursExample(){
  const [quiet,setQuiet]=useState(false),[error,setError]=useState('');
  const input=useRef<HTMLInputElement>(null);
  return <form noValidate onSubmit={event=>{event.preventDefault();setError(quiet?'':'Enable quiet hours for this example.');if(!quiet)input.current?.focus();}}>
    <Switch label="Quiet hours" name="quietHours" value="enabled" checked={quiet}
      onCheckedChange={next=>{setQuiet(next);setError('');}} inputRef={input} required
      hint="Pause optional notifications overnight." error={error}/>
    <Button type="submit">Save quiet hours example</Button>
  </form>;
}`},
  {id:'slider-preview',componentId:'slider',title:'A native single-value range',description:'One numerical setting with explicit increments and a visible value.',keyboard:['Arrow keys change the value by five.','Home and End reach the native range limits.'],states:['Controlled value','Keyboard editing'],source:`'use client';
import {useState} from 'react';
import {Slider} from '@bld8/ui';
export default function ThumbnailExample(){
  const [scale,setScale]=useState(40);
  return <Slider label="Thumbnail scale" name="thumbnailScale" value={scale}
    onChange={event=>setScale(Number(event.target.value))} min={20} max={100} step={5}
    hint="Use arrow keys for 5 point changes."/>;
}`},
  {id:'range-budget',componentId:'range-slider',title:'An ordered range',description:'Two labelled thumbs retain a minimum gap and report live and committed values.',keyboard:['Tab reaches each thumb in order.','Arrow keys adjust by five; Home/End respect the minimum gap.'],states:['Two values','Clamped collision','Committed feedback'],source:`'use client';
import {useState} from 'react';
import {RangeSlider} from '@bld8/ui';
export default function BudgetExample(){
  const [budget,setBudget]=useState<[number,number]>([20,80]),[committed,setCommitted]=useState('');
  return <div><RangeSlider label="Monthly budget" name="budget" value={budget} onValueChange={setBudget}
    onValueCommitted={range=>setCommitted(range.join(' to '))} min={0} max={100} step={5} minGap={10}
    thumbLabels={['Minimum budget','Maximum budget']} hint="Keep at least 10 between the lower and upper values."/>
    <p role="status">{committed?'Committed '+committed:'Adjust either end of the range.'}</p>
  </div>;
}`},
  {id:'checkbox-required',componentId:'checkbox',title:'A required native form choice',description:'Required validation, native form data, a ref and linked feedback.',keyboard:['Space changes the choice.','Submit focuses the unchecked required input.'],states:['Required','Invalid','Submitted'],source:`'use client';
import {useRef,useState} from 'react';
import {Button,Checkbox} from '@bld8/ui';
export default function AgreementExample(){
  const input=useRef<HTMLInputElement>(null);
  const [error,setError]=useState(''),[status,setStatus]=useState('');
  return <form noValidate onSubmit={event=>{
    event.preventDefault();
    if(!input.current?.checkValidity()){setError('Accept the example terms to continue.');input.current?.focus();return;}
    setStatus('Agreement: '+new FormData(event.currentTarget).get('agreement'));
  }}>
    <Checkbox label="Accept example terms" name="agreement" value="accepted" required inputRef={input}
      hint="This is a local form example." error={error} onChange={()=>{setError('');setStatus('');}}/>
    <Button type="submit">Submit agreement example</Button><p role="status">{status}</p>
  </form>;
}`},
  {id:'radio-validation',componentId:'radio',title:'Required choice and form data',description:'An uncontrolled native group with a focused error and a disabled option.',keyboard:['Tab reaches the first available radio.','Arrow keys change the selection and skip disabled options.'],states:['Empty required group','Invalid','Disabled option','Submitted'],source:`'use client';
import {useRef,useState} from 'react';
import {Button,RadioGroup} from '@bld8/ui';
export default function ExportExample(){
  const first=useRef<HTMLInputElement>(null);
  const [error,setError]=useState(''),[status,setStatus]=useState('');
  return <form noValidate onSubmit={event=>{
    event.preventDefault();const selected=new FormData(event.currentTarget).get('exportFormat');
    if(!selected){setError('Choose an export format.');first.current?.focus();return;}
    setStatus('Export format: '+selected);
  }}>
    <RadioGroup label="Export format" name="exportFormat" required inputRef={first} error={error}
      hint="The choice is submitted using its stable value." onValueChange={()=>{setError('');setStatus('');}}
      options={[{value:'json',label:'Structured JSON'},{value:'csv',label:'Spreadsheet CSV'},{value:'xml',label:'Legacy XML',disabled:true}]}/>
    <Button type="submit">Read export preference</Button><p role="status">{status}</p>
  </form>;
}`},
  {id:'range-uncontrolled',componentId:'range-slider',title:'Default values and form reset',description:'Both named thumbs submit values; reset restores the initial range.',keyboard:['Tab reaches both labelled thumbs.','Reset restores the initial values without firing a user edit.'],states:['Uncontrolled','Reset','Disabled range'],source:`'use client';
import {useState} from 'react';
import {Button,RangeSlider} from '@bld8/ui';
export default function RetentionExample(){
  const [status,setStatus]=useState('');
  return <form onSubmit={event=>{event.preventDefault();setStatus('Retention values: '+new FormData(event.currentTarget).getAll('retention').join(', '));}}>
    <RangeSlider label="Retention window" name="retention" defaultValue={[15,45]} min={0} max={60} step={5} minGap={10}
      thumbLabels={['Earliest retention','Latest retention']} hint="Keep a minimum interval of ten."/>
    <RangeSlider label="Locked example range" defaultValue={[20,40]} disabled/>
    <Button type="submit">Read retention values</Button><Button type="reset" variant="secondary">Reset retention example</Button>
    <p role="status">{status}</p>
  </form>;
}`},
  {id:'otp-uncontrolled',componentId:'otp-input',title:'Native form entry and reset',description:'A single named field supports defaults, completion feedback and native reset.',keyboard:['Native selection, Delete and Backspace edit the same input.','Reset restores the initial code.'],states:['Default value','Completion','Disabled field','Reset'],source:`'use client';
import {useState} from 'react';
import {Button,OTPInput} from '@bld8/ui';
export default function UncontrolledCodeExample(){
  const [status,setStatus]=useState('');
  return <form onSubmit={event=>{event.preventDefault();setStatus('Entered code: '+new FormData(event.currentTarget).get('backupCode'));}}>
    <OTPInput label="Backup example code" name="backupCode" length={4} defaultValue="12" required onComplete={()=>setStatus('All four positions are filled.')}/>
    <OTPInput label="Locked example code" length={4} defaultValue="1234" disabled/>
    <Button type="submit">Read backup example</Button><Button type="reset" variant="secondary">Reset backup example</Button>
    <p role="status">{status}</p>
  </form>;
}`},
  {id:'otp-native-change',componentId:'otp-input',title:'Native change events and read-only entry',description:'The ordinary value/onChange convention receives the canonical code after native paste.',keyboard:['Paste formatted text into the real input.','Select a text range and use Backspace to edit it.','Read-only entry keeps its value when paste is attempted.'],states:['Canonical paste','Native change feedback','Complete code','Read only'],source:`'use client';
import {useState} from 'react';
import {OTPInput} from '@bld8/ui';
import '@bld8/ui/styles.css';
export default function NativeCodeExample(){
  const [code,setCode]=useState(''),[lastEdit,setLastEdit]=useState(''),[complete,setComplete]=useState('');
  return <div>
    <OTPInput label="Native change example code" length={6} value={code}
      onChange={event=>{setCode(event.currentTarget.value);setLastEdit(event.currentTarget.value);}} onComplete={setComplete}/>
    <p role="status">Canonical edit: {lastEdit}</p><p>Last complete code: {complete}</p>
    <OTPInput label="Read only example code" length={4} value="1234" readOnly/>
  </div>;
}`},
  {id:'otp-code',componentId:'otp-input',title:'One field for the whole code',description:'Native paste, autofill, selection and deletion, with optional decorative progress slots.',keyboard:['Type or paste into the single labelled input.','Arrow keys, selection and Backspace use native text editing.','Submit focuses the input when the code is incomplete.'],states:['Empty','Partial','Complete format','Validation error'],source:`'use client';
import {useRef,useState} from 'react';
import {Button,OTPInput} from '@bld8/ui';
export default function CodeExample(){
  const [code,setCode]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState('');
  const input=useRef<HTMLInputElement>(null);
  return <form noValidate onSubmit={event=>{
    event.preventDefault();
    if(code.length!==6){setError('Enter all six digits.');input.current?.focus();return;}
    setError('');setStatus('Code format is ready. This example does not verify a code.');
  }}>
    <OTPInput label="Example verification code" name="verificationCode" length={6} value={code}
      onValueChange={next=>{setCode(next);setError('');setStatus('');}} inputRef={input} required showSlots
      hint="Paste a six digit code or type it in this single field." error={error}/>
    <Button type="submit">Check example code</Button><p role="status">{status}</p>
  </form>;
}`}
];
