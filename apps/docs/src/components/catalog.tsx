'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {Badge,Button,Field,Icon,Input,Select} from '@bld8/ui';
import {categories,components} from '@/lib/catalog';
import {componentCapabilityDefinitions,componentFiltersUrl,defaultComponentFilters,filterComponents,getComponentCapabilities,parseComponentFilters,type ComponentFilters} from '@/lib/component-discovery';
import {CatalogPreview} from './catalog-preview';

export function Catalog({exampleCounts={}}:{exampleCounts?:Readonly<Record<string,number>>}) {
  const [filters,setFilters]=useState<ComponentFilters>(defaultComponentFilters),[ready,setReady]=useState(false);const latest=useRef(filters);
  useEffect(()=>{const restore=()=>{const next=parseComponentFilters(new URLSearchParams(window.location.search));latest.current=next;setFilters(next);setReady(true);};restore();window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);},[]);
  function update(patch:Partial<ComponentFilters>,replace=false){const next={...latest.current,...patch};latest.current=next;setFilters(next);const href=componentFiltersUrl(window.location.href,next),current=window.location.pathname+window.location.search+window.location.hash;if(href!==current)window.history[replace?'replaceState':'pushState'](window.history.state,'',href);}
  const visible=filterComponents(filters),examples=visible.reduce((sum,item)=>sum+(exampleCounts[item.id]??0),0),hasExamples=Object.keys(exampleCounts).length>0;
  const dirty=!!filters.query||filters.category!=='All components'||filters.capability!=='all';
  return <div className="catalog-main" data-catalog-ready={ready||undefined}>
    <form className="library-filter-panel" role="search" aria-label="Filter components" onSubmit={event=>event.preventDefault()} onReset={event=>{event.preventDefault();update(defaultComponentFilters);}}>
      <div className="library-filter-fields"><Field label="Search components"><Input type="search" aria-label="Search components" placeholder="Name, task or keyboard behaviour…" maxLength={80} value={filters.query} disabled={!ready} onChange={event=>update({query:event.target.value},true)}/></Field>
      <Select label="Category" value={filters.category} disabled={!ready} options={categories.map(category=>({value:category,label:category,description:String(category==='All components'?components.length:components.filter(component=>component.category===category).length)+' components'}))} onValueChange={value=>update({category:value as ComponentFilters['category']})}/>
      <Select label="Capability" value={filters.capability} disabled={!ready} options={[{value:'all',label:'All capabilities'},...componentCapabilityDefinitions.map(capability=>({value:capability.id,label:capability.label,description:capability.description}))]} onValueChange={value=>update({capability:value as ComponentFilters['capability']})}/></div>
      <div className="library-filter-summary"><p className="bui-hint" role="status" aria-label="Component results">{visible.length} {visible.length===1?'component':'components'}{hasExamples&&<> · {examples} {examples===1?'example':'examples'}</>}</p><Button type="reset" variant="ghost" size="sm" disabled={!ready||!dirty}>Clear component filters</Button></div>
    </form>
    <div className="component-grid">{visible.map(component=><article className={'component-card'+(['day-agenda','table','advanced-table','windowed-table'].includes(component.id)?' component-wide':'')} key={component.id}><div className="component-meta"><Badge>{component.category}</Badge><span className="component-number">{String(components.indexOf(component)+1).padStart(2,'0')}</span></div><div className={'component-preview'+(['day-agenda','windowed-table','chart','tree','timeline','filter-builder','kanban','sidebar','form','react-hook-form','advanced-table','table','stepper'].includes(component.id)?' component-preview--flow':'')}><CatalogPreview id={component.id} enabled={ready}/></div><div className="component-bottom"><div><h2><Link href={'/components/'+component.id}>{component.title}<Icon/></Link></h2><p>{component.description}</p><p className="bui-hint"><Link href={"/components/examples?component="+component.id}>Browse complete examples</Link></p><p className="bui-hint component-capabilities">{getComponentCapabilities(component.id).slice(0,3).map(id=>componentCapabilityDefinitions.find(capability=>capability.id===id)!.label).join(' · ')}{hasExamples&&<> {getComponentCapabilities(component.id).length>0?'· ':''}{exampleCounts[component.id]??0} {(exampleCounts[component.id]??0)===1?'example':'examples'}</>}</p></div></div></article>)}</div>
    {!visible.length&&<div className="no-results"><h2>No matching components.</h2><p>Try a broader search or choose another category or capability.</p><button type="button" className="plain-link" onClick={()=>update(defaultComponentFilters)}>Reset filters</button></div>}
  </div>;
}
