'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {Badge,Button,Field,Icon,Input,TreeSelect,type TreeSelectNode} from '@bld8/ui';
import {componentExampleCategories,componentFamilyIndex,componentExampleIndex} from '@/lib/generated/component-example-index';
import {emptyExampleFilters,normalizeExampleFilters,parseExampleFilters,exampleFiltersUrl,filterExampleEntries,type ExampleFilters} from '@/lib/example-filters';

const exampleCountLabel=(count:number)=>count+' '+(count===1?'example':'examples');
const categories=componentExampleCategories.filter(category=>category!=='All components');
const familyNodes:TreeSelectNode[]=categories.map(category=>({
  id:'family-group:'+category,label:category,
  description:'All '+componentFamilyIndex.filter(family=>family.category===category).length+' families',
  children:componentFamilyIndex.filter(family=>family.category===category).map(family=>({
    id:family.id,label:family.title,
    description:exampleCountLabel(componentExampleIndex.filter(example=>example.componentId===family.id).length),
    searchTerms:[family.id,family.description],
  })),
}));
const categoryNodes:TreeSelectNode[]=categories.map(category=>({
  id:category,label:category,
  description:exampleCountLabel(componentExampleIndex.filter(example=>componentFamilyIndex.find(family=>family.id===example.componentId)?.category===category).length),
}));

export function ExampleCatalog(){
  const [filters,setFilters]=useState<ExampleFilters>(emptyExampleFilters),[ready,setReady]=useState(false);
  const current=useRef(filters);
  useEffect(()=>{
    const restore=()=>{const next=parseExampleFilters(new URLSearchParams(window.location.search));current.current=next;setFilters(next);setReady(true);};
    restore();window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);
  },[]);
  function update(patch:Partial<ExampleFilters>,replace=false){
    const next=normalizeExampleFilters({...current.current,...patch});current.current=next;setFilters(next);
    const href=exampleFiltersUrl(window.location.href,next),previous=window.location.pathname+window.location.search+window.location.hash;
    if(href!==previous)window.history[replace?'replaceState':'pushState'](window.history.state,'',href);
  }
  const visible=filterExampleEntries(filters),dirty=!!filters.query||filters.components.length>0||filters.categories.length>0;
  return <section aria-label="Complete component examples" className="example-catalog" data-filter-ready={ready||undefined}>
    <form className="example-catalog-panel" role="search" aria-label="Filter complete examples" onSubmit={event=>event.preventDefault()} onReset={event=>{event.preventDefault();update(emptyExampleFilters);}}>
      <div className="example-catalog-filters">
        <Field label="Search examples"><Input type="search" placeholder="Search patterns, states or keyboard behavior…" maxLength={120} value={filters.query} disabled={!ready} onChange={event=>update({query:event.target.value},true)}/></Field>
        <TreeSelect label="Component families" nodes={familyNodes} value={filters.components} onValueChange={components=>update({components})} placeholder="All component families" disabled={!ready} popupDataAttributes={{'data-example-family-picker':true}}/>
        <TreeSelect label="Categories" nodes={categoryNodes} value={filters.categories} onValueChange={categories=>update({categories})} placeholder="All categories" disabled={!ready} popupDataAttributes={{'data-example-category-picker':true}}/>
      </div>
      <p className="example-catalog-help bui-hint">Choose several families or categories. Selecting a group includes every family in it.</p>
      <div className="example-catalog-results">
        <div><p className="example-catalog-count" role="status" aria-label="Example results">{visible.length} complete {visible.length===1?'example':'examples'}</p><p className="bui-hint">{filters.components.length?filters.components.length+' selected '+(filters.components.length===1?'family':'families'):'All families'} · {filters.categories.length?filters.categories.length+' selected '+(filters.categories.length===1?'category':'categories'):'All categories'}{filters.components.length>0&&filters.categories.length>0?' · Matching both filters':''}</p></div>
        <Button type="reset" size="sm" variant="ghost" disabled={!ready||!dirty}>Clear example filters</Button>
      </div>
    </form>
    <div className="example-catalog-grid">{visible.map(item=>{const family=componentFamilyIndex.find(family=>family.id===item.componentId)!;return <article key={item.id} className="example-catalog-card"><div className="bui-between"><Badge>{family.title}</Badge><span className="bui-hint">{family.category}</span></div><h2><Link href={item.documentationPath}>{item.title}<Icon/></Link></h2><p>{item.description}</p><p className="bui-hint">{item.states.slice(0,2).join(' · ')}</p><Link className="plain-link" href={item.documentationPath}>Preview, source and install <Icon/></Link></article>;})}</div>
    {!visible.length&&<div className="no-results"><h2>No matching examples.</h2><p>Try a broader term or another combination of families and categories.</p><div className="actions">{filters.categories.length>0&&filters.components.length>0&&<Button variant="secondary" size="sm" onClick={()=>update({categories:[]})}>Clear category selection</Button>}<Button variant="ghost" size="sm" onClick={()=>update(emptyExampleFilters)}>Clear all filters</Button></div></div>}
  </section>;
}
