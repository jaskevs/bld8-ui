import {test,expect,type Page,type Route} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createHash} from 'node:crypto';
import {createUploadHttpAdapter} from '../packages/ui/src/upload-http';
import {uploadFileError,validateUploadLimits,validateUploadProgress,validateUploadReceipt} from '../packages/ui/src/upload-state';

const example='/examples/upload-http';
const file=(name:string,body='Interface notes')=>({name,mimeType:'text/plain',buffer:Buffer.from(body)});
const queue=(page:Page)=>page.getByRole('group',{name:'Files to receive',exact:true});
const row=(page:Page,name:string)=>queue(page).locator('[data-upload-id]').filter({has:page.getByText(name,{exact:true})});
const input=(page:Page)=>page.getByLabel('Files to receive files',{exact:true});
const release=()=>{let finish!:()=>void;const promise=new Promise<void>(resolve=>{finish=resolve;});return {promise,finish};};
const ack=(route:Route)=>({id:'receipt-'+route.request().headers()['x-bld8-request-id'],requestId:route.request().headers()['x-bld8-request-id'],bytes:route.request().postDataBuffer()?.length??0});
const accept=(route:Route)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(ack(route))});

test('upload contracts reject forged receipts, invalid bounds and regressing or oversized progress',()=>{
  const receipt={id:'receipt-1',requestId:'request-1',bytes:5,sha256:'A'.repeat(64)};
  expect(validateUploadReceipt(receipt,'request-1',5)).toEqual({...receipt,sha256:'a'.repeat(64)});
  for(const value of [{...receipt,id:''},{...receipt,requestId:'other'},{...receipt,bytes:6},{...receipt,bytes:NaN},{...receipt,sha256:'invalid'},{...receipt,id:'a\nb'},null])expect(()=>validateUploadReceipt(value,'request-1',5)).toThrow();
  expect(validateUploadLimits()).toEqual({maxFiles:5,maxSize:10*1024*1024,concurrency:2});
  for(const value of [{maxFiles:21},{maxFiles:1.5},{maxSize:0},{maxSize:101*1024*1024},{concurrency:0},{concurrency:4}])expect(()=>validateUploadLimits(value)).toThrow();
  expect(validateUploadProgress({loaded:2},{loaded:0},5)).toEqual({loaded:2});expect(validateUploadProgress({loaded:5,total:5},{loaded:2},5)).toEqual({loaded:5,total:5});expect(validateUploadProgress({loaded:0,total:0},{loaded:0},0)).toEqual({loaded:0,total:0});
  for(const value of [{loaded:-1},{loaded:1.2},{loaded:NaN},{loaded:6,total:6},{loaded:4,total:3},{loaded:3,total:10}])expect(validateUploadProgress(value,{loaded:2},5)).toBeNull();
  expect(validateUploadProgress({loaded:2},{loaded:3},5)).toBeNull();
  expect(uploadFileError(new File(['notes'],'notes.txt',{type:'text/plain'}),'.txt',5)).toBeNull();expect(uploadFileError(new File(['notes'],'notes.exe',{type:'text/plain'}),'.txt',5)).toContain('Unsupported');expect(uploadFileError(new File(['notes'],'notes.txt'),'',4)).toContain('size limit');
});

