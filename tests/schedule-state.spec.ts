import {test,expect} from '@playwright/test';
import {
  validateScheduleSnapshot,getScheduleDay,getScheduleStarts,formatScheduleTime,validateScheduleBooking,
  type ScheduleSnapshot,type ScheduleSlot,type ScheduleEvent,type ScheduleBooking,
} from '../packages/ui/src/schedule-state';

const start='2026-11-02T08:00:00Z',end='2026-11-02T10:00:00Z';
const slot=(id='morning',from=start,to=end):ScheduleSlot=>({id,start:from,end:to});
const event=(id='booked',from='2026-11-02T08:15:00Z',to='2026-11-02T08:45:00Z'):ScheduleEvent=>({...slot(id,from,to),title:'Review the interface',revision:1});
const snapshot=(slots:ScheduleSlot[]=[slot()],events:ScheduleEvent[]=[]):ScheduleSnapshot=>({revision:4,slots,events});
const booking=(overrides:Partial<ScheduleBooking>={}):ScheduleBooking=>({slotId:'morning',start,end:'2026-11-02T08:30:00Z',title:' Review the draft ',expectedRevision:4,...overrides});
const iso=(milliseconds:number)=>new Date(milliseconds).toISOString();

test('schedule snapshots clone, normalize and retain source order without mutating frozen input',()=>{
  const source=snapshot([slot('later','2026-11-03T08:00:00Z','2026-11-03T09:00:00Z'),slot()],[{...event(),title:'  Review the interface  '}]);
  Object.freeze(source);Object.freeze(source.slots);Object.freeze(source.events);source.slots.forEach(Object.freeze);source.events.forEach(Object.freeze);
  const before=JSON.stringify(source),clean=validateScheduleSnapshot(source);
  expect(clean).not.toBe(source);expect(clean.slots).not.toBe(source.slots);expect(clean.events[0]).not.toBe(source.events[0]);
  expect(clean.slots.map(row=>row.id)).toEqual(['later','morning']);expect(clean.slots[1].start).toBe('2026-11-02T08:00:00.000Z');
  expect(clean.events[0].title).toBe('Review the interface');expect(JSON.stringify(source)).toBe(before);
  clean.slots[0].id='changed';expect(source.slots[0].id).toBe('later');
  expect(validateScheduleSnapshot(snapshot([],[]))).toEqual({revision:4,slots:[],events:[]});
});

test('snapshot boundaries reject malformed envelopes, unsafe revisions and oversized supplied collections',()=>{
  for(const invalid of [null,[],{},{revision:1,slots:null,events:[]},{revision:1,slots:[],events:null}])expect(()=>validateScheduleSnapshot(invalid)).toThrow();
  for(const invalid of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'1']){
    expect(()=>validateScheduleSnapshot({...snapshot(),revision:invalid})).toThrow('revision');
    expect(()=>validateScheduleSnapshot(snapshot([],[{...event(),revision:invalid as number}]))).toThrow('revision');
  }
  expect(()=>validateScheduleSnapshot(snapshot(Array.from({length:201},(_,i)=>slot(String(i)))))).toThrow('200');
  expect(()=>validateScheduleSnapshot(snapshot([],Array.from({length:501},(_,i)=>event(String(i)))))).toThrow('500');
  expect(validateScheduleSnapshot({...snapshot(),revision:Number.MAX_SAFE_INTEGER}).revision).toBe(Number.MAX_SAFE_INTEGER);
});

test('interval validation requires actual whole-minute UTC instants and at most one elapsed day',()=>{
  for(const value of ['2026-02-30T08:00:00Z','2026-11-02T24:00:00Z','2026-11-02T08:00:01Z','2026-11-02T08:00:00.001Z','2026-11-02T08:00:00+00:00','2026-11-02','2026-11-02T08:00Z','0000-01-01T00:00:00Z','not a date']){
    expect(()=>validateScheduleSnapshot(snapshot([{...slot(),start:value}]))).toThrow();
    if(!['2026-11-02T08:00:01Z','2026-11-02T08:00:00.001Z'].includes(value))expect(()=>getScheduleDay(value,'UTC')).toThrow();
    expect(()=>formatScheduleTime(value,'UTC')).toThrow();
  }
  for(const [from,to] of [[start,start],[end,start],[start,'2026-11-03T08:01:00Z']])expect(()=>validateScheduleSnapshot(snapshot([slot('bad',from,to)]))).toThrow('24 hours');
  const wholeDay=validateScheduleSnapshot(snapshot([slot('day',start,'2026-11-03T08:00:00Z')]));expect(wholeDay.slots).toHaveLength(1);
  expect(validateScheduleSnapshot(snapshot([slot('milliseconds','2026-11-02T08:00:00.000Z','2026-11-02T09:00:00.000Z')])).slots[0].start).toBe('2026-11-02T08:00:00.000Z');
});

