import Link from 'next/link';
import { Icon } from '@bld8/ui';
import { SettingsExample } from '@/components/demos';
import { SelectionStudy } from '@/components/motion-studies';

export default function Home() {
  return <div className="page">
    <section className="home-hero"><div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> BLD8 UI / FIRST EDITION</p><h1>Details that<br /><span>work together.</span></h1><p className="lead">React components for clear, considered interfaces. Quiet surfaces, useful states and a shared sense of motion.</p><div className="actions"><Link href="/components" className="bui-button bui-button--primary">Explore components <Icon /></Link><Link href="/motion" className="plain-link">Try the motion <Icon /></Link></div><p className="hero-footnote">React · Base UI · Plain CSS</p></div><div className="hero-study"><div className="study-label"><span>INTERFACE STUDY / 01</span><span>SELECT A STAGE</span></div><div className="hero-selection"><SelectionStudy /></div><div className="study-foot"><span>Small changes. A clear response.</span><span>01—03</span></div></div></section>
    <section className="home-features"><div><span className="eyebrow">01 / FOUNDATIONS</span><h2>A little breathing room.</h2><p>White panels, a soft grey canvas and colour where it helps you find an action.</p></div><div><span className="eyebrow">02 / INTERACTIONS</span><h2>More than the first frame.</h2><p>Focus, feedback and the movement between states are part of the component.</p></div><div><span className="eyebrow">03 / COMPOSITION</span><h2>Useful together.</h2><p>Try the components in forms, settings and a small project workspace.</p></div></section>
    <section className="home-example"><div className="section-title"><div><p className="eyebrow">IN CONTEXT</p><h2>The pieces, together.</h2></div><Link href="/examples" className="plain-link">Explore examples <Icon /></Link></div><SettingsExample /></section>
    <section className="notes-band"><span className="eyebrow">NOTES TO SELF</span><h2>A small detail is still a design decision.</h2><p>Keep the labels clear. Give content room. Make the next action easy to find.</p><Link href="/foundations" className="plain-link">Explore the foundations <Icon /></Link></section>
  </div>;
}