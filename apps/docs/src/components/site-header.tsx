'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button, Icon, IconButton, Tooltip } from '@bld8/ui';
import { LibrarySearch } from './library-search';

const links = [['/components', 'Components'], ['/blocks', 'Blocks'], ['/templates', 'Templates'], ['/icons', 'Icons'], ['/playground', 'Playground'], ['/themes', 'Themes'], ['/frameworks', 'React setups']];

export function SiteHeader() {
  const path = usePathname();
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 16);
    const media = window.matchMedia('(max-width: 1040px)');
    const updateViewport = () => { setMobile(media.matches); if (!media.matches) setMenuOpen(false); };
    updateScroll(); updateViewport();
    window.addEventListener('scroll', updateScroll, { passive: true });
    media.addEventListener('change', updateViewport);
    return () => { window.removeEventListener('scroll', updateScroll); media.removeEventListener('change', updateViewport); };
  }, []);

  useEffect(() => { const sync=()=>setDark(document.documentElement.dataset.uiTheme==='dark'); sync(); const observer=new MutationObserver(sync); observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-ui-theme']}); return()=>observer.disconnect(); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setMenuOpen(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [menuOpen]);

  if (path === '/themes/preview') return null;

  return <header ref={header} className="site-header" data-scrolled={scrolled}>
    <Link href="/" className="brand" aria-label="BLD8 UI home" onClick={() => setMenuOpen(false)}><span className="brand-mark" aria-hidden="true"><Icon name="mark" size={20} strokeWidth={1.6} /></span> BLD8 <span>/ ui</span></Link>
    <nav id="main-navigation" aria-label="Main navigation" data-open={menuOpen} inert={mobile && !menuOpen}>
      {links.map(([href, label]) => <Link key={href} href={href} aria-current={(path.startsWith(href) || (href === '/frameworks' && path === '/react-nextjs')) ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{label}<span className="nav-marker" aria-hidden="true" /></Link>)}
    </nav>
    <div className="header-actions">
      <LibrarySearch />
      <Button ref={menuButton} variant="ghost" size="sm" className="mobile-menu-toggle" aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(current => !current)}>Menu <span className="menu-chevron" data-open={menuOpen}><Icon name="chevron" /></span></Button>
      <Tooltip content={dark ? 'Switch to light theme' : 'Switch to dark theme'}><IconButton variant="ghost" className="theme-toggle" label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => { const next = !dark; setDark(next); document.documentElement.dataset.uiTheme = next ? 'dark' : 'light'; }}><Icon name={dark ? 'sun' : 'moon'} /></IconButton></Tooltip>
    </div>
  </header>;
}
