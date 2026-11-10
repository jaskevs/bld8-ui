import {test,expect} from '@playwright/test';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {parseDataQuery,parseDataTsv,stringifyDataTsv,parseDataValue,validateDataChanges,type DataBatchRequest,type DataColumn} from '../packages/ui/src/data-workspace-state';
import {createIssueDataSnapshot,createMemoryIssueDataSource,createIssueDataHttpSource,defaultDataQuery,issueDataColumns,queryIssueData,saveIssueData} from '../packages/blocks/src/issue-data-source';
import {issueFields,issueSeed,type Issue} from '../packages/blocks/src/issue-repository';
import {createPersistentIssueDataSource} from '../examples/data-workspace/persistent-store.mjs';
import {createIssueDataHandler} from '../examples/data-workspace/http-handler.mjs';

const signal=()=>new AbortController().signal;
const batch=(changes:DataBatchRequest<Issue>['changes'],requestId=randomUUID()):DataBatchRequest<Issue>=>({requestId,changes});
const twenty=():Issue[]=>Array.from({length:20},(_,index)=>({...issueSeed[index%issueSeed.length],id:'ISS-'+(1000+index),revision:1,title:'Issue '+index}));
async function directory(run:(file:string)=>Promise<void>){const base=resolve('.local');await mkdir(base,{recursive:true});const folder=await mkdtemp(join(base,'data-contract-'));try{await run(join(folder,'issues.json'));}finally{if(!resolve(folder).startsWith(base+sep))throw new Error('Refuse to remove an unexpected test directory.');await rm(folder,{recursive:true,force:true});}}
async function withHttp(source:Awaited<ReturnType<typeof createPersistentIssueDataSource>>,run:(base:string)=>Promise<void>){
  const handler=createIssueDataHandler(source),server=createServer(async(incoming,outgoing)=>{try{const request=new Request('http://127.0.0.1'+incoming.url,{method:incoming.method,headers:incoming.headers as Record<string,string>,...(!['GET','HEAD'].includes(incoming.method??'GET')?{body:Readable.toWeb(incoming),duplex:'half'}:{})} as RequestInit);const response=await handler(request);outgoing.writeHead(response.status,Object.fromEntries(response.headers));outgoing.end(Buffer.from(await response.arrayBuffer()));}catch{outgoing.writeHead(500).end();}});
  await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));try{await run('http://127.0.0.1:'+(server.address() as {port:number}).port+'/api/issues');}finally{server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));}
}

test('canonical typed edits reject invalid decimals, dates, choices and protected fields',()=>{
  const number=issueDataColumns.find(column=>column.key==='estimate')!,date=issueDataColumns.find(column=>column.key==='due')!;
  expect(parseDataValue(number,' 12.5 ')).toEqual({value:12.5});
  for(const value of ['',null,'1,000','1e3',Infinity,-1,'1000'])expect(parseDataValue(number,value).error).toBeTruthy();
  expect(parseDataValue(date,'2028-02-29')).toEqual({value:'2028-02-29'});expect(parseDataValue(date,'2026-02-29').error).toBeTruthy();
  expect(parseDataValue(issueDataColumns.find(column=>column.key==='status')!,'unknown').error).toBeTruthy();
  expect(parseDataValue(issueDataColumns[0],'ISS-999').error).toContain('read-only');
  expect(parseDataValue({key:'title',label:'Title',type:'text'} as DataColumn<Issue>,'Title').error).toContain('read-only');
  expect(validateDataChanges(issueSeed,issueDataColumns,[{id:issueSeed[0].id,expectedRevision:1,values:{estimate:'2' as any}}])[0].message).toContain('canonical');
});

test('queries combine nested filters, ordered multi-sort and stable IDs before paging',()=>{
  const rows=twenty().map((row,index)=>({...row,status:'review' as const,estimate:index%3,title:index%2?'Same':'Other'})),snapshot=createIssueDataSnapshot(rows);
  const query={...defaultDataQuery(),pageSize:5,sorts:[{key:'title',descending:true},{key:'estimate',descending:false}],filters:{version:2 as const,root:{id:'root',match:'all' as const,children:[{id:'status',field:'status',operator:'anyOf' as const,values:['review']}]}}};
  const all=queryIssueData(snapshot,{...query,pageSize:100}).rows;
  const pages=Array.from({length:4},(_,page)=>queryIssueData(snapshot,{...query,page:page+1}).rows).flat();
  expect(pages).toEqual(all);expect(new Set(pages.map(row=>row.id)).size).toBe(20);
  expect(all.slice(0,3).map(row=>[row.title,row.estimate])).toEqual([['Same',0],['Same',0],['Same',0]]);
  for(const bad of [{...query,sorts:[{key:'title',descending:false},{key:'title',descending:true}]},{...query,sorts:Array(1)},{...query,page:0},{...query,pageSize:'5'},{...query,search:'x'.repeat(201)}])expect(parseDataQuery(bad,issueDataColumns,issueFields)).toBeNull();
});

