import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';
import localFont from 'next/font/local';
import { UIProvider } from '@bld8/ui';
import { SiteHeader } from '@/components/site-header';
import '@bld8/ui/styles.css';
import '@bld8/blocks/styles.css';
import './globals.css';
import './library.css';
import './icons.css';
import './playground.css';
const display = localFont({ src: '../../../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', variable: '--font-display', display: 'swap' });
const body = localFont({ src: '../../../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', variable: '--font-body', display: 'swap' });
export const metadata: Metadata = { title: { default: 'BLD8 UI — Components, blocks & templates', template: '%s — BLD8 UI' }, description: 'Considered React components, working interface blocks and starter templates. Free and Premium collections, both free under MIT.', metadataBase: new URL(siteUrl), robots: { index: true, follow: true } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={display.variable + ' ' + body.variable}><body><UIProvider><div className="site-root"><a className="skip-link" href="#main">Skip to content</a><SiteHeader /><main id="main" tabIndex={-1}>{children}</main><footer className="site-footer"><a className="brand" href="/">BLD8 <span>/ ui</span></a><p>Good details, shared. Both collections are free.</p><nav aria-label="Footer navigation"><a href="/foundations">Foundations</a><a href="/examples">Examples</a><a href="/frameworks">React setups</a><a href="/community">Community</a><a href="/plans">MIT / $0</a></nav><span>React · Base UI</span></footer></div></UIProvider></body></html>;
}