test('XHR sends real event progress and waits for a correlated acknowledgement, with bounded failure and abort cleanup',async()=>{
  type Handler=((event?:any)=>void)|null;
  class Xhr {
    static all:Xhr[]=[];headers:Record<string,string>={};upload:{onprogress:Handler;onload:Handler}={onprogress:null,onload:null};
    onload:Handler=null;onerror:Handler=null;ontimeout:Handler=null;onabort:Handler=null;onprogress:Handler=null;onreadystatechange:Handler=null;
    responseText='';status=200;readyState=1;aborted=false;responseType='';timeout=0;withCredentials=false;sent?:Blob;
    constructor(){Xhr.all.push(this);}open(method:string,url:string){expect(method).toBe('POST');expect(url).toBe('/receiver');}setRequestHeader(name:string,value:string){this.headers[name]=value;}getResponseHeader(){return null;}send(body:Blob){this.sent=body;}abort(){this.aborted=true;this.onabort?.();}
  }
  const original=globalThis.XMLHttpRequest;Object.assign(globalThis,{XMLHttpRequest:Xhr});
  try{
    const updates:unknown[]=[],abort=new AbortController(),handler=createUploadHttpAdapter({endpoint:'/receiver',headers:()=>({'X-Example':'session'})}),selected=new File(['Notes'],'café.txt');
    let resolved=false;const result=handler(selected,{signal:abort.signal,requestId:'request-1',onProgress:value=>updates.push(value)}).then(value=>{resolved=true;return value;});
    const xhr=Xhr.all.at(-1)!;expect(xhr.sent).toBe(selected);expect(xhr.headers['X-BLD8-File-Name']).toBe('caf%C3%A9.txt');expect(xhr.headers['X-BLD8-Request-Id']).toBe('request-1');expect(xhr.headers['Content-Type']).toBe('application/octet-stream');expect(xhr.headers['X-Example']).toBe('session');
    xhr.upload.onprogress?.({loaded:2,total:5,lengthComputable:true});xhr.upload.onload?.();expect(updates).toEqual([{loaded:2,total:5},{loaded:5,total:5}]);await Promise.resolve();expect(resolved).toBe(false);
    xhr.responseText=JSON.stringify({id:'receipt-1',requestId:'request-1',bytes:5});xhr.onload?.();await expect(result).resolves.toEqual({id:'receipt-1',requestId:'request-1',bytes:5});expect(xhr.upload.onprogress).toBeNull();expect(xhr.onload).toBeNull();
    const cancelled=new AbortController(),pending=handler(selected,{signal:cancelled.signal,requestId:'request-2',onProgress:()=>{throw Error('No late progress');}}),stopped=Xhr.all.at(-1)!;cancelled.abort();await expect(pending).rejects.toHaveProperty('name','AbortError');expect(stopped.aborted).toBe(true);expect(stopped.upload.onprogress).toBeNull();
    for(const response of [{body:'not JSON',status:200},{body:JSON.stringify({id:'wrong',requestId:'other',bytes:5}),status:200},{body:'denied',status:403},{body:'x'.repeat(16385),status:200}]){const request=handler(selected,{signal:new AbortController().signal,requestId:'request-3',onProgress:()=>{}}),current=Xhr.all.at(-1)!;current.status=response.status;current.responseText=response.body;current.onload?.();await expect(request).rejects.toThrow();}
    const oversized=handler(selected,{signal:new AbortController().signal,requestId:'request-4',onProgress:()=>{}}),large=Xhr.all.at(-1)!;large.onprogress?.({loaded:16385});await expect(oversized).rejects.toThrow('response limit');expect(large.aborted).toBe(true);
    const emptyProgress:unknown[]=[],empty=handler(new File([],'empty.txt'),{signal:new AbortController().signal,requestId:'empty',onProgress:value=>emptyProgress.push(value)}),zero=Xhr.all.at(-1)!;zero.upload.onload?.();expect(emptyProgress).toEqual([{loaded:0,total:0}]);zero.responseText=JSON.stringify({id:'empty-receipt',requestId:'empty',bytes:0});zero.onload?.();await expect(empty).resolves.toHaveProperty('bytes',0);
  }finally{Object.assign(globalThis,{XMLHttpRequest:original});}
});

test('manual queue sends the selected bytes and encoded name through the real receiver',async({page})=>{
  const requests:{name:string;requestId:string}[]=[];page.on('request',request=>{if(new URL(request.url()).pathname==='/api/examples/uploads')requests.push({name:request.headers()['x-bld8-file-name'],requestId:request.headers()['x-bld8-request-id']});});
  await page.goto(example);await input(page).setInputFiles(file('café-review.txt','A useful review'));await expect(row(page,'café-review.txt')).toHaveAttribute('data-upload-status','queued');expect(requests).toHaveLength(0);
  const responsePending=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/examples/uploads'&&response.request().method()==='POST');await queue(page).getByRole('button',{name:'Start queued',exact:true}).click();const response=await responsePending;expect(response.status()).toBe(201);const digest=createHash('sha256').update('A useful review').digest('hex');await expect(row(page,'café-review.txt')).toHaveAttribute('data-upload-status','complete');expect(requests).toHaveLength(1);expect(decodeURIComponent(requests[0].name)).toBe('café-review.txt');expect(await response.json()).toMatchObject({requestId:requests[0].requestId,bytes:Buffer.byteLength('A useful review'),sha256:digest});
  await expect(row(page,'café-review.txt')).toContainText(digest);await expect(row(page,'café-review.txt').getByRole('button',{name:'Remove café-review.txt',exact:true})).toBeFocused();
  await queue(page).getByRole('button',{name:'Remove café-review.txt',exact:true}).click();await expect(queue(page).getByRole('button',{name:'Browse files',exact:true})).toBeFocused();
});

