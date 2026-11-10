import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {handlePeopleDirectory} from '../examples/async-selection/directory';

async function withDirectory(run:(url:string)=>Promise<void>){
  const server=createServer(async(request,response)=>{
    const result=handlePeopleDirectory(new Request('http://localhost'+request.url,{method:request.method}));
    response.writeHead(result.status,Object.fromEntries(result.headers));response.end(Buffer.from(await result.arrayBuffer()));
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{await run('http://127.0.0.1:'+(server.address() as {port:number}).port);}
  finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
}

test('real directory HTTP paging covers a bounded source without repeating option IDs',async()=>{
  await withDirectory(async base=>{
    let cursor:string|null=null;const values:string[]=[];
    do{
      const response=await fetch(base+'?'+new URLSearchParams({source:'product',...(cursor?{cursor}:{})}));
      expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');
      const page=await response.json();expect(page.items).toHaveLength(20);values.push(...page.items.map((item:{value:string})=>item.value));cursor=page.nextCursor;
    }while(cursor);
    expect(values).toHaveLength(60);expect(new Set(values).size).toBe(60);expect(values.slice(0,3)).toEqual(['maya','sam','oliver']);
    const filtered=await(await fetch(base+'?query=mAyA')).json();expect(filtered.items.map((item:{value:string})=>item.value)).toEqual(['maya']);expect(filtered.nextCursor).toBeNull();
  });
});
test('selected IDs resolve independently from paging and the source scope controls their labels',async()=>{
  await withDirectory(async base=>{
    const product=await(await fetch(base+'?source=product&values=sam,maya,missing')).json();
    const research=await(await fetch(base+'?source=research&values=sam,maya')).json();
    expect(product.map((person:{value:string})=>person.value)).toEqual(['sam','maya']);
    expect(product.map((person:{label:string})=>person.label)).toEqual(['Sam Rivera','Maya Chen']);
    expect(research.map((person:{label:string})=>person.label)).toEqual(['Sam Ortiz','Maya Field']);
    const final=await(await fetch(base+'?cursor=40')).json();expect(final.items.find((person:{value:string})=>person.value==='person-60').disabled).toBe(true);
  });
});
test('the directory boundary rejects malformed requests and exposes a deliberate recoverable failure',async()=>{
  await withDirectory(async base=>{
    for(const query of ['source=unknown','cursor=-1','cursor=61','cursor=1.5','values=maya,maya','query=a&query=b','private=1','fail=yes','query='+encodeURIComponent('x'.repeat(1001))])expect((await fetch(base+'?'+query)).status,query).toBe(400);
    expect((await fetch(base,{method:'POST'})).status).toBe(405);
    const failure=await fetch(base+'?fail=1');expect(failure.status).toBe(503);expect(await failure.json()).toEqual({error:'The sample directory is temporarily unavailable.'});
    expect((await fetch(base)).status).toBe(200);
  });
});
