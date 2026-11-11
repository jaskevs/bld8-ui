export const menuExamples = [
  {
    id: 'dropdown-actions', componentId: 'dropdown', title: 'Groups and nested actions',
    description: 'Move a record through a submenu, inspect a disabled destination and restore the example. Changes stay in this example.',
    keyboard: ['Arrow Down opens the menu. Up and Down move through enabled items.', 'Right opens Move to; Left returns to its parent. Escape closes and returns focus.', 'The shortcut hint is display text; applications register their own shortcuts.'],
    states: ['Enabled and disabled actions', 'Grouped items and separators', 'Nested keyboard navigation', 'Local record state and focus return'],
    source: `'use client';
import { useState } from 'react';
import { Button, DropdownMenu, type DropdownMenuEntry } from '@bld8/ui';
import { Check, FolderInput, RotateCcw } from 'lucide-react';

export function RecordActionsExample() {
  const [reviewed, setReviewed] = useState(false);
  const [location, setLocation] = useState('Inbox');
  const items: DropdownMenuEntry[] = [
    { type: 'group', label: 'Record', items: [
      { label: 'Mark reviewed', icon: Check, shortcut: 'R', disabled: reviewed, onSelect: () => setReviewed(true) },
      { type: 'submenu', label: 'Move to', icon: FolderInput, items: [
        { label: 'Inbox', onSelect: () => setLocation('Inbox') },
        { label: 'Review queue', onSelect: () => setLocation('Review queue') },
        { label: 'Restricted area', disabled: true },
      ] },
    ] },
    { type: 'separator' },
    { label: 'Restore record example', icon: RotateCcw, destructive: true, onSelect: () => { setReviewed(false); setLocation('Inbox'); } },
  ];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
    <DropdownMenu trigger={<Button variant="secondary">Record actions</Button>} items={items} />
    <p role="status">{reviewed ? 'Reviewed' : 'Not reviewed'} · Location: {location}</p>
    <p className="bui-hint">Local example state. No record is written to a service.</p>
  </div>;
}`,
  },
  {
    id: 'dropdown-preferences', componentId: 'dropdown', title: 'Checkbox and radio preferences',
    description: 'Controlled checkbox and radio values remain editable while the menu stays open.',
    keyboard: ['Space toggles Show labels without closing the menu.', 'Move to a spacing option and press Space or Enter to choose it.', 'Escape or Close view preferences returns focus to the trigger.'],
    states: ['Controlled popup', 'Controlled checkbox', 'Controlled radio group', 'Disabled radio option', 'State retained across reopening'],
    source: `'use client';
import { useState } from 'react';
import { Button, DropdownMenu, type DropdownMenuEntry } from '@bld8/ui';

export function ViewPreferencesExample() {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState(true);
  const [spacing, setSpacing] = useState('comfortable');
  const items: DropdownMenuEntry[] = [
    { type: 'group', label: 'Display', items: [
      { type: 'checkbox', label: 'Show labels', checked: labels, onCheckedChange: setLabels },
    ] },
    { type: 'separator' },
    { type: 'radio-group', label: 'Row spacing', value: spacing, onValueChange: setSpacing, items: [
      { value: 'compact', label: 'Compact spacing' },
      { value: 'comfortable', label: 'Comfortable spacing' },
      { value: 'automatic', label: 'Automatic spacing', disabled: true },
    ] },
    { type: 'separator' },
    { label: 'Close view preferences', onSelect: () => setOpen(false) },
  ];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
    <DropdownMenu trigger={<Button variant="secondary">View preferences</Button>} items={items} open={open} onOpenChange={setOpen} />
    <p role="status">{labels ? 'Labels visible' : 'Labels hidden'} · {spacing === 'compact' ? 'Compact spacing' : 'Comfortable spacing'}</p>
  </div>;
}`,
  },
  {
    id: 'toggle-formatting', componentId: 'toggle-group', title: 'Single and multiple choices in a form',
    description: 'Pressed buttons keep stable values. Native submission includes each selected value; reset restores the uncontrolled defaults.',
    keyboard: ['Arrow keys move focus inside each group and skip disabled options.', 'Space or Enter toggles the focused option. Single groups hold at most one value.', 'Submit with no required alignment to reveal validation and focus the first choice.'],
    states: ['Single selection', 'Multiple selection', 'Required group validation', 'Disabled choice', 'Native form values and reset'],
    source: `'use client';
import { useState } from 'react';
import { Button, ToggleGroup } from '@bld8/ui';
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';

export function FormattingChoicesExample() {
  const [result, setResult] = useState('Submit to inspect the form values.');
  return <form style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }} onReset={() => setResult('Submit to inspect the form values.')} onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setResult(JSON.stringify({ alignment: data.getAll('alignment'), format: data.getAll('format') }));
  }}>
    <ToggleGroup label="Text alignment" name="alignment" required defaultValue={['left']} options={[
      { value: 'left', label: 'Align left', icon: AlignLeft },
      { value: 'center', label: 'Align center', icon: AlignCenter },
      { value: 'right', label: 'Align right', icon: AlignRight },
    ]} hint="Choose one alignment." />
    <ToggleGroup label="Text formatting" name="format" multiple defaultValue={['bold']} options={[
      { value: 'bold', label: 'Bold text', icon: Bold },
      { value: 'italic', label: 'Italic text', icon: Italic },
      { value: 'underline', label: 'Underline text', icon: Underline, disabled: true },
    ]} hint="Choose any supported formatting options." />
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}><Button type="submit">Apply formatting</Button><Button type="reset" variant="secondary">Reset formatting</Button></div>
    <output aria-label="Formatting form values" className="bui-hint">{result}</output>
  </form>;
}`,
  },
  {
    id: 'tag-input-validation', componentId: 'tag-input', title: 'Tags, validation and controlled values',
    description: 'Add tags deliberately, paste a validated batch and recover from duplicates or limits without losing text.',
    keyboard: ['Enter or comma adds the draft and does not submit the form.', 'Pasting comma or newline separated text validates one batch before adding it.', 'Backspace in an empty input focuses the last remove button; Backspace or Delete removes it. Escape returns to the input.'],
    states: ['Uncontrolled and controlled values', 'Required input', 'Duplicate and custom validation', 'Maximum tag count', 'Readonly field', 'Native form values and reset'],
    source: `'use client';
import { useState } from 'react';
import { Button, Checkbox, TagInput } from '@bld8/ui';

export function TagEntryExample() {
  const [reviewers, setReviewers] = useState(['Documentation']);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState('Submit to inspect the form values.');
  return <form style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }} onReset={() => { setReviewers(['Documentation']); setLocked(false); setResult('Submit to inspect the form values.'); }} onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setResult(JSON.stringify({ topics: data.getAll('topics'), reviewers: data.getAll('reviewers') }));
  }}>
    <TagInput label="Topics" name="topics" defaultValue={['React']} required maxTags={3} maxTagLength={20} validateTag={tag => tag.startsWith('#') ? 'Use the topic name without #.' : undefined} hint="Up to three topics. Enter or comma adds a tag." placeholder="Add a topic" />
    <TagInput label="Reviewer labels" name="reviewers" value={reviewers} onValueChange={setReviewers} readOnly={locked} hint="Controlled values; lock the field to keep them unchanged." />
    <Checkbox label="Lock reviewer labels" checked={locked} onChange={event => setLocked(event.target.checked)} />
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}><Button type="submit">Save topics</Button><Button type="reset" variant="secondary">Reset topics</Button></div>
    <output aria-label="Tag form values" className="bui-hint">{result}</output>
  </form>;
}`,
  },
];
