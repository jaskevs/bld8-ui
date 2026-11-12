/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {useId,type ComponentProps,type ReactNode} from 'react';
import {cx} from './core.js';

export interface FieldsetProps extends Omit<ComponentProps<'fieldset'>,'title'> {
  /** A native legend names the complete group. */
  legend:ReactNode;
  hint?:string;error?:string;
}
/** Native grouping without adding a second field label or changing form ownership. */
export function Fieldset({legend,hint,error,id:suppliedId,className,children,...props}:FieldsetProps){
  const generated=useId(),id=suppliedId||generated;
  const description=[props['aria-describedby'],hint&&id+'-hint',error&&id+'-error'].filter(Boolean).join(' ')||undefined;
  return <fieldset {...props} id={id} className={cx('bui-fieldset',className)} aria-invalid={error?true:props['aria-invalid']} aria-describedby={description}>
    <legend className="bui-fieldset-legend">{legend}</legend>
    {hint&&<p className="bui-hint" id={id+'-hint'}>{hint}</p>}
    <div className="bui-fieldset-content">{children}</div>
    {error&&<p className="bui-error" role="alert" id={id+'-error'}>{error}</p>}
  </fieldset>;
}
