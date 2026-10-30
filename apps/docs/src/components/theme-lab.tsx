'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, Check, ChevronDown, Code2, Copy, Link2, Monitor, Moon, RotateCcw, Smartphone, Sun } from 'lucide-react';
import { Button, Field, Icon, Input, Select, Slider } from '@bld8/ui';
import {
  DEFAULT_THEME, THEME_PRESETS, THEME_TYPOGRAPHY, exportThemeCss, getThemeContrast,
  normalizeThemeConfig, parseThemeConfig, serializeThemeConfig,
  type ThemeConfig, type ThemeMode,
} from '@bld8/ui/theme-config';

type ThemeState = { config: ThemeConfig; mode: ThemeMode };
type PreviewState = 'loading' | 'ready' | 'error';
type HistoryKind = 'push' | 'replace';

const defaultState = (): ThemeState => ({ config: { ...DEFAULT_THEME }, mode: 'light' });

function themeUrl(state: ThemeState) {
  const url = new URL(window.location.href);
  url.searchParams.set('theme', serializeThemeConfig(state.config));
  url.searchParams.set('mode', state.mode);
  return url;
}

function ColourField({ label, pickerLabel, value, resetKey, onChange }: {
  label: string; pickerLabel: string; value: string; resetKey: number;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value.toUpperCase());
  useEffect(() => { setDraft(value.toUpperCase()); }, [value, resetKey]);
  const valid = /^#[0-9a-f]{6}$/i.test(draft);
  return <Field label={label} error={valid ? undefined : `Use a six-digit hex colour, such as ${DEFAULT_THEME.accent.toUpperCase()}.`}>
    <div className="theme-colour-field">
      <Input value={draft} maxLength={7} spellCheck={false} autoComplete="off" onChange={event => {
        const next = event.target.value;
        setDraft(next);
        if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next);
      }} onBlur={() => { if (valid) setDraft(value.toUpperCase()); }} />
      <input type="color" aria-label={pickerLabel} value={value} onChange={event => {
        setDraft(event.target.value.toUpperCase());
        onChange(event.target.value);
      }} />
    </div>
    {!valid && <p className="theme-field-note">Preview and export keep the last valid colour.</p>}
  </Field>;
}