test('identities and titles are bounded and duplicate IDs are checked within each source collection',()=>{
  for(const id of ['', ' ', 'x'.repeat(81),null,3])expect(()=>validateScheduleSnapshot(snapshot([{...slot(),id:id as string}]))).toThrow('ID');
  for(const title of ['', ' x ', 'x'.repeat(121),null,3])expect(()=>validateScheduleSnapshot(snapshot([],[{...event(),title:title as string}]))).toThrow('title');
  expect(()=>validateScheduleSnapshot(snapshot([slot(),slot()]))).toThrow('unique IDs');
  expect(()=>validateScheduleSnapshot(snapshot([],[event(),event()]))).toThrow('unique IDs');
  const clean=validateScheduleSnapshot(snapshot([slot('__proto__')],[event('__proto__')]));expect(clean.slots[0].id).toBe('__proto__');expect(clean.events[0].id).toBe('__proto__');
});

test('availability and booked intervals use half-open overlap rules while old events need not fit current availability',()=>{
  expect(()=>validateScheduleSnapshot(snapshot([slot(),slot('overlap','2026-11-02T09:45:00Z','2026-11-02T10:30:00Z')]))).toThrow('must not overlap');
  expect(()=>validateScheduleSnapshot(snapshot([],[event(),event('overlap','2026-11-02T08:30:00Z','2026-11-02T09:00:00Z')]))).toThrow('must not overlap');
  expect(validateScheduleSnapshot(snapshot([slot(),slot('next','2026-11-02T10:00:00Z','2026-11-02T11:00:00Z')],[event(),event('adjacent','2026-11-02T08:45:00Z','2026-11-02T09:00:00Z')])).events).toHaveLength(2);
  expect(validateScheduleSnapshot(snapshot([slot()],[event('old','2026-10-30T08:00:00Z','2026-10-30T09:00:00Z')])).events).toHaveLength(1);
});

test('offered starts are chronological, duration-bounded and exclude every overlapping booked interval',()=>{
  const source=snapshot([slot('later','2026-11-02T10:00:00Z','2026-11-02T11:00:00Z'),slot()],[event()]),before=JSON.stringify(source);
  const starts=getScheduleStarts(source,'2026-11-02','UTC',30);
  expect(starts.map(row=>row.start.slice(11,16))).toEqual(['08:45','09:00','09:15','09:30','10:00','10:15','10:30']);
  expect(starts[0]).toEqual({slotId:'morning',start:'2026-11-02T08:45:00.000Z',end:'2026-11-02T09:15:00.000Z'});
  expect(JSON.stringify(source)).toBe(before);expect(getScheduleStarts(source,'2026-11-03','UTC',30)).toEqual([]);
  expect(getScheduleStarts(snapshot([slot('offset','2026-11-02T08:07:00Z','2026-11-02T09:07:00Z')]),'2026-11-02','UTC',30).map(row=>row.start.slice(11,16))).toEqual(['08:07','08:22','08:37']);
  for(const offered of starts)expect(()=>validateScheduleBooking(source,{...booking(),...offered})).not.toThrow();
});

