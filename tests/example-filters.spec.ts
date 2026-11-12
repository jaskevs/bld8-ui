import {test,expect} from '@playwright/test';
import {componentExampleIndex} from '../apps/docs/src/lib/generated/component-example-index';
import {emptyExampleFilters,normalizeExampleFilters,parseExampleFilters,exampleFiltersUrl,filterExampleEntries,type ExampleFilters} from '../apps/docs/src/lib/example-filters';

const filters=(patch:Partial<ExampleFilters>={}):ExampleFilters=>({...emptyExampleFilters,...patch});

test('example filters accept legacy links and repeated selections in stable catalogue order',()=>{
  expect(parseExampleFilters(new URLSearchParams('component=autocomplete&category=Forms&q=email'))).toEqual({query:'email',components:['autocomplete'],categories:['Forms']});
  expect(parseExampleFilters(new URLSearchParams('component=select&component=autocomplete&component=select&component=missing&category=Data&category=Forms&category=forms&category=All+components&category=missing'))).toEqual({query:'',components:['autocomplete','select'],categories:['Forms','Data']});
});

test('normalization safely ignores malformed selections without mutating host state',()=>{
  const incoming={query:'  email ',components:['missing','autocomplete',null,'autocomplete','Select'],categories:['All components','forms','Forms','missing']};
  const snapshot=structuredClone(incoming),normalized=normalizeExampleFilters(incoming);
  expect(normalized).toEqual({query:'  email ',components:['autocomplete'],categories:['Forms']});
  normalized.components.push('select');expect(incoming).toEqual(snapshot);expect(emptyExampleFilters).toEqual({query:'',components:[],categories:[]});
  for(const invalid of [undefined,null,false,42,[],{query:17,components:'autocomplete',categories:'Forms'}])expect(normalizeExampleFilters(invalid)).toEqual(emptyExampleFilters);
});

test('shared filter URLs replace owned keys and preserve unrelated repeated parameters and hash',()=>{
  const state=filters({query:'  keyboard  ',components:['select','autocomplete'],categories:['Data','Forms']});
  const href=exampleFiltersUrl('https://ui.bld8.dev/components/examples?campaign=one&component=old&q=old&campaign=two&category=old#results',state);
  const url=new URL(href,'https://ui.bld8.dev');
  expect(url.pathname).toBe('/components/examples');expect(url.hash).toBe('#results');expect(url.searchParams.getAll('campaign')).toEqual(['one','two']);
  expect(url.searchParams.getAll('component')).toEqual(['autocomplete','select']);expect(url.searchParams.getAll('category')).toEqual(['Forms','Data']);
  expect(parseExampleFilters(url.searchParams)).toEqual({query:'keyboard',components:['autocomplete','select'],categories:['Forms','Data']});
  expect(exampleFiltersUrl(href,parseExampleFilters(url.searchParams))).toBe(href);
  const cleared=new URL(exampleFiltersUrl(href,emptyExampleFilters),'https://ui.bld8.dev');
  for(const key of ['q','component','category'])expect(cleared.searchParams.has(key)).toBe(false);
  expect(cleared.searchParams.getAll('campaign')).toEqual(['one','two']);expect(cleared.hash).toBe('#results');
});

test('query length stays bounded in parsing, normalization and shared URLs',()=>{
  const query='x'.repeat(240),expected='x'.repeat(120);
  expect(parseExampleFilters(new URLSearchParams({q:query})).query).toBe(expected);
  expect(normalizeExampleFilters({query}).query).toBe(expected);
  expect(new URL(exampleFiltersUrl('/components/examples',filters({query})),'https://ui.bld8.dev').searchParams.get('q')).toBe(expected);
});

test('multiple families and categories match alternatives within each selection',()=>{
  const selected=filterExampleEntries(filters({components:['autocomplete','select']}));
  expect(new Set(selected.map(example=>example.componentId))).toEqual(new Set(['autocomplete','select']));
  expect(selected).toContainEqual(expect.objectContaining({id:'autocomplete-email'}));
  const categories=filterExampleEntries(filters({categories:['Forms','Data']}));
  expect(categories).toContainEqual(expect.objectContaining({componentId:'autocomplete'}));
  expect(categories).toContainEqual(expect.objectContaining({componentId:'chart'}));
  expect(categories.some(example=>example.componentId==='button')).toBe(false);
});

test('families, categories and every query term narrow results together',()=>{
  const selected=filterExampleEntries(filters({components:['button','autocomplete','chart'],categories:['Forms']}));
  expect(selected.length).toBeGreaterThan(0);expect(new Set(selected.map(example=>example.componentId))).toEqual(new Set(['autocomplete']));
  expect(filterExampleEntries(filters({components:['autocomplete'],query:'--autocomplete_email--'})).map(example=>example.id)).toEqual(['autocomplete-email']);
  expect(filterExampleEntries(filters({components:['autocomplete'],query:'native email constraint'})).map(example=>example.id)).toEqual(['autocomplete-email']);
  expect(filterExampleEntries(filters({components:['autocomplete'],query:'keyboard acceptance'}))).toContainEqual(expect.objectContaining({id:'autocomplete-search'}));
  expect(filterExampleEntries(filters({components:['autocomplete'],categories:['Data']}))).toEqual([]);
  expect(filterExampleEntries(filters({query:'not-a-real-pattern-404'}))).toEqual([]);
});

test('empty or stale selections recover the complete catalogue',()=>{
  expect(filterExampleEntries(emptyExampleFilters)).toEqual(componentExampleIndex);
  expect(filterExampleEntries(filters({components:['removed-family'],categories:['All components']}))).toEqual(componentExampleIndex);
});
