'use client';
import { useState, type FormEvent } from 'react';
import { Avatar, Button, Field, Input, Switch } from '@bld8/ui';

export interface AccountValues { name: string; email: string; digest: boolean }
export function AccountSettings({ initialValues = { name: 'Alex Morgan', email: 'alex@example.com', digest: true }, onSave }: { initialValues?: AccountValues; onSave?: (values: AccountValues) => Promise<void> }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  function update(patch: Partial<AccountValues>) { setValues(current => ({ ...current, ...patch })); setMessage(''); }
  async function save(event: FormEvent) {
    event.preventDefault();
    const next = { name: values.name.trim() ? undefined : 'Enter your name.', email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? undefined : 'Enter a valid email address.' };
    setErrors(next); if (next.name || next.email) return;
    setSaving(true);
    try { if (onSave) await onSave({ ...values, name: values.name.trim(), email: values.email.trim() }); setMessage(onSave ? 'Changes saved.' : 'Saved for this session.'); }
    catch { setMessage('Changes could not be saved. Please try again.'); }
    finally { setSaving(false); }
  }
  return <section className="bblocks-panel" aria-label="Account settings">
    <div className="bblocks-heading"><div><p className="bblocks-kicker">PERSONAL SPACE</p><h2>Your profile.</h2><p className="bblocks-muted">The details that make it yours.</p></div><Avatar name={values.name || 'Profile'} size="lg" /></div>
    <form onSubmit={save} noValidate className="bblocks-stack">
      <div className="bblocks-form-grid"><Field label="Display name" error={errors.name} required><Input value={values.name} autoComplete="name" onChange={e => update({name:e.target.value})} /></Field><Field label="Email address" error={errors.email} required><Input type="email" value={values.email} autoComplete="email" onChange={e => update({email:e.target.value})} /></Field></div>
      <div className="bblocks-rule"><Switch label="Weekly summary" description="A quiet update about your workspace." checked={values.digest} onChange={e => update({digest:e.target.checked})} /></div>
      <div className="bblocks-heading"><p className="bblocks-note">{onSave ? 'Save your profile changes.' : 'Sample profile. Changes stay in this session.'}</p><Button type="submit" loading={saving}>Save profile</Button></div>
    </form><p role="status" className="bblocks-status">{message}</p>
  </section>;
}
