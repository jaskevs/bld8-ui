'use client';
import {useEffect,useRef,useState} from 'react';
import {Alert,Button} from '@bld8/ui';
import {createOutlineHttpRepository} from './outline-http.js';
import type {OutlineRepository} from './outline-repository.js';
import {OperationsTemplate} from './operations-template.js';

/** Client plumbing for the session-scoped sample API, not an authentication helper. */
export function useOutlineDemoRepository(baseUrl='/api/outline'){
  const [repository,setRepository]=useState<OutlineRepository|null>(null);
  const [rejectNext,setRejectNext]=useState(false);const rejection=useRef(false);
  rejection.current=rejectNext;
  useEffect(()=>{
    let token:string;
    try{const stored=sessionStorage.getItem('bld8-outline-http-session');token=stored && /^[a-zA-Z0-9-]{16,80}$/.test(stored)?stored:crypto.randomUUID();sessionStorage.setItem('bld8-outline-http-session',token);}catch{token=crypto.randomUUID();}
    const transport:typeof fetch=(input,init)=>{
      const headers=new Headers(init?.headers);
      if(rejection.current && init?.method && init.method!=='GET'){headers.set('X-Outline-Demo-Fail','save');rejection.current=false;setRejectNext(false);}
      return fetch(input,{...init,headers});
    };
    setRepository(createOutlineHttpRepository({baseUrl,fetch:transport,headers:{'X-Outline-Demo-Session':token}}));
  },[baseUrl]);
  return {repository,rejectNext,setRejectNext};
}
export function OutlineHttpDemo({baseUrl='/api/outline'}:{baseUrl?:string}){
  const {repository,rejectNext,setRejectNext}=useOutlineDemoRepository(baseUrl);
  return <div className="bblocks-root"><Alert title="Sample HTTP workspace"><p>Projects use a real JSON API with an isolated demo session. Sample server data expires after inactivity or a server restart. References and preferences use this browser.</p><Button variant="secondary" size="sm" aria-pressed={rejectNext} onClick={()=>setRejectNext(value=>!value)}>{rejectNext?'Cancel failed-save example':'Fail next save'}</Button><span role="status" className="bblocks-note">{rejectNext?'The next project change will be rejected once.':''}</span></Alert>{repository?<OperationsTemplate repository={repository} />:<p role="status">Opening the HTTP example…</p>}</div>;
}
