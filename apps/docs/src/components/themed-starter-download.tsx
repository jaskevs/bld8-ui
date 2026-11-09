'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowDownToLine} from 'lucide-react';
import {Button} from '@bld8/ui';
import type {ThemeConfig,ThemeMode} from '@bld8/ui/theme-config';
import {starterHref,type StarterFramework} from '@/lib/starter-options';

export function ThemedStarterDownload({id,framework,config,mode}:{id:string;framework:StarterFramework;config:ThemeConfig;mode:ThemeMode}){
  const href=starterHref(id,framework,config,mode),pending=useRef<AbortController|null>(null);
  const [loading,setLoading]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState(false);
  useEffect(()=>{pending.current?.abort();pending.current=null;setLoading(false);setNotice('');return()=>pending.current?.abort();},[href]);
  async function download(){
    if(!href||pending.current)return;
    const controller=new AbortController();pending.current=controller;setLoading(true);setNotice('');setError(false);
    let url:string|undefined;
    try{
      const response=await fetch(href,{signal:controller.signal});
      if(!response.ok)throw Error('Download unavailable');
      const blob=await response.blob();if(controller.signal.aborted||pending.current!==controller)return;
      if(blob.size>16*1024*1024||!response.headers.get('content-type')?.startsWith('application/zip'))throw Error('Invalid download');
      url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=id+'-'+framework+'-themed.zip';document.body.appendChild(anchor);anchor.click();anchor.remove();setNotice('Starter download started.');
    }catch{
      if(!controller.signal.aborted&&pending.current===controller){setError(true);setNotice('Could not prepare the starter. Please try again.');}
    }finally{
      if(url){const finished=url;setTimeout(()=>URL.revokeObjectURL(finished),1000);}
      if(pending.current===controller){pending.current=null;setLoading(false);}
    }
  }
  return <div className="theme-starter-download"><Button variant="accent" leadingIcon={ArrowDownToLine} disabled={!href} loading={loading} onClick={download}>Download starter</Button><p role="status" aria-live="polite" className="bui-hint" data-error={error||undefined}>{notice||(!id?'Choose a block or template to begin.':'Includes your theme and selected fonts.')}</p></div>;
}
