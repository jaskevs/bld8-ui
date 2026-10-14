'use client';
import { useEffect, useState } from 'react';
import { Button, Icon } from '@bld8/ui';
export function CodeBlock({ code, language }: { code: string; language?:string }) {
  const label=language ?? (/^(?:npx |npm |git |cd )/.test(code.trim()) ? 'Terminal' : /^[{[]/.test(code.trim()) ? 'JSON' : 'React / TypeScript');
  const [status, setStatus] = useState('Copy code');
  useEffect(() => { setStatus('Copy code'); }, [code]);
  return <div className="code-block"><div className="code-toolbar"><span>{label}</span><Button variant="ghost" size="sm" onClick={async () => { try {await navigator.clipboard.writeText(code); setStatus('Copied');} catch {setStatus('Select code to copy');} }}>{status}<Icon name="copy" /></Button></div><pre tabIndex={0}><code>{code}</code></pre><span className="bui-sr-only" role="status">{status === 'Copy code' ? '' : status}</span></div>;
}