test('booking validation rejects stale revisions, unoffered intervals and conflicting writes without mutating source',()=>{
  const source=snapshot(),before=JSON.stringify(source);
  expect(()=>validateScheduleBooking(source,booking())).not.toThrow();
  expect(()=>validateScheduleBooking(source,booking({expectedRevision:3}))).toThrow('schedule changed');
  expect(()=>validateScheduleBooking(source,booking({slotId:'missing'}))).toThrow('available start');
  expect(()=>validateScheduleBooking(source,booking({start:'2026-11-02T08:05:00Z',end:'2026-11-02T08:35:00Z'}))).toThrow('within its window');
  expect(()=>validateScheduleBooking(source,booking({start:'2026-11-02T07:45:00Z',end:'2026-11-02T08:15:00Z'}))).toThrow('within its window');
  expect(()=>validateScheduleBooking(source,booking({start:'2026-11-02T09:45:00Z',end:'2026-11-02T10:15:00Z'}))).toThrow('within its window');
  expect(()=>validateScheduleBooking(source,booking({end:'2026-11-02T08:20:00Z'}))).toThrow('15-minute steps');
  expect(()=>validateScheduleBooking(source,booking({end:'2026-11-02T10:15:00Z'}))).toThrow('15 to 120');
  expect(()=>validateScheduleBooking(source,booking({title:'x'}))).toThrow('title');
  expect(()=>validateScheduleBooking(snapshot([slot()],[event()]),booking())).toThrow('no longer available');
  expect(()=>validateScheduleBooking(source,null as unknown as ScheduleBooking)).toThrow('complete booking');
  expect(JSON.stringify(source)).toBe(before);
});

test('New York spring transition never invents the skipped hour and durations are real elapsed minutes',()=>{
  const source=snapshot([slot('spring','2026-03-08T06:00:00Z','2026-03-08T08:00:00Z')]);
  const starts=getScheduleStarts(source,'2026-03-08','America/New_York',30),labels=starts.map(row=>formatScheduleTime(row.start,'America/New_York'));
  expect(labels).toEqual(['01:00 · UTC-05:00','01:15 · UTC-05:00','01:30 · UTC-05:00','01:45 · UTC-05:00','03:00 · UTC-04:00','03:15 · UTC-04:00','03:30 · UTC-04:00']);
  expect(labels.every(value=>!value.startsWith('02:'))).toBe(true);
  const crossing=getScheduleStarts(source,'2026-03-08','America/New_York',60).find(row=>row.start==='2026-03-08T06:30:00.000Z')!;
  expect(formatScheduleTime(crossing.start,'America/New_York')).toBe('01:30 · UTC-05:00');expect(formatScheduleTime(crossing.end,'America/New_York')).toBe('03:30 · UTC-04:00');
  expect(Date.parse(crossing.end)-Date.parse(crossing.start)).toBe(60*60_000);
});

test('New York repeated local hour remains two distinct offered instants with different offset labels',()=>{
  const source=snapshot([slot('fall','2026-11-01T05:00:00Z','2026-11-01T07:00:00Z')]);
  const starts=getScheduleStarts(source,'2026-11-01','America/New_York',15),repeated=starts.filter(row=>formatScheduleTime(row.start,'America/New_York').startsWith('01:30'));
  expect(repeated.map(row=>row.start)).toEqual(['2026-11-01T05:30:00.000Z','2026-11-01T06:30:00.000Z']);
  expect(repeated.map(row=>formatScheduleTime(row.start,'America/New_York'))).toEqual(['01:30 · UTC-04:00','01:30 · UTC-05:00']);
  expect(new Set(starts.map(row=>row.start)).size).toBe(starts.length);
});

test('Melbourne transitions preserve its repeated hour, skip nonexistent starts and project dates explicitly',()=>{
  const fall=snapshot([slot('fall','2026-04-04T15:00:00Z','2026-04-04T17:00:00Z')]);
  const repeated=getScheduleStarts(fall,'2026-04-05','Australia/Melbourne',15).filter(row=>formatScheduleTime(row.start,'Australia/Melbourne').startsWith('02:30'));
  expect(repeated.map(row=>formatScheduleTime(row.start,'Australia/Melbourne'))).toEqual(['02:30 · UTC+11:00','02:30 · UTC+10:00']);
  const spring=snapshot([slot('spring','2026-10-03T15:00:00Z','2026-10-03T17:00:00Z')]);
  const labels=getScheduleStarts(spring,'2026-10-04','Australia/Melbourne',15).map(row=>formatScheduleTime(row.start,'Australia/Melbourne'));
  expect(labels.some(value=>value.startsWith('01:'))).toBe(true);expect(labels.some(value=>value.startsWith('03:'))).toBe(true);expect(labels.some(value=>value.startsWith('02:'))).toBe(false);
  expect(getScheduleDay('2026-11-02T13:30:00Z','Australia/Melbourne')).toBe('2026-11-03');expect(getScheduleDay('2026-11-02T13:30:00Z','America/New_York')).toBe('2026-11-02');
});

