'use client';
import { useState } from 'react';
import { Button } from '@bld8/ui';
import { BlockRenderer } from './block-renderer';
import { CodeBlock } from './code-block';
import { StarterDownload } from './starter-download';

export function LibraryDetail({ id, component, styles }: { id:string; component:string; styles:string }) {
  const [mode,setMode] = useState('Preview');
  const [width,setWidth] = useState('Desktop');
  const [file,setFile] = useState('Component');
  return <section className="library-preview" aria-label="Block explorer"><div className="library-preview-toolbar"><div className="library-tier-filter" role="group" aria-label="Explorer view">{['Preview','Source'].map(label => <Button key={label} size="sm" variant={mode === label ? 'primary' : 'ghost'} aria-pressed={mode === label} onClick={() => setMode(label)}>{label}</Button>)}</div>{mode === 'Preview' ? <div className="library-tier-filter" role="group" aria-label="Preview width">{['Desktop','Mobile'].map(label => <Button key={label} size="sm" variant={width === label ? 'secondary' : 'ghost'} aria-pressed={width === label} onClick={() => setWidth(label)}>{label}</Button>)}</div> : <div className="library-tier-filter" role="group" aria-label="Source file">{['Component','Styles'].map(label => <Button key={label} size="sm" variant={file === label ? 'secondary' : 'ghost'} aria-pressed={file === label} onClick={() => setFile(label)}>{label}</Button>)}</div>}<StarterDownload id={id} /></div>{mode === 'Preview' ? <div className="library-preview-canvas"><div className="library-preview-frame" data-width={width}><BlockRenderer id={id} /></div><p className="library-preview-note">{id==='outline'?'Live interface · sample data · saved in this browser':id==='issue-table'?'Sample issues · views saved in this browser':id==='session-setup'?'Sample preferences · drafts stay in this tab':'Live interface · sample data · state resets on reload'}</p></div> : <div className="library-source"><CodeBlock code={file === 'Component' ? component : styles} /></div>}</section>;
}
