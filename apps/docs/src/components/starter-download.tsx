'use client';
import {Button,Icon,Popover} from '@bld8/ui';
import Link from 'next/link';

export function StarterDownload({id}:{id:string}) {
  return <Popover title="Choose a starter" trigger={<Button variant="ghost" size="sm">Download starter <Icon name="chevron" /></Button>}><div className="starter-download-options"><a href={'/downloads/'+id+'.zip'} download><span><strong>Next.js</strong><small>App Router starter · port 3000</small></span><Icon /></a><a href={'/downloads/'+id+'-vite.zip'} download><span><strong>React + Vite</strong><small>Client app starter · port 5173</small></span><Icon /></a><Link href={'/themes?starter='+encodeURIComponent(id)}><span><strong>Use your own theme</strong><small>Preview colours, type and spacing</small></span><Icon/></Link></div></Popover>;
}