test('twenty typed changes commit once, with atomic validation/conflict rejection and replay receipts',()=>{
  const rows=twenty(),snapshot=createIssueDataSnapshot(rows),request=batch(rows.map((row,index)=>({id:row.id,expectedRevision:1,values:{estimate:index+0.5,status:'done',due:'2026-12-01'}})));
  const bad={...request,changes:request.changes.map((change,index)=>index===19?{...change,values:{...change.values,estimate:-1}}:change)};
  expect(saveIssueData(snapshot,bad).result).toMatchObject({ok:false,code:'validation'});expect(saveIssueData(snapshot,bad).next).toBe(snapshot);
  const saved=saveIssueData(snapshot,request);expect(saved.result.ok).toBe(true);expect(saved.next.rows.every(row=>row.revision===2&&row.status==='done')).toBe(true);expect(snapshot.rows.every(row=>row.revision===1)).toBe(true);
  expect(saveIssueData(saved.next,request).result).toEqual(saved.result);expect(saveIssueData(saved.next,request).next).toBe(saved.next);
  expect(saveIssueData(saved.next,{...request,changes:[{...request.changes[0],values:{title:'A different request'}}]}).result).toMatchObject({ok:false,code:'validation'});
  const conflict=saveIssueData(saved.next,batch(request.changes));expect(conflict.result).toMatchObject({ok:false,code:'conflict'});expect(conflict.next).toBe(saved.next);
  const duplicate=batch([request.changes[0],request.changes[0]]);expect(saveIssueData(snapshot,duplicate).result).toMatchObject({ok:false,code:'validation'});
  const protectedPatch=batch([{id:rows[0].id,expectedRevision:1,values:JSON.parse('{"__proto__":{"polluted":true}}')}]);expect(saveIssueData(snapshot,protectedPatch).result).toMatchObject({ok:false,code:'validation'});expect(({} as any).polluted).toBeUndefined();
});

test('persistent HTTP batches and retry receipts survive reopening, while concurrent revisions cannot both win',async()=>{
  await directory(async file=>{
    const rows=twenty();await writeFile(file,JSON.stringify(createIssueDataSnapshot(rows)));
    const store=await createPersistentIssueDataSource(file),request=batch(rows.map((row,index)=>({id:row.id,expectedRevision:1,values:{title:'Saved issue '+index,estimate:index}})));
    await withHttp(store,async base=>{const client=createIssueDataHttpSource(base);const saved=await client.save(request,{signal:signal()});expect(saved.ok).toBe(true);expect((await client.load({...defaultDataQuery(),pageSize:100},{signal:signal()})).rows).toHaveLength(20);});
    const reopened=await createPersistentIssueDataSource(file);const again=await reopened.save(request,{signal:signal()});expect(again.ok).toBe(true);expect((await reopened.load({...defaultDataQuery(),pageSize:100},{signal:signal()})).rows.every(row=>row.revision===2)).toBe(true);
    const before=await readFile(file,'utf8');const conflict=await reopened.save(batch([{id:rows[0].id,expectedRevision:1,values:{title:'Stale edit'}},{id:rows[1].id,expectedRevision:2,values:{title:'Must not save'}}]),{signal:signal()});expect(conflict).toMatchObject({ok:false,code:'conflict',conflicts:[{id:rows[0].id,revision:2}]});expect(await readFile(file,'utf8')).toBe(before);
    const results=await Promise.all(['First title','Second title'].map(title=>reopened.save(batch([{id:rows[0].id,expectedRevision:2,values:{title}}]),{signal:signal()})));expect(results.filter(result=>result.ok)).toHaveLength(1);expect(results.filter(result=>!result.ok&&result.code==='conflict')).toHaveLength(1);
  });
});

test('locks, corrupt snapshots and missing files fail without destroying stored data',async()=>{
  await directory(async file=>{const store=await createPersistentIssueDataSource(file),before=await readFile(file,'utf8');await writeFile(file+'.lock','active');await expect(store.save(batch([{id:issueSeed[0].id,expectedRevision:1,values:{title:'Locked update'}}]),{signal:signal()})).rejects.toThrow('locked');expect(await readFile(file,'utf8')).toBe(before);await rm(file+'.lock');await writeFile(file,'corrupt snapshot');await expect(createPersistentIssueDataSource(file)).rejects.toThrow();expect(await readFile(file,'utf8')).toBe('corrupt snapshot');await rm(file);await expect(store.save(batch([{id:issueSeed[0].id,expectedRevision:1,values:{title:'Missing update'}}]),{signal:signal()})).rejects.toThrow('missing');await expect(readFile(file)).rejects.toThrow();});
});

