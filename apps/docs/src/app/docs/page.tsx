import Link from 'next/link';
import { Icon } from '@bld8/ui';

export const metadata = {
  title: 'Documentation',
  description: 'Install BLD8 UI, customise its styles and connect React workflows. Guides for developers and coding tools.',
};

const groups = [
  { id: 'start', title: 'Start building', description: 'Install a control or run an interface starter.', links: [
    ['/components/examples', 'Complete component examples', 'Search focused patterns, inspect behavior and install the exact example.'],
    ['/getting-started', 'Installation', 'Source installs, local development and starter downloads.'],
    ['/frameworks', 'React, Vite and Next.js', 'Choose a framework and understand client boundaries.'],
    ['/registry', 'Registry', 'Install components and their dependencies with the shadcn CLI.'],
    ['/releases', 'Source versions and updates', 'Retained releases, installation receipts and reviewing customisations.'],
  ] },
  { id: 'design', title: 'Style and interaction', description: 'Understand the foundations and adjust them for your application.', links: [
    ['/foundations', 'Foundations', 'Tokens, typography, spacing and component structure.'],
    ['/themes', 'Themes', 'Preview colours and fonts, export CSS or download a themed starter.'],
    ['/motion', 'Motion', 'Shared easing, feedback and reduced-motion behaviour.'],
    ['/icons', 'Icons', 'Search Lucide icons and copy licensed SVG or React usage.'],
  ] },
  { id: 'workflows', title: 'Connect a workflow', description: 'Working examples with explicit service contracts.', links: [
    ['/docs/application-foundations', 'Application foundations', 'Generic workspaces, scoped configuration, dates, large grids, charts and motion.'],
    ['/examples/data-workspace', 'Editable data workspace', 'Review drafts, save batches and recover from conflicts.'],
    ['/integrations/react-hook-form', 'React Hook Form', 'Connect existing form state, errors and focus handling.'],
    ['/integrations/uploads', 'Upload workflows', 'Byte progress, cancellation and server acknowledgements.'],
    ['/examples', 'More examples', 'Explore tables, dates, scheduling and application workflows.'],
  ] },
  { id: 'reference', title: 'Reference and contribution', description: 'Find the contracts, licence terms and ways to help.', links: [
    ['/agents', 'Agents and MCP', 'Markdown APIs, structured discovery and optional local read-only MCP.'],
    ['/playground', 'Playground', 'Configure component states and copy matching examples.'],
    ['/plans', 'Licence and usage', 'MIT permissions, copyright and third-party attribution.'],
    ['/community', 'Community', 'Report issues, request useful patterns or contribute.'],
  ] },
] as const;

export default function Page() {
  return <div className="page detail-page docs-index">
    <header className="page-intro"><p className="eyebrow">DOCUMENTATION</p><h1>From install<br /><span>to interaction.</span></h1><p className="lead">Choose a component, run its example and connect your application. These guides cover the source, styling and service contracts.</p><div className="actions"><Link href="/getting-started" className="bui-button bui-button--primary">Install your first component <Icon /></Link><Link href="/components" className="plain-link">Browse components <Icon /></Link></div></header>
    <nav className="actions docs-index-sections" aria-label="Documentation sections">{groups.map(group => <a key={group.id} className="plain-link" href={'#' + group.id}>{group.title}</a>)}</nav>
    {groups.map(group => <section id={group.id} key={group.id} className="detail-section"><div className="section-title"><div><h2>{group.title}</h2><p>{group.description}</p></div></div><div className="framework-grid">{group.links.map(([href, title, description]) => <article key={href} className="framework-panel"><h3><Link className="plain-link" href={href}>{title} <Icon /></Link></h3><p>{description}</p></article>)}</div></section>)}
  </div>;
}
