/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type FocusEventHandler, type ReactNode, type Ref } from 'react';
import {CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon} from 'lucide-react';
import { Icon } from './icons.js';
import { cn } from './utils.js';
import { buttonVariants } from './variants.js';
export { Icon, type IconProps, type IconName } from './icons.js';

export function cx(...values: (string | false | undefined)[]) { return values.filter(Boolean).join(' '); }
export type ButtonProps = ComponentProps<'button'> & { variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean; leadingIcon?:LucideIcon; trailingIcon?:LucideIcon };
export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, type = 'button', leadingIcon, trailingIcon, ...props }: ButtonProps) {
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn(buttonVariants({variant,size}),className)}><span className="bui-button-content">{leadingIcon && <Icon icon={leadingIcon} size={size === 'sm' ? 16 : 18} />}{children}{trailingIcon && <Icon icon={trailingIcon} size={size === 'sm' ? 16 : 18} />}</span>{loading && <span className="bui-button-spinner"><Spinner /></span>}</button>;
}
export function IconButton({ label, icon, children, ...props }: ButtonProps & { label: string; icon?:LucideIcon }) { return <Button {...props} aria-label={label} className={cx('bui-icon-button', props.className)}>{children ?? (icon && <Icon icon={icon} size={props.size === 'sm' ? 16 : 18} />)}</Button>; }
const FieldContext = createContext<{ id: string; description?: string; invalid: boolean; required?: boolean; disabled?:boolean } | null>(null);
const describedBy=(...values:(string|false|undefined)[])=>values.filter(Boolean).join(' ')||undefined;
function setInputRef(ref:Ref<HTMLInputElement>|undefined,node:HTMLInputElement|null){if(typeof ref==='function')ref(node);else if(ref)ref.current=node;}
export interface FieldProps {label:string;hint?:string;error?:string;id?:string;children:ReactNode;required?:boolean;disabled?:boolean}
export function Field({ label, hint, error, id: suppliedId, children, required, disabled }: FieldProps) {
  const generated = useId(); const id = suppliedId || generated;
  const description = [hint && id + '-hint', error && id + '-error'].filter(Boolean).join(' ') || undefined;
  return <FieldContext.Provider value={{ id, description, invalid: !!error, required, disabled }}><div className="bui-field" data-disabled={disabled||undefined}><label className="bui-label" htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>{children}{hint && <p id={id + '-hint'} className="bui-hint">{hint}</p>}{error && <p id={id + '-error'} className="bui-error" role="alert">{error}</p>}</div></FieldContext.Provider>;
}
export function Input({ className, density = 'comfortable', ...props }: ComponentProps<'input'> & { density?: 'comfortable' | 'compact' }) {
  const field = useContext(FieldContext);
  return <input id={field?.id} aria-invalid={field?.invalid || undefined} required={field?.required} disabled={field?.disabled} {...props} aria-describedby={describedBy(field?.description,props['aria-describedby'])} data-density={density} className={cx('bui-input', className)} />;
}
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  const field = useContext(FieldContext);
  return <textarea id={field?.id} aria-invalid={field?.invalid || undefined} required={field?.required} disabled={field?.disabled} rows={4} {...props} aria-describedby={describedBy(field?.description,props['aria-describedby'])} className={cx('bui-input', 'bui-textarea', className)} />;
}
export function InputGroup({leading,trailing,className,children,...props}:ComponentProps<'div'> & {leading?:ReactNode;trailing?:ReactNode}) {
  const field=useContext(FieldContext);
  return <div {...props} data-invalid={field?.invalid || undefined} className={cx('bui-input-group',className)}>{leading && <span className="bui-input-adornment">{leading}</span>}{children}{trailing && <span className="bui-input-adornment">{trailing}</span>}</div>;
}
export interface ChoiceFieldProps {label:string;/** Existing alias for hint. */description?:string;hint?:string;error?:string;inputRef?:Ref<HTMLInputElement>;onCheckedChange?:(checked:boolean)=>void}
export type CheckboxProps=Omit<ComponentProps<'input'>,'type'> & ChoiceFieldProps & {/** Sets the native indeterminate property; checked remains boolean. */indeterminate?:boolean};
export function Checkbox({ label, description, hint=description, error, inputRef, ref, indeterminate, onCheckedChange, onChange, className, ...props }: CheckboxProps) {
  const generated=useId(),id=props.id||generated,node=useRef<HTMLInputElement|null>(null);
  const attach=useCallback((input:HTMLInputElement|null)=>{node.current=input;if(input&&indeterminate!==undefined)input.indeterminate=indeterminate;setInputRef(ref,input);setInputRef(inputRef,input);},[ref,inputRef,indeterminate]);
  useEffect(()=>{if(node.current&&indeterminate!==undefined)node.current.indeterminate=indeterminate;},[indeterminate,props.checked]);
  return <label className={cx('bui-choice', className)} data-invalid={!!error||undefined}><input {...props} ref={attach} id={id} type="checkbox" className="bui-checkbox" aria-invalid={error?true:props['aria-invalid']} aria-labelledby={props['aria-labelledby'] ?? (props['aria-label'] ? undefined : id+'-label')} aria-describedby={describedBy(hint&&id+'-hint',error&&id+'-error',props['aria-describedby'])} onChange={event=>{onChange?.(event);onCheckedChange?.(event.currentTarget.checked);}}/><span><span id={id+'-label'}>{label}{props.required&&<span aria-hidden="true"> *</span>}</span>{hint&&<small id={id+'-hint'}>{hint}</small>}{error&&<small className="bui-error" id={id+'-error'} role="alert">{error}</small>}</span></label>;
}
export type SwitchProps=Omit<ComponentProps<'input'>,'type'|'role'> & ChoiceFieldProps;
export function Switch({ label, description, hint=description, error, inputRef, ref, onCheckedChange, onChange, className, ...props }: SwitchProps) {
  const generated=useId(),id=props.id||generated;
  const attach=useCallback((input:HTMLInputElement|null)=>{setInputRef(ref,input);setInputRef(inputRef,input);},[ref,inputRef]);
  return <label className={cx('bui-choice','bui-switch-row',className)} data-invalid={!!error||undefined}><span><span id={id+'-label'}>{label}{props.required&&<span aria-hidden="true"> *</span>}</span>{hint&&<small id={id+'-hint'}>{hint}</small>}{error&&<small className="bui-error" id={id+'-error'} role="alert">{error}</small>}</span><input {...props} ref={attach} id={id} type="checkbox" role="switch" className="bui-switch" aria-invalid={error?true:props['aria-invalid']} aria-labelledby={props['aria-labelledby'] ?? (props['aria-label'] ? undefined : id+'-label')} aria-describedby={describedBy(hint&&id+'-hint',error&&id+'-error',props['aria-describedby'])} onChange={event=>{onChange?.(event);onCheckedChange?.(event.currentTarget.checked);}}/></label>;
}
export interface Option {value:string;label:string;disabled?:boolean;icon?:LucideIcon;description?:string;group?:string;searchTerms?:string[]}
export interface RadioGroupProps extends Omit<ComponentProps<'fieldset'>,'onChange'|'onBlur'|'defaultValue'> {label:string;options:Option[];name?:string;value?:string;defaultValue?:string;onValueChange?:(value:string)=>void;required?:boolean;hint?:string;error?:string;inputRef?:Ref<HTMLInputElement>;onBlur?:FocusEventHandler<HTMLInputElement>;form?:string}
export function RadioGroup({label,options,name,value,defaultValue,onValueChange,disabled,required,hint,error,inputRef,onBlur,form,className,id:suppliedId,...props}:RadioGroupProps) {
  const generated=useId(),id=suppliedId||generated,description=describedBy(hint&&id+'-hint',error&&id+'-error',props['aria-describedby']);
  return <fieldset {...props} id={id} className={cx('bui-radio-group',className)} disabled={disabled} aria-invalid={error?true:props['aria-invalid']} aria-describedby={description}><legend className="bui-label">{label}{required&&<span aria-hidden="true"> *</span>}</legend>{hint&&<p className="bui-hint" id={id+'-hint'}>{hint}</p>}{options.map((option,index)=><label className="bui-choice" key={option.value}><input ref={index===options.findIndex(item=>!item.disabled)?inputRef:undefined} type="radio" aria-label={option.label} name={name||id} form={form} value={option.value} checked={value===undefined?undefined:value===option.value} defaultChecked={value===undefined?defaultValue===option.value:undefined} disabled={option.disabled} required={required} aria-invalid={error?true:undefined} aria-describedby={describedBy(description,option.description&&id+'-option-'+index)} onBlur={onBlur} onChange={()=>onValueChange?.(option.value)}/>{option.icon&&<Icon icon={option.icon}/>}<span><span>{option.label}</span>{option.description&&<small id={id+'-option-'+index}>{option.description}</small>}</span></label>)}{error&&<p className="bui-error" id={id+'-error'} role="alert">{error}</p>}</fieldset>;
}
export type SliderProps=Omit<ComponentProps<'input'>,'type'> & {label:string;hint?:string;error?:string;inputRef?:Ref<HTMLInputElement>};
export function Slider({ label,hint,error,inputRef,ref,...props }: SliderProps) {
  const id = useId();
  const min = Number(props.min ?? 0), max = Number(props.max ?? 100);
  const [internal, setInternal] = useState(props.defaultValue ?? (min + max) / 2);
  const node=useRef<HTMLInputElement|null>(null),initial=useRef(internal);
  useEffect(()=>{const owner=node.current?.form;if(!owner||props.value!==undefined)return;const reset=(event:Event)=>queueMicrotask(()=>{if(!event.defaultPrevented)setInternal(initial.current);});owner.addEventListener('reset',reset);return()=>owner.removeEventListener('reset',reset);},[props.form,props.value]);
  const current = Number(props.value ?? internal);
  const progress = max > min && Number.isFinite(current) ? Math.max(0, Math.min(100, (current - min) / (max - min) * 100)) : 0;
  const style = { '--bui-slider-progress': progress + '%', ...props.style } as CSSProperties;
  const attach=useCallback((input:HTMLInputElement|null)=>{node.current=input;setInputRef(ref,input);setInputRef(inputRef,input);},[ref,inputRef]);
  return <div className="bui-field"><div className="bui-between"><label className="bui-label" htmlFor={props.id||id}>{label}</label><output htmlFor={props.id||id}>{props.value??internal}</output></div><input {...props} ref={attach} style={style} id={props.id||id} aria-invalid={error?true:props['aria-invalid']} aria-describedby={describedBy(hint&&(props.id||id)+'-hint',error&&(props.id||id)+'-error',props['aria-describedby'])} className={cx('bui-slider',props.className)} type="range" onChange={event=>{setInternal(event.target.value);props.onChange?.(event);}}/>{hint&&<p className="bui-hint" id={(props.id||id)+'-hint'}>{hint}</p>}{error&&<p className="bui-error" id={(props.id||id)+'-error'} role="alert">{error}</p>}</div>;
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
export function Progress({ label, value, max = 100 }: { label: string; value: number | null; max?: number }) {
  const limit=Number.isFinite(max) && max>0 ? max : 100;
  const amount=value===null ? null : Number.isFinite(value) ? Math.max(0,Math.min(limit,value)) : 0;
  return <div className="bui-field"><div className="bui-between"><span className="bui-label">{label}</span><span className="bui-hint bui-progress-value">{amount===null ? 'In progress' : Math.round(amount/limit*100)+'%'}</span></div><progress className="bui-progress" aria-label={label} max={limit} value={amount===null ? undefined : amount} /></div>;
}
const alertIcons={neutral:Info,success:CircleCheck,warning:TriangleAlert,danger:CircleAlert};
export function Alert({ title, children, tone = 'neutral', live = false }: { title: string; children?: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger'; live?: boolean }) {
  return <div className={'bui-alert bui-tone--'+tone} role={live ? (tone==='danger'?'alert':'status') : undefined}><Icon icon={alertIcons[tone]} /><div className="bui-alert-content"><strong>{title}</strong>{children && <div>{children}</div>}</div></div>;
}
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) { return <div className="bui-empty"><span className="bui-empty-mark" aria-hidden="true"><Icon name="plus" /></span><h3>{title}</h3><p>{children}</p>{action}</div>; }
export function Breadcrumb({ items, label = 'Breadcrumb' }: { items: { label: string; href?: string }[]; label?: string }) { return <nav aria-label={label}><ol className="bui-breadcrumb">{items.map((item,index) => <li key={index}>{index > 0 && <span aria-hidden="true">/</span>}{item.href && index < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}</li>)}</ol></nav>; }
export function Pagination({ page, totalPages, onPageChange, label = 'Pagination' }: { page: number; totalPages: number; onPageChange: (page: number) => void; label?: string }) { return <nav aria-label={label} className="bui-pagination"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button><span aria-live="polite">Page {page} of {Math.max(totalPages,1)}</span><Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button></nav>; }
