import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The configured schedule zone must remain independent of the browser's zone.
test.use({timezoneId:'UTC'});
const errors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const messages:string[]=[];errors.set(page,messages);page.on('pageerror',error=>messages.push(error.message));});
test.afterEach(async({page})=>expect(errors.get(page),'No uncaught schedule errors').toEqual([]));
const planner=(page:Page)=>page.getByRole('region',{name:'Schedule planner',exact:true});
const agenda=(page:Page)=>page.getByRole('region',{name:'Day agenda',exact:true});
const booking=(page:Page)=>page.getByRole('dialog',{name:'Book a time',exact:true});
async function choose(page:Page,label:string,option:string|RegExp){
  await page.getByRole('combobox',{name:label,exact:true}).click();
  await page.getByRole('option',{name:option,exact:typeof option==='string'}).click();
}
async function open(page:Page){
  await page.goto('/blocks/schedule-planner');
  await expect(agenda(page).getByRole('button',{name:/^Book /}).first()).toBeVisible();
}
async function preview(page:Page,state:string){await choose(page,'Schedule preview state',state);}
async function startBooking(page:Page,title:string){
  const trigger=agenda(page).getByRole('button',{name:/^Book /}).first();
  const label=await trigger.getAttribute('aria-label')??await trigger.innerText();
  await trigger.click();await expect(booking(page)).toBeVisible();
  const field=booking(page).getByRole('textbox',{name:'Appointment title',exact:true});
  await expect(field).toBeFocused();await field.fill(title);
  return {trigger,label,field};
}
async function contained(page:Page){
  await expect.poll(()=>planner(page).evaluate(panel=>{
    const bounds=panel.getBoundingClientRect();
    return [...panel.querySelectorAll('button,input,[role="combobox"]')].filter(element=>{
      const rect=element.getBoundingClientRect();
      if(!rect.width||!rect.height||element.getAttribute('aria-hidden')==='true'||(element.tagName==='INPUT'&&rect.width<=1&&rect.height<=1))return false;
      return rect.left<bounds.left-1||rect.right>bounds.right+1;
    }).map(element=>element.getAttribute('aria-label')||element.textContent?.trim().slice(0,70));
  }),{message:'Schedule fields, appointments and booking controls fit their own panel'}).toEqual([]);
  expect(await planner(page).evaluate(panel=>panel.scrollWidth<=panel.clientWidth+1)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

test('booking an available start creates one appointment with the chosen title and time',async({page})=>{
  await open(page);const title='Keyboard interaction review';const {label}=await startBooking(page,title);
  const time=booking(page).getByRole('combobox',{name:'Appointment time',exact:true});
  const selected=await time.innerText();expect(label).toContain('09:00 · UTC+11:00');expect(selected).toContain('09:00 · UTC+11:00');
  await booking(page).getByRole('button',{name:'Book appointment',exact:true}).click();
  await expect(booking(page)).toHaveCount(0);
  const created=agenda(page).getByRole('button',{name:new RegExp(title)});await expect(created).toHaveCount(1);await created.click();
  const details=page.getByRole('dialog',{name:'Appointment details',exact:true});await expect(details).toContainText(title);await expect(details).toContainText('09:00 · UTC+11:00');await expect(details).toContainText('09:30 · UTC+11:00');await expect(details.locator('time').nth(0)).toHaveAttribute('datetime','2026-11-01T22:00:00.000Z');await expect(details.locator('time').nth(1)).toHaveAttribute('datetime','2026-11-01T22:30:00.000Z');
  await page.keyboard.press('Escape');await expect(created).toBeFocused();
});

test('a rejected booking retains its draft and retry creates only one appointment',async({page})=>{
  await page.addInitScript(()=>{const original=crypto.randomUUID.bind(crypto);(window as any).__scheduleIds=[];crypto.randomUUID=()=>{const id=original();(window as any).__scheduleIds.push(id);return id;};});
  await open(page);await preview(page,'Rejected booking');const title='Retained appointment draft';const {field}=await startBooking(page,title);const before=await page.evaluate(()=>(window as any).__scheduleIds.length);
  await booking(page).getByRole('button',{name:'Book appointment',exact:true}).click();
  await expect(booking(page).getByRole('alert')).toBeVisible();await expect(field).toHaveValue(title);await expect(field).toBeFocused();
  await booking(page).getByRole('button',{name:'Book appointment',exact:true}).click();await expect(booking(page)).toHaveCount(0);
  await expect(agenda(page).getByRole('button',{name:new RegExp(title)})).toHaveCount(1);expect(await page.evaluate(()=>(window as any).__scheduleIds.length),'Unchanged retry keeps the request identity').toBe(before+1);
});

test('a cancelled slow booking cannot add a late appointment',async({page})=>{
  await open(page);await preview(page,'Slow booking');const title='Cancelled appointment';await startBooking(page,title);
  await booking(page).getByRole('button',{name:'Book appointment',exact:true}).click();
  await expect(booking(page).getByRole('textbox',{name:'Appointment title',exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');await expect(booking(page)).toHaveCount(0);await expect(planner(page).getByRole('heading').first()).toBeFocused();
  await expect(planner(page).getByRole('status').filter({hasText:/^Booking request cancelled\./})).toBeVisible();
  await page.waitForTimeout(2200);await expect(agenda(page).getByRole('button',{name:new RegExp(title)})).toHaveCount(0);
  await expect(agenda(page).getByRole('button',{name:/^Book /}).first()).toBeDisabled();await expect(agenda(page).getByRole('button',{name:'View Interface review',exact:true})).toBeEnabled();
  await planner(page).getByRole('button',{name:'Reload schedule',exact:true}).click();await expect(agenda(page).getByRole('button',{name:/^Book /}).first()).toBeEnabled();
});

test('booking validation retains the entered title and cancellation leaves the schedule unchanged',async({page})=>{
  await open(page);const before=await agenda(page).getByRole('button',{name:/^Book /}).count();const {field,trigger}=await startBooking(page,'x');
  await booking(page).getByRole('button',{name:'Book appointment',exact:true}).click();await expect(field).toBeFocused();
  await expect(booking(page).getByText('Use a title between 3 and 120 characters.',{exact:true})).toBeVisible();await expect(field).toHaveValue('x');
  await booking(page).getByRole('button',{name:'Cancel',exact:true}).click();await expect(booking(page)).toHaveCount(0);await expect(trigger).toBeFocused();
  await expect(agenda(page).getByRole('button',{name:/^Book /})).toHaveCount(before);
});

test('duration, explicit zone and calendar navigation change available starts without interpreting browser wall time',async({page})=>{
  await open(page);await expect(planner(page).locator('input[name="agendaDate"]')).toHaveValue('2026-11-02');const duration=planner(page).getByRole('textbox',{name:'Duration in minutes',exact:true});
  await duration.fill('60');await duration.press('Tab');
  await expect(agenda(page).getByRole('button',{name:/^Book .* for 60 minutes$/}).first()).toBeVisible();
  await choose(page,'Time zone',/New York/);await expect(planner(page).getByRole('combobox',{name:'Time zone',exact:true})).toContainText(/New York/);await expect(planner(page).locator('input[name="agendaDate"]')).toHaveValue('2026-11-01');await expect(agenda(page).getByRole('button',{name:/^Book 18:00.*UTC-05:00.*for 60 minutes$/})).toBeVisible();
  const date=planner(page).getByRole('button',{name:'Agenda date',exact:true}),before=await date.getAttribute('title');await date.click();
  const selected=page.locator('.bui-calendar-popup .bui-calendar-selected .bui-calendar-day-button');await selected.focus();await selected.press('ArrowRight');await page.keyboard.press('Enter');
  await expect(page.locator('.bui-calendar-popup')).not.toBeVisible();await expect(date).not.toHaveAttribute('title',before!);await expect(date).toBeFocused();await expect(planner(page).locator('input[name="agendaDate"]')).toHaveValue('2026-11-02');
  await contained(page);
});

test('loading, error, empty and invalid sources stay distinct and retry restores a useful focus target',async({page})=>{
  await open(page);await preview(page,'Loading');await expect(planner(page).getByRole('status').filter({hasText:/Loading/i})).toBeVisible();
  await preview(page,'Connection error');await expect(planner(page).getByRole('alert')).toBeVisible();
  await planner(page).getByRole('button',{name:/^Retry loading/}).click();
  await expect(planner(page).getByRole('heading').first()).toBeFocused();await expect(agenda(page).getByRole('button',{name:/^Book /}).first()).toBeVisible();
  await preview(page,'Empty');await expect(planner(page).getByText('No available times.',{exact:true})).toBeVisible();await expect(agenda(page).getByRole('button',{name:/^Book /})).toHaveCount(0);
  await preview(page,'Invalid data');await expect(planner(page).getByRole('alert')).toBeVisible();await expect(planner(page).getByRole('button',{name:/^Book /})).toHaveCount(0);
  await preview(page,'Sample data');await expect(agenda(page).getByRole('button',{name:/^Book /}).first()).toBeVisible();
});

test('repeated-hour starts keep their distinct UTC offsets and remain independently selectable',async({page})=>{
  await page.goto('/components/day-agenda');await choose(page,'Agenda preview state','Repeated hour');
  const first=agenda(page).getByRole('button',{name:/^Book 01:00.*UTC-04:00/}),second=agenda(page).getByRole('button',{name:/^Book 01:00.*UTC-05:00/});
  await expect(first).toHaveCount(1);await expect(second).toHaveCount(1);await expect(first).toBeEnabled();await expect(second).toBeEnabled();
  await first.click();await expect(first).toHaveAttribute('aria-pressed','true');await second.click();await expect(second).toHaveAttribute('aria-pressed','true');await expect(first).toHaveAttribute('aria-pressed','false');await second.focus();await expect(second).toBeFocused();
});

for(const theme of ['light','dark'])test('embedded Mobile schedule and booking controls stay contained in '+theme,async({page})=>{
  await page.setViewportSize({width:1440,height:1100});await open(page);
  if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
  await page.getByRole('group',{name:'Preview width',exact:true}).getByRole('button',{name:'Mobile',exact:true}).click();
  await expect.poll(()=>page.locator('.library-preview-frame[data-width="Mobile"]').evaluate(element=>Math.round(element.getBoundingClientRect().width))).toBe(390);await contained(page);
  await startBooking(page,'A narrow appointment');await expect(booking(page).getByRole('textbox',{name:'Appointment title',exact:true})).toHaveValue('A narrow appointment');await page.keyboard.press('Escape');
  await preview(page,'Connection error');await expect(planner(page).getByRole('alert')).toBeVisible();await contained(page);
});

for(const theme of ['light','dark'])test('phone schedule and open booking dialog pass automated accessibility in '+theme,async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page);
  if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();await contained(page);
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(scan.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);
  await startBooking(page,'Accessible appointment');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const dialog=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(dialog.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)}))).toEqual([]);
});

