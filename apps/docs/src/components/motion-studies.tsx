'use client';

import { useEffect, useRef, useState } from 'react';
import { Accordion, Badge, Button, Card, Dialog, DialogClose, Icon, Separator, Sheet, Switch, Tabs, useToast } from '@bld8/ui';

const stages = [
  { value: 'idea', label: 'Idea', title: 'A place to begin.', description: 'A few notes. A rough shape. Something worth trying.', count: '01', widths: [78, 48, 62] },
  { value: 'building', label: 'Building', title: 'Taking shape.', description: 'Small changes, tried together. Keep what makes it clearer.', count: '02', widths: [92, 72, 46] },
  { value: 'review', label: 'Review', title: 'Look a little closer.', description: 'Check the edges, the labels and the way it responds.', count: '03', widths: [100, 86, 70] },
];

export function SelectionStudy() {
  return <Tabs label="Study stage" items={stages.map(stage => ({
    value: stage.value,
    label: stage.label,
    content: <div className="selection-study"><div className="selection-heading"><span className="selection-number" aria-hidden="true">{stage.count}</span><Badge tone="accent">{stage.label}</Badge></div><h3>{stage.title}</h3><p>{stage.description}</p><div className="study-lines" aria-hidden="true">{stage.widths.map((width, index) => <span key={index} style={{ width: width + '%' }} />)}</div></div>,
  }))} />;
}

function PreferenceStudy() {
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('Changes stay in this preview.');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function save() {
    if (saving) return;
    setSaving(true);
    setMessage('Saving locally…');
    // A short simulated save makes the loading state available to inspect.
    timer.current = setTimeout(() => {
      setSaving(false);
      setMessage('Saved for this session.');
      toast.add({ title: 'Preference saved', description: enabled ? 'Weekly digest is on in this preview.' : 'Weekly digest is off in this preview.' });
    }, 700);
  }
  return <div className="preference-study"><div className="preference-symbol" aria-hidden="true"><span /><span /><span /></div><Switch label="Weekly digest" description="A short summary, once a week." checked={enabled} disabled={saving} onChange={event => {setEnabled(event.target.checked); setMessage('You have an unsaved change.');}} /><Separator /><Button variant="accent" onClick={save} loading={saving}>Save preference <Icon /></Button><p className="study-status" role="status">{message}</p></div>;
}

export function MotionStudies() {
  return <div className="motion-grid">
    <Card className="motion-study"><div className="study-label"><span>01 / SELECTION</span><span>TABS</span></div><div className="motion-demo"><SelectionStudy /></div><div className="motion-caption"><h2>Follow the selection.</h2><p>A single line carries your place from one tab to the next.</p></div></Card>
    <Card className="motion-study"><div className="study-label"><span>02 / FEEDBACK</span><span>SWITCH + BUTTON</span></div><div className="motion-demo"><PreferenceStudy /></div><div className="motion-caption"><h2>Change one thing.</h2><p>A settled switch. A save button that keeps its shape.</p></div></Card>
    <Card className="motion-study"><div className="study-label"><span>03 / DISCLOSURE</span><span>ACCORDION</span></div><div className="motion-demo"><Accordion items={[
      { value: 'space', title: 'Give the content room.', content: 'The panel opens from its own edge. The surrounding content moves with it, so the connection stays clear.' },
      { value: 'return', title: 'Make the return feel familiar.', content: 'Closing follows the same path. Nothing needs to jump back into place.' },
      { value: 'choice', title: 'Respect a quieter preference.', content: 'With reduced motion enabled on your device, transitions stop. The controls still work in exactly the same way.' },
    ]} /></div><div className="motion-caption"><h2>Make room.</h2><p>Content opens in place, with a gentle change in height.</p></div></Card>
    <Card className="motion-study"><div className="study-label"><span>04 / CONTEXT</span><span>DIALOG + SHEET</span></div><div className="motion-demo overlay-study"><div className="overlay-sketch" aria-hidden="true"><div /><div /><div /></div><div className="actions"><Dialog trigger={<Button>Open a dialog <Icon /></Button>} title="One thing at a time." description="A small space to make a decision."><div className="stack"><p className="demo-copy">Focus stays here while this is open. Close it to return to the button you came from.</p><DialogClose>Back to the study</DialogClose></div></Dialog><Sheet trigger={<Button variant="secondary">Open a sheet</Button>} title="Study details" description="Context without losing your place."><div className="stack"><Badge tone="accent">Interface study</Badge><p className="demo-copy">A side panel for the details that do not need a whole new page.</p><Separator /><Switch label="Follow this study" defaultChecked /><DialogClose>Done</DialogClose></div></Sheet></div></div><div className="motion-caption"><h2>A little more context.</h2><p>Overlays arrive softly and leave promptly. Focus returns with them.</p></div></Card>
  </div>;
}