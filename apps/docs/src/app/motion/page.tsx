import Link from 'next/link';
import { Icon } from '@bld8/ui';
import { MotionStudies } from '@/components/motion-studies';

export const metadata = { title: 'Motion studies' };

export default function MotionPage() {
  return <div className="page motion-page">
    <header className="page-intro"><p className="eyebrow">MOTION STUDIES / 01—04</p><h1>Small movements.<br /><span>Clear responses.</span></h1><p className="lead">Select, switch, open and close. A few places to feel how the components respond.</p></header>
    <MotionStudies />
    <section className="motion-notes" aria-labelledby="motion-notes-title"><div><p className="eyebrow">NOTES TO SELF</p><h2 id="motion-notes-title">A shared rhythm.</h2><p>Quick feedback. A little more time for movement. No loops, bouncing panels or moving targets.</p><Link href="/foundations" className="plain-link">See the foundations <Icon /></Link></div><dl className="motion-timings"><div><dt>Feedback</dt><dd>160<span>ms</span></dd></div><div><dt>Colour</dt><dd>280<span>ms</span></dd></div><div><dt>Movement</dt><dd>440<span>ms</span></dd></div></dl></section>
    <p className="page-note">These studies use the library components. Your device’s reduced-motion preference applies throughout. Saves are simulated and reset when you reload.</p>
  </div>;
}