import {library} from './library';
import {serializeThemeConfig,type ThemeConfig,type ThemeMode} from '@bld8/ui/theme-config';

export type StarterFramework='nextjs'|'vite';
export const starterOptions=[...library.blocks,...library.templates].map(item=>({value:item.id,label:item.name}));
const ids=new Set<string>(starterOptions.map(item=>item.value));
export const isStarter=(value:unknown):value is string=>typeof value==='string'&&ids.has(value);
export function starterHref(id:string,framework:StarterFramework,config:ThemeConfig,mode:ThemeMode){
  if(!isStarter(id))return null;
  return '/api/starters/'+id+'?'+new URLSearchParams({framework,mode,theme:serializeThemeConfig(config)});
}
