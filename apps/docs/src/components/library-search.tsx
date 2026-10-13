'use client';
import { useRouter } from 'next/navigation';
import { Box, Layers, LayoutTemplate, Search, Shapes } from 'lucide-react';
import { CommandPalette, IconButton, type CommandItem } from '@bld8/ui';
import { components } from '@/lib/catalog';
import { library } from '@/lib/library';

export function LibrarySearch() {
  const router=useRouter();
  const entry=(id:string,label:string,url:string,category:string,description:string,icon:CommandItem['icon']):CommandItem=>({id,label,category,description,icon,onSelect:()=>router.push(url)});
  const items=[
    ...components.map(item=>entry('component:'+item.id,item.title,'/components/'+item.id,'Component',item.description,Box)),
    ...library.blocks.map(item=>entry('block:'+item.id,item.name,'/blocks/'+item.id,'Block',item.description,Layers)),
    ...library.templates.map(item=>entry('template:'+item.id,item.name,'/templates/'+item.id,'Template',item.description,LayoutTemplate)),
    entry('icons','Icon directory','/icons','Foundation','Browse the Lucide icon family',Shapes),
    entry('guide','Usage guide','/getting-started','Guide','Install, run and adapt the source',Box),
  ];
  return <CommandPalette shortcut title="Search the library" items={items} trigger={<IconButton icon={Search} label="Search the library" variant="ghost" />} />;
}
