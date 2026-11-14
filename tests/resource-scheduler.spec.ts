import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {applySchedulerChange,createMemoryResourceScheduler,schedulerInstant,schedulerSegments,snapSchedulerMinutes,validateSchedulerChange,validateSchedulerDays,validateSchedulerSaveResult,validateSchedulerSnapshot,type SchedulerSnapshot,type SchedulerChange} from '../packages/ui/src/resource-scheduler-state';

const initial:SchedulerSnapshot={revision:1,resources:[{id:'person',label:'Alex',kind:'person'},{id:'room',label:'Review room',kind:'room'}],availability:[{id:'person-day',resourceId:'person',start:'2026-11-16T09:00:00Z',end:'2026-11-16T17:00:00Z'},{id:'room-day',resourceId:'room',start:'2026-11-16T09:00:00Z',end:'2026-11-16T17:00:00Z'}],events:[{id:'review',resourceId:'person',title:'Interface review',start:'2026-11-16T09:00:00Z',end:'2026-11-16T10:00:00Z',revision:1},{id:'sync',resourceId:'person',title:'Design sync',start:'2026-11-16T11:00:00Z',end:'2026-11-16T12:00:00Z',revision:1}]};
const change:SchedulerChange={eventId:'review',expectedRevision:1,expectedSnapshotRevision:1,resourceId:'person',start:'2026-11-16T09:15:00.000Z',end:'2026-11-16T10:15:00.000Z'},requestId='11111111-1111-4111-8111-111111111111';
async function open(page:Page,id='resource-scheduler-recovery'){await page.goto('/components/resource-scheduler/examples/'+id);const demo=page.locator('[data-example-id="'+id+'"]');const run=demo.getByRole('button',{name:'Run example',exact:true});if(await run.count())await run.click();await expect(demo.locator('.bui-resource-scheduler')).toBeVisible();return demo;}
async function mode(page:Page,value:string){await page.getByRole('combobox',{name:'Scheduler service preview',exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();}
async function proposal(page:Page){const demo=await open(page),event=demo.getByRole('button',{name:'Edit Interface review',exact:true}).first();await event.focus();await event.press('ArrowRight');await demo.getByRole('button',{name:'Review change',exact:true}).click();return demo;}

test('resource snapshots validate canonical instants, identities, availability and half-open overlap',()=>{
  const clean=validateSchedulerSnapshot(initial);expect(clean.events[0].start).toBe('2026-11-16T09:00:00.000Z');expect(initial.events[0].start).toBe('2026-11-16T09:00:00Z');
  expect(()=>validateSchedulerSnapshot({...initial,resources:[initial.resources[0],initial.resources[0]]})).toThrow(/unique/);
  for(const value of ['2026-02-30T09:00:00Z','2026-11-16T09:00:01Z','2026-11-16T09:00:00+00:00'])expect(()=>schedulerInstant(value)).toThrow();
  expect(()=>validateSchedulerSnapshot({...initial,events:[initial.events[0],{...initial.events[1],start:'2026-11-16T09:45:00Z'}]})).toThrow(/overlap/);
  expect(()=>validateSchedulerSnapshot({...initial,events:[{...initial.events[0],start:'2026-11-16T08:45:00Z'}]})).toThrow(/availability/);
  expect(validateSchedulerSnapshot({...initial,events:[initial.events[0],{...initial.events[1],start:'2026-11-16T10:00:00Z'}]}).events).toHaveLength(2);
  expect(validateSchedulerSnapshot({...initial,events:[initial.events[0],{...initial.events[1],resourceId:'room',start:'2026-11-16T09:00:00Z'}]}).events).toHaveLength(2);
  expect(()=>validateSchedulerSnapshot({...initial,resources:Array.from({length:51},(_,index)=>({id:'r'+index,label:'Resource'}))})).toThrow(/50 resources/);
});

test('explicit day windows preserve the short and repeated IANA days without guessing wall clocks',()=>{
  const spring=validateSchedulerDays([{date:'2026-03-08',start:'2026-03-08T05:00:00Z',end:'2026-03-09T04:00:00Z'}],'America/New_York')[0];expect(schedulerInstant(spring.end)-schedulerInstant(spring.start)).toBe(23*3600000);
  const fall=validateSchedulerDays([{date:'2026-11-01',start:'2026-11-01T04:00:00Z',end:'2026-11-02T05:00:00Z'}],'America/New_York')[0];expect(schedulerInstant(fall.end)-schedulerInstant(fall.start)).toBe(25*3600000);
  expect(()=>validateSchedulerDays([{date:'2026-11-01',start:'2026-11-01T03:00:00Z',end:'2026-11-02T05:00:00Z'}],'America/New_York')).toThrow(/labelled/);
  expect(()=>validateSchedulerDays(new Array(8).fill(fall),'America/New_York')).toThrow(/seven/);
});

test('scheduler snapping and clipped geometry stay finite and bounded',()=>{
  expect(snapSchedulerMinutes(22,15)).toBe(15);expect(snapSchedulerMinutes(23,15)).toBe(30);expect(()=>snapSchedulerMinutes(Infinity,15)).toThrow();
  const day={date:'2026-11-16',start:'2026-11-16T09:30:00Z',end:'2026-11-16T10:30:00Z'},segments=schedulerSegments(initial.events,[day]);expect(segments).toHaveLength(1);expect(segments[0]).toMatchObject({offset:0,width:50,clippedStart:true,clippedEnd:false});
  expect(()=>schedulerSegments([{...initial.events[0],end:initial.events[0].start}],[day])).toThrow(/positive/);
});

test('atomic scheduler proposals reject stale revisions and receipts cannot rewrite other records',()=>{
  expect(validateSchedulerChange(initial,change).eventId).toBe('review');expect(()=>validateSchedulerChange(initial,{...change,expectedRevision:2})).toThrow(/changed/);
  expect(()=>validateSchedulerChange(initial,{...change,start:'2026-11-16T10:30:00Z',end:'2026-11-16T11:30:00Z'})).toThrow(/already/);
  const result=applySchedulerChange(initial,change,requestId);expect(result.ok).toBe(true);if(!result.ok)return;expect(result.snapshot.revision).toBe(2);expect(result.snapshot.events[0].revision).toBe(2);expect(result.snapshot.events[1]).toEqual(validateSchedulerSnapshot(initial).events[1]);
  expect(validateSchedulerSaveResult(result,initial,change,requestId)).toEqual(result);expect(()=>validateSchedulerSaveResult({...result,requestId:'different'},initial,change,requestId)).toThrow(/match/);
  expect(()=>validateSchedulerSaveResult({...result,snapshot:{...result.snapshot,events:result.snapshot.events.slice(0,1)}},initial,change,requestId)).toThrow(/unexpected/);
  expect(applySchedulerChange(result.snapshot,change,requestId)).toMatchObject({ok:false,code:'conflict'});
});

test('memory source reconciles one request identity and rejects payload reuse or aborted writes',async()=>{
  const service=createMemoryResourceScheduler(initial),context={signal:new AbortController().signal,requestId};const first=await service.save(change,context),again=await service.save(change,context);expect(again).toEqual(first);expect(service.read().revision).toBe(2);
  expect(await service.save({...change,end:'2026-11-16T10:30:00Z'},context)).toMatchObject({ok:false,code:'validation'});const aborted=new AbortController();aborted.abort();await expect(service.save(change,{signal:aborted.signal,requestId:'22222222-2222-4222-8222-222222222222'})).rejects.toThrow(/Aborted/);expect(service.read().revision).toBe(2);
});

test('keyboard proposals never save on movement and Escape restores the untouched schedule',async({page})=>{
  const demo=await open(page),event=demo.getByRole('button',{name:'Edit Interface review',exact:true}).first();await event.focus();await event.press('ArrowRight');await expect(event).toBeFocused();await expect(demo.locator('.bui-resource-scheduler-preview')).toHaveCount(1);await expect(demo.getByLabel('Scheduler save request IDs')).toHaveText('[]');await event.press('Escape');await expect(demo.locator('.bui-resource-scheduler-preview')).toHaveCount(0);await expect(event).toBeFocused();
  await event.press('ArrowRight');await event.press('Shift+ArrowRight');await demo.getByRole('button',{name:'Review change',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Review scheduled event',exact:true});await expect(dialog).toContainText('09:15');await expect(dialog).toContainText('10:30');await dialog.getByRole('button',{name:'Save change',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(demo.locator('.bui-resource-scheduler-status')).toContainText('confirmed');await expect(event).toBeFocused();
});

test('lost scheduler acknowledgement retains a frozen request until same-ID reconciliation',async({page})=>{
  const demo=await proposal(page);await page.getByRole('dialog').getByRole('button',{name:'Keep proposal',exact:true}).click();await mode(page,'Lost acknowledgement');await demo.getByRole('button',{name:'Review change',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Save change',exact:true}).click();await expect(dialog).toContainText('may have committed');await expect(dialog.getByRole('combobox',{name:'Resource',exact:true})).toBeDisabled();await dialog.getByRole('button',{name:'Retry unchanged save',exact:true}).click();await expect(dialog).not.toBeVisible();const ids=JSON.parse(await demo.getByLabel('Scheduler save request IDs').innerText());expect(ids).toHaveLength(2);expect(ids[0]).toBe(ids[1]);await demo.getByRole('button',{name:'Exact table',exact:true}).click();await expect(demo.getByRole('row').filter({hasText:'Interface review'})).toContainText('2026-11-16T09:15:00.000Z');
});

test('conflict comparison keeps proposed instants until explicit revision rebase',async({page})=>{
  const demo=await open(page);await mode(page,'Newer revision');const event=demo.getByRole('button',{name:'Edit Interface review',exact:true}).first();await event.focus();await event.press('ArrowRight');await event.press('Enter');const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Save change',exact:true}).click();await expect(dialog).toContainText('Latest schedule revision: 2');await expect(dialog).toContainText('09:15');await dialog.getByRole('button',{name:'Use latest revisions and keep proposal',exact:true}).click();await dialog.getByRole('button',{name:'Save change',exact:true}).click();await expect(dialog).not.toBeVisible();await demo.getByRole('button',{name:'Exact table',exact:true}).click();await expect(demo.getByRole('row').filter({hasText:'Interface review'})).toContainText('3');
});

test('pointer preview is snapped and pointer cancellation never sends a write',async({page})=>{
  const demo=await open(page),event=demo.locator('[data-scheduler-event="review"] .bui-resource-scheduler-event-button'),cell=demo.locator('[data-scheduler-cell][data-scheduler-resource="alex"]').first();await event.scrollIntoViewIfNeeded();const a=await event.boundingBox(),b=await cell.boundingBox();expect(a&&b).toBeTruthy();if(!a||!b)return;await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2+b.width/16,a.y+a.height/2,{steps:5});await expect(demo.locator('.bui-resource-scheduler-preview')).toHaveCount(1);await page.keyboard.press('Escape');await page.mouse.up();await expect(demo.locator('.bui-resource-scheduler-preview')).toHaveCount(0);await expect(demo.getByLabel('Scheduler save request IDs')).toHaveText('[]');
});

test('resource edge resizing previews a snapped end and requires explicit review before saving',async({page})=>{
  const demo=await open(page),handle=demo.locator('[data-scheduler-event="review"] [data-scheduler-resize="end"]'),cell=demo.locator('[data-scheduler-cell][data-scheduler-resource="alex"]').first();await handle.scrollIntoViewIfNeeded();const a=await handle.boundingBox(),b=await cell.boundingBox();if(!a||!b)throw Error('Resource resize geometry missing');await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2+b.width/16,a.y+a.height/2,{steps:4});await page.mouse.up();const dialog=page.getByRole('dialog',{name:'Review scheduled event',exact:true});await expect(dialog.getByRole('combobox',{name:'End time',exact:true})).toContainText('10:30');await expect(demo.getByLabel('Scheduler save request IDs')).toHaveText('[]');await dialog.getByRole('button',{name:'Keep proposal',exact:true}).click();await demo.getByRole('button',{name:'Discard proposal',exact:true}).click();
});

test('resource pointer preview does not insert a proposal bar above its captured lane',async({page})=>{
  const demo=await open(page),event=demo.locator('[data-scheduler-event="review"] .bui-resource-scheduler-event-button'),lane=demo.locator('[data-scheduler-cell][data-scheduler-resource="alex"]').first();await event.scrollIntoViewIfNeeded();const box=await event.boundingBox(),before=await lane.boundingBox();if(!box||!before)throw Error('Resource lane geometry missing');await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+before.width/16,box.y+box.height/2,{steps:5});await expect(demo.locator('.bui-resource-scheduler-preview')).toHaveCount(1);const during=await lane.boundingBox();expect(during!.y).toBeCloseTo(before.y,0);await page.keyboard.press('Escape');await page.mouse.up();await expect(demo.getByLabel('Scheduler save request IDs')).toHaveText('[]');
});

test('an old scheduler receipt confirms its operation without rolling back a newer supplied revision',async({page})=>{
  const demo=await open(page);await mode(page,'Lost acknowledgement');const event=demo.getByRole('button',{name:'Edit Interface review',exact:true}).first();await event.focus();await event.press('ArrowRight');await event.press('Enter');const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Save change',exact:true}).click();await expect(dialog).toContainText('may have committed');await dialog.getByRole('button',{name:'Keep proposal',exact:true}).click();await demo.getByRole('button',{name:'Publish newer supplied schedule',exact:true}).click();await demo.getByRole('button',{name:'Exact table',exact:true}).click();const sync=demo.getByRole('row').filter({has:page.getByRole('rowheader',{name:'Design sync',exact:true})});await expect(sync).toContainText('2026-11-16T11:15:00.000Z');await demo.getByRole('button',{name:'Reconcile save',exact:true}).click();await dialog.getByRole('button',{name:'Retry unchanged save',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(sync).toContainText('2026-11-16T11:15:00.000Z');await expect(demo.locator('.bui-resource-scheduler-status')).toContainText('newer supplied schedule is retained');const ids=JSON.parse(await demo.getByLabel('Scheduler save request IDs').innerText());expect(ids).toHaveLength(2);expect(ids[0]).toBe(ids[1]);
});

test('late service responses cannot repopulate a replaced scheduler source',async({page})=>{
  const demo=await open(page);await mode(page,'Late service response');const event=demo.getByRole('button',{name:'Edit Interface review',exact:true}).first();await event.focus();await event.press('ArrowRight');await event.press('Enter');const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Save change',exact:true}).click();await dialog.getByRole('button',{name:'Stop waiting',exact:true}).click();await dialog.getByRole('button',{name:'Keep proposal',exact:true}).click();await demo.getByRole('button',{name:'Reset scheduler source',exact:true}).click();await page.waitForTimeout(700);await expect(demo.getByLabel('Scheduler save request IDs')).toHaveText('[]');await expect(demo.locator('.bui-resource-scheduler-preview')).toHaveCount(0);await demo.getByRole('button',{name:'Exact table',exact:true}).click();await expect(demo.getByRole('row').filter({hasText:'Interface review'})).toContainText('2026-11-16T09:00:00.000Z');
});

test('moving an event to another supplied day returns focus to the visible scheduler heading',async({page})=>{
  const demo=await open(page);await demo.getByRole('button',{name:'Edit Interface review',exact:true}).first().click();const dialog=page.getByRole('dialog');for(const label of ['Start day','End day']){await dialog.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:/17 Nov/}).click();}await dialog.getByRole('button',{name:'Save change',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(demo.getByRole('heading',{name:'Resource planning',exact:true})).toBeFocused();await expect(demo.getByRole('button',{name:'Edit Interface review',exact:true})).toHaveCount(0);
});

test('phone agenda and exact repeated-hour table remain contained, operable and accessible',async({page})=>{
  await page.setViewportSize({width:390,height:844});const demo=await open(page,'resource-scheduler-repeated-hour');await expect(demo.locator('.bui-resource-scheduler-board')).toBeHidden();await expect(demo.locator('.bui-resource-scheduler-mobile-agenda')).toBeVisible();await demo.getByRole('button',{name:'Use right-to-left',exact:true}).click();await demo.getByRole('button',{name:'Exact table',exact:true}).click();const table=demo.getByRole('table');await expect(table).toContainText('UTC-04:00');await expect(table).toContainText('UTC-05:00');await expect(table.locator('time').first()).toHaveAttribute('datetime','2026-11-01T05:00:00.000Z');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await new AxeBuilder({page}).include('[data-example-id="resource-scheduler-repeated-hour"]').analyze()).violations).toEqual([]);
});

for(const width of [320,390])test('resource day navigation stays aligned and operable at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});const demo=await open(page),nav=demo.locator('.bui-resource-scheduler-day-controls'),previous=nav.getByRole('button',{name:'Previous supplied day',exact:true}),day=nav.getByRole('combobox',{name:'Displayed day',exact:true}),next=nav.getByRole('button',{name:'Next supplied day',exact:true});
  const boxes=await Promise.all([previous,day,next].map(control=>control.boundingBox()));if(boxes.some(box=>!box))throw Error('Day navigation geometry missing');const [left,center,right]=boxes as {x:number;y:number;width:number;height:number}[];expect(Math.abs(left.y-center.y)).toBeLessThanOrEqual(1);expect(Math.abs(right.y-center.y)).toBeLessThanOrEqual(1);expect(left.x+left.width).toBeLessThan(center.x);expect(center.x+center.width).toBeLessThan(right.x);expect(left.height).toBeGreaterThanOrEqual(44);expect(center.height).toBeGreaterThanOrEqual(44);expect(right.height).toBeGreaterThanOrEqual(44);expect(await nav.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(previous).toBeDisabled();await next.click();await expect(day).toContainText('17 Nov');await expect(previous).toBeEnabled();await previous.click();await expect(day).toContainText('16 Nov');await day.click();await page.getByRole('option',{name:/18 Nov/}).click();await expect(day).toContainText('18 Nov');await expect(next).toBeDisabled();
});
