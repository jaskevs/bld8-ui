import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {createHash,randomUUID} from 'node:crypto';
import {createUploadDemoApi} from '../examples/upload-http/demo-api';

const bytes=(value:string)=>new TextEncoder().encode(value);
const session=()=>randomUUID();
const headers=(scope:string,id='file-one',name='notes.txt')=>({'Content-Type':'application/octet-stream','X-BLD8-Session':scope,'X-BLD8-Request-Id':id,'X-BLD8-File-Name':encodeURIComponent(name)});
function request(body:BodyInit|null,custom:Record<string,string>,signal?:AbortSignal){return new Request('http://example.test/api/files',{method:'POST',body,headers:custom,signal,duplex:'half'} as RequestInit);}
async function withReceiver(handler:ReturnType<typeof createUploadDemoApi>,run:(url:string)=>Promise<void>){
  const server=createServer(async(incoming,outgoing)=>{
    const controller=new AbortController();incoming.on('aborted',()=>controller.abort());incoming.on('error',()=>{});
    try{
      const value=new Request('http://127.0.0.1'+incoming.url,{method:incoming.method,headers:incoming.headers as Record<string,string>,body:Readable.toWeb(incoming),signal:controller.signal,duplex:'half'} as RequestInit);
      const response=await handler(value);outgoing.writeHead(response.status,Object.fromEntries(response.headers));outgoing.end(Buffer.from(await response.arrayBuffer()));
    }catch{if(!outgoing.destroyed)outgoing.writeHead(500).end();}
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{await run('http://127.0.0.1:'+(server.address() as {port:number}).port);}
  finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
test('a real HTTP transfer acknowledges the exact received bytes and digest',async()=>{
  await withReceiver(createUploadDemoApi(),async base=>{
    const body=bytes('A small file. Café.\n'),response=await fetch(base,{method:'POST',headers:headers(session(),'file-one','café.txt'),body});
    expect(response.status).toBe(201);expect(response.headers.get('cache-control')).toBe('no-store');
    const receipt=await response.json();expect(receipt).toMatchObject({requestId:'file-one',bytes:body.byteLength,sha256:createHash('sha256').update(body).digest('hex')});expect(receipt.id).toMatch(/^receipt-/);expect(receipt).not.toHaveProperty('url');
  });
});
test('real retries reuse a temporary receipt while content conflicts and session namespaces remain separate',async()=>{
  await withReceiver(createUploadDemoApi(),async base=>{
    const scope=session(),send=(body:string,custom=headers(scope))=>fetch(base,{method:'POST',headers:custom,body:bytes(body)});
    const first=await(await send('same')).json(),repeat=await send('same');expect(repeat.status).toBe(200);expect(await repeat.json()).toEqual(first);
    expect((await send('different')).status).toBe(409);expect((await send('same',headers(scope,'file-one','other.txt'))).status).toBe(409);
    const other=await(await send('same',headers(session()))).json();expect(other.id).not.toBe(first.id);
    const failed=await send('retry',{'X-BLD8-Fail':'1',...headers(scope,'retry-one')});expect(failed.status).toBe(503);
    expect((await send('retry',headers(scope,'retry-one'))).status).toBe(201);
  });
});
test('the receiver validates headers, origin, declared lengths and actual streaming bounds',async()=>{
  const handler=createUploadDemoApi({maxBytes:32}),valid=headers(session());
  for(const [patch,status] of [
    [{'X-BLD8-Session':'invalid'},400],[{'X-BLD8-Request-Id':'bad id'},400],[{'X-BLD8-Request-Id':'constructor'},400],[{'X-BLD8-File-Name':'folder%2Ffile.txt'},400],
    [{'Content-Type':'text/plain'},415],[{'Origin':'https://other.test'},403],[{'Content-Length':'4'},400],[{'Content-Length':'33'},413],
  ] as const)expect((await handler(request(bytes('abc'),{...valid,...patch}))).status).toBe(status);
  expect((await handler(new Request('http://example.test',{method:'GET'}))).status).toBe(405);
  let cancelled=false;const body=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(33));},cancel(){cancelled=true;}});
  expect((await handler(request(body,valid))).status).toBe(413);expect(cancelled).toBe(true);
  expect((await handler(request(new Uint8Array(),headers(session(),'empty')))).status).toBe(201);
  const normalised=new Request('http://localhost:3121/api/files',{method:'POST',body:bytes('abc'),headers:{...headers(session(),'normalised'),Host:'127.0.0.1:3121',Origin:'http://127.0.0.1:3121'}});
  expect((await handler(normalised)).status).toBe(201);
});
test('temporary receipts expire and metadata storage stays bounded',async()=>{
  let now=1000;const handler=createUploadDemoApi({receipts:1,receiptTtlMs:20,now:()=>now}),scope=session();
  const first=await handler(request(bytes('a'),headers(scope,'a')));expect(first.status).toBe(201);const oldId=(await first.json()).id;
  expect((await handler(request(bytes('b'),headers(scope,'b')))).status).toBe(503);
  now=1021;expect((await handler(request(bytes('b'),headers(scope,'b')))).status).toBe(201);
  now=1042;const fresh=await handler(request(bytes('a'),headers(scope,'a')));expect(fresh.status).toBe(201);expect((await fresh.json()).id).not.toBe(oldId);
});
test('cancellation and read timeouts release receiver capacity without acknowledging partial data',async()=>{
  const handler=createUploadDemoApi({maxActive:1,readTimeoutMs:100}),scope=session(),controller=new AbortController();let cancelled=false;
  const waiting=handler(request(new ReadableStream<Uint8Array>({cancel(){cancelled=true;}}),headers(scope,'waiting'),controller.signal));
  expect((await handler(request(bytes('x'),headers(scope,'busy')))).status).toBe(429);controller.abort();expect((await waiting).status).toBe(499);expect(cancelled).toBe(true);
  expect((await handler(request(bytes('x'),headers(scope,'after-abort')))).status).toBe(201);
  const timeout=await handler(request(new ReadableStream<Uint8Array>(),headers(scope,'timeout')));expect(timeout.status).toBe(408);
  expect((await handler(request(bytes('x'),headers(scope,'after-timeout')))).status).toBe(201);
});

test('locked and previously consumed bodies do not leak receiver capacity',async()=>{
  const handler=createUploadDemoApi({maxActive:1}),scope=session(),locked=request(bytes('x'),headers(scope,'locked')),reader=locked.body!.getReader();
  expect((await handler(locked)).status).toBe(400);reader.releaseLock();
  const used=request(bytes('x'),headers(scope,'used'));await used.text();expect((await handler(used)).status).toBe(400);
  expect((await handler(request(bytes('x'),headers(scope,'after-locked')))).status).toBe(201);
});
