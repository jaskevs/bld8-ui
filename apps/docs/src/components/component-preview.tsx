'use client';
import {useEffect,useState} from 'react';
import {ComponentDemo} from './demos';
/** Keep the rendered layout while native fields wait for their client handlers. */
export function ComponentPreview({id,fullWidth=false}:{id:string;fullWidth?:boolean}){
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  return <div className={'detail-demo'+(fullWidth?' full-width':'')} inert={!ready||undefined} aria-hidden={!ready||undefined} aria-busy={!ready||undefined}><ComponentDemo id={id}/></div>;
}
