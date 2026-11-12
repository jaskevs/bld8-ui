'use client';
import { useRouter } from 'next/navigation';
import {useEffect,useState} from 'react';
import { Box, Layers, LayoutTemplate, Search, Shapes } from 'lucide-react';
import { CommandPalette, IconButton, type CommandItem } from '@bld8/ui';
import { library } from '@/lib/library';
import {componentFamilyIndex as components,componentExampleIndex} from '@/lib/generated/component-example-index';

export function LibrarySearch() {
  const router=useRouter();const [ready,setReady]=useState(false);useEffect(()=>setReady(true),[]);
  if(!ready)return <IconButton disabled icon={Search} label="Search the library" variant="ghost"/>;
  const entry=(id:string,label:string,url:string,category:string,description:string,icon:CommandItem['icon']):CommandItem=>({id,label,category,description,icon,onSelect:()=>router.push(url)});
  const items=[
    ...componentExampleIndex.map(item=>entry('example:'+item.id,item.title,item.documentationPath,'Component example',item.description,Box)),
    ...components.map(item=>entry('component:'+item.id,item.title,'/components/'+item.id,'Component',item.description,Box)),
    ...library.blocks.map(item=>entry('block:'+item.id,item.name,'/blocks/'+item.id,'Block',item.description,Layers)),
    ...library.templates.map(item=>entry('template:'+item.id,item.name,'/templates/'+item.id,'Template',item.description,LayoutTemplate)),
    entry('documentation','Documentation','/docs','Guide','Installation, styling, workflows, licences and agents',Box),
    entry('agents','Agents and MCP','/agents','Guide','Markdown APIs, structured catalogue and local read-only MCP',Box),
    entry('releases','Source versions and updates','/releases','Guide','Retained source, installation receipts and reviewing customisations',Box),
    entry('licensing','Licence and usage','/plans','Guide','MIT source, copyright and third-party notices',Box),
    entry('frameworks','React, Vite & Next.js guide','/frameworks','Guide','Vite and Next.js starters, source installation and switching frameworks',Box),
    entry('community','Community','/community','Guide','Issues, requests and contributions; everything stays free',Box),
    entry('rhf','React Hook Form integration','/integrations/react-hook-form','Integration','Use your existing form state with BLD8',Box),
    entry('scheduling','Scheduling integration','/integrations/scheduling','Integration','Day agendas, UTC availability and recoverable bookings',Box),
    entry('large-tables','Grouped and large tables','/integrations/large-tables','Integration','Bounded scrolling, grouped pages and retained edit drafts',Box),
    entry('analytics-integration','Charts and analytics integration','/integrations/analytics','Integration','Reporting periods, explorable charts, exact data and abortable requests',Box),
    entry('file-browser-integration','File browser integration','/integrations/file-browser','Integration','Tree navigation, metadata and abortable folder loading',Box),
    entry('session-setup','Session setup integration','/integrations/session-setup','Integration','Multi-step drafts, locale-aware fields and recoverable saves',Box),
    entry('tasks','Task workspace integration','/integrations/task-workspace','Integration','Kanban, backlog and abortable revision-checked saves',Box),
    entry('issues','Issue repository integration','/integrations/issues','Integration','Advanced filters, shared views and an HTTP contract',Box),
    entry('http','Outline HTTP example','/examples/outline-http','Example','Project workflows over a real JSON API',Box),
    entry('registry','Install from the registry','/registry','Guide','Add editable source with the shadcn CLI',Box),
    entry('themes','Theme lab','/themes','Tools','Customise colour, type, shape and spacing; export portable CSS',Shapes),
    entry('playground','Component playground','/playground','Tools','Configure variants, states and matching code',Shapes),
    entry('icons','Icon directory','/icons','Foundation','Browse the Lucide icon family',Shapes),
    entry('guide','Usage guide','/getting-started','Guide','Install, run and adapt the source',Box),
  ];
  return <CommandPalette shortcut={ready} title="Search the library" items={items} trigger={<IconButton disabled={!ready} icon={Search} label="Search the library" variant="ghost" />} />;
}
