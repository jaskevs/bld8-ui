import {test,expect} from '@playwright/test';
import {randomUUID,createHash} from 'node:crypto';
const endpoint='/api/examples/data-workspace';
const query={search:'',filters:{version:1,match:'all',rules:[]},sorts:[],page:1,pageSize:20};

test('real HTTP sessions isolate atomic batches and replay the exact receipt',async({request})=>{
  const headers={'X-BLD8-Session':randomUUID()},other={'X-BLD8-Session':randomUUID()};
  const list=async(h:Record<string,string>)=>{const response=await request.get(endpoint,{headers:h,params:{query:JSON.stringify(query)}});expect(response.status()).toBe(200);return (await response.json()).rows as {id:string;revision:number;title:string}[];};
  const rows=await list(headers),original=rows[0],untouched=rows[1];
  const batch={requestId:randomUUID(),changes:[{id:original.id,expectedRevision:original.revision,values:{title:'Saved through the HTTP adapter'}}]};
  const save=await request.patch(endpoint,{headers,data:batch});expect(save.status()).toBe(200);const receipt=await save.json();expect(receipt.rows[0].revision).toBe(2);
  const replay=await request.patch(endpoint,{headers,data:batch});expect(await replay.json()).toEqual(receipt);
  const conflict=await request.patch(endpoint,{headers,data:{requestId:randomUUID(),changes:[{id:original.id,expectedRevision:1,values:{title:'Stale update'}},{id:untouched.id,expectedRevision:1,values:{title:'Must never partially save'}}]}});expect(conflict.status()).toBe(409);
  expect((await list(headers))[1].title).toBe(untouched.title);expect((await list(other))[0]).toEqual(original);
});

test('HTTP workspace reloads saved records and acknowledges real supporting-file bytes',async({page})=>{
  let holdReload=false,reloadStarted=false,releaseReload!:()=>void;
  const reloadGate=new Promise<void>(resolve=>{releaseReload=resolve;});
  await page.route(url=>url.pathname===endpoint,async route=>{
    if(holdReload&&route.request().method()==='GET'){reloadStarted=true;await reloadGate;}
    await route.continue().catch(()=>{});
  });
  await page.goto('/examples/data-workspace');
  const workspace=page.getByRole('region',{name:'Data workspace',exact:true}).nth(1),cell=workspace.locator('[data-row-id="ISS-101"][data-column-key="title"]');
  await expect(cell).toBeVisible();await cell.focus();await cell.press('Enter');const input=workspace.getByRole('textbox',{name:'Title for ISS-101',exact:true});await input.fill('A saved HTTP record');await input.press('Enter');
  await workspace.getByRole('button',{name:'Review changes',exact:true}).click();const review=page.getByRole('dialog',{name:'Review pending changes',exact:true});
  holdReload=true;
  const saved=page.waitForResponse(response=>response.url().includes(endpoint)&&response.request().method()==='PATCH');await review.getByRole('button',{name:'Save 1 record',exact:true}).click();expect((await saved).status()).toBe(200);await expect(review).not.toBeVisible();
  try{await expect.poll(()=>reloadStarted).toBe(true);await expect(workspace.locator('.bblocks-data-workspace-grid')).toHaveAttribute('aria-busy','true');await expect(cell).toContainText('A saved HTTP record');}
  finally{holdReload=false;releaseReload();}
  await expect(workspace.locator('.bblocks-data-workspace-grid')).toHaveAttribute('aria-busy','false');
  await page.reload();await expect(cell).toContainText('A saved HTTP record');await cell.focus();await workspace.getByRole('button',{name:'Open record',exact:true}).click();const drawer=page.getByRole('dialog',{name:'Issue ISS-101',exact:true});
  const bytes=Buffer.from('Supporting material, acknowledged separately.');await drawer.locator('input[type=file]').setInputFiles({name:'support.txt',mimeType:'text/plain',buffer:bytes});
  const uploaded=page.waitForResponse(response=>response.url().includes('/api/examples/uploads')&&response.request().method()==='POST');await drawer.getByRole('button',{name:'Start queued',exact:true}).click();const response=await uploaded;expect(response.status()).toBe(201);const receipt=await response.json();expect(receipt.bytes).toBe(bytes.length);expect(receipt.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));await expect(drawer.locator('[data-upload-status=complete]')).toContainText('Acknowledged');
});
