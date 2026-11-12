/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const workflowExamples = [
  {
    id: 'workflow-dependent-reviewer', componentId: 'async-combobox', title: 'Choose a reviewer within a team',
    description: 'Changing the team clears the previous reviewer and aborts its pending directory lookup. A one-shot failure can be retried without losing the parent choice.',
    keyboard: ['Choose a team, then type in Reviewer.', 'Arrow Down and Enter choose an available reviewer; Escape closes the results.', 'The built-in Retry reviewer search action restores focus after recovery.'],
    states: ['Dependent source identity', 'Abort on parent change', 'Stale results excluded', 'One-shot lookup failure and retry', 'Native form IDs', 'Explicit local data adapter'],
    source: `'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AsyncCombobox } from '@bld8/ui/async-combobox';
import type { AsyncOptionsLoader } from '@bld8/ui/async-options';
import { Button, Checkbox } from '@bld8/ui/core';
import { UIProvider, Select } from '@bld8/ui';

const teams = {
  design: [{ value: 'maya', label: 'Maya Chen', description: 'Design systems' }, { value: 'sam-design', label: 'Sam Rivera', description: 'Product design' }],
  research: [{ value: 'eli', label: 'Eli Morgan', description: 'Research operations' }, { value: 'sam-research', label: 'Sam Ortiz', description: 'User research' }],
};
export function DependentReviewerExample() {
  const [team, setTeam] = useState<keyof typeof teams>('design');
  const [reviewer, setReviewer] = useState<string | null>(null);
  const [failNext, setFailNext] = useState(false);
  const [hold, setHold] = useState(false);
  const [cancelled, setCancelled] = useState(0);
  const [waiting, setWaiting] = useState(0);
  const [submitted, setSubmitted] = useState('No assignment submitted.');
  const failure = useRef(false), held = useRef(false), alive = useRef(true);
  const releases = useRef(new Map<symbol, () => void>());
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const loadReviewers = useCallback<AsyncOptionsLoader>(async ({ query, signal }) => {
    const shouldFail = failure.current;
    if (shouldFail) { failure.current = false; setFailNext(false); }
    await new Promise<void>((resolve, reject) => {
      const key = Symbol('lookup');
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = () => { clearTimeout(timer); releases.current.delete(key); signal.removeEventListener('abort', abort); if (alive.current) setWaiting(releases.current.size); resolve(); };
      const abort = () => { clearTimeout(timer); releases.current.delete(key); if (alive.current) { setCancelled(value => value + 1); setWaiting(releases.current.size); } reject(new DOMException('Lookup cancelled', 'AbortError')); };
      if (signal.aborted) { abort(); return; }
      signal.addEventListener('abort', abort, { once: true });
      if (held.current) { releases.current.set(key, finish); if (alive.current) setWaiting(releases.current.size); } else timer = setTimeout(finish, 300);
    });
    if (signal.aborted) throw new DOMException('Lookup cancelled', 'AbortError');
    if (shouldFail) throw new Error('The local directory rejected this lookup.');
    return { items: teams[team].filter(person => person.label.toLowerCase().includes(query.toLowerCase())), nextCursor: null };
  }, [team]);
  return <UIProvider><form aria-label="Reviewer assignment" style={{ display: 'grid', gap: 20, width: '100%' }} onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget); setSubmitted(String(data.get('team')) + ' / ' + String(data.get('reviewer') || 'none'));
  }}>
    <Select label="Team" name="team" value={team} options={[{ value: 'design', label: 'Design studio' }, { value: 'research', label: 'Research studio' }]} onValueChange={value => { if (value !== 'design' && value !== 'research') return; setReviewer(null); setTeam(value); setSubmitted('No assignment submitted.'); }} />
    <AsyncCombobox label="Reviewer" name="reviewer" value={reviewer} onValueChange={setReviewer} sourceKey={team} loadOptions={loadReviewers} debounceMs={100} hint="Search within the selected team. Changing teams clears the reviewer." />
    <Checkbox label="Fail next reviewer lookup" checked={failNext} onCheckedChange={checked => { failure.current = checked; setFailNext(checked); }} />
    <Checkbox label="Hold directory responses" checked={hold} onCheckedChange={checked => { held.current = checked; setHold(checked); if (!checked) for (const release of [...releases.current.values()]) release(); }} />
    <Button type="submit" disabled={!reviewer}>Assign reviewer</Button>
    <output aria-label="Reviewer assignment result">{submitted}</output>
    <p className="bui-hint">Held lookups: {waiting}. Cancelled lookups: {cancelled}. Local records and an abortable delay demonstrate the service boundary. Replace the loader with an authorised, validated directory request.</p>
  </form></UIProvider>;
}`,
  },
  {
    id: 'workflow-upload-acknowledgement', componentId: 'upload-queue', title: 'Wait for a per-file acknowledgement',
    description: 'Read and hash real local file bytes, then hold the handler promise until the local adapter acknowledges or rejects each receipt. Cancel and retry keep a stable request ID.',
    keyboard: ['Browse files and Start queued are available by keyboard.', 'Use the file Cancel or Retry action; focus follows the surviving row action.', 'Acknowledge or Reject processed files resolves the local adapter outside the queue.'],
    states: ['Measured local bytes', 'Processing while awaiting a receipt', 'Cancellation through AbortSignal', 'Rejected acknowledgement', 'Retry with stable request ID', 'No network or durable storage'],
    source: `'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadQueue } from '@bld8/ui/upload-queue';
import type { UploadFileHandler, UploadQueueItem, UploadReceipt } from '@bld8/ui/upload-state';
import { Button } from '@bld8/ui/core';

type PendingReceipt = { accept: () => void; reject: () => void };
export function AcknowledgedFileProcessingExample() {
  const [items, setItems] = useState<readonly UploadQueueItem[]>([]);
  const [waiting, setWaiting] = useState(0);
  const pending = useRef(new Map<string, PendingReceipt>()), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const processFile = useCallback<UploadFileHandler>(async (file, { signal, requestId, onProgress }) => {
    const reader = file.stream().getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let loaded = 0;
    const cancelReader = () => { void reader.cancel().catch(() => {}); };
    signal.addEventListener('abort', cancelReader, { once: true });
    try {
      while (true) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        const next = await reader.read(); if (next.done) break;
        chunks.push(new Uint8Array(next.value)); loaded += next.value.byteLength; onProgress({ loaded, total: file.size });
      }
    } finally { signal.removeEventListener('abort', cancelReader); reader.releaseLock(); }
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const bytes = new Uint8Array(loaded); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    onProgress({ loaded: file.size, total: file.size });
    const receipt: UploadReceipt = { id: 'local-' + requestId, requestId, bytes: file.size, sha256: Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('') };
    return new Promise<UploadReceipt>((resolve, reject) => {
      const cleanup = () => { pending.current.delete(requestId); signal.removeEventListener('abort', abort); if (alive.current) setWaiting(pending.current.size); };
      const abort = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
      if (signal.aborted) { abort(); return; }
      signal.addEventListener('abort', abort, { once: true });
      pending.current.set(requestId, { accept: () => { cleanup(); resolve(receipt); }, reject: () => { cleanup(); reject(new Error('Local receipt rejected')); } });
      if (alive.current) setWaiting(pending.current.size);
    });
  }, []);
  return <div style={{ width: '100%', display: 'grid', gap: 20 }}>
    <p className="bui-hint">No files leave this browser. The local adapter reads and hashes bytes, then waits for your acknowledgement. It does not upload or store files.</p>
    <UploadQueue label="Acknowledged local processing" onUploadFile={processFile} onItemsChange={setItems} maxFiles={3} maxSize={256 * 1024} concurrency={1} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}><Button disabled={!waiting} onClick={() => { for (const receipt of [...pending.current.values()]) receipt.accept(); }}>Acknowledge processed files</Button><Button variant="secondary" disabled={!waiting} onClick={() => { for (const receipt of [...pending.current.values()]) receipt.reject(); }}>Reject processed files</Button></div>
    <p role="status">{waiting} file acknowledgement{waiting === 1 ? '' : 's'} pending.</p>
    <output aria-label="Upload attempt records" className="bui-hint" style={{ overflowWrap: 'anywhere' }}>{JSON.stringify(items.map(item => ({ requestId: item.requestId, attempt: item.attempt, status: item.status })))}</output>
  </div>;
}`,
  },
  {
    id: 'workflow-kanban-recovery', componentId: 'kanban', title: 'Save, reject and retry an intended move',
    description: 'An optimistic board move stays pending until the local adapter accepts, rejects or cancels it. A rejected save restores the original order and retains the intended move for retry.',
    keyboard: ['Use a card Move button to choose a column and exact position.', 'Move item applies the optimistic change; other move buttons stay disabled during the save.', 'Accept, Reject or Cancel the pending move using outside controls. Retry intended move repeats the rejected move.'],
    states: ['Optimistic reorder', 'Pending move lock', 'Rejected save rollback', 'Exact intended move retry', 'Abortable cancellation', 'Unmount protection', 'Host-owned persistence'],
    source: `'use client';
import { useEffect, useRef, useState } from 'react';
import { Kanban } from '@bld8/ui/kanban';
import { applyKanbanMove, type KanbanColumn, type KanbanItem, type KanbanMove } from '@bld8/ui/kanban-state';
import { Button, Checkbox } from '@bld8/ui/core';
import { UIProvider, Select } from '@bld8/ui';

const columns: KanbanColumn[] = [{ id: 'planned', title: 'Planned' }, { id: 'review', title: 'In review', limit: 2 }, { id: 'done', title: 'Done' }];
const initial: KanbanItem[] = [{ id: 'labels', columnId: 'planned', title: 'Review field labels' }, { id: 'focus', columnId: 'planned', title: 'Check focus return' }, { id: 'spacing', columnId: 'review', title: 'Verify spacing' }];
type SaveRequest = { controller: AbortController; accept: () => void; reject: () => void };
export function RecoverableKanbanExample() {
  const [items, setItems] = useState<KanbanItem[]>(initial);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState<KanbanMove | null>(null);
  const [message, setMessage] = useState('No move is pending.');
  const current = useRef(items), active = useRef<SaveRequest | null>(null), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; active.current?.controller.abort(); }; }, []);
  function moveItem(move: KanbanMove) {
    if (active.current) return;
    const before = current.current;
    let next: KanbanItem[];
    try { next = applyKanbanMove(before, move, columns); } catch { setMessage('The board changed. Choose the move again.'); setFailed(null); return; }
    const controller = new AbortController();
    let accept!: () => void, reject!: () => void;
    const response = new Promise<void>((resolve, fail) => {
      accept = resolve; reject = () => fail(new Error('Save rejected'));
      controller.signal.addEventListener('abort', () => fail(new DOMException('Cancelled', 'AbortError')), { once: true });
    });
    const request = { controller, accept, reject };
    active.current = request; current.current = next; setItems(next); setSaving(true); setFailed(null); setMessage('Saving the intended move…');
    response.then(() => {
      if (!alive.current || active.current !== request || controller.signal.aborted) return;
      setMessage('Move saved by the local adapter.');
    }).catch(() => {
      if (!alive.current || active.current !== request) return;
      current.current = before; setItems(before);
      if (controller.signal.aborted) { setFailed(null); setMessage('Save cancelled. Original order restored.'); }
      else { setFailed(move); setMessage('Save rejected. Original order restored; the intended move is ready to retry.'); }
    }).finally(() => { if (alive.current && active.current === request) { active.current = null; setSaving(false); } });
  }
  return <UIProvider><div style={{ width: '100%', display: 'grid', gap: 20 }}>
    <p className="bui-hint">This local adapter holds its save promise for review. Replace it with an authorised, revision-checked service. No tasks are persisted.</p>
    <Kanban label="Recoverable review board" columns={columns} items={items} onMove={moveItem} pending={saving} layout="backlog" />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Button disabled={!saving} onClick={() => active.current?.accept()}>Accept pending move</Button>
      <Button variant="secondary" disabled={!saving} onClick={() => active.current?.reject()}>Reject pending move</Button>
      <Button variant="secondary" disabled={!saving} onClick={() => active.current?.controller.abort()}>Cancel pending move</Button>
      {failed && <Button variant="secondary" onClick={() => moveItem(failed)}>Retry intended move</Button>}
    </div>
    <p role={failed ? 'alert' : 'status'}>{message}</p>
    <output aria-label="Board order" className="bui-hint">{items.map(item => item.id + ':' + item.columnId).join(' | ')}</output>
  </div></UIProvider>;
}`,
  },
];
