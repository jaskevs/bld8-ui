'use client';
import { createContext, useContext, useId, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';

export function cx(...values: (string | false | undefined)[]) { return values.filter(Boolean).join(' '); }
export function Icon({ name = 'arrow', ...props }: ComponentProps<'svg'> & { name?: 'arrow' | 'check' | 'close' | 'chevron' | 'plus' | 'search' | 'copy' | 'sun' | 'moon' }) {
  const paths = { check: 'm5 12 4 4 10-10', close: 'm6 6 12 12M18 6 6 18', chevron: 'm6 9 6 6 6-6', plus: 'M12 5v14M5 12h14', search: 'm16 16 4 4M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', copy: 'M8 8h12v12H8zM4 16V4h12', sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0', moon: 'M20 14a8 8 0 0 1-10-10 9 9 0 1 0 10 10' };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-bui-icon={name} {...props}>{name === 'arrow' ? [[10,6],[14,6],[18,6],[14,10],[18,10],[10,14],[18,14],[6,18]].map(([x,y]) => <circle key={x + ',' + y} cx={x} cy={y} r="1.25" fill="currentColor" stroke="none" />) : <path d={paths[name]} />}</svg>;
}
export type ButtonProps = ComponentProps<'button'> & { variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean };
export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cx('bui-button', 'bui-button--' + variant, 'bui-button--' + size, className)}><span className="bui-button-content">{children}</span>{loading && <span className="bui-button-spinner"><Spinner /></span>}</button>;
}
export function IconButton({ label, children, ...props }: ButtonProps & { label: string }) { return <Button {...props} aria-label={label} className={cx('bui-icon-button', props.className)}>{children}</Button>; }
const FieldContext = createContext<{ id: string; description?: string; invalid: boolean } | null>(null);
export function Field({ label, hint, error, id: suppliedId, children, required }: { label: string; hint?: string; error?: string; id?: string; children: ReactNode; required?: boolean }) {
  const generated = useId(); const id = suppliedId || generated;
  const description = [hint && id + '-hint', error && id + '-error'].filter(Boolean).join(' ') || undefined;
  return <FieldContext.Provider value={{ id, description, invalid: !!error }}><div className="bui-field"><label className="bui-label" htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>{children}{hint && <p id={id + '-hint'} className="bui-hint">{hint}</p>}{error && <p id={id + '-error'} className="bui-error" role="alert">{error}</p>}</div></FieldContext.Provider>;
}
export function Input({ className, ...props }: ComponentProps<'input'>) {
  const field = useContext(FieldContext);
  return <input id={field?.id} aria-describedby={field?.description} aria-invalid={field?.invalid || undefined} {...props} className={cx('bui-input', className)} />;
}
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  const field = useContext(FieldContext);
  return <textarea id={field?.id} aria-describedby={field?.description} aria-invalid={field?.invalid || undefined} rows={4} {...props} className={cx('bui-input', 'bui-textarea', className)} />;
}
export function Checkbox({ label, description, className, ...props }: Omit<ComponentProps<'input'>, 'type'> & { label: string; description?: string }) {
  const hintId = useId();
  return <label className={cx('bui-choice', className)}><input {...props} type="checkbox" className="bui-checkbox" aria-describedby={description ? hintId : props['aria-describedby']} /><span>{label}{description && <small id={hintId}>{description}</small>}</span></label>;
}
export function Switch({ label, description, className, ...props }: Omit<ComponentProps<'input'>, 'type' | 'role'> & { label: string; description?: string }) {
  const hintId = useId();
  return <label className={cx('bui-choice', 'bui-switch-row', className)}><span>{label}{description && <small id={hintId}>{description}</small>}</span><input {...props} type="checkbox" role="switch" className="bui-switch" aria-describedby={description ? hintId : props['aria-describedby']} /></label>;
}
export interface Option { value: string; label: string; disabled?: boolean }
export function RadioGroup({ label, options, name, value, defaultValue, onValueChange, disabled }: { label: string; options: Option[]; name?: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; disabled?: boolean }) {
  const id = useId();
  return <fieldset className="bui-radio-group" disabled={disabled}><legend className="bui-label">{label}</legend>{options.map(option => <label className="bui-choice" key={option.value}><input type="radio" name={name || id} value={option.value} checked={value === undefined ? undefined : value === option.value} defaultChecked={value === undefined ? defaultValue === option.value : undefined} disabled={option.disabled} onChange={() => onValueChange?.(option.value)} />{option.label}</label>)}</fieldset>;
}
export function Slider({ label, ...props }: Omit<ComponentProps<'input'>, 'type'> & { label: string }) {
  const id = useId(); const [internal, setInternal] = useState(props.defaultValue ?? 50);
  return <div className="bui-field"><div className="bui-between"><label className="bui-label" htmlFor={props.id || id}>{label}</label><output htmlFor={props.id || id}>{props.value ?? internal}</output></div><input {...props} id={props.id || id} className={cx('bui-slider', props.className)} type="range" onChange={event => { setInternal(event.target.value); props.onChange?.(event); }} /></div>;
}
export function Badge({ tone = 'neutral', className, ...props }: ComponentProps<'span'> & { tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' }) { return <span {...props} className={cx('bui-badge', 'bui-tone--' + tone, className)} />; }
export function Card({ className, ...props }: ComponentProps<'div'>) { return <div {...props} className={cx('bui-card', className)} />; }
export function Avatar({ name, src, size = 'md' }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState<string | null>(null);
  return <span className={'bui-avatar bui-avatar--' + size} role="img" aria-label={name}>{src && failed !== src ? <img src={src} alt="" onError={() => setFailed(src)} /> : name.trim().split(/\s+/).map(part => part[0]).slice(0,2).join('')}</span>;
}
export function Separator({ className, ...props }: ComponentProps<'hr'>) { return <hr {...props} className={cx('bui-separator', className)} />; }
export function Spinner({ label }: { label?: string }) { return <span className="bui-spinner" role={label ? 'status' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />; }
export function Skeleton({ width = '100%', height = '1rem', className }: { width?: CSSProperties['width']; height?: CSSProperties['height']; className?: string }) { return <span className={cx('bui-skeleton', className)} style={{ width, height }} aria-hidden="true" />; }
export function Progress({ label, value, max = 100 }: { label: string; value: number | null; max?: number }) { return <div className="bui-field"><div className="bui-between"><span className="bui-label">{label}</span><span className="bui-hint">{value === null ? 'In progress' : Math.round(value / max * 100) + '%'}</span></div><progress className="bui-progress" aria-label={label} max={max} value={value === null ? undefined : value} /></div>; }
export function Alert({ title, children, tone = 'neutral', live = false }: { title: string; children?: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger'; live?: boolean }) { return <div className={'bui-alert bui-tone--' + tone} role={live ? (tone === 'danger' ? 'alert' : 'status') : undefined}><strong>{title}</strong>{children && <div>{children}</div>}</div>; }
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) { return <div className="bui-empty"><span className="bui-empty-mark" aria-hidden="true"><Icon name="plus" /></span><h3>{title}</h3><p>{children}</p>{action}</div>; }
export function Breadcrumb({ items, label = 'Breadcrumb' }: { items: { label: string; href?: string }[]; label?: string }) { return <nav aria-label={label}><ol className="bui-breadcrumb">{items.map((item,index) => <li key={index}>{index > 0 && <span aria-hidden="true">/</span>}{item.href && index < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}</li>)}</ol></nav>; }
export function Pagination({ page, totalPages, onPageChange, label = 'Pagination' }: { page: number; totalPages: number; onPageChange: (page: number) => void; label?: string }) { return <nav aria-label={label} className="bui-pagination"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button><span aria-live="polite">Page {page} of {Math.max(totalPages,1)}</span><Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button></nav>; }