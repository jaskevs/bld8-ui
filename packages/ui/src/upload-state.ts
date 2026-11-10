export type UploadStatus='queued'|'uploading'|'processing'|'complete'|'error'|'cancelled';
export interface UploadProgress {loaded:number;total?:number}
/** A service acknowledgement, not a promise of durable storage. */
export interface UploadReceipt {id:string;requestId:string;bytes:number;sha256?:string}
export interface UploadFileContext {signal:AbortSignal;requestId:string;onProgress:(progress:UploadProgress)=>void}
export type UploadFileHandler=(file:globalThis.File,context:UploadFileContext)=>Promise<UploadReceipt>;
export interface UploadQueueItem {id:string;requestId:string;file:globalThis.File;status:UploadStatus;attempt:number;loaded:number;total?:number;receipt?:UploadReceipt;error?:string}
export interface UploadQueueLimits {maxFiles?:number;maxSize?:number;concurrency?:number}

const plain=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const validId=(value:unknown):value is string=>typeof value==='string'&&!!value.trim()&&value.length<=128&&!/[\u0000-\u0020\u007f]/.test(value)&&!['__proto__','prototype','constructor'].includes(value);
export function validateUploadReceipt(value:unknown,requestId:string,bytes:number):UploadReceipt {
  if(!plain(value)||!validId(value.id)||!validId(value.requestId)||value.requestId!==requestId||!Number.isSafeInteger(value.bytes)||value.bytes!==bytes||bytes<0||value.sha256!==undefined&&(typeof value.sha256!=='string'||!/^[a-f\d]{64}$/i.test(value.sha256)))throw new Error('The upload service returned an invalid acknowledgement.');
  return {id:value.id,requestId:value.requestId,bytes:value.bytes as number,...(value.sha256===undefined?{}:{sha256:(value.sha256 as string).toLowerCase()})};
}
export function validateUploadLimits({maxFiles=5,maxSize=10*1024*1024,concurrency=2}:UploadQueueLimits={}) {
  if(!Number.isInteger(maxFiles)||maxFiles<1||maxFiles>20||!Number.isSafeInteger(maxSize)||maxSize<1||maxSize>100*1024*1024||!Number.isInteger(concurrency)||concurrency<1||concurrency>3)throw new Error('Use 1–20 files, a per-file limit up to 100 MiB and concurrency from 1–3.');
  return {maxFiles,maxSize,concurrency};
}
/** Ignore malformed or regressing transport events rather than showing invented progress. */
export function validateUploadProgress(value:unknown,previous:UploadProgress={loaded:0},bytes?:number):UploadProgress|null {
  if(!plain(value)||!Number.isSafeInteger(value.loaded)||(value.loaded as number)<0||(value.loaded as number)<previous.loaded||value.total!==undefined&&(!Number.isSafeInteger(value.total)||(value.total as number)<0||(value.loaded as number)>(value.total as number))||previous.total!==undefined&&value.total!==undefined&&value.total!==previous.total||bytes!==undefined&&((value.loaded as number)>bytes||value.total!==undefined&&value.total!==bytes))return null;
  const total=value.total===undefined?previous.total:value.total as number;
  if(total!==undefined&&(value.loaded as number)>total)return null;
  return {loaded:value.loaded as number,...(total===undefined?{}:{total})};
}
export function uploadFileError(file:globalThis.File,accept:string,maxSize:number):string|null {
  if(typeof file.name!=='string'||!file.name.trim()||file.name.length>255||/[\u0000-\u001f\u007f/\\]/.test(file.name)||!Number.isSafeInteger(file.size)||file.size<0)return 'Use a file with a valid name and size.';
  if(file.size>maxSize)return 'Exceeds the per-file size limit.';
  if(accept&&!accept.split(',').some(raw=>{const rule=raw.trim().toLowerCase(),type=file.type.toLowerCase();return rule.startsWith('.')?file.name.toLowerCase().endsWith(rule):rule.endsWith('/*')?type.startsWith(rule.slice(0,-1)):!!rule&&type===rule;}))return 'Unsupported file type.';
  return null;
}
export function formatUploadBytes(value:number):string {return value<1024?value+' B':value<1024*1024?(value/1024).toFixed(1)+' KB':(value/1024/1024).toFixed(1)+' MB';}
