export const choiceExamples = [
  {
    id:'select-rich-options',componentId:'select',title:'Grouped choices with stable values',
    description:'Icons and descriptions explain each choice while forms keep the canonical ID.',
    keyboard:['Open the list with Enter or Space.','Arrow keys move between enabled choices; type a label for typeahead.','Enter selects; Escape closes and returns focus to the trigger.'],
    states:['controlled value','controlled popup','groups','icons','descriptions','disabled option','native form','clearable'],
    source:`'use client';
import { useRef, useState } from 'react';
import { Archive, Cloud, Server } from 'lucide-react';
import { Button, Select, type Option } from '@bld8/ui';

const targets: Option[] = [
  { value: 'cluster-preview', label: 'Preview cluster', group: 'Delivery', icon: Cloud, description: 'Quick checks before a release.' },
  { value: 'cluster-primary', label: 'Primary cluster', group: 'Delivery', icon: Server, description: 'The production destination.' },
  { value: 'cluster-archive', label: 'Archive cluster', group: 'History', icon: Archive, description: 'Kept for existing deployments.', disabled: true }

];
export default function GroupedSelectExample() {
  const [value, setValue] = useState<string | null>('cluster-preview');
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState('Not submitted');
  const trigger = useRef<HTMLButtonElement>(null);
  return <form aria-label="Deployment selection example" onSubmit={event => {
    event.preventDefault(); setSubmitted(String(new FormData(event.currentTarget).get('deployment') ?? ''));
  }} style={{ display: 'grid', gap: 16, maxWidth: 440 }}>
    <Select label="Deployment target" name="deployment" options={targets} value={value} onValueChange={setValue}
      open={open} onOpenChange={setOpen} inputRef={trigger} clearable hint="The submitted value is a cluster ID." />
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button variant="secondary" onClick={() => { trigger.current?.focus(); setOpen(true); }}>Open target list</Button>
      <Button type="submit">Read deployment value</Button>
    </div>
    <output aria-label="Deployment form value">{submitted}</output>
  </form>;
}`
  },
  {
    id:'select-empty-validation',componentId:'select',title:'Empty choices and validation',
    description:'Show the unavailable state, load choices explicitly and retain useful field feedback.',
    keyboard:['The empty list explains why no choice can be made.','After loading choices, use normal select keyboard navigation.','The managed field remains disabled and cannot change.'],
    states:['empty options','required','invalid','disabled field','recovery'],
    source:`'use client';
import { useState } from 'react';
import { Button, Select, type Option } from '@bld8/ui';
const destinations: Option[] = [{ value: 'edge', label: 'Edge destination' }, { value: 'batch', label: 'Batch destination' }];
export default function EmptySelectExample() {
  const [available, setAvailable] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState('Not submitted');
  return <form aria-label="Destination validation example" noValidate onSubmit={event => {
    event.preventDefault(); setAttempted(true); setSubmitted(value ?? 'Choose a destination first.');
  }} style={{ display: 'grid', gap: 16, maxWidth: 440 }}>
    <Select label="Release destination" name="destination" options={available ? destinations : []} value={value} onValueChange={setValue}
      required emptyMessage="No destinations are available." placeholder="Choose a destination"
      error={attempted && !value ? 'Choose a release destination.' : undefined}
      hint={available ? 'Choices are ready.' : 'Load the example destinations to continue.'} />
    <Select label="Managed region" options={[{ value: 'central', label: 'Central region' }]} defaultValue="central" disabled hint="Managed by the application." />
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Button variant="secondary" onClick={() => setAvailable(true)} disabled={available}>Load example destinations</Button><Button type="submit">Check destination</Button></div>
    <output aria-label="Destination validation result">{submitted}</output>
  </form>;
}`
  },
  {
    id:'combobox-canonical-options',componentId:'combobox',title:'Search rich options and submit IDs',
    description:'Search labels, descriptions or aliases without using display text as the selected value.',
    keyboard:['Type to filter labels, descriptions and search terms.','ArrowDown highlights a result; Enter commits its ID.','Escape closes the list without discarding the committed selection.'],
    states:['controlled value','stable IDs','grouped results','search aliases','custom row','native form','blur binding'],
    source:`'use client';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button, Combobox, type Option } from '@bld8/ui';
const offices: Option[] = [
  { value: 'mel-studio', label: 'Melbourne studio', group: 'Australia', icon: MapPin, description: 'City centre workspace.', searchTerms: ['victoria', 'collingwood'] },
  { value: 'syd-studio', label: 'Sydney studio', group: 'Australia', icon: MapPin, description: 'Harbour workspace.', searchTerms: ['nsw'] },
  { value: 'wlg-studio', label: 'Wellington studio', group: 'New Zealand', icon: MapPin, description: 'Waterfront workspace.', searchTerms: ['aotearoa'] }
];
export default function CanonicalComboboxExample() {
  const [value, setValue] = useState<string | null>('mel-studio');
  const [submitted, setSubmitted] = useState('Not submitted');
  const [touched, setTouched] = useState(false);
  return <form aria-label="Office search example" onSubmit={event => {
    event.preventDefault(); setSubmitted(String(new FormData(event.currentTarget).get('office') ?? ''));
  }} style={{ display: 'grid', gap: 16, maxWidth: 440 }}>
    <Combobox label="Office location" name="office" options={offices} value={value} onValueChange={setValue} clearable
      onBlur={() => setTouched(true)} hint="Try searching for victoria or waterfront."
      renderOption={option => <strong style={{ fontWeight: 500 }}>{option.label}</strong>} />
    <Button type="submit">Read office ID</Button>
    <output aria-label="Office form value">{submitted}</output>
    <p>Office field touched: {touched ? 'yes' : 'no'}</p>
  </form>;
}`
  },
  {
    id:'combobox-legacy-states',componentId:'combobox',title:'Simple strings, empty and disabled states',
    description:'Existing string items keep working alongside canonical-ID options.',
    keyboard:['The legacy field retains standard filtering and keyboard selection.','No-match feedback stays visible for an empty source.','Disabled fields keep their display value without accepting edits.'],
    states:['legacy items','uncontrolled popup','empty options','invalid','disabled'],
    source:`'use client';
import { useState } from 'react';
import { Button, Combobox } from '@bld8/ui';
export default function LegacyComboboxExample() {
  const [city, setCity] = useState<string | null>('Lisbon');
  const [submitted, setSubmitted] = useState('Not submitted');
  return <form aria-label="Legacy city selection example" onSubmit={event => {
    event.preventDefault(); setSubmitted(String(new FormData(event.currentTarget).get('city') ?? ''));
  }} style={{ display: 'grid', gap: 16, maxWidth: 440 }}>
    <Combobox label="Legacy city strings" name="city" items={['Lisbon', 'Oslo', 'Tallinn']} value={city} onValueChange={setCity} clearable />
    <Combobox label="Unavailable office" options={[]} error="No offices are configured." emptyMessage="No office choices are available." />
    <Combobox label="Managed office" options={[{ value: 'managed-office', label: 'Assigned office' }]} defaultValue="managed-office" disabled />
    <Button type="submit">Read legacy city</Button><output aria-label="Legacy city form value">{submitted}</output>
  </form>;
}`
  },
  {
    id:'multi-select-grouped-reviewers',componentId:'multi-select',title:'Grouped reviewers with controlled opening',
    description:'Keep selected IDs while searching groups and removing individual choices.',
    keyboard:['Type a name, description or alias to narrow the list.','Arrow keys and Enter choose an enabled reviewer.','Use each chip removal action or Backspace when the input is empty; Escape closes options first.'],
    states:['controlled value','controlled popup','groups','icons','descriptions','disabled option','native form','clear all'],
    source:`'use client';
import { useRef, useState } from 'react';
import { User } from 'lucide-react';
import { Button, MultiSelect, type Option } from '@bld8/ui';
const reviewers: Option[] = [
  { value: 'avery', label: 'Avery Stone', group: 'Contributors', icon: User, description: 'Quality review.', searchTerms: ['qa'] },
  { value: 'jules', label: 'Jules Park', group: 'Contributors', icon: User, description: 'Product review.' },
  { value: 'noor', label: 'Noor Sethi', group: 'Owners', icon: User, description: 'Unavailable for new reviews.', disabled: true }
];
export default function GroupedMultiSelectExample() {
  const [value, setValue] = useState<string[]>(['avery']);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState('Not submitted');
  const input = useRef<HTMLInputElement>(null);
  return <form aria-label="Review panel example" onSubmit={event => {
    event.preventDefault(); setSubmitted(new FormData(event.currentTarget).getAll('reviewers').map(String).join(', '));
  }} style={{ display: 'grid', gap: 16, maxWidth: 440 }}>
    <MultiSelect label="Review panel" name="reviewers" options={reviewers} value={value} onValueChange={setValue}
      open={open} onOpenChange={setOpen} inputRef={input} clearable hint="The form receives reviewer IDs." />
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Button variant="secondary" onClick={() => { input.current?.focus(); setOpen(true); }}>Open reviewer list</Button><Button type="submit">Read reviewer IDs</Button></div>
    <output aria-label="Reviewer form values">{submitted}</output>
  </form>;
}`
  },
  {
    id:'multi-select-validation',componentId:'multi-select',title:'Required choices and field errors',
    description:'Keep validation explicit and preserve selected values while the field recovers.',
    keyboard:['Submit to show the field error and focus the input.','Choose an option with ArrowDown and Enter.','Remove a choice with its labelled chip action; disabled managed choices stay unchanged.'],
    states:['required','invalid','recovery','disabled field','compact density'],
    source:`'use client';
import { useRef, useState } from 'react';
import { Button, MultiSelect, type Option } from '@bld8/ui';
const reviewers: Option[] = [{ value: 'erin', label: 'Erin Vale' }, { value: 'tomas', label: 'Tomas Reed' }];
export default function ValidatedMultiSelectExample() {
  const [value, setValue] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState('Not submitted');
  const input = useRef<HTMLInputElement>(null);
  return <form aria-label="Required reviewers example" noValidate onSubmit={event => {
    event.preventDefault(); setAttempted(true);
    if (!value.length) { setSubmitted('Choose a reviewer first.'); input.current?.focus(); }
    else setSubmitted(new FormData(event.currentTarget).getAll('requiredReviewers').map(String).join(', '));
  }} style={{ display: 'grid', gap: 16, maxWidth: 440 }}>
    <MultiSelect label="Required reviewers" name="requiredReviewers" options={reviewers} value={value} onValueChange={setValue} inputRef={input}
      required density="compact" error={attempted && !value.length ? 'Choose at least one reviewer.' : undefined} hint="One or more reviewers are required." />
    <MultiSelect label="Managed review panel" options={reviewers} defaultValue={['tomas']} disabled />
    <Button type="submit">Check reviewers</Button><output aria-label="Required reviewer form values">{submitted}</output>
  </form>;
}`
  }
  ,{
    id:'choice-native-form-reset',componentId:'select',title:'External forms and native reset',
    description:'Associate choices with a separate form. Native reset restores uncontrolled defaults; the application owns controlled values.',
    keyboard:['Choose a different value with the normal list keyboard controls.','Submit reads the canonical IDs from the external form.','Reset restores uncontrolled defaults without reporting a user change.'],
    states:['external form','required','uncontrolled defaults','native reset','controlled reset ownership'],
    source:`'use client';
import { useId, useState } from 'react';
import { Button, Combobox, MultiSelect, Select, type Option } from '@bld8/ui';
import '@bld8/ui/styles.css';
const choices: Option[] = [{ value: 'alpha-id', label: 'Alpha environment' }, { value: 'beta-id', label: 'Beta environment' }];
export default function ExternalChoiceFormExample() {
  const formId = useId();
  const [controlled, setControlled] = useState<string | null>('alpha-id');
  const [changes, setChanges] = useState(0);
  const [result, setResult] = useState('Not submitted');
  const changed = () => setChanges(count => count + 1);
  return <div style={{ display: 'grid', gap: 16, maxWidth: 440 }}>
    <Select label="Resettable environment" name="nativeSelect" form={formId} options={choices} defaultValue="alpha-id" required onValueChange={changed} />
    <Combobox label="Resettable search" name="nativeCombo" form={formId} options={choices} defaultValue="alpha-id" required onValueChange={changed} />
    <MultiSelect label="Resettable reviewers" name="nativeMulti" form={formId} options={choices} defaultValue={['alpha-id']} required onValueChange={changed} />
    <Combobox label="Application-owned environment" name="controlledCombo" form={formId} options={choices} value={controlled} onValueChange={setControlled} />
    <form id={formId} aria-label="External choice form" onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      setResult(['nativeSelect', 'nativeCombo', 'nativeMulti', 'controlledCombo'].map(name => data.getAll(name).map(String).join(',')).join(' | '));
    }} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Button type="submit">Read external choice values</Button><Button type="reset" variant="secondary">Reset external choices</Button></div>
      <output aria-label="External choice values">{result}</output>
      <output aria-label="Choice change count">{changes}</output>
    </form>
  </div>;
}`
  },{
    id:'combobox-focus-lifecycle',componentId:'combobox',title:'Keyboard focus and popup completion',
    description:'Keep typing focus, scroll long results and close options before a parent dialog.',
    keyboard:['ArrowDown highlights an option while focus remains in the search input.','Tab and Shift+Tab leave the search naturally; Escape restores the committed label.','Inside the dialog, Escape closes options first and the dialog second.'],
    states:['controlled popup','completion callbacks','interrupted motion','long results','dialog ownership','native focus'],
    source:`'use client';
import { useRef, useState } from 'react';
import { Button, Combobox, Dialog, DialogClose, UIProvider, type Option } from '@bld8/ui';
import '@bld8/ui/styles.css';
const rooms: Option[] = Array.from({ length: 36 }, (_, index) => ({ value: 'room-' + (index + 1), label: 'Review room ' + String(index + 1).padStart(2, '0') }));
export default function ComboboxFocusLifecycleExample() {
  const [value, setValue] = useState<string | null>('room-1');
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [outside, setOutside] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  return <UIProvider><div style={{ display: 'grid', gap: 16, maxWidth: 440 }}>
    <Button variant="secondary">Before room search</Button>
    <Combobox label="Room search lifecycle" options={rooms} value={value} onValueChange={setValue} inputRef={input} open={open} onOpenChange={setOpen}
      onOpenChangeComplete={next => setCompleted(previous => [...previous, next ? 'open' : 'closed'])} clearable />
    <Button variant="secondary" onClick={() => setOutside(count => count + 1)}>After room search</Button>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Button onClick={() => { input.current?.focus(); setOpen(true); }}>Open room choices</Button><Button variant="secondary" onClick={() => setOpen(false)}>Close room choices</Button><Button variant="ghost" onClick={() => setCompleted([])}>Clear room completions</Button></div>
    <output aria-label="Room popup completions">{completed.join(', ')}</output>
    <output aria-label="Room outside actions">{outside}</output>
    <Dialog trigger={<Button variant="secondary">Open room dialog</Button>} title="Review room dialog" description="The search belongs to this dialog.">
      <div style={{ display: 'grid', gap: 16 }}><Combobox label="Dialog review room" options={rooms} defaultValue="room-1" /><DialogClose>Finish room selection</DialogClose></div>
    </Dialog>
  </div></UIProvider>;
}`
  }
];
