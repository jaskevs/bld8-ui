import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Breadcrumb, Icon } from '@bld8/ui';
import { components, findComponent } from '@/lib/catalog';
import { ComponentDemo } from '@/components/demos';
import { PropTable } from '@/components/prop-table';
import { api } from '@/lib/generated/api';
import { playgroundHref } from '@/lib/playground-state';
import { siteUrl } from '@/lib/site';
import { CodeBlock } from '@/components/code-block';
export function generateStaticParams() { return components.map(component => ({id:component.id})); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { const item = findComponent((await params).id); return { title: item?.title || 'Component not found' }; }
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const item = findComponent((await params).id); if (!item) notFound();
  const index = components.indexOf(item); const next = components[(index + 1) % components.length];
  return <div className="page detail-page"><Breadcrumb items={[{label:'Components',href:'/components'},{label:item.title}]} /><header className="page-intro"><Badge>{item.category}</Badge><h1>{item.title}.</h1><p className="lead">{item.description}</p></header><section className="detail-preview" aria-label={item.title + ' live preview'}><div className="preview-label"><span className="eyebrow">LIVE PREVIEW</span><span>Try it. It works.</span></div><div className={'detail-demo' + (['table','advanced-table','sidebar','timeline','filter-builder','kanban','stepper'].includes(item.id) ? ' full-width' : '')}><ComponentDemo id={item.id} /></div></section><section className="detail-section"><h2>Install the source</h2><CodeBlock code={`npx shadcn@latest add ${siteUrl}/r/${item.id}.json`} /><p><Link href="/registry">Registry setup</Link> · <Link href={playgroundHref(item.id)}>Open the playground</Link></p></section><section className="detail-section"><h2>Usage</h2><CodeBlock code={item.code} /><p className="muted">In the workspace or ZIP starter, import components from <code>@bld8/ui</code> and include <code>@bld8/ui/styles.css</code> once. Registry installations use your local <code>bld8/</code> source path. Wrap overlays in <code>UIProvider</code>.</p></section><section className="detail-section"><h2>API & behaviour</h2><p>{item.notes}</p><PropTable sections={api[item.id as keyof typeof api] ?? []} /></section><section className="detail-section"><h2>Notes to self</h2><p>Test this component with real content, keyboard input and both themes. The example is a starting point; labels, error handling and behaviour still need to fit the application.</p></section><nav className="detail-next" aria-label="More components"><Link className="plain-link" href="/components">All components</Link><Link className="plain-link" href={'/components/' + next.id}>{next.title} <Icon /></Link></nav></div>;
}