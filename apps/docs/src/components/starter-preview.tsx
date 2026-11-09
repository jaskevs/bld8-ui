'use client';
import * as blocks from '@bld8/blocks';
import type {ComponentType} from 'react';
import {library} from '@/lib/library';

export default function StarterPreview({id}:{id:string}){
  const item=[...library.blocks,...library.templates].find(item=>item.id===id);
  if(!item)return null;
  const View=blocks[item.exportName as keyof typeof blocks] as ComponentType;
  return <section className="bblocks-root" aria-label={item.name+' preview'}><View/></section>;
}
