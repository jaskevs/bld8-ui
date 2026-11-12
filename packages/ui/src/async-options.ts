/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
/** A stable form value and its display data. Extend this object for rich option rows. */
export interface AsyncOption {value:string;label:string;description?:string;disabled?:boolean}
export interface AsyncOptionsRequest {query:string;cursor:string|null;signal:AbortSignal}
export interface AsyncOptionsPage<T extends AsyncOption=AsyncOption> {items:readonly T[];nextCursor:string|null}
export type AsyncOptionsLoader<T extends AsyncOption=AsyncOption>=(request:AsyncOptionsRequest)=>Promise<AsyncOptionsPage<T>>;
export type AsyncOptionsResolver<T extends AsyncOption=AsyncOption>=(request:{values:readonly string[];signal:AbortSignal})=>Promise<readonly T[]>;

const reserved=new Set(['__proto__','prototype','constructor']);
const plain=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
export function isAsyncOptionValue(value:unknown):value is string {return typeof value==='string'&&!!value.trim()&&value.length<=128&&!/[\u0000-\u001f\u007f]/.test(value)&&!reserved.has(value);}
export function validateAsyncValues(values:readonly string[]):string[] {
  if(!Array.isArray(values)||values.length>100||Array.from(values).some(value=>!isAsyncOptionValue(value))||new Set(values).size!==values.length)throw new Error('Choose at most 100 unique, stable option values.');
  return [...values];
}
export function validateAsyncOption<T extends AsyncOption=AsyncOption>(value:unknown):T {
  if(!plain(value)||!isAsyncOptionValue(value.value)||typeof value.label!=='string'||!value.label.trim()||value.label.length>200
    ||value.description!==undefined&&(typeof value.description!=='string'||value.description.length>500)
    ||value.disabled!==undefined&&typeof value.disabled!=='boolean')throw new Error('The option source returned invalid display data.');
  return {...value} as unknown as T;
}
export function validateAsyncPage<T extends AsyncOption=AsyncOption>(value:unknown):AsyncOptionsPage<T> {
  if(!plain(value)||!Array.isArray(value.items)||value.items.length>100||value.nextCursor!==null&&(typeof value.nextCursor!=='string'||!value.nextCursor||value.nextCursor.length>512||/[\u0000-\u001f\u007f]/.test(value.nextCursor)))throw new Error('The option source returned an invalid page.');
  const items=Array.from(value.items).map(item=>validateAsyncOption<T>(item));
  if(new Set(items.map(item=>item.value)).size!==items.length)throw new Error('The option source returned duplicate values.');
  return {items,nextCursor:value.nextCursor as string|null};
}
export function validateResolvedOptions<T extends AsyncOption=AsyncOption>(value:unknown,requested:readonly string[]):T[] {
  validateAsyncValues(requested);
  if(!Array.isArray(value)||value.length>100)throw new Error('The option source returned invalid selected values.');
  const items=Array.from(value).map(item=>validateAsyncOption<T>(item));
  if(new Set(items.map(item=>item.value)).size!==items.length||items.some(item=>!requested.includes(item.value)))throw new Error('The option source returned unexpected selected values.');
  return items;
}
