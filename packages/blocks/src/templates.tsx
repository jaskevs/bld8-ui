'use client';
import { useId, useState } from 'react';
import { Badge, Button, Dialog, Icon } from '@bld8/ui';
import { AccountSettings } from './account-settings.js';
import { SignInForm } from './sign-in.js';
import { ProjectBoard } from './project-board.js';
import { TeamDirectory } from './team.js';
import { WorkspaceOverview } from './workspace.js';

export function StudioTemplate() {
  const [view,setView] = useState('Overview');
  return <div className="bblocks-studio"><aside className="bblocks-studio-sidebar"><a href="#" onClick={event => {event.preventDefault();setView('Overview');}} className="bblocks-wordmark"><span aria-hidden="true">✳</span> Studio</a><p className="bblocks-kicker">YOUR WORKSPACE</p><nav aria-label="Studio sections">{['Overview','Projects','People','Settings'].map(label => <Button key={label} variant={label === view ? 'primary' : 'ghost'} aria-pressed={label === view} onClick={() => setView(label)}>{label}</Button>)}</nav><p className="bblocks-note">A working interface starter.<br />All data is illustrative.</p></aside><div className="bblocks-studio-main"><div className="bblocks-studio-top"><span>{view}</span><Badge tone="accent">Sample workspace</Badge></div>{view === 'Overview' && <WorkspaceOverview />}{view === 'Projects' && <ProjectBoard />}{view === 'People' && <TeamDirectory />}{view === 'Settings' && <AccountSettings />}</div></div>;
}
export function LaunchTemplate() {
  const prefix = useId();
  return <div className="bblocks-launch"><header><a className="bblocks-wordmark" href={'#' + prefix + '-top'}><span aria-hidden="true">✳</span> Gather</a><a href={'#' + prefix + '-details'}>The details <Icon /></a></header><section className="bblocks-launch-hero" id={prefix + '-top'}><div><p className="bblocks-kicker">LESS NOISE. MORE ROOM.</p><h2>A calmer place<br />for your next idea.</h2><p>Bring the work, people and small decisions into one clear workspace.</p><Dialog title="Try the sign-in form" description="This starter includes an interface, not an authentication service." trigger={<Button>Try the demo <Icon /></Button>}><SignInForm /></Dialog><span className="bblocks-note">An illustrative product, built with BLD8 UI.</span></div><div className="bblocks-launch-sketch" aria-hidden="true"><div><span className="bblocks-kicker">THE WEEK, AT A GLANCE</span><strong>A little progress.</strong><div className="bblocks-sketch-row"><span>Navigation study</span><Badge tone="accent">In progress</Badge></div><div className="bblocks-sketch-row"><span>First ideas</span><Badge tone="success">Done</Badge></div><div className="bblocks-sketch-row"><span>Next conversation</span><Badge>Planned</Badge></div></div></div></section><section className="bblocks-launch-features" id={prefix + '-details'}>{[['01','Keep the work in view.','A clear overview without the clutter.'],['02','Make room for people.','A shared space with considered controls.'],['03','Let the details settle.','Typography, spacing and motion in a common rhythm.']].map(([number,title,copy]) => <article key={number}><span className="bblocks-kicker">{number} / THE DETAILS</span><h3>{title}</h3><p>{copy}</p></article>)}</section><footer>Gather / an interface starter <span>Made with BLD8 UI</span></footer></div>;
}
