import {componentExampleCategories,componentExampleIndex,componentFamilyIndex} from './generated/component-example-index';

export interface ExampleFilters {
  query:string;
  components:string[];
  categories:string[];
}
export const emptyExampleFilters:ExampleFilters={query:'',components:[],categories:[]};

const knownCategories=componentExampleCategories.filter(category=>category!=='All components');
const categoryNames=new Map(knownCategories.map(category=>[category.toLocaleLowerCase('en-US'),category]));
const familiesById=new Map(componentFamilyIndex.map(family=>[family.id,family]));
const strings=(value:unknown):string[]=>Array.isArray(value)?value.filter((item):item is string=>typeof item==='string'):[];
const searchText=(value:string)=>value.toLocaleLowerCase('en-US').replace(/[-_]/g,' ');

/** Canonical ordering makes repeated filter URLs stable and removes stale catalogue IDs. */
export function normalizeExampleFilters(value:unknown):ExampleFilters {
  const input=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const components=new Set(strings(input.components));
  const categories=new Set(strings(input.categories).map(category=>categoryNames.get(category.toLocaleLowerCase('en-US'))).filter((category):category is string=>category!==undefined));
  return {
    query:typeof input.query==='string'?input.query.slice(0,120):'',
    components:componentFamilyIndex.filter(family=>components.has(family.id)).map(family=>family.id),
    categories:knownCategories.filter(category=>categories.has(category)),
  };
}

/** Repeated keys add selections; existing single-family/category links remain valid. */
export function parseExampleFilters(params:URLSearchParams):ExampleFilters {
  return normalizeExampleFilters({query:params.get('q')??'',components:params.getAll('component'),categories:params.getAll('category')});
}

export function exampleFiltersUrl(href:string,filters:ExampleFilters):string {
  const url=new URL(href,'http://localhost'),values=normalizeExampleFilters(filters);
  for(const key of ['q','component','category'])url.searchParams.delete(key);
  if(values.query.trim())url.searchParams.set('q',values.query.trim());
  for(const component of values.components)url.searchParams.append('component',component);
  for(const category of values.categories)url.searchParams.append('category',category);
  return url.pathname+url.search+url.hash;
}

/** Selections within one dimension are alternatives; dimensions narrow one another. */
export function filterExampleEntries(filters:ExampleFilters){
  const values=normalizeExampleFilters(filters),components=new Set(values.components),categories=new Set(values.categories);
  const terms=searchText(values.query).trim().split(/\s+/u).filter(Boolean);
  return componentExampleIndex.filter(example=>{
    const family=familiesById.get(example.componentId);
    if(!family||(components.size&&!components.has(family.id))||(categories.size&&!categories.has(family.category)))return false;
    const haystack=searchText([example.id,example.componentId,example.title,example.description,family.title,family.category,...example.keyboard,...example.states].join(' '));
    return terms.every(term=>haystack.includes(term));
  });
}