export function ThemeLab() {
  const [state, setState] = useState<ThemeState>(defaultState);
  const current = useRef(state);
  const [hydrated, setHydrated] = useState(false);
  const [urlMessage, setUrlMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState(false);
  const [manualLink, setManualLink] = useState('');
  const [showCss, setShowCss] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [viewport, setViewport] = useState<'desktop' | 'phone'>('desktop');
  const [previewState, setPreviewState] = useState<PreviewState>('loading');
  const [previewKey, setPreviewKey] = useState(0);
  const iframe = useRef<HTMLIFrameElement>(null);
  const pendingUrl = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewConnected = useRef(false);

  const cancelUrlWrite = useCallback(() => {
    if (pendingUrl.current !== null) {
      clearTimeout(pendingUrl.current);
      pendingUrl.current = null;
    }
  }, []);

  const writeUrl = useCallback((next: ThemeState, kind: HistoryKind) => {
    try {
      const url = themeUrl(next);
      if (url.href !== window.location.href) {
        if (kind === 'push') window.history.pushState(window.history.state, '', url);
        else window.history.replaceState(window.history.state, '', url);
      }
      setUrlMessage('');
    } catch {
      setUrlMessage('The browser could not update this address. Use Copy theme link to share your current settings.');
    }
  }, []);

  useEffect(() => {
    const restore = () => {
      cancelUrlWrite();
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('theme');
      const config = parseThemeConfig(raw);
      const mode = params.get('mode') === 'dark' ? 'dark' : 'light';
      const next = { config: config ?? { ...DEFAULT_THEME }, mode } as ThemeState;
      current.current = next;
      setState(next);
      setResetKey(key => key + 1);
      setActionMessage('');
      setManualLink('');
      setUrlMessage(raw !== null && config === null
        ? 'This theme link is invalid or unsupported. The default theme is shown.'
        : '');
      setHydrated(true);
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => { window.removeEventListener('popstate', restore); cancelUrlWrite(); };
  }, [cancelUrlWrite]);

  const sendPreview = useCallback(() => {
    if (!iframe.current?.contentWindow) return;
    try {
      iframe.current.contentWindow.postMessage({
        type: 'bld8-theme-config',
        config: current.current.config,
        mode: current.current.mode,
      }, window.location.origin);
    } catch {
      previewConnected.current = false;
      setPreviewState('error');
    }
  }, []);

  useEffect(() => {
    const receive = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || event.source !== iframe.current?.contentWindow) return;
      if (!event.data || typeof event.data !== 'object' || !('type' in event.data)) return;
      if (event.data.type === 'bld8-theme-ready') {
        sendPreview();
      } else if (event.data.type === 'bld8-theme-applied') {
        previewConnected.current = true;
        setPreviewState('ready');
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [sendPreview]);

  useEffect(() => { sendPreview(); }, [state, sendPreview]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!previewConnected.current) setPreviewState('error');
    }, 10000);
    return () => clearTimeout(timeout);
  }, [previewKey]);

  const update = (patch: Partial<ThemeConfig>, kind: HistoryKind = 'push') => {
    const next = { ...current.current, config: normalizeThemeConfig({ ...current.current.config, ...patch }) };
    current.current = next;
    setState(next);
    setActionMessage('');
    setManualLink('');
    cancelUrlWrite();
    if (kind === 'replace') pendingUrl.current = setTimeout(() => { pendingUrl.current = null; writeUrl(next, 'replace'); }, 180);
    else writeUrl(next, 'push');
  };

  const chooseTheme = (config: Readonly<ThemeConfig>, resetMode = false) => {
    cancelUrlWrite();
    const next = { config: normalizeThemeConfig(config), mode: resetMode ? 'light' as const : current.current.mode };
    current.current = next;
    setState(next);
    setResetKey(key => key + 1);
    setActionMessage(resetMode ? 'Theme reset.' : '');
    setActionError(false);
    setManualLink('');
    writeUrl(next, 'push');
  };

  const changeMode = (mode: ThemeMode) => {
    cancelUrlWrite();
    const next = { ...current.current, mode };
    current.current = next;
    setState(next);
    setActionMessage('');
    setManualLink('');
    writeUrl(next, 'push');
  };

  const css = useMemo(() => exportThemeCss(state.config, { selector: '.bld8-theme' }), [state.config]);
  const contrast = useMemo(() => getThemeContrast(state.config, state.mode), [state.config, state.mode]);
  const serialised = serializeThemeConfig(state.config);
  const preset = THEME_PRESETS.find(item => serializeThemeConfig(item.config) === serialised);
  const typography = THEME_TYPOGRAPHY.find(item => item.value === state.config.typography)!;

  async function copyCss() {
    try {
      await navigator.clipboard.writeText(exportThemeCss(current.current.config, { selector: '.bld8-theme' }));
      setActionError(false);
      setActionMessage('CSS copied.');
    } catch {
      setShowCss(true);
      setActionError(true);
      setActionMessage('Could not copy CSS. Select the CSS below and copy it manually.');
    }
  }

  async function share() {
    cancelUrlWrite();
    const url = themeUrl(current.current).href;
    writeUrl(current.current, 'replace');
    try {
      await navigator.clipboard.writeText(url);
      setManualLink('');
      setActionError(false);
      setActionMessage('Theme link copied.');
    } catch {
      setManualLink(url);
      setActionError(true);
      setActionMessage('Could not copy the theme link. Select the link below and copy it manually.');
    }
  }

  function download() {
    let objectUrl: string | undefined;
    let anchor: HTMLAnchorElement | undefined;
    try {
      const content = exportThemeCss(current.current.config, { selector: '.bld8-theme' });
      objectUrl = URL.createObjectURL(new Blob([content], { type: 'text/css;charset=utf-8' }));
      anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = 'bld8-theme.css';
      document.body.appendChild(anchor);
      anchor.click();
      setActionError(false);
      setActionMessage('Theme CSS download started.');
    } catch {
      setShowCss(true);
      setActionError(true);
      setActionMessage('Could not start the download. Copy the CSS below and save it as bld8-theme.css.');
    } finally {
      anchor?.remove();
      if (objectUrl) {
        const url = objectUrl;
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
  }

  return <div className="theme-lab" aria-busy={!hydrated || undefined}>
    <section className="theme-presets" aria-labelledby="theme-presets-heading">
      <div className="theme-section-caption"><h2 id="theme-presets-heading">Start with a direction.</h2><span className="eyebrow">THREE STARTING POINTS</span></div>
      <div className="theme-preset-grid">{THEME_PRESETS.map(item => {
        const selected = item.id === preset?.id;
        return <button type="button" className="theme-preset" key={item.id} aria-pressed={selected} onClick={() => chooseTheme(item.config)}>
          <span className="theme-preset-art" aria-hidden="true">
            <span className="theme-preset-type" data-type={item.config.typography}>Aa<span>.</span></span>
            <span className="theme-preset-colours"><i style={{ background: item.config.primary }} /><i style={{ background: item.config.accent }} /></span>
          </span>
          <span className="theme-preset-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
          <span className="theme-preset-check" aria-hidden="true">{selected && <Icon icon={Check} size={14} />}</span>
        </button>;
      })}</div>
    </section>

    {urlMessage && <p className="theme-url-message" role="status">{urlMessage}</p>}

    <div className="theme-lab-grid">
      <section className="theme-controls" aria-label="Theme controls">
        <div className="theme-controls-heading"><div><p className="eyebrow">YOUR THEME</p><h2>{preset?.label ?? 'Custom'}</h2></div><Button variant="ghost" size="sm" leadingIcon={RotateCcw} aria-label="Reset theme" onClick={() => chooseTheme(DEFAULT_THEME, true)}>Reset</Button></div>

        <fieldset className="theme-control-group"><legend><span>01</span> Colour</legend>
          <ColourField label="Accent colour" pickerLabel="Choose accent colour" value={state.config.accent} resetKey={resetKey} onChange={accent => update({ accent }, 'replace')} />
          <ColourField label="Primary colour" pickerLabel="Choose primary colour" value={state.config.primary} resetKey={resetKey} onChange={primary => update({ primary }, 'replace')} />
          <p className="theme-field-note">Text colours adjust to keep actions legible.</p>
        </fieldset>

        <fieldset className="theme-control-group"><legend><span>02</span> Typography</legend>
          <Select label="Typography" value={state.config.typography} options={THEME_TYPOGRAPHY.map(item => ({ value: item.value, label: item.label }))} onValueChange={value => { if (value) update({ typography: value as ThemeConfig['typography'] }); }} />
          <div className="theme-type-sample" data-type={state.config.typography} aria-hidden="true"><span>Aa Bb 012</span><small>{typography.description}</small></div>
        </fieldset>

        <fieldset className="theme-control-group"><legend><span>03</span> Shape & space</legend>
          <Slider label="Corner radius" min={0} max={16} step={1} value={state.config.radius} aria-valuetext={state.config.radius + ' pixels'} onChange={event => update({ radius: Number(event.target.value) }, 'replace')} />
          <Select label="Density" value={state.config.density} options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }]} onValueChange={value => { if (value) update({ density: value as ThemeConfig['density'] }); }} />
          <Select label="Shadow" value={state.config.shadow} options={[{ value: 'flat', label: 'Flat' }, { value: 'soft', label: 'Soft' }, { value: 'raised', label: 'Raised' }]} onValueChange={value => { if (value) update({ shadow: value as ThemeConfig['shadow'] }); }} />
        </fieldset>
        <div className="theme-controls-footer"><span className="theme-local-dot" aria-hidden="true" /><p>Changes stay in this page and its shareable URL.</p></div>
      </section>

      <div className="theme-workspace">
        <section className="theme-preview" aria-labelledby="theme-preview-heading">
          <div className="theme-preview-toolbar">
            <div className="theme-preview-heading"><h2 id="theme-preview-heading">Live preview</h2><span>Try the controls.</span></div>
            <div className="theme-preview-tools">
              <div className="theme-segmented" role="group" aria-label="Preview colour mode">
                <Button variant="ghost" size="sm" leadingIcon={Sun} aria-label="Light preview" aria-pressed={state.mode === 'light'} onClick={() => changeMode('light')}>Light</Button>
                <Button variant="ghost" size="sm" leadingIcon={Moon} aria-label="Dark preview" aria-pressed={state.mode === 'dark'} onClick={() => changeMode('dark')}>Dark</Button>
              </div>
              <div className="theme-segmented theme-viewport-controls" role="group" aria-label="Preview viewport">
                <Button variant="ghost" size="sm" leadingIcon={Monitor} aria-label="Desktop preview" aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')}><span className="theme-sr-only">Desktop</span></Button>
                <Button variant="ghost" size="sm" leadingIcon={Smartphone} aria-label="Phone preview" aria-pressed={viewport === 'phone'} onClick={() => setViewport('phone')}><span className="theme-sr-only">Phone</span></Button>
              </div>
            </div>
          </div>
          <div className="theme-preview-stage" data-viewport={viewport}>
            <div className="theme-browser-frame">
              <div className="theme-browser-bar" aria-hidden="true"><span className="theme-browser-dots"><i /><i /><i /></span><span>workspace / overview</span><span>{state.mode}</span></div>
              <iframe key={previewKey} ref={iframe} src="/themes/preview" title="Theme preview" className="theme-preview-iframe" onLoad={sendPreview} onError={() => setPreviewState('error')} />
            </div>
          </div>
          <div className="theme-preview-footnote">
            <span role="status">{previewState === 'ready' ? 'Live. Buttons, menus and dialogs use your theme.' : previewState === 'loading' ? 'Loading preview…' : 'Preview did not connect.'}</span>
            {previewState === 'error' ? <Button variant="ghost" size="sm" onClick={() => { previewConnected.current = false; setPreviewState('loading'); setPreviewKey(key => key + 1); }}>Retry preview</Button> : <span>Preview theme only</span>}
          </div>
        </section>

        <section className="theme-contrast" aria-labelledby="theme-contrast-heading">
          <div className="theme-section-caption"><h2 id="theme-contrast-heading">Contrast, in context.</h2><span>{state.mode === 'light' ? 'Light' : 'Dark'} mode · normal text</span></div>
          <div className="theme-contrast-grid">{contrast.map(item => <div className="theme-contrast-item" key={item.label}>
            <span className="theme-contrast-swatch" style={{ background: item.background, color: item.foreground }} aria-hidden="true">Aa</span>
            <div><strong>{item.label}</strong><span>{item.ratio.toFixed(2)}:1 <span className={item.passes ? 'theme-contrast-pass' : 'theme-contrast-fail'}>{item.passes ? 'AA' : 'Below AA'}</span></span></div>
          </div>)}</div>
          <p>These token pairs target 4.5:1 for normal text. Review contrast in your finished interface, including disabled and custom states.</p>
        </section>

        <section className="theme-export" aria-labelledby="theme-export-heading">
          <div className="theme-export-heading"><div><p className="eyebrow">TAKE IT WITH YOU</p><h2 id="theme-export-heading">A theme. A CSS file.</h2></div><Icon icon={Code2} size={22} /></div>
          <p>Both colour modes, typography, shape and spacing. Add the file after the library styles.</p>
          <div className="theme-export-actions"><Button leadingIcon={Copy} size="sm" onClick={copyCss}>Copy CSS</Button><Button variant="secondary" leadingIcon={ArrowDownToLine} size="sm" onClick={download}>Download CSS</Button><Button variant="ghost" leadingIcon={Link2} size="sm" onClick={share}>Copy theme link</Button></div>
          <p className="theme-action-message" data-error={actionError || undefined} role="status" aria-live="polite">{actionMessage}</p>
          {manualLink && <Field label="Theme link"><Input readOnly value={manualLink} onFocus={event => event.target.select()} /></Field>}
          <details className="theme-css" open={showCss} onToggle={event => setShowCss(event.currentTarget.open)}>
            <summary><span><Icon icon={Code2} size={15} />View theme CSS</span><Icon icon={ChevronDown} size={15} /></summary>
            <pre role="region" tabIndex={0} aria-label="Theme CSS"><code>{css}</code></pre>
          </details>
          <div className="theme-install-guide">
            <h3>Use it in your application</h3>
            <ol>
              <li>Import the library CSS, then <code>bld8-theme.css</code>.</li>
              <li>Add <code>class="bld8-theme"</code> and <code>data-ui-theme="light"</code> or <code>"dark"</code> to <code>&lt;html&gt;</code>. This also themes overlays rendered in portals.</li>
              <li>Wrap overlays in <code>UIProvider</code> and set <code>body &#123; position: relative; &#125;</code>.</li>
            </ol>
            <p>DM Sans and Manrope are loaded in this lab. Install or self-host these fonts to match them in your application; the export includes system fallbacks.</p>
            <Link href="/frameworks" className="plain-link">Application setup <Icon icon={ArrowUpRight} size={15} /></Link>
          </div>
        </section>
      </div>
    </div>
  </div>;
}
