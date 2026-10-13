'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Icon, IconButton, Input, InputGroup, Pagination, Sheet } from '@bld8/ui';
import { iconCatalog, lucideVersion } from '@/lib/generated/icons';
import { CodeBlock } from './code-block';

const categories = ['All', ...new Set(iconCatalog.map(icon => icon.category))];
const pageSize = 72;
type Entry = typeof iconCatalog[number];
function asset(icon: Entry, stroke: number) { return `/icon-assets/${icon.name}-${stroke}.svg`; }
function Mask({ icon, size, stroke }: { icon: Entry; size: number; stroke: number }) {
  const image = `url("${asset(icon, stroke)}")`;
  return <span className="icon-mask" aria-hidden="true" style={{ width:size, height:size, maskImage:image, WebkitMaskImage:image }} />;
}

export function IconDirectory() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(iconCatalog.find(icon => icon.name === 'camera') || iconCatalog[0]);
  const [size, setSize] = useState(24);
  const [stroke, setStroke] = useState(1.75);
  const [tone, setTone] = useState('Ink');
  const [message, setMessage] = useState('');
  const [mobile, setMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => { setMobile(media.matches); if (!media.matches) setDrawerOpen(false); };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => { setMessage(''); }, [selected, stroke]);

  const filtered = useMemo(() => iconCatalog.filter(icon =>
    (category === 'All' || icon.category === category) &&
    `${icon.name} ${icon.label} ${icon.exportName}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [category, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pages);
  const code = `import { ${selected.exportName} } from 'lucide-react';\nimport { Icon, IconButton, Button } from '@bld8/ui';\n\n<Icon icon={${selected.exportName}} size={${size}} strokeWidth={${stroke}} />\n<IconButton icon={${selected.exportName}} label="${selected.label}" />\n<Button leadingIcon={${selected.exportName}}>Continue</Button>`;

  async function copySvg() {
    try {
      const response = await fetch(asset(selected, stroke));
      if (!response.ok) throw new Error('Unavailable');
      await navigator.clipboard.writeText(await response.text());
      setMessage('SVG copied, with licence notices.');
    } catch { setMessage('Unable to copy here. Use Download SVG instead.'); }
  }

  const inspector = <>
    <div className="icon-inspector-heading"><div><p className="eyebrow">THE SMALL DETAILS</p><h2>{selected.label}</h2></div><span className="collection-label">Free</span></div>
    <div className="icon-showcase" data-tone={tone}>
      <div><Mask icon={selected} size={size} stroke={stroke} /><small>Actual size</small></div>
      <div><Mask icon={selected} size={size * 2} stroke={stroke} /><small>2× detail</small></div>
    </div>
    <fieldset className="icon-controls"><legend>Preview size</legend><div>{[16,18,20,24,32].map(value => <Button key={value} size="sm" variant={size === value ? 'primary' : 'ghost'} aria-pressed={size === value} onClick={() => setSize(value)}>{value}px</Button>)}</div></fieldset>
    <fieldset className="icon-controls"><legend>Stroke width</legend><div>{[1.5,1.75,2].map(value => <Button key={value} size="sm" variant={stroke === value ? 'primary' : 'ghost'} aria-pressed={stroke === value} onClick={() => setStroke(value)}>{value}</Button>)}</div></fieldset>
    <fieldset className="icon-controls"><legend>Preview colour</legend><div>{['Ink','Muted','Accent'].map(value => <Button key={value} size="sm" variant={tone === value ? 'primary' : 'ghost'} aria-pressed={tone === value} onClick={() => setTone(value)}>{value}</Button>)}</div></fieldset>
    <div className="icon-download-actions"><Button size="sm" variant="secondary" onClick={copySvg}>Copy SVG <Icon name="copy" /></Button><a href={asset(selected, stroke)} download={selected.name + '.svg'} className="plain-link">Download SVG <Icon /></a></div>
    <p className="icon-status" role="status">{message}</p>
    <CodeBlock code={code} />
    <p className="icon-provenance">Lucide {lucideVersion} · ISC, with MIT notices for Feather-derived icons. <a href="/icon-assets/LICENSE.txt">Licence notices</a></p>
  </>;

  return <div className="icon-directory">
    <div className="icon-browser">
      <div className="icon-search">
        <InputGroup leading={<Icon icon={Search} />} trailing={<IconButton label="Clear icon search" icon={X} variant="ghost" size="sm" disabled={!query} onClick={() => { setQuery(''); setPage(1); }} />}>
          <Input type="search" aria-label="Search icons" placeholder="Find a name or a shape…" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
        </InputGroup>
        <span role="status">{filtered.length.toLocaleString('en-AU')} icons</span>
        <Button className="icon-mobile-toggle" size="sm" variant="secondary" onClick={() => setDrawerOpen(true)}>Inspect {selected.label} <Icon /></Button>
      </div>
      <div className="icon-category-filter" role="group" aria-label="Icon categories">{categories.map(label => <Button key={label} size="sm" variant={category === label ? 'primary' : 'ghost'} aria-pressed={category === label} onClick={() => { setCategory(label); setPage(1); }}>{label}</Button>)}</div>
      {filtered.length ? <>
        <div className="icon-grid">{filtered.slice((activePage - 1) * pageSize, activePage * pageSize).map(icon => <button type="button" className="icon-tile" key={icon.name} aria-pressed={selected.name === icon.name} onClick={() => { setSelected(icon); if (mobile) setDrawerOpen(true); }} title={icon.label}><Mask icon={icon} size={size} stroke={stroke} /><span>{icon.label}</span></button>)}</div>
        <Pagination label="Icon pages" page={activePage} totalPages={pages} onPageChange={setPage} />
      </> : <div className="library-empty"><Icon name="search" /><h2>No matching icons.</h2><p>Try a shorter name or another category.</p><Button variant="secondary" onClick={() => { setQuery(''); setCategory('All'); setPage(1); }}>Reset icon filters</Button></div>}
    </div>
    <aside className="icon-inspector" aria-label="Selected icon">{inspector}</aside>
    <Sheet title={selected.label} description="Preview the icon, copy its React usage or download the SVG." open={drawerOpen} onOpenChange={setDrawerOpen}><div className="icon-inspector icon-inspector--sheet">{inspector}</div></Sheet>
  </div>;
}