test('live reduced motion keeps schedule controls steady and removes dialog travel',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await open(page);
  const first=agenda(page).getByRole('button',{name:/^Book /}).first();await first.scrollIntoViewIfNeeded();const bounds=await first.boundingBox();await first.hover();expect(await first.boundingBox(),'Hover lighting keeps slot geometry rigid').toEqual(bounds);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(planner(page)).toHaveAttribute('data-reduced-motion','true');await expect(agenda(page).locator('.bui-day-agenda-layout')).toHaveCSS('animation-name','none');
  await startBooking(page,'Reduced motion review');await expect(booking(page)).toHaveCSS('transition-duration','0s');
  await page.keyboard.press('Escape');await contained(page);
});

test('schedule fields share a baseline and clearing the date offers a deliberate empty view',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});await open(page);
  const date=planner(page).getByRole('button',{name:'Agenda date',exact:true});
  const boxes=await Promise.all([date.boundingBox(),planner(page).getByRole('combobox',{name:'Time zone',exact:true}).boundingBox(),planner(page).locator('.bui-number-group').boundingBox()]);
  for(const box of boxes){expect(box).not.toBeNull();expect(Math.abs(box!.y-boxes[0]!.y),'Schedule controls align below their labels').toBeLessThan(1);expect(Math.abs(box!.height-boxes[0]!.height),'Shared controls retain a consistent height').toBeLessThan(2);}
  await planner(page).getByRole('button',{name:'Clear agenda date',exact:true}).click();await expect(date).toBeFocused();
  await expect(agenda(page).getByRole('heading',{name:'Choose a date.',exact:true})).toBeVisible();await expect(agenda(page).getByRole('button',{name:/^Book /})).toHaveCount(0);
  await expect(planner(page).getByRole('button',{name:'Previous day',exact:true})).toBeDisabled();await expect(planner(page).getByRole('button',{name:'Next day',exact:true})).toBeDisabled();
  await planner(page).getByRole('button',{name:'Reload schedule',exact:true}).click();await expect(agenda(page).getByRole('button',{name:/^Book /}).first()).toBeVisible();
});
test('overnight booking options and next-day appointments keep the end date explicit',async({page})=>{
  await open(page);await choose(page,'Time zone','UTC');
  await agenda(page).getByRole('button',{name:/^Book 23:45/}).click();
  await expect(booking(page).getByRole('combobox',{name:'Appointment time',exact:true})).toContainText('2026-11-02');
  await expect(booking(page).locator('time[datetime="2026-11-02T00:15:00.000Z"]')).toBeVisible();
  await booking(page).getByRole('textbox',{name:'Appointment title',exact:true}).fill('Overnight review');
  await booking(page).getByRole('button',{name:'Book appointment',exact:true}).click();await expect(booking(page)).not.toBeVisible();
  const event=planner(page).getByRole('button',{name:'View Overnight review',exact:true});await event.click();
  const details=page.getByRole('dialog',{name:'Appointment details',exact:true});
  await expect(details.locator('time[datetime="2026-11-01T23:45:00.000Z"]')).toBeVisible();
  await expect(details.locator('time[datetime="2026-11-02T00:15:00.000Z"]')).toBeVisible();
  await page.keyboard.press('Escape');await planner(page).getByRole('button',{name:'Next day',exact:true}).click();await expect(event).toBeVisible();
});
