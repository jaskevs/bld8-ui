import Link from 'next/link';
import { Icon } from '@bld8/ui';
import { components } from '@/lib/catalog';
import { library } from '@/lib/library';
import { LibraryCard } from '@/components/library-card';
import { iconCatalog } from '@/lib/generated/icons';
import { IconShowcaseStrip } from '@/components/icon-showcase-strip';
import { MarketingPreview, MarketingInstallCommand } from '@/components/marketing-preview';
import { MarketingReveal } from '@/components/marketing-reveal';

export default function Home() {
  return <div className="marketing-home"><div className="page marketing-page">
    <section className="marketing-hero" aria-labelledby="marketing-title">
      <p className="marketing-kicker"><span aria-hidden="true" />OPEN SOURCE. READY TO MAKE YOUR OWN.</p>
      <h1 id="marketing-title">React components.<br /><span>Built for interaction.</span></h1>
      <p className="marketing-hero-description">Forms, editable tables and complete workspaces.<br className="marketing-desktop-break" /> Try the interactions. Bring the source into your React app.</p>
      <div className="marketing-hero-actions"><Link href="/components" className="bui-button bui-button--primary">Browse components <Icon /></Link><Link href="/getting-started" className="marketing-text-link">Get started <Icon /></Link></div>
      <p className="marketing-hero-footnote"><span><Icon name="check" size={13} /> Free under MIT</span><span aria-hidden="true">·</span><span>React · Next.js · Vite</span></p>
    </section>
    <section className="marketing-product" aria-label="Interactive library preview"><MarketingPreview /></section>
    <nav className="marketing-collections" aria-label="Explore the library">{[[String(components.length), 'Component families', '/components'], [String(library.blocks.length), 'Interface blocks', '/blocks'], [String(library.templates.length), 'Runnable templates', '/templates'], [iconCatalog.length.toLocaleString('en-AU'), 'Lucide icons', '/icons']].map(([count, label, href]) => <Link key={href} href={href}><strong>{count}</strong><span>{label}</span><Icon size={15} /></Link>)}</nav>
    <MarketingReveal><section className="marketing-section" aria-labelledby="marketing-blocks-title">
      <div className="marketing-section-heading"><div><p className="eyebrow">THE PIECES, WORKING TOGETHER</p><h2 id="marketing-blocks-title">A useful starting point.<br /><span>A working flow.</span></h2></div><div><p>Connected controls for project planning, file metadata and reporting. Open a preview, try a task and inspect the source.</p><Link href="/blocks" className="marketing-text-link">Explore all blocks <Icon /></Link></div></div>
      <div className="library-grid library-grid--featured marketing-card-grid">{['project-planner', 'resources', 'analytics-dashboard'].map(id => { const item = library.blocks.find(block => block.id === id); return item ? <LibraryCard key={id} item={item} /> : null; })}</div>
    </section></MarketingReveal>
    <MarketingReveal><section className="marketing-section marketing-template-section" aria-labelledby="marketing-templates-title">
      <div className="marketing-section-heading"><div><p className="eyebrow">MORE THAN A SINGLE SCREEN</p><h2 id="marketing-templates-title">Start with the application.</h2></div><div><p>Explore complete page layouts, then download a Next.js or Vite starter with the source included.</p><Link href="/templates" className="marketing-text-link">View templates <Icon /></Link></div></div>
      <div className="library-grid marketing-card-grid marketing-template-grid">{library.templates.map(item => <LibraryCard key={item.id} item={item} kind="templates" />)}</div>
    </section></MarketingReveal>
    <MarketingReveal><section className="marketing-details" aria-label="Icons and themes">
      <article className="marketing-detail-card marketing-icon-card"><div className="marketing-detail-art"><IconShowcaseStrip /><div className="marketing-icon-measure" aria-hidden="true"><span>24 × 24</span><span>1.75 STROKE</span></div></div><div className="marketing-detail-copy"><p className="eyebrow">A CONSISTENT ICON FAMILY</p><h2>The right detail,<br />at every size.</h2><p>Search {iconCatalog.length.toLocaleString('en-AU')} Lucide icons. Adjust the size and stroke, preview them in controls, then copy the SVG or React usage.</p><Link href="/icons" className="marketing-text-link">Find an icon <Icon /></Link></div></article>
      <article className="marketing-detail-card marketing-theme-card"><div className="marketing-detail-art"><div className="marketing-theme-specimen" aria-hidden="true"><div className="marketing-theme-palette"><i /><i /><i /><i /></div><div className="marketing-theme-type"><span>Aa</span><div>Manrope<small>Headings &amp; display</small></div></div><div className="marketing-theme-tokens"><span>Colour</span><span>Type</span><span>Shape</span></div></div></div><div className="marketing-detail-copy"><p className="eyebrow">YOUR APPLICATION, YOUR TOKENS</p><h2>Make the system<br />feel like yours.</h2><p>Choose colours, typography and spacing. Test them on real controls in light and dark, then export the CSS.</p><Link href="/themes" className="marketing-text-link">Open the theme lab <Icon /></Link></div></article>
    </section></MarketingReveal>
    <MarketingReveal><section className="marketing-install" aria-labelledby="marketing-install-title"><div className="marketing-install-intro"><p className="eyebrow">EDITABLE SOURCE. YOUR CODEBASE.</p><h2 id="marketing-install-title">From the preview<br />to your project.</h2><p>Install individual components through the registry, or download a complete starter. Keep your framework and connect your own services.</p><Link href="/frameworks" className="marketing-text-link">React, Next.js &amp; Vite guide <Icon /></Link></div><div className="marketing-install-steps"><article><span className="marketing-step-number">01</span><div><h3>Find the right piece.</h3><p>Try the live example. Read its API, keyboard behaviour and integration notes.</p></div></article><article><span className="marketing-step-number">02</span><div><h3>Add the source.</h3><p>Use the registry in your React project. Or start from a runnable Next.js or Vite download.</p><MarketingInstallCommand /></div></article><article><span className="marketing-step-number">03</span><div><h3>Build it into your application.</h3><p>Change the tokens, adapt the components and connect your data. The code is yours to customise under MIT.</p></div></article></div></section></MarketingReveal>
    <MarketingReveal><section className="marketing-closing" aria-labelledby="marketing-closing-title"><span className="marketing-closing-mark" aria-hidden="true"><Icon name="mark" size={36} strokeWidth={1.4} /></span><p className="eyebrow">THE NEXT INTERFACE STARTS HERE</p><h2 id="marketing-closing-title">Find your starting point.</h2><p>One control or a complete workspace. All free under MIT.</p><div className="marketing-hero-actions"><Link href="/components" className="bui-button bui-button--primary">Browse the library <Icon /></Link><Link href="/docs" className="marketing-text-link">Read the docs <Icon /></Link></div></section></MarketingReveal>
  </div></div>;
}