test('bounded concurrency keeps sent files processing until acknowledgement and starts the next authorised file',async({page})=>{
  const requests:Route[]=[],waits:ReturnType<typeof release>[]=[];
  await page.route('**/api/examples/uploads',async route=>{const held=release();requests.push(route);waits.push(held);await held.promise;await accept(route).catch(()=>{});});
  await page.goto(example);await input(page).setInputFiles([file('first.txt'),file('second.txt'),file('third.txt')]);await queue(page).getByRole('button',{name:'Start queued',exact:true}).click();
  await expect.poll(()=>requests.length).toBe(2);await expect(row(page,'third.txt')).toHaveAttribute('data-upload-status','queued');await expect(row(page,'first.txt')).not.toHaveAttribute('data-upload-status','complete');
  const outside=page.getByRole('checkbox',{name:'Fail next upload',exact:true});await outside.focus();waits[0].finish();await expect.poll(()=>requests.length).toBe(3);await expect(row(page,'first.txt')).toHaveAttribute('data-upload-status','complete');await expect(outside).toBeFocused();
  waits[1].finish();waits[2].finish();await expect(queue(page).locator('[data-upload-status=complete]')).toHaveCount(3);
});

test('cancel and retry preserve request identity while removed attempts cannot return late receipts',async({page})=>{
  const requests:Route[]=[],waits:ReturnType<typeof release>[]=[];
  await page.route('**/api/examples/uploads',async route=>{const held=release();requests.push(route);waits.push(held);await held.promise;await accept(route).catch(()=>{});});
  await page.goto(example);await input(page).setInputFiles(file('retry.txt'));await queue(page).getByRole('button',{name:'Start queued',exact:true}).click();await expect.poll(()=>requests.length).toBe(1);
  await queue(page).getByRole('button',{name:'Cancel retry.txt',exact:true}).click();await expect(row(page,'retry.txt')).toHaveAttribute('data-upload-status','cancelled');const retry=queue(page).getByRole('button',{name:'Retry retry.txt',exact:true});await expect(retry).toBeFocused();await retry.press('Enter');await expect.poll(()=>requests.length).toBe(2);await expect(queue(page).getByRole('button',{name:'Cancel retry.txt',exact:true})).toBeFocused();
  expect(requests[1].request().headers()['x-bld8-request-id']).toBe(requests[0].request().headers()['x-bld8-request-id']);waits[0].finish();await expect(row(page,'retry.txt')).not.toHaveAttribute('data-upload-status','complete');
  await queue(page).getByRole('button',{name:'Remove retry.txt',exact:true}).click();await expect(row(page,'retry.txt')).toHaveCount(0);await expect(queue(page).getByRole('button',{name:'Browse files',exact:true})).toBeFocused();waits[1].finish();await expect(row(page,'retry.txt')).toHaveCount(0);
});

test('real failed request retains a retryable file, stable ID and keyboard focus',async({page})=>{
  const ids:string[]=[];page.on('request',request=>{if(new URL(request.url()).pathname==='/api/examples/uploads')ids.push(request.headers()['x-bld8-request-id']);});
  await page.goto(example);await page.getByRole('checkbox',{name:'Fail next upload',exact:true}).check();await input(page).setInputFiles(file('recover.txt'));await queue(page).getByRole('button',{name:'Start queued',exact:true}).click();await expect(row(page,'recover.txt')).toHaveAttribute('data-upload-status','error');const retry=queue(page).getByRole('button',{name:'Retry recover.txt',exact:true});await expect(retry).toBeFocused();await expect(row(page,'recover.txt')).toContainText('Upload failed. Try again.');await retry.press('Enter');await expect(row(page,'recover.txt')).toHaveAttribute('data-upload-status','complete');expect(ids).toHaveLength(2);expect(ids[0]).toBe(ids[1]);await expect(queue(page).getByRole('button',{name:'Remove recover.txt',exact:true})).toBeFocused();
});

