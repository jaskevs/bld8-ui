'use client';
import { useState, type FormEvent } from 'react';
import { Button, Field, Input, Icon } from '@bld8/ui';

export function SignInForm({ onSignIn }: { onSignIn?: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const next = { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? undefined : 'Enter a valid email address.', password: password.length >= 8 ? undefined : 'Use at least 8 characters.' };
    setErrors(next); setMessage('');
    if (next.email || next.password) return;
    setBusy(true);
    try {
      if (onSignIn) await onSignIn(email.trim(), password);
      setMessage(onSignIn ? 'Sign-in request completed.' : 'Form validated. Connect your authentication service to sign in.');
      setPassword('');
    } catch { setMessage('Unable to sign in. Please try again.'); }
    finally { setBusy(false); }
  }
  return <section className="bblocks-auth bblocks-panel" aria-label="Sign-in form">
    <span className="bblocks-symbol" aria-hidden="true"><Icon name="plus" /></span>
    <p className="bblocks-kicker">YOUR WORKSPACE</p><h2>Welcome back.</h2><p className="bblocks-muted">A little space to do your best work.</p>
    <form className="bblocks-stack" onSubmit={submit} noValidate>
      <Field label="Email" error={errors.email} required><Input type="email" autoComplete="username" value={email} placeholder="you@example.com" onChange={e => setEmail(e.target.value)} /></Field>
      <Field label="Password" error={errors.password} required><Input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></Field>
      <Button type="submit" loading={busy}>Continue <Icon /></Button>
    </form>
    <p className="bblocks-status" role="status">{message}</p>
    {!onSignIn && <p className="bblocks-note">Demo form. No account is created and no credentials are sent.</p>}
  </section>;
}
