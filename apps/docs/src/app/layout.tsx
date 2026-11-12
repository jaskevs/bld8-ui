import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';
import localFont from 'next/font/local';
import { UIProvider } from '@bld8/ui';
import { SiteHeader } from '@/components/site-header';
import '@bld8/ui/styles.css';
import '@bld8/blocks/styles.css';
import './globals.css';
import './library.css';
import './library-browse.css';
import './icons.css';
import './playground.css';
import './themes.css';
import './component-examples.css';
import './marketing.css';
const display = localFont({ src: '../../../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', variable: '--font-display', display: 'swap' });
const body = localFont({ src: '../../../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', variable: '--font-body', display: 'swap' });
export const metadata: Metadata = { title: { default: 'BLD8 UI — Components, blocks & templates', template: '%s — BLD8 UI' }, description: 'React components, editable data grids and interface starters with keyboard interaction and shared motion. Free MIT-licensed source for Next.js and Vite.', metadataBase: new URL(siteUrl), robots: { index: true, follow: true } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={display.variable + ' ' + body.variable}><body><UIProvider><div className="site-root"><a className="skip-link" href="#main">Skip to content</a><SiteHeader /><main id="main" tabIndex={-1}>{children}</main><footer className="site-footer"><div className="footer-intro"><a className="brand" href="/">BLD8 <span>/ ui</span></a><p>React components and workflows.<br />Free source, under MIT.</p></div><nav aria-label="Footer navigation"><div className="footer-link-group"><span>Library</span><a href="/components">Components</a><a href="/components/examples">Examples</a><a href="/blocks">Blocks</a><a href="/templates">Templates</a><a href="/icons">Icons</a></div><div className="footer-link-group"><span>Documentation</span><a href="/docs">All guides</a><a href="/getting-started">Installation</a><a href="/themes">Themes</a><a href="/releases">Source updates</a></div><div className="footer-link-group"><span>Project</span><a href="/agents">Agents &amp; MCP</a><a href="/community">Community</a><a href="/plans">Licence &amp; usage</a><a href="/playground">Playground</a></div></nav><span className="footer-platform">React · TypeScript · Base UI</span></footer></div></UIProvider></body></html>;
}