test('replacing a receiver cancels its focused attempt and rejects its late acknowledgement',async({page})=>{
  const requests:Route[]=[],waits:ReturnType<typeof release>[]=[];
  await page.route('**/api/examples/uploads',async route=>{const held=release();requests.push(route);waits.push(held);await held.promise;await accept(route).catch(()=>{});});
  await page.goto(example);await input(page).setInputFiles(file('source.txt'));await queue(page).getByRole('button',{name:'Start queued',exact:true}).click();await expect.poll(()=>requests.length).toBe(1);await expect(queue(page).getByRole('button',{name:'Cancel source.txt',exact:true})).toBeFocused();
  // A host source change can arrive while the row owns focus; activating the
  // native button programmatically preserves that ownership for this check.
  await page.getByRole('button',{name:'Replace upload adapter',exact:true}).evaluate(element=>(element as HTMLButtonElement).click());
  await expect(row(page,'source.txt')).toHaveAttribute('data-upload-status','cancelled');const retry=queue(page).getByRole('button',{name:'Retry source.txt',exact:true});await expect(retry).toBeFocused();waits[0].finish();await expect(row(page,'source.txt')).not.toHaveAttribute('data-upload-status','complete');
  await retry.press('Enter');await expect.poll(()=>requests.length).toBe(2);expect(requests[1].request().headers()['x-bld8-session']).not.toBe(requests[0].request().headers()['x-bld8-session']);await expect(queue(page).getByRole('button',{name:'Cancel source.txt',exact:true})).toBeFocused();waits[1].finish();await expect(row(page,'source.txt')).toHaveAttribute('data-upload-status','complete');await expect(queue(page).getByRole('button',{name:'Remove source.txt',exact:true})).toBeFocused();
});

test('a malformed 2xx receipt never completes a file and can be retried',async({page})=>{
  let count=0;await page.route('**/api/examples/uploads',route=>++count===1?route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...ack(route),bytes:999})}):accept(route));
  await page.goto(example);await input(page).setInputFiles(file('ack.txt'));await queue(page).getByRole('button',{name:'Start queued',exact:true}).click();await expect(row(page,'ack.txt')).toHaveAttribute('data-upload-status','error');await expect(row(page,'ack.txt')).not.toContainText('Acknowledged');await queue(page).getByRole('button',{name:'Retry ack.txt',exact:true}).click();await expect(row(page,'ack.txt')).toHaveAttribute('data-upload-status','complete');
});

test('file bounds reject before transmission and disabled selection leaves active cancellation available',async({page})=>{
  const held=release();let requests=0;await page.route('**/api/examples/uploads',async route=>{requests++;await held.promise;await accept(route).catch(()=>{});});
  await page.goto(example);await input(page).setInputFiles([...Array.from({length:6},(_,index)=>file('file-'+index+'.txt')),file('large.txt','x'.repeat(2*1024*1024+1))]);await expect(queue(page).locator('[data-upload-id]')).toHaveCount(5);await expect(queue(page).getByRole('alert')).toContainText('Limit of 5 files');await expect(queue(page).getByRole('alert')).toContainText('per-file size limit');expect(requests).toBe(0);
  await queue(page).getByRole('button',{name:'Start queued',exact:true}).click();await expect.poll(()=>requests).toBe(2);await page.getByRole('checkbox',{name:'Disable new uploads',exact:true}).check();await expect(input(page)).toBeDisabled();await expect(queue(page).getByRole('button',{name:'Start queued',exact:true})).toBeDisabled();await queue(page).getByRole('button',{name:'Cancel file-0.txt',exact:true}).click();await expect(row(page,'file-0.txt')).toHaveAttribute('data-upload-status','cancelled');await expect(queue(page).getByRole('button',{name:'Retry file-0.txt',exact:true})).toBeDisabled();expect(requests).toBe(2);held.finish();
});

for(const theme of ['light','dark'] as const)test('upload queue remains readable, contained and accessible on a phone in '+theme,async({page})=>{
  await page.setViewportSize({width:320,height:780});await page.goto(example);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
  await input(page).setInputFiles(file('An-interface-review-with-a-deliberately-long-file-name.txt'));await expect(queue(page).locator('[data-upload-id]')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const results=await new AxeBuilder({page}).include('.upload-http-example').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations.map(value=>({id:value.id,targets:value.nodes.map(node=>node.target)}))).toEqual([]);
  const selected=queue(page).locator('[data-upload-id]');expect(await selected.evaluate(element=>getComputedStyle(element).animationName)).toBe('none');expect(await queue(page).locator('.bui-upload-queue-stage').evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
  await queue(page).getByRole('button',{name:/^Remove /}).click();await expect(queue(page).getByRole('button',{name:'Browse files',exact:true})).toBeFocused();
});