test('formatting retains explicit fractional-hour offsets, midnight and locale choice without relying on the system zone',()=>{
  expect(formatScheduleTime('2026-11-02T00:00:00Z','UTC')).toBe('00:00 · UTC+00:00');
  expect(formatScheduleTime('2026-11-02T00:00:00Z','Asia/Kolkata')).toBe('05:30 · UTC+05:30');
  expect(formatScheduleTime('2026-11-02T00:00:00Z','Australia/Adelaide','de-DE')).toBe('10:30 · UTC+10:30');
  expect(formatScheduleTime('1900-01-01T00:00:00Z','Asia/Kolkata')).toBe('05:21:10 · UTC+05:21:10');
  for(const zone of ['', 'not/a/zone','x'.repeat(101)]){expect(()=>getScheduleDay(start,zone)).toThrow('time zone');expect(()=>formatScheduleTime(start,zone)).toThrow('time zone');}
  for(const locale of ['', 'en_AU','x'.repeat(101)])expect(()=>formatScheduleTime(start,'UTC',locale)).toThrow('locale');
});

test('day projection keeps precise half-open end boundaries without relaxing supplied record precision',()=>{
  const midnight=Date.parse('2026-11-02T00:00:00Z');
  expect(getScheduleDay(iso(midnight),'UTC')).toBe('2026-11-02');expect(getScheduleDay(iso(midnight-1),'UTC')).toBe('2026-11-01');
  const historicEnd=Date.parse('1900-01-01T18:39:00Z');
  expect(formatScheduleTime(iso(historicEnd),'Asia/Kolkata')).toBe('00:00:10 · UTC+05:21:10');
  expect(getScheduleDay(iso(historicEnd-1),'Asia/Kolkata')).toBe('1900-01-02');
  expect(getScheduleDay(iso(historicEnd-60_000),'Asia/Kolkata')).toBe('1900-01-01');
  expect(()=>validateScheduleSnapshot(snapshot([slot('precise',iso(midnight-1),iso(midnight+60_000))]))).toThrow('whole-minute');
  expect(()=>formatScheduleTime(iso(midnight-1),'UTC')).toThrow('whole-minute');
});

test('invalid day and duration settings reject the query instead of shifting or rounding it',()=>{
  for(const day of ['2026-02-30','2026-1-01','0000-01-01','2026-11-02T00:00:00Z',''])expect(()=>getScheduleStarts(snapshot(),day,'UTC',30)).toThrow();
  for(const value of [0,14,20,121,Infinity,NaN,15.5,'30'])expect(()=>getScheduleStarts(snapshot(),'2026-11-02','UTC',value as number)).toThrow('15 to 120');
  expect(()=>getScheduleStarts(snapshot(),'2026-11-02','Invalid/Zone',30)).toThrow('time zone');
});

test('maximum bounded sources stay finite and a complete-day window has an exact finite candidate count',()=>{
  const base=Date.parse('2026-01-01T00:00:00Z');
  const slots=Array.from({length:200},(_,index)=>slot('slot-'+index,iso(base+index*86_400_000),iso(base+(index+1)*86_400_000)));
  const events=Array.from({length:500},(_,index)=>event('event-'+index,iso(base-(index+1)*86_400_000),iso(base-(index+1)*86_400_000+15*60_000)));
  const source=snapshot(slots,events),clean=validateScheduleSnapshot(source);
  expect(clean.slots).toHaveLength(200);expect(clean.events).toHaveLength(500);
  const starts=getScheduleStarts(clean,'2026-01-01','UTC',15);expect(starts).toHaveLength(96);expect(starts[0].start).toBe('2026-01-01T00:00:00.000Z');expect(starts.at(-1)!.end).toBe('2026-01-02T00:00:00.000Z');
  expect(()=>validateScheduleBooking(clean,{...starts[0],title:'Beyond the bounded source',expectedRevision:4})).toThrow('500 events');
});