test('HTTP handler bounds requests, rejects cross-origin writes and uses exact routes',async()=>{
  const handler=createIssueDataHandler(createMemoryIssueDataSource()),send=(body:string,extra:Record<string,string>={})=>handler(new Request('http://example.test/api/issues',{method:'PATCH',headers:{'Content-Type':'application/json',...extra},body}));
  expect((await send('{}',{Origin:'https://elsewhere.test'})).status).toBe(403);
  expect((await send('{}',{'Content-Type':'text/plain'})).status).toBe(415);
  expect((await send('x'.repeat(100001))).status).toBe(413);expect((await send('not json')).status).toBe(400);expect((await send('{}'))).toMatchObject({status:422});
  expect((await handler(new Request('http://example.test/unexpected/api/issues'))).status).toBe(404);expect((await handler(new Request('http://example.test/api/issues',{method:'POST'}))).status).toBe(405);
  const sparse={...defaultDataQuery(),sorts:[null]};expect((await handler(new Request('http://example.test/api/issues?'+new URLSearchParams({query:JSON.stringify(sparse)})))).status).toBe(400);
});

test('timed-out or aborted bodies never save an otherwise complete JSON batch',async()=>{
  const source=createMemoryIssueDataSource(),handler=createIssueDataHandler(source),request=batch([{id:issueSeed[0].id,expectedRevision:1,values:{title:'Must not commit'}}]);
  let timedOutCancelled=false;
  const pending=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new TextEncoder().encode(JSON.stringify(request)));},cancel(){timedOutCancelled=true;}});
  const response=await handler(new Request('http://example.test/api/issues',{method:'PATCH',headers:{'Content-Type':'application/json'},body:pending,duplex:'half'} as RequestInit));expect(response.status).toBe(408);expect(timedOutCancelled).toBe(true);
  const controller=new AbortController();let abortedCancelled=false;
  const interrupted=new ReadableStream<Uint8Array>({start(stream){stream.enqueue(new TextEncoder().encode(JSON.stringify(request)));},cancel(){abortedCancelled=true;}});
  const result=handler(new Request('http://example.test/api/issues',{method:'PATCH',headers:{'Content-Type':'application/json'},body:interrupted,signal:controller.signal,duplex:'half'} as RequestInit));controller.abort();await expect(result).rejects.toMatchObject({name:'AbortError'});expect(abortedCancelled).toBe(true);
  const current=(await source.load(defaultDataQuery(),{signal:signal()})).rows.find(row=>row.id===issueSeed[0].id);expect(current).toMatchObject({title:issueSeed[0].title,revision:1});
});

test('HTTP clients reject plausible but incomplete receipts instead of discarding drafts',async()=>{
  const request=batch([{id:issueSeed[0].id,expectedRevision:1,values:{title:'Changed title'}}]);
  for(const response of [{ok:true,rows:[{...issueSeed[0],revision:2}]},{ok:true,rows:[{...issueSeed[0],title:'Changed title',revision:1}]},{ok:false,code:'conflict',conflicts:[]},{ok:false,code:'validation',errors:[null]}]){
    const client=createIssueDataHttpSource('/api/issues',async()=>Response.json(response));await expect(client.save(request,{signal:signal()})).rejects.toThrow('invalid');
  }
});

test('HTTP clients stop oversized streams, reject sparse records and expose only schema fields',async()=>{
  let cancelled=false;const response=()=>new Response(new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(250001));},cancel(){cancelled=true;}}));
  const oversized=createIssueDataHttpSource('/api/issues',async()=>response());await expect(oversized.load(defaultDataQuery(),{signal:signal()})).rejects.toThrow('oversized');expect(cancelled).toBe(true);
  const declared=createIssueDataHttpSource('/api/issues',async()=>new Response('{}',{headers:{'Content-Length':'250001'}}));await expect(declared.load(defaultDataQuery(),{signal:signal()})).rejects.toThrow('oversized');
  const sparse=createIssueDataHttpSource('/api/issues',async()=>Response.json({rows:[null],total:1}));await expect(sparse.load(defaultDataQuery(),{signal:signal()})).rejects.toThrow('invalid page');
  const extra=createIssueDataHttpSource('/api/issues',async()=>Response.json({rows:[{...issueSeed[0],internalNote:'private'}],total:1}));expect((await extra.load(defaultDataQuery(),{signal:signal()})).rows[0]).not.toHaveProperty('internalNote');
});

test('clipboard round-trips quoted multiline ranges and rejects malformed or excessive input',()=>{
  const values=[['one\ttwo','line\nnext','say "hello"'],['','','-2']];expect(parseDataTsv(stringifyDataTsv(values))).toEqual(values);
  expect(parseDataTsv('a\tb\r\nc\td\r\n')).toEqual([['a','b'],['c','d']]);
  for(const value of ['a"b\tc','"unfinished','"closed"tail','a\tb\nc','x'.repeat(100001)])expect(()=>parseDataTsv(value)).toThrow();
  expect(()=>parseDataTsv(null as any)).toThrow();expect(()=>parseDataTsv(Array.from({length:2001},()=>['x']).flat().join('\t'))).toThrow();
});
