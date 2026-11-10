import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {handleProjectAreas} from '../examples/cascader/directory';

async function withDirectory(run:(url:string)=>Promise<void>){
  const server=createServer(async(request,response)=>{
    const result=handleProjectAreas(new Request('http://localhost'+request.url,{method:request.method}));
    response.writeHead(result.status,Object.fromEntries(result.headers));response.end(Buffer.from(await result.arrayBuffer()));
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{await run('http://127.0.0.1:'+(server.address() as {port:number}).port);}
  finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
test('the hierarchical HTTP source browses only children and resolves a complete leaf path',async()=>{
  await withDirectory(async base=>{
    const roots=await fetch(base);expect(roots.headers.get('cache-control')).toBe('no-store');const first=await roots.json();
    expect(first.items.map((node:{value:string})=>node.value)).toEqual(['engineering','design','operations']);expect(first.items.at(-1).disabled).toBe(true);
    const children=await(await fetch(base+'?'+new URLSearchParams({path:JSON.stringify(['engineering']),query:'BACK'}))).json();
    expect(children.items.map((node:{value:string})=>node.value)).toEqual(['backend']);expect(children.nextCursor).toBeNull();
    const resolved=await(await fetch(base+'?'+new URLSearchParams({values:JSON.stringify(['engineering','frontend','react'])}))).json();
    expect(resolved.map((node:{label:string})=>node.label)).toEqual(['Engineering','Frontend','React']);
  });
});
test('hierarchical lookup rejects branch commits, nonmember paths and unbounded requests',async()=>{
  await withDirectory(async base=>{
    for(const params of [
      {values:'["engineering"]'},{values:'["engineering","backend","react"]'},{path:'["react"]'},
      {path:'["engineering","frontend","react"]'},{path:'["engineering","engineering"]'},
      {values:'["operations"]'},{path:'not-json'},{cursor:'1'},{query:'x'.repeat(1001)},
      {values:'[]',path:'[]'},{private:'1'},
    ])expect((await fetch(base+'?'+new URLSearchParams(params))).status,JSON.stringify(params)).toBe(400);
    expect((await fetch(base+'?query=a&query=b')).status).toBe(400);expect((await fetch(base,{method:'POST'})).status).toBe(405);
  });
});
test('a failed child load is a recoverable HTTP result',async()=>{
  await withDirectory(async base=>{
    const query=new URLSearchParams({path:'["engineering"]',fail:'1'});expect((await fetch(base+'?'+query)).status).toBe(503);
    query.delete('fail');const response=await fetch(base+'?'+query);expect(response.status).toBe(200);expect((await response.json()).items).toHaveLength(2);
  });
});
