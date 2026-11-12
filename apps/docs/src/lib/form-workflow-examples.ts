/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const formWorkflowExamples = [
  {
    "id": "fieldset-contact-groups",
    "componentId": "fieldset",
    "title": "Related details with native group ownership",
    "description": "Group contact and delivery fields with native legends, shared hints and one form. Disabled groups stay out of native submission.",
    "keyboard": [
      "Tab follows editable fields in document order and skips the disabled group.",
      "Submit incomplete details, then follow the linked message to the contact field."
    ],
    "states": [
      "Native fieldset and legend",
      "Grouped disabled state",
      "Required native input",
      "Canonical form values"
    ],
    "source": "'use client';\nimport {useState} from 'react';\nimport {Button,Field,Fieldset,FormErrorSummary,Input} from '@bld8/ui';\nexport default function GroupedContactExample(){\n  const [result,setResult]=useState('No contact read yet.'),[errors,setErrors]=useState<Record<string,string>>({});\n  return <form noValidate aria-label=\"Grouped contact example\" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);if(!String(data.get('contact')??'').trim()){setErrors({contact:'Enter a contact name.'});return;}setErrors({});setResult(String(data.get('contact'))+' | '+String(data.get('team'))+' | disabled: '+String(data.has('retired')));}} style={{display:'grid',gap:24,maxWidth:600}}>\n    <FormErrorSummary errors={errors} fieldLabels={{contact:'Contact name'}}/>\n    <Fieldset legend=\"Contact details\" hint=\"These fields describe who will receive the review.\"><Field label=\"Contact name\" required><Input name=\"contact\" autoComplete=\"name\" onChange={()=>setErrors({})}/></Field><Field label=\"Team\"><Input name=\"team\" defaultValue=\"Interface team\"/></Field></Fieldset>\n    <Fieldset legend=\"Retired destination\" hint=\"Disabled groups are excluded from submission.\" disabled><Field label=\"Retired contact\"><Input name=\"retired\" defaultValue=\"Old team\"/></Field></Fieldset>\n    <Button type=\"submit\">Read grouped contact</Button><p role=\"status\">{result}</p>\n  </form>;\n}"
  },
  {
    "id": "checkbox-group-native-form",
    "componentId": "checkbox-group",
    "title": "Grouped validation, native reset and external forms",
    "description": "Choose delivery channels with a group minimum, submit stable repeated values and reset an uncontrolled collection. Read-only choices remain submitted; disabled choices do not.",
    "keyboard": [
      "Tab visits native checkboxes. Space changes an editable choice.",
      "Submitting without a delivery channel focuses the first enabled choice.",
      "Reset restores the uncontrolled defaults unless Prevent reset is checked; controlled values remain owned by the host."
    ],
    "states": [
      "External native form",
      "Required group validation",
      "Repeated values",
      "Read-only submission",
      "Disabled exclusion",
      "Uncontrolled and controlled reset",
      "Prevented reset"
    ],
    "source": "'use client';\nimport {useId,useState} from 'react';\nimport {Button,Checkbox,CheckboxGroup} from '@bld8/ui';\nconst channels=[{value:'email',label:'Email',description:'A review link in your inbox.'},{value:'in-app',label:'In-app',description:'An entry in your review queue.'},{value:'legacy',label:'Legacy feed',disabled:true}];\nexport default function CheckboxGroupFormExample(){\n  const id=useId(),[prevent,setPrevent]=useState(false),[owned,setOwned]=useState<string[]>(['in-app']),[result,setResult]=useState('No delivery selection submitted.'),[reversed,setReversed]=useState(false);\n  return <div style={{display:'grid',gap:24,maxWidth:600}}>\n    <CheckboxGroup label=\"Delivery channels\" name=\"delivery\" form={id} options={reversed?[...channels].reverse():channels} defaultValue={['email']} required hint=\"Choose at least one available channel.\"/>\n    <Button variant=\"ghost\" onClick={()=>setReversed(value=>!value)}>Reverse delivery choice order</Button>\n    <CheckboxGroup label=\"Host-owned channels\" name=\"owned\" form={id} options={channels} value={owned} onValueChange={setOwned}/>\n    <CheckboxGroup label=\"Read-only channels\" name=\"locked\" form={id} options={channels} defaultValue={['email']} readOnly/>\n    <CheckboxGroup label=\"Disabled channels\" name=\"disabled\" form={id} options={channels} defaultValue={['email']} disabled/>\n    <Checkbox label=\"Prevent channel reset\" checked={prevent} onCheckedChange={setPrevent}/>\n    <form id={id} aria-label=\"Delivery channel submission\" onReset={event=>{if(prevent){event.preventDefault();return;}setOwned(['in-app']);setResult('Delivery defaults restored.');}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setResult('Delivery: '+data.getAll('delivery').join(', ')+' | Host: '+data.getAll('owned').join(', ')+' | Locked: '+data.getAll('locked').join(', ')+' | Disabled: '+data.has('disabled'));}}>\n      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button type=\"submit\">Read delivery values</Button><Button variant=\"secondary\" type=\"reset\">Reset delivery choices</Button></div>\n    </form><p role=\"status\">{result}</p>\n  </div>;\n}"
  },
  {
    "id": "form-review-request",
    "componentId": "react-hook-form",
    "title": "Conditional reviewers and repeatable form rows",
    "description": "Compose grouped channels, a conditional reviewer list and linked validation errors with React Hook Form. A rejected local save preserves every draft value for correction.",
    "keyboard": [
      "Submit an incomplete request to focus the first invalid field. Error-summary links return to the named field.",
      "Enable Include reviewers to reveal email fields. Add reviewer focuses the new row; remove keeps a valid nearby focus target.",
      "Reset restores host-owned defaults. Pending submission disables editing; failed saves keep values and show a linked error."
    ],
    "states": [
      "Fieldset and CheckboxGroup",
      "React Hook Form integration",
      "Conditional fields",
      "Repeatable rows",
      "Linked error summary",
      "Server error retention",
      "Host reset",
      "Abortable local save"
    ],
    "source": "'use client';\nimport {useEffect,useRef,useState} from 'react';\nimport {Controller,useFieldArray,useForm,type FieldPath} from 'react-hook-form';\nimport {Button,Checkbox,CheckboxGroup,Fieldset,FormErrorSummary,Input,Reveal} from '@bld8/ui';\nimport {RHFControl,RHFField} from '@bld8/ui/react-hook-form';\ninterface Values {title:string;channels:string[];includeReviewers:boolean;reviewers:{email:string}[]}\nconst defaults:Values={title:'',channels:['email'],includeReviewers:false,reviewers:[{email:''}]};\nconst channelOptions=[{value:'email',label:'Email'},{value:'in-app',label:'In-app'}];\nfunction wait(signal:AbortSignal){return new Promise<void>((resolve,reject)=>{const done=()=>{signal.removeEventListener('abort',abort);resolve();},timer=setTimeout(done,160),abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));};if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});});}\nexport default function ReviewRequestFormExample(){\n  const form=useForm<Values>({defaultValues:defaults,mode:'onBlur'}),rows=useFieldArray({control:form.control,name:'reviewers'});\n  const includeReviewers=form.watch('includeReviewers'),pending=form.formState.isSubmitting,request=useRef<AbortController|null>(null);\n  const [rejectNext,setRejectNext]=useState(false),[status,setStatus]=useState('Local form example. No review is sent.');\n  useEffect(()=>()=>request.current?.abort(),[]);\n  useEffect(()=>{if(!pending&&form.formState.errors.title?.type==='server')form.setFocus('title');},[pending,form.formState.errors.title,form.setFocus]);\n  useEffect(()=>{if(!includeReviewers)form.clearErrors('reviewers');},[includeReviewers,form.clearErrors]);\n  const errors:Record<string,string|undefined>={title:form.formState.errors.title?.message,channels:form.formState.errors.channels?.message};\n  if(includeReviewers)rows.fields.forEach((row,index)=>{errors['reviewers.'+index+'.email']=form.formState.errors.reviewers?.[index]?.email?.message;});\n  async function save(values:Values){\n    const controller=new AbortController();request.current?.abort();request.current=controller;setStatus('');form.clearErrors('root.service');\n    try{await wait(controller.signal);if(controller.signal.aborted)return;\n      if(rejectNext){setRejectNext(false);form.setError('title',{type:'server',message:'This local request title is already used.'},{shouldFocus:true});form.setError('root.service',{message:'The local save was rejected. Your entries are kept.'});return;}\n      setStatus('Request prepared locally with '+(values.includeReviewers?values.reviewers.length:0)+' reviewers. No message was sent.');\n    }catch(error){if(!controller.signal.aborted)form.setError('root.service',{message:error instanceof Error?error.message:'Unable to prepare request.'});}\n    finally{if(request.current===controller)request.current=null;}\n  }\n  function reset(){request.current?.abort();form.reset(defaults);setStatus('Form defaults restored.');}\n  return <div style={{display:'grid',gap:20,maxWidth:680}}><Checkbox label=\"Reject next local save\" checked={rejectNext} onCheckedChange={setRejectNext} disabled={pending}/>\n    <form noValidate aria-label=\"Review request form\" aria-busy={pending||undefined} onSubmit={form.handleSubmit(save)} onReset={event=>{event.preventDefault();reset();}} style={{display:'grid',gap:24}}>\n      <FormErrorSummary error={form.formState.errors.root?.service?.message} errors={errors} fieldLabels={{title:'Request title',channels:'Delivery channels'}} onFocusField={name=>form.setFocus(name as FieldPath<Values>)}/>\n      <Fieldset legend=\"Request details\" hint=\"Start with a short title and a delivery choice.\" disabled={pending}>\n        <RHFField control={form.control} name=\"title\" label=\"Request title\" required rules={{required:'Enter a request title.',minLength:{value:3,message:'Use at least three characters.'}}}>{field=><Input {...field} autoComplete=\"off\"/>}</RHFField>\n        <RHFControl control={form.control} name=\"channels\" rules={{validate:value=>value.length>0||'Choose at least one delivery channel.'}}>{binding=><CheckboxGroup {...binding} label=\"Delivery channels\" options={channelOptions} required/>}</RHFControl>\n      </Fieldset>\n      <Controller control={form.control} name=\"includeReviewers\" render={({field})=><Checkbox label=\"Include reviewers\" name={field.name} inputRef={field.ref} checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} disabled={pending}/>}/>\n      <Reveal open={includeReviewers}><Fieldset legend=\"Reviewers\" hint=\"Up to three local reviewer rows. Hiding this group preserves its draft.\" disabled={pending}>\n        {rows.fields.map((row,index)=><div key={row.id} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:12,alignItems:'end'}}>\n          <RHFField control={form.control} name={('reviewers.'+index+'.email') as `reviewers.${number}.email`} label={'Reviewer '+(index+1)+' email'} required rules={{validate:value=>!includeReviewers||/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)||'Enter a valid reviewer email.'}}>{field=><Input {...field} type=\"email\" autoComplete=\"off\"/>}</RHFField>\n          <Button variant=\"ghost\" size=\"sm\" aria-label={'Remove reviewer '+(index+1)} disabled={rows.fields.length<=1} onClick={()=>{rows.remove(index);requestAnimationFrame(()=>form.setFocus(('reviewers.'+Math.max(0,index-1)+'.email') as FieldPath<Values>));}}>Remove</Button>\n        </div>)}\n        <Button variant=\"secondary\" disabled={rows.fields.length>=3} onClick={()=>rows.append({email:''})}>Add reviewer</Button>\n      </Fieldset></Reveal>\n      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button type=\"submit\" loading={pending}>Prepare review request</Button><Button variant=\"secondary\" type=\"reset\" disabled={pending}>Reset review form</Button></div>\n    </form><p role=\"status\">{status}</p>\n  </div>;\n}"
  }
];
