'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotionPreference } from '@bld8/ui';

/** Only animate content that begins below the viewport; server content stays readable. */
export function MarketingReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  const [state, setState] = useState<'visible' | 'pending'>('visible');
  const reduced = useReducedMotionPreference();

  useEffect(() => {
    const element = root.current;
    if (!element || reduced || seen.current || !('IntersectionObserver' in window)) {
      setState('visible');
      return;
    }
    if (element.getBoundingClientRect().top < window.innerHeight - 24) {
      seen.current = true;
      setState('visible');
      return;
    }
    setState('pending');
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        seen.current = true;
        setState('visible');
        observer.disconnect();
      }
    }, { rootMargin: '0px 0px -24px 0px', threshold: 0 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced]);

  return <div ref={root} className={'marketing-reveal ' + className} data-reveal={state}>{children}</div>;
}
