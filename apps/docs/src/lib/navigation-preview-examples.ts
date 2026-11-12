/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const navigationPreviewExamples = [
  {
    id: 'navigation-product', componentId: 'navigation-menu', title: 'Product navigation with shared flyouts',
    description: 'Move between product links and learning resources. Real links retain their destinations, and the current page is marked separately from the open flyout.',
    keyboard: ['Tab reaches the navigation. Arrow keys move between top-level items.', 'Enter, Space or Arrow Down opens a flyout. Tab or arrow keys reach its links.', 'Escape closes the flyout and returns focus. Selecting a destination closes it.'],
    states: ['Uncontrolled flyout', 'Current page link', 'Shared viewport resize', 'Disabled destination', 'Real section navigation'],
    source: `'use client';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, NavigationMenuGroup, NavigationMenuPopup } from '@bld8/ui/navigation-menu';
import { Layers, BarChart3, BookOpen } from 'lucide-react';

export function ProductNavigationExample() {
  return <div style={{ width: '100%', display: 'grid', gap: 24 }}>
    <NavigationMenu aria-label="Product navigation">
      <NavigationMenuList>
        <NavigationMenuItem value="product">
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuGroup label="Workspace">
              <NavigationMenuLink href="#nav-product-projects" description="Organise project records and review current work."><Layers size={16} aria-hidden="true" />Projects</NavigationMenuLink>
              <NavigationMenuLink href="#nav-product-reports" description="Inspect the weekly delivery snapshot."><BarChart3 size={16} aria-hidden="true" />Reports</NavigationMenuLink>
              <NavigationMenuLink disabled href="#nav-product-audit" description="This destination is not available in the example.">Audit log</NavigationMenuLink>
            </NavigationMenuGroup>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="learn">
          <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
          <NavigationMenuContent><NavigationMenuGroup label="Resources">
            <NavigationMenuLink href="#nav-product-guide" description="A short guide to your first project."><BookOpen size={16} aria-hidden="true" />Quick start</NavigationMenuLink>
          </NavigationMenuGroup></NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem><NavigationMenuLink href="#nav-product-plan" active>Plan</NavigationMenuLink></NavigationMenuItem>
      </NavigationMenuList>
      <NavigationMenuPopup popupProps={{ 'aria-label': 'Product destinations' }} />
    </NavigationMenu>
    <div style={{ display: 'grid', gap: 12 }}>
      <section id="nav-product-projects"><strong>Projects</strong><p className="bui-hint">Create a project record, assign an owner and review its current stage.</p></section>
      <section id="nav-product-reports"><strong>Reports</strong><p className="bui-hint">The weekly delivery snapshot groups active work by stage.</p></section>
      <section id="nav-product-guide"><strong>Quick start</strong><p className="bui-hint">Start with a name, owner and target date. Save the record before sharing its link.</p></section>
      <section id="nav-product-plan"><strong>Current plan</strong><p className="bui-hint">Example destinations are sections on this page. Replace href values with your application routes.</p></section>
    </div>
  </div>;
}`,
  },
  {
    id: 'navigation-documentation', componentId: 'navigation-menu', title: 'Grouped documentation directory',
    description: 'Two columns organise installation and reference links, then collapse into a single readable column on narrow screens.',
    keyboard: ['Open Documentation with Enter or Arrow Down.', 'Tab moves through links in document order; each group keeps its visible heading.', 'Escape dismisses without changing the current-page marker.'],
    states: ['Labelled link groups', 'Responsive two-column layout', 'Current documentation page', 'Long descriptions'],
    source: `'use client';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, NavigationMenuGroup, NavigationMenuPopup } from '@bld8/ui/navigation-menu';

export function DocumentationNavigationExample() {
  return <div style={{ width: '100%', display: 'grid', gap: 24 }}>
    <NavigationMenu aria-label="Documentation directory">
      <NavigationMenuList>
        <NavigationMenuItem value="docs"><NavigationMenuTrigger>Documentation</NavigationMenuTrigger><NavigationMenuContent>
          <div className="bui-navigation-columns">
            <NavigationMenuGroup label="Start building">
              <NavigationMenuLink href="#nav-docs-install" active description="Install editable source and preserve its notices.">Installation</NavigationMenuLink>
              <NavigationMenuLink href="#nav-docs-theme" description="Set shared colour, type and spacing tokens.">Theme setup</NavigationMenuLink>
              <NavigationMenuLink href="#nav-docs-keyboard" description="Review keyboard paths and focus ownership.">Keyboard guide</NavigationMenuLink>
            </NavigationMenuGroup>
            <NavigationMenuGroup label="Reference">
              <NavigationMenuLink href="#nav-docs-api" description="Read public properties and controlled state contracts.">Component APIs</NavigationMenuLink>
              <NavigationMenuLink href="#nav-docs-versions" description="Track source changes before updating a local copy.">Source versions</NavigationMenuLink>
            </NavigationMenuGroup>
          </div>
        </NavigationMenuContent></NavigationMenuItem>
        <NavigationMenuItem value="help"><NavigationMenuTrigger>Help</NavigationMenuTrigger><NavigationMenuContent>
          <NavigationMenuLink href="#nav-docs-keyboard" description="Find the interaction used by each control.">Interaction reference</NavigationMenuLink>
        </NavigationMenuContent></NavigationMenuItem>
      </NavigationMenuList>
      <NavigationMenuPopup minWidth={280} popupProps={{ 'aria-label': 'Documentation links' }} />
    </NavigationMenu>
    <div className="bui-hint" style={{ display: 'grid', gap: 12 }}>
      <p id="nav-docs-install"><strong>Installation:</strong> add the source module, its runtime dependencies and shared CSS.</p>
      <p id="nav-docs-theme"><strong>Theme setup:</strong> use the same CSS tokens for controls and portalled overlays.</p>
      <p id="nav-docs-keyboard"><strong>Keyboard guide:</strong> preserve native links, visible focus and Escape dismissal.</p>
      <p id="nav-docs-api"><strong>Component APIs:</strong> value and defaultValue identify the open flyout; active identifies a current page link.</p>
      <p id="nav-docs-versions"><strong>Source versions:</strong> review changes against your customised copy before replacing source.</p>
    </div>
  </div>;
}`,
  },
  {
    id: 'navigation-nested', componentId: 'navigation-menu', title: 'Controlled directory with inline subnavigation',
    description: 'A controlled Library flyout contains a second menu whose grouped destinations stay in the same panel.',
    keyboard: ['Open Library, then use the Foundations or Workflows triggers inside it.', 'Tab or arrow keys enter the nested destination links.', 'Escape closes the active level; selecting a real link closes the directory.'],
    states: ['Controlled top-level value', 'Nested inline viewport', 'Uncontrolled initial subgroup', 'Disabled subgroup', 'State visible outside the panel'],
    source: `'use client';
import { useState } from 'react';
import { Button, Checkbox } from '@bld8/ui/core';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, NavigationMenuGroup, NavigationMenuPopup, NavigationMenuViewport } from '@bld8/ui/navigation-menu';

export function NestedNavigationExample() {
  const [section, setSection] = useState<string | null>(null);
  return <div style={{ width: '100%', display: 'grid', gap: 20 }}>
    <NavigationMenu aria-label="Library directory" value={section} onValueChange={setSection}>
      <NavigationMenuList><NavigationMenuItem value="library"><NavigationMenuTrigger>Library</NavigationMenuTrigger><NavigationMenuContent>
        <NavigationMenu orientation="vertical" defaultValue="foundations" className="bui-navigation-inline">
          <NavigationMenuList>
            <NavigationMenuItem value="foundations"><NavigationMenuTrigger>Foundations</NavigationMenuTrigger><NavigationMenuContent>
              <NavigationMenuGroup label="Build a foundation">
                <NavigationMenuLink href="#nav-nested-tokens" description="Shared colours, dimensions and motion.">Design tokens</NavigationMenuLink>
                <NavigationMenuLink href="#nav-nested-inputs" description="Labels, validation and native forms.">Form controls</NavigationMenuLink>
              </NavigationMenuGroup>
            </NavigationMenuContent></NavigationMenuItem>
            <NavigationMenuItem value="workflows"><NavigationMenuTrigger>Workflows</NavigationMenuTrigger><NavigationMenuContent>
              <NavigationMenuGroup label="Complete an activity">
                <NavigationMenuLink href="#nav-nested-review" description="Review records and recover failed saves.">Record review</NavigationMenuLink>
                <NavigationMenuLink href="#nav-nested-upload" description="Send files with progress and cancellation.">Upload queue</NavigationMenuLink>
              </NavigationMenuGroup>
            </NavigationMenuContent></NavigationMenuItem>
            <NavigationMenuItem value="archive"><NavigationMenuTrigger disabled>Archive</NavigationMenuTrigger></NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>
      </NavigationMenuContent></NavigationMenuItem></NavigationMenuList>
      <NavigationMenuPopup popupProps={{ 'aria-label': 'Library destinations' }} />
    </NavigationMenu>
    <p role="status">{section ? 'Open directory: Library' : 'Directory closed'}</p>
    <Button variant="secondary" onClick={() => setSection(null)} disabled={!section}>Close directory</Button>
    <div className="bui-hint" style={{ display: 'grid', gap: 12 }}>
      <p id="nav-nested-tokens">Design tokens keep surfaces, spacing and transition timing consistent.</p>
      <p id="nav-nested-inputs">Form controls connect their labels, validation messages and submitted values.</p>
      <p id="nav-nested-review">Record review keeps failed drafts available for retry.</p>
      <p id="nav-nested-upload">Upload queues expose actual progress, cancellation and per-file retry.</p>
    </div>
  </div>;
}`,
  },
  {
    id: 'navigation-boundary', componentId: 'navigation-menu', title: 'Long labels within an application panel',
    description: 'A vertical navigation keeps long labels readable and positions its flyout within the supplied application panel. Click and touch use the same triggers.',
    keyboard: ['Tab reaches each available link or trigger; disabled links are skipped.', 'Use Enter or Space to open the administration links without relying on hover.', 'Escape closes and leaves focus on the trigger.'],
    states: ['Vertical navigation', 'Custom collision boundary and portal container', 'Long labels at mobile widths', 'Disabled links', 'Current page'],
    source: `'use client';
import { useState } from 'react';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, NavigationMenuPopup } from '@bld8/ui/navigation-menu';

export function BoundedNavigationExample() {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  return <div style={{ width: '100%', display: 'grid', gap: 16 }}>
    <div ref={setBoundary} style={{ position: 'relative', minHeight: 380, padding: 12, border: '1px solid var(--bui-line)', borderRadius: 8 }}>
      <NavigationMenu aria-label="Application panel navigation" orientation="vertical" style={{ width: 260, maxWidth: '100%' }}>
        <NavigationMenuList>
          <NavigationMenuItem><NavigationMenuLink href="#nav-boundary-overview" active>Organisation overview</NavigationMenuLink></NavigationMenuItem>
          <NavigationMenuItem value="administration"><NavigationMenuTrigger>Administration and team permissions</NavigationMenuTrigger><NavigationMenuContent>
            <NavigationMenuLink href="#nav-boundary-review" description="Review who can access shared project records.">Team membership and access review</NavigationMenuLink>
            <NavigationMenuLink href="#nav-boundary-retention" description="Read the retention policy before exporting records.">Data retention and export settings</NavigationMenuLink>
            <NavigationMenuLink disabled href="#nav-boundary-identity" description="Requires an administrator role.">Identity provider configuration</NavigationMenuLink>
          </NavigationMenuContent></NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuPopup minWidth={300} portalContainer={boundary} collisionBoundary={boundary ?? undefined} collisionPadding={8} popupProps={{ 'aria-label': 'Administration destinations' }} />
      </NavigationMenu>
    </div>
    <p className="bui-hint" id="nav-boundary-overview">Organisation overview is the current page. Role checks and route access belong to the host application.</p>
    <p className="bui-hint" id="nav-boundary-review">Team access review lists the members who can read and edit shared project records.</p>
    <p className="bui-hint" id="nav-boundary-retention">Retention settings describe when records expire and which exports are available.</p>
  </div>;
}`,
  },
  {
    id: 'preview-person', componentId: 'preview-card', title: 'Person information beside a real link',
    description: 'Preview a project owner before following their link. The complete information remains in the destination section for touch, keyboard and assistive technology users.',
    keyboard: ['Tab focuses the person link; Enter follows its real destination.', 'Base UI may show a visual preview on keyboard focus after the same delay.', 'Escape dismisses a shown preview. Its supplementary content is outside the tab and screen reader order.'],
    states: ['Hover and focus timing', 'Real destination', 'Supplementary person metadata', 'No popup actions'],
    source: `'use client';
import { PreviewCard, PreviewCardTrigger, PreviewCardPopup } from '@bld8/ui/preview-card';

export function PersonPreviewExample() {
  return <div style={{ width: '100%', display: 'grid', gap: 28 }}>
    <PreviewCard>
      <p style={{ margin: 0 }}>Project owner: <PreviewCardTrigger href="#preview-person-details" delay={350} closeDelay={200}>Maya Chen</PreviewCardTrigger></p>
      <PreviewCardPopup className="person-preview">
        <div className="bui-preview-heading"><span className="bui-preview-avatar">MC</span><div><p className="bui-preview-title">Maya Chen</p><p className="bui-preview-meta">Design systems · Sydney</p></div></div>
        <p className="bui-preview-description">Maintains the shared component library and reviews interaction changes.</p>
        <div className="bui-preview-facts"><span>Owner of Atlas</span><span>UTC+11</span></div>
      </PreviewCardPopup>
    </PreviewCard>
    <section id="preview-person-details" style={{ paddingTop: 16, borderTop: '1px solid var(--bui-line)' }}><strong>Maya Chen</strong><p className="bui-hint">Design systems, Sydney (UTC+11). Maintains the shared component library, reviews interaction changes and owns the Atlas project.</p></section>
    <p className="bui-hint">Sample person data. Follow the link to read the same information; use a Popover when the popup needs actions.</p>
  </div>;
}`,
  },
  {
    id: 'preview-linked-records', componentId: 'preview-card', title: 'One preview shared by linked records',
    description: 'Detached triggers pass typed project data to a shared popup. Moving between links updates the content and viewport without mounting separate cards.',
    keyboard: ['Each project is an ordinary link in document order.', 'Enter follows the focused project destination; Escape dismisses the visual preview.', 'No project action is available only in the preview.'],
    states: ['Typed trigger payloads', 'Detached multiple triggers', 'Shared content transition', 'Different content heights', 'Complete destination content'],
    source: `'use client';
import { useState } from 'react';
import { Layers } from 'lucide-react';
import { PreviewCard, PreviewCardTrigger, PreviewCardPopup, createPreviewCardHandle } from '@bld8/ui/preview-card';

type Project = { id: string; name: string; owner: string; summary: string; status: string };
const projects: Project[] = [
  { id: 'atlas', name: 'Atlas', owner: 'Maya Chen', summary: 'Shared components, interaction guidance and editable source examples.', status: 'In review' },
  { id: 'harbour', name: 'Harbour', owner: 'Eli Morgan', summary: 'An internal record directory with saved filters, ownership review and clear recovery for failed saves. The next review focuses on narrow screens.', status: 'In progress' },
];
export function LinkedRecordPreviewExample() {
  const [handle] = useState(() => createPreviewCardHandle<Project>());
  return <div style={{ width: '100%', display: 'grid', gap: 24 }}>
    <p style={{ margin: 0 }}>Related projects: {projects.map((project, index) => <span key={project.id}>{index > 0 && ' and '}<PreviewCardTrigger handle={handle} payload={project} href={'#preview-project-' + project.id} delay={250}>{project.name}</PreviewCardTrigger></span>)}.</p>
    <PreviewCard handle={handle}>{({ payload }) => <PreviewCardPopup className="record-preview">{payload && <>
      <div className="bui-preview-heading"><span className="bui-preview-avatar"><Layers size={18} aria-hidden="true" /></span><div><p className="bui-preview-title">{payload.name}</p><p className="bui-preview-meta">{payload.status}</p></div></div>
      <p className="bui-preview-description">{payload.summary}</p><div className="bui-preview-facts"><span>Owner: {payload.owner}</span></div>
    </>}</PreviewCardPopup>}</PreviewCard>
    {projects.map(project => <section key={project.id} id={'preview-project-' + project.id}><strong>{project.name}</strong><p className="bui-hint">{project.status} · Owner: {project.owner}. {project.summary}</p></section>)}
  </div>;
}`,
  },
  {
    id: 'preview-controlled', componentId: 'preview-card', title: 'Controlled visual reference preview',
    description: 'Control the preview with an explicit trigger ID and observe its lifecycle. Outside show and hide actions demonstrate host state while the linked reference stays independently usable.',
    keyboard: ['Tab reaches the reference link and the separate show and hide actions.', 'Enter on the link navigates; Enter or Space on a preview action changes visual preview state.', 'Escape dismisses the card. Focus remains in the surrounding page.'],
    states: ['Controlled open state', 'Explicit trigger association', 'Open and close completion', 'Actions outside the popup'],
    source: `'use client';
import { useId, useState } from 'react';
import { Button, Checkbox } from '@bld8/ui/core';
import { PreviewCard, PreviewCardTrigger, PreviewCardPopup } from '@bld8/ui/preview-card';

export function ControlledReferencePreviewExample() {
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const [complete, setComplete] = useState('No transition yet');
  return <div style={{ width: '100%', display: 'grid', gap: 20 }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}><Button variant="secondary" disabled={open} onClick={() => setOpen(true)}>Show visual preview</Button><Button variant="secondary" disabled={!open} onClick={() => setOpen(false)}>Hide visual preview</Button></div>
    <PreviewCard open={open} triggerId={triggerId} onOpenChange={setOpen} onOpenChangeComplete={value => setComplete(value ? 'Preview entered' : 'Preview exited')}>
      <p style={{ margin: 0 }}>Read the <PreviewCardTrigger id={triggerId} href="#preview-controlled-reference" delay={400}>source update checklist</PreviewCardTrigger> before replacing customised files.</p>
      <PreviewCardPopup className="controlled-preview" side="bottom" collisionAvoidance={{ side: 'none', align: 'shift' }}><p className="bui-preview-title">Source update checklist</p><p className="bui-preview-description" style={{ marginTop: 8 }}>Compare local changes, retain licence notices and verify the updated interaction in your application.</p><p className="bui-preview-meta">Reference · 3 review steps</p></PreviewCardPopup>
    </PreviewCard>
    <p role="status">{open ? 'Visual preview open' : 'Visual preview closed'} · {complete}</p>
    <section id="preview-controlled-reference"><strong>Source update checklist</strong><ol className="bui-hint"><li>Compare upstream changes with your local customisations.</li><li>Retain copyright, permission and dependency notices.</li><li>Verify keyboard paths, failure recovery and responsive layout in your application.</li></ol></section>
  </div>;
}`,
  },
  {
    id: 'preview-async-reference', componentId: 'preview-card', title: 'Abortable reference metadata',
    description: 'Load optional metadata only while the preview is open. Closing or retrying cancels the previous request; recovery controls and the complete reference remain outside the popup.',
    keyboard: ['The reference link remains navigable while metadata loads or fails.', 'Use the outside Simulate failure checkbox and Retry metadata button to inspect recovery.', 'Escape closes the visual preview and cancels pending metadata.'],
    states: ['Loading', 'Resolved metadata', 'Recoverable failure', 'Abort on close and retry', 'Stale result protection', 'Host-owned service boundary'],
    source: `'use client';
import { useEffect, useState } from 'react';
import { Button, Checkbox } from '@bld8/ui/core';
import { PreviewCard, PreviewCardTrigger, PreviewCardPopup } from '@bld8/ui/preview-card';

type Metadata = { title: string; updated: string; summary: string };
function loadMetadata(signal: AbortSignal, fail: boolean): Promise<Metadata> {
  // Local timed adapter. Replace with fetch(url, { signal }) and validate the response.
  return new Promise((resolve, reject) => {
    const cancel = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      if (fail) reject(new Error('Metadata could not be loaded. The reference link still works.'));
      else resolve({ title: 'Interaction review', updated: 'Updated 12 November 2026', summary: 'Check focus entry and return, interrupted transitions and live reduced-motion settings.' });
    }, 650);
    if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true });
  });
}
export function AsyncReferencePreviewExample() {
  const [open, setOpen] = useState(false);
  const [fail, setFail] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ status: 'idle' | 'loading' | 'ready' | 'error'; data?: Metadata; error?: string }>({ status: 'idle' });
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setResult({ status: 'loading' });
    loadMetadata(controller.signal, fail).then(data => {
      if (!controller.signal.aborted) setResult({ status: 'ready', data });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ status: 'error', error: error instanceof Error ? error.message : 'Metadata unavailable.' });
    });
    return () => controller.abort();
  }, [open, fail, attempt]);
  return <div style={{ width: '100%', display: 'grid', gap: 20 }}>
    <PreviewCard open={open} onOpenChange={setOpen}>
      <p style={{ margin: 0 }}>Review the <PreviewCardTrigger href="#preview-async-reference-details" delay={300}>interaction checklist</PreviewCardTrigger> with the component change.</p>
      <PreviewCardPopup className="async-reference-preview">
        <p className="bui-preview-title">{result.data?.title ?? 'Interaction review'}</p>
        {result.status === 'loading' && <p className="bui-preview-description">Loading optional metadata…</p>}
        {result.status === 'error' && <p className="bui-preview-description">{result.error}</p>}
        {result.status === 'ready' && <><p className="bui-preview-description">{result.data?.summary}</p><p className="bui-preview-meta">{result.data?.updated}</p></>}
      </PreviewCardPopup>
    </PreviewCard>
    <Checkbox label="Simulate metadata failure" checked={fail} onCheckedChange={setFail} />
    <Button variant="secondary" onClick={() => { setAttempt(value => value + 1); setOpen(true); }}>Retry metadata</Button>
    <p className="bui-hint">Local timed sample, no network service. Preview metadata is {open ? result.status : 'closed'}.</p>
    <section id="preview-async-reference-details"><strong>Interaction review</strong><p className="bui-hint">Updated 12 November 2026. Check focus entry and return, interrupted transitions and live reduced-motion settings. Confirm that the same information remains available when a visual preview is closed or unavailable.</p></section>
  </div>;
}`,
  },
];
