'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { File, Upload, X } from 'lucide-react';
import { Alert, Button, Icon, IconButton, Progress } from './core.js';
import { useControllableValue } from './state.js';

export interface UploadContext { signal: AbortSignal; onProgress: (file: globalThis.File, percent: number) => void }
export interface FileUploadProps {
  label: string;
  value?: globalThis.File[];
  defaultValue?: globalThis.File[];
  onValueChange?: (files: globalThis.File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  hint?: string;
  /** Supply your upload service. No request is made without this callback. */
  onUpload?: (files: globalThis.File[], context: UploadContext) => Promise<void>;
}
// Selection identity is metadata-based, not a claim of content-level deduplication.
const fileKey = (file:globalThis.File) => file.name + ':' + file.size + ':' + file.type;
function bytes(value:number) { return value < 1024 ? value + ' B' : value < 1024 * 1024 ? (value / 1024).toFixed(1) + ' KB' : (value / 1024 / 1024).toFixed(1) + ' MB'; }
function accepts(file:globalThis.File, accept:string) {
  return !accept || accept.split(',').some(raw => {
    const rule = raw.trim().toLowerCase(); const type = file.type.toLowerCase();
    return rule.startsWith('.') ? file.name.toLowerCase().endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule;
  });
}
export function FileUpload({ label, value, defaultValue = [], onValueChange, accept = '', maxFiles = 5, maxSize = 10 * 1024 * 1024, disabled, hint, onUpload }: FileUploadProps) {
  const id = useId(); const input = useRef<HTMLInputElement>(null); const controller = useRef<AbortController | null>(null);
  const browse=useRef<HTMLButtonElement>(null);
  const run = useRef(0); const [files, setFiles] = useControllableValue(value, defaultValue, onValueChange);
  const [dragging, setDragging] = useState(false); const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState(''); const [progress, setProgress] = useState<Record<string,number>>({});
  const fileLimit = Number.isFinite(maxFiles) ? Math.max(1, Math.floor(maxFiles)) : 5;
  const sizeLimit = Number.isFinite(maxSize) ? Math.max(1, maxSize) : 10 * 1024 * 1024;
  useEffect(() => () => { run.current++; controller.current?.abort(); }, []);
  const add = (incoming:globalThis.File[]) => {
    if (disabled || busy) return;
    const next = [...files]; const rejected:string[] = [];
    for (const file of incoming) {
      if (next.some(item => fileKey(item) === fileKey(file))) { rejected.push(file.name + ': already selected.'); continue; }
      if (!accepts(file, accept)) { rejected.push(file.name + ': unsupported file type.'); continue; }
      if (file.size > sizeLimit) { rejected.push(file.name + ': exceeds ' + bytes(sizeLimit) + '.'); continue; }
      if (next.length >= fileLimit) { rejected.push(file.name + ': limit of ' + fileLimit + ' files reached.'); continue; }
      next.push(file);
    }
    setFiles(next); setErrors(rejected); setProgress({}); setStatus(next.length + ' files selected.');
  };
  async function upload() {
    if (!onUpload || !files.length || busy || disabled) return;
    const current = ++run.current; const abort = new AbortController(); controller.current = abort;
    setBusy(true); setErrors([]); setProgress({}); setStatus('Uploading files…');
    try {
      await onUpload([...files], {signal:abort.signal, onProgress:(file, percent) => {
        if (run.current === current && !abort.signal.aborted && Number.isFinite(percent)) setProgress(previous => ({...previous, [fileKey(file)]:Math.max(0, Math.min(100, percent))}));
      }});
      if (run.current !== current || abort.signal.aborted) return;
      setProgress(Object.fromEntries(files.map(file => [fileKey(file),100]))); setStatus('Upload complete.');
    } catch (error) {
      if (run.current === current && !abort.signal.aborted) { setErrors([error instanceof Error ? error.message : 'Upload failed. Try again.']); setStatus(''); }
    } finally { if (run.current === current) {setBusy(false);controller.current = null;} }
  }
  return <div className="bui-file-upload">
    <label htmlFor={id} className="bui-label">{label}</label>
    <div className="bui-dropzone" data-dragging={dragging || undefined} data-disabled={disabled || busy || undefined}
      onDragOver={event => {event.preventDefault();if(!disabled && !busy) {event.dataTransfer.dropEffect='copy';setDragging(true);}}}
      onDragLeave={event => {if(!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);}}
      onDrop={event => {event.preventDefault();setDragging(false);add(Array.from(event.dataTransfer.files));}}>
      <span className="bui-file-symbol"><Icon icon={Upload} size={24} /></span><strong>Drop files here</strong>
      <p className="bui-hint">{hint ?? (accept || 'Any file type') + ' · Up to ' + fileLimit + ' files · ' + bytes(sizeLimit) + ' each'}</p>
      <input ref={input} id={id} type="file" multiple={fileLimit > 1} accept={accept} disabled={disabled || busy} className="bui-sr-only" aria-describedby={id + '-help'} onChange={event => {add(Array.from(event.target.files ?? []));event.target.value='';}} />
      <Button ref={browse} variant="secondary" size="sm" disabled={disabled || busy} onClick={() => input.current?.click()}>Browse files</Button>
      <span id={id + '-help'} className="bui-sr-only">{accept || 'Any file type'}. Maximum {fileLimit} files, {bytes(sizeLimit)} per file. Drag and drop or browse.</span>
    </div>
    {errors.length > 0 && <Alert title="Check the files" tone="danger" live><ul className="bui-file-errors">{errors.map((error,index) => <li key={index}>{error}</li>)}</ul></Alert>}
    {files.length > 0 && <ul className="bui-file-list" aria-label={label + ' selected files'}>{files.map(file => <li key={fileKey(file)}>
      <Icon icon={File} /><div><strong>{file.name}</strong><span className="bui-hint">{bytes(file.size)}</span>{progress[fileKey(file)] !== undefined && <Progress label={'Upload ' + file.name} value={progress[fileKey(file)]} />}</div>
      <IconButton icon={X} label={'Remove ' + file.name} variant="ghost" size="sm" disabled={disabled || busy} onClick={() => {setFiles(files.filter(item => fileKey(item) !== fileKey(file)));setErrors([]);setStatus(file.name + ' removed.');browse.current?.focus();}} />
    </li>)}</ul>}
    <div className="bui-file-footer"><span role="status" className="bui-hint">{status}</span>{onUpload && (busy ? <Button variant="secondary" size="sm" onClick={() => {run.current++;controller.current?.abort();controller.current=null;setBusy(false);setProgress({});setStatus('Upload cancelled.');}}>Cancel upload</Button> : <Button size="sm" disabled={disabled || !files.length} onClick={upload}>Upload {files.length || ''} {files.length === 1 ? 'file' : 'files'}</Button>)}</div>
  </div>;
}
