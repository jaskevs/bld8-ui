'use client';
import {useEffect,useRef,useState} from 'react';
import {Controller,useForm} from 'react-hook-form';
import {Alert,Button,DatePicker,Input,MultiSelect,Select,Switch,formatDateValue} from '@bld8/ui';
import {RHFControl,RHFField} from '@bld8/ui/react-hook-form';
import {useOutlineDemoRepository} from '@bld8/blocks';
import {OutlineValidationError} from '@bld8/blocks/outline-repository';

export interface RHFProjectValues {name:string;discipline:string|null;date:Date|null;tags:string[];summary:boolean}
const defaults:RHFProjectValues={name:'',discipline:null,date:null,tags:[],summary:true};
const options=[{value:'design',label:'Design'},{value:'engineering',label:'Engineering'},{value:'research',label:'Research'}];

export function RHFProjectExample({baseUrl='/api/outline'}:{baseUrl?:string}){
  const form=useForm<RHFProjectValues>({defaultValues:defaults,mode:'onBlur'});
  const {repository,rejectNext,setRejectNext}=useOutlineDemoRepository(baseUrl);
  const [message,setMessage]=useState('');const request=useRef<AbortController|null>(null);
  useEffect(()=>()=>{request.current?.abort();request.current=null;},[]);
  const pending=form.formState.isSubmitting;
  const serverFocus=form.formState.errors.name?.type==='server'?'name':form.formState.errors.date?.type==='server'?'date':undefined;
  useEffect(()=>{if(!pending&&serverFocus)form.setFocus(serverFocus);},[pending,serverFocus,form.setFocus]);
  async function save(values:RHFProjectValues){
    if(!repository||request.current)return;const controller=new AbortController();request.current=controller;form.clearErrors('root.service');setMessage('');
    try{
      await repository.save({name:values.name,due:formatDateValue(values.date??undefined),notes:'Discipline: '+values.discipline+'; tags: '+values.tags.join(', ')+'; summary: '+values.summary,status:'Planned'},null,controller.signal);
      if(controller.signal.aborted)return;form.reset(values);setMessage('Project saved through the sample HTTP API.');
    }catch(error){
      if(controller.signal.aborted)return;
      if(error instanceof OutlineValidationError){if(error.fields.name)form.setError('name',{type:'server',message:error.fields.name},{shouldFocus:true});if(error.fields.due)form.setError('date',{type:'server',message:error.fields.due},{shouldFocus:!error.fields.name});if(error.fields.notes||error.fields.status)form.setError('root.service',{message:error.message});}
      else form.setError('root.service',{message:error instanceof Error?error.message:'Unable to save. Try again.'});
    }finally{if(request.current===controller)request.current=null;}
  }
  return <section className="bblocks-panel" aria-label="React Hook Form example"><div className="bblocks-heading"><div><p className="bblocks-kicker">REACT HOOK FORM / HTTP</p><h2>A form that fits your setup.</h2><p className="bblocks-muted">Native and controlled fields, one form state.</p></div><Button variant="ghost" size="sm" disabled={pending} aria-pressed={rejectNext} onClick={()=>setRejectNext(value=>!value)}>{rejectNext?'Cancel failed-save example':'Fail next save'}</Button></div>
    <form noValidate className="bblocks-stack" onSubmit={form.handleSubmit(save)} aria-busy={pending || undefined}>
      <RHFField control={form.control} name="name" label="Project name" required rules={{required:'Enter a project name.',minLength:{value:3,message:'Use at least three characters.'},maxLength:{value:80,message:'Keep the name within 80 characters.'}}}>{field=><Input {...field} disabled={pending} autoComplete="off" />}</RHFField>
      <div className="bblocks-form-grid"><RHFControl control={form.control} name="discipline" rules={{validate:value=>!!value||'Choose a discipline.'}}>{binding=><Select {...binding} label="Primary discipline" options={options} disabled={pending} clearable />}</RHFControl><RHFControl control={form.control} name="date" rules={{validate:value=>!!value||'Choose a review date.'}}>{binding=><DatePicker {...binding} label="Review date" defaultMonth={new Date(2026,9,1)} disabled={pending} />}</RHFControl></div>
      <RHFControl control={form.control} name="tags" rules={{validate:value=>value.length>0||'Choose at least one tag.'}}>{binding=><MultiSelect {...binding} label="Project tags" options={options} disabled={pending} />}</RHFControl>
      <Controller control={form.control} name="summary" render={({field})=><Switch label="Weekly summary" name={field.name} ref={field.ref} checked={field.value} onBlur={field.onBlur} onChange={event=>field.onChange(event.target.checked)} disabled={pending} />} />
      {form.formState.errors.root?.service && <Alert title="Unable to save project" tone="danger" live>{form.formState.errors.root.service.message}</Alert>}
      <div className="bblocks-heading"><p className="bblocks-note">{pending?'Saving…':form.formState.isDirty?'Unsaved changes':'Sample data. Uses the example HTTP service.'}</p><div className="bblocks-inline-actions"><Button variant="secondary" disabled={pending} onClick={()=>{form.reset(defaults);setMessage('');}}>Reset form</Button><Button type="submit" loading={pending} disabled={!repository}>Save project</Button></div></div>
    </form><p role="status" className="bblocks-status">{message || (rejectNext?'The next save will be rejected once.':'')}</p>
  </section>;
}
