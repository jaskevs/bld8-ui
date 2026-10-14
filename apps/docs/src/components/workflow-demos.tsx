'use client';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button,EditableCell,Input} from '@bld8/ui';
import {RHFField} from '@bld8/ui/react-hook-form';
export function EditableCellDemo(){const [name,setName]=useState('Sensible defaults');return <EditableCell label="example project name" value={name} validate={value=>value.trim().length<3?'Use at least three characters.':undefined} onSave={async value=>setName(value.trim())} />;}
export function RHFNativeDemo(){const form=useForm({defaultValues:{name:''}});const [saved,setSaved]=useState(false);return <form className="stack" noValidate onSubmit={form.handleSubmit(()=>setSaved(true))}><RHFField control={form.control} name="name" label="RHF project name" rules={{required:'Enter a project name.'}}>{field=><Input {...field} onChange={event=>{field.onChange(event);setSaved(false);}} />}</RHFField><Button type="submit">Validate form</Button><p role="status" className="bui-hint">{saved?'Form validated in this preview.':''}</p></form>;}
