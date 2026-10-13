'use client';
import { useMemo, useState } from 'react';
import { Button, Icon, Input } from '@bld8/ui';
import { library } from '@/lib/library';
import { LibraryCard } from './library-card';

export function LibraryCatalog({ kind }: { kind: 'blocks' | 'templates' }) {
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('All');
  const [tier,setTier] = useState('All');
  const items = library[kind];
  const categories = ['All',...new Set(items.map(item => item.category))];
  const filtered = useMemo(() => items.filter(item => (category === 'All' || item.category === category) && (tier === 'All' || item.tier === tier) && (item.name + ' ' + item.description + ' ' + item.category).toLowerCase().includes(query.toLowerCase())),[items,category,tier,query]);
  return <div className="library-layout"><aside className="library-sidebar"><p className="eyebrow">BROWSE BY USE</p><div className="library-categories" role="group" aria-label="Categories">{categories.map(label => <button key={label} type="button" aria-pressed={category === label} onClick={() => setCategory(label)}>{label}<span>{label === 'All' ? items.length : items.filter(item => item.category === label).length}</span></button>)}</div><div className="library-sidebar-note"><Icon name="plus" /><strong>Both collections. $0.</strong><p>Choose by what you need. Every preview, source file and starter is available.</p></div></aside><div className="library-results"><div className="library-toolbar"><Input type="search" value={query} onChange={e => setQuery(e.target.value)} aria-label={'Search ' + kind} placeholder={'Find a ' + (kind === 'blocks' ? 'block' : 'template') + '…'} /><div className="library-tier-filter" role="group" aria-label="Collection">{['All','Free','Premium'].map(label => <Button key={label} size="sm" variant={tier === label ? 'primary' : 'ghost'} aria-pressed={tier === label} onClick={() => setTier(label)}>{label}</Button>)}</div></div><p className="library-result-count" role="status">{filtered.length} {kind} · all free to use</p>{filtered.length ? <div className={'library-grid' + (kind === 'templates' ? ' library-grid--templates' : '')}>{filtered.map(item => <LibraryCard key={item.id} item={item} kind={kind} />)}</div> : <div className="library-empty"><Icon name="search" /><h2>Nothing here yet.</h2><p>Try a different word or collection.</p><Button variant="secondary" onClick={() => {setQuery('');setCategory('All');setTier('All');}}>Reset filters</Button></div>}</div></div>;
}
