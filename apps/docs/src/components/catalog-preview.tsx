'use client';
import dynamic from 'next/dynamic';
import {useEffect,useRef,useState} from 'react';
import {ExamplePreview} from './component-examples';
const Demo=dynamic(()=>import('./demos').then(module=>module.ComponentDemo),{loading:()=> <PreviewPlaceholder/>});
const examples:Record<string,string>={"recurrence-editor":"recurrence-finite-rule","gantt":"gantt-reviewed-delivery","resource-scheduler":"resource-scheduler-recovery","product-preview":"product-preview-workflow","carousel":"carousel-native-controls","bento":"bento-product-layout","stagger":"stagger-keyed-cards","text-reveal":"text-reveal-reading-order","rating":"rating-fractional-form","phone-input":"phone-country-form","color-picker":"color-format-form","import-wizard":"import-create-reviewed-batch","mentions":"mentions-async-directory","rich-text-editor":"rich-text-review-form","scroll-area":"scroll-area-native-region","resizable-panels":"resizable-workspace-panes","stacked-bar-chart":"chart-stacked-periods","sparkline":"chart-sparkline-missing","donut-chart":"chart-donut-allocation","layout-transition":"motion-shared-selection","auto-height":"motion-intrinsic-height","animated-number":"motion-number-metric","animated-list":"motion-list-updates",autocomplete:'autocomplete-search',toolbar:'toolbar-editor-actions','alert-dialog':'alert-dialog-delete','navigation-menu':'navigation-product','preview-card':'preview-person'};
function PreviewPlaceholder(){return <div className="catalog-preview-placeholder" aria-hidden="true"><span/><span/><span/></div>;}
/** Metadata stays server-rendered. Live examples mount once, after URL restore and viewport entry. */
export function CatalogPreview({id,enabled}:{id:string;enabled:boolean}){
  const placeholder=useRef<HTMLDivElement>(null),[active,setActive]=useState(false);
  useEffect(()=>{
    const element=placeholder.current;if(!enabled||active||!element)return;
    const card=element.closest('article'),activate=()=>setActive(true);
    card?.addEventListener('focusin',activate);
    if(typeof IntersectionObserver==='undefined'){activate();return()=>card?.removeEventListener('focusin',activate);}
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){activate();observer.disconnect();}},{rootMargin:'320px'});observer.observe(element);
    return()=>{observer.disconnect();card?.removeEventListener('focusin',activate);};
  },[enabled,active]);
  return active?(examples[id]?<ExamplePreview id={examples[id]}/>:<Demo id={id}/>):<div ref={placeholder} className="catalog-preview-pending"><PreviewPlaceholder/></div>;
}
