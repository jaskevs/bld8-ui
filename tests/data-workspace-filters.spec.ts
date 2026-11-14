import {test,expect,type Page} from '@playwright/test';
const route='/blocks/data-workspace';
async function add(page:Page,field:string){await page.locator('.bblocks-quick-filter-actions').getByRole('button',{name:'Add filter',exact:true}).click();const search=page.getByRole('textbox',{name:'Find a filter field',exact:true});await search.fill(field);await search.press('ArrowDown');await page.keyboard.press('Enter');}
async function values(page:Page,value:string){const input=page.getByRole('combobox',{name:'Values',exact:true});await input.fill(value);await page.getByRole('option',{name:value,exact:true}).click();if(await input.getAttribute('aria-expanded')==='true')await input.press('Escape');await expect(page.getByRole('button',{name:'Apply filter',exact:true})).toBeVisible();}

test('quick facets stay unapplied until confirmed and retain an editable summary',async({page})=>{
  await page.goto(route);const backlog=page.getByRole('gridcell',{name:'Title for ISS-103',exact:true});await expect(backlog).toBeVisible();await add(page,'Status');await values(page,'In progress');
  await expect(backlog).toBeVisible();await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(backlog).toHaveCount(0);
  const chip=page.getByRole('button',{name:'Edit Status filter',exact:true});await expect(chip).toContainText('In progress');expect((await page.locator('[data-column-key=status] .bui-data-grid-value').allTextContents()).every(value=>value==='In progress')).toBe(true);
  await chip.click();await page.getByRole('button',{name:'Remove In progress',exact:true}).click();await values(page,'Done');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(chip).toContainText('Done');await expect(page.getByRole('gridcell',{name:'Title for ISS-105',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Remove Status filter',exact:true}).click();await expect(page.getByRole('button',{name:'Add filter',exact:true})).toBeFocused();await expect(backlog).toBeVisible();
});

test('numeric ranges reject reversed values before changing the query',async({page})=>{
  await page.goto(route);await add(page,'Estimate');await page.getByRole('combobox',{name:'Condition',exact:true}).click();await page.getByRole('option',{name:'Between',exact:true}).click();
  await page.getByRole('textbox',{name:'From',exact:true}).fill('8');await page.getByRole('textbox',{name:'To',exact:true}).fill('2');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.getByText('The start must not be after the end.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Edit Estimate filter',exact:true})).toHaveCount(0);
  await page.getByRole('textbox',{name:'From',exact:true}).fill('3');await page.getByRole('textbox',{name:'To',exact:true}).fill('5');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.getByRole('button',{name:'Edit Estimate filter',exact:true})).toContainText('3 – 5');
  await expect(page.getByRole('gridcell',{name:'Title for ISS-102',exact:true})).toBeVisible();await expect(page.getByRole('gridcell',{name:'Title for ISS-103',exact:true})).toHaveCount(0);
});

test('quick filtering and clearing preserve drafts from hidden rows',async({page})=>{
  await page.goto(route);const cell=page.getByRole('gridcell',{name:'Title for ISS-101',exact:true});await cell.focus();await cell.press('Enter');const input=cell.getByRole('textbox');await input.fill('Keep this hidden draft');await input.press('Enter');
  await add(page,'Status');await values(page,'Done');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(cell).toHaveCount(0);await expect(page.getByRole('button',{name:'Review changes',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(cell).toContainText('Keep this hidden draft');await expect(cell).toHaveAttribute('data-dirty','true');
});

test('unapplied advanced edits are protected from quick filter replacement',async({page})=>{
  await page.goto(route);await page.getByRole('button',{name:'Advanced',exact:true}).click();const advanced=page.getByRole('region',{name:'Workspace filters',exact:true});await advanced.getByRole('button',{name:'Add filter',exact:true}).click();
  await expect(page.getByText('Apply or clear the advanced changes before editing quick filters.',{exact:true})).toBeVisible();await expect(page.locator('.bblocks-quick-filter-actions').getByRole('button',{name:'Add filter',exact:true})).toBeDisabled();
  await page.locator('.bblocks-data-workspace-filters').getByRole('button',{name:'Clear filters',exact:true}).click();await expect(page.locator('.bblocks-quick-filter-actions').getByRole('button',{name:'Add filter',exact:true})).toBeEnabled();
});

test('quick root conditions keep nested group semantics intact',async({page})=>{
  await page.goto(route);await page.getByRole('button',{name:'Advanced',exact:true}).click();const advanced=page.getByRole('region',{name:'Workspace filters',exact:true});await advanced.getByRole('button',{name:'Add group',exact:true}).click();
  const group=page.getByRole('group',{name:'Condition group 1',exact:true});await group.getByRole('textbox').fill('Keyboard');await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByRole('gridcell',{name:'Title for ISS-102',exact:true})).toBeVisible();
  await add(page,'Status');await values(page,'In review');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.getByText('No loaded records match this view.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'1 group · edit conditions',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Remove Status filter',exact:true}).click();await expect(page.getByRole('gridcell',{name:'Title for ISS-102',exact:true})).toBeVisible();await expect(group.getByRole('textbox')).toHaveValue('Keyboard');
});


for(const {height,anchorTop}of [{height:720,anchorTop:360},{height:800,anchorTop:420}])test('quick-filter native back navigation survives contained resize delivery at '+height+'px',async({page})=>{
  await page.setViewportSize({width:1440,height});await page.emulateMedia({colorScheme:'dark',reducedMotion:'no-preference'});
  await page.addInitScript(()=>{
    type Pending={observed:Set<Element>;entries:Map<Element,ResizeObserverEntry>;callback:ResizeObserverCallback;observer:ResizeObserver};
    const Native=window.ResizeObserver,pending=new Set<Pending>();let hold=false,downInFields=false;
    const host=window as Window & {quickFilterResizeGate?:{hold:()=>void;flush:()=>void;restore:()=>void;downInFields:()=>boolean}};
    // Delay observer delivery, never DOM updates or pointer events. Removed
    // observations must not be replayed after a child unmounts or disconnects.
    window.ResizeObserver=class extends Native{
      private record:Pending;
      constructor(callback:ResizeObserverCallback){
        const record:Pending={observed:new Set(),entries:new Map(),callback,observer:null as unknown as ResizeObserver};
        super((entries,observer)=>{const current=entries.filter(entry=>record.observed.has(entry.target));if(!current.length)return;if(hold){current.forEach(entry=>record.entries.set(entry.target,entry));pending.add(record);}else callback(current,observer);});
        this.record=record;record.observer=this;
      }
      observe(target:Element,options?:ResizeObserverOptions){this.record.entries.delete(target);if(!this.record.entries.size)pending.delete(this.record);this.record.observed.add(target);super.observe(target,options);}
      unobserve(target:Element){this.record.observed.delete(target);this.record.entries.delete(target);if(!this.record.entries.size)pending.delete(this.record);super.unobserve(target);}
      disconnect(){this.record.observed.clear();this.record.entries.clear();pending.delete(this.record);super.disconnect();}
    };
    const pressed=(event:PointerEvent)=>{const button=event.target instanceof Element?event.target.closest('button'):null;downInFields=button?.textContent?.trim()==='Fields';};
    document.addEventListener('pointerdown',pressed,true);
    host.quickFilterResizeGate={hold:()=>{hold=true;downInFields=false;},flush:()=>{hold=false;const queued=[...pending];pending.clear();for(const record of queued){const entries=[...record.entries.values()].filter(entry=>record.observed.has(entry.target));record.entries.clear();if(entries.length)record.callback(entries,record.observer);}},restore:()=>{hold=false;for(const record of pending)record.entries.clear();pending.clear();window.ResizeObserver=Native;document.removeEventListener('pointerdown',pressed,true);},downInFields:()=>downInFields};
    document.addEventListener('DOMContentLoaded',()=>document.documentElement.dataset.uiTheme='dark',{once:true});
  });
  const frames=()=>page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  try{
    await page.goto(route);await page.evaluate(async()=>{await document.fonts.ready;});await expect.poll(()=>page.evaluate(()=>[...document.fonts].filter(font=>font.status==='loaded').length)).toBeGreaterThanOrEqual(2);
    const add=page.getByRole('button',{name:'Add filter',exact:true}),grid=page.getByRole('grid',{name:'Issue data grid',exact:true});await expect(grid).toBeVisible();await expect(grid.getByRole('gridcell',{name:'Title for ISS-103',exact:true})).toBeVisible();
    const rows=()=>grid.locator('[data-row-id]').evaluateAll(nodes=>[...new Set(nodes.map(node=>node.getAttribute('data-row-id')))]),beforeRows=await rows(),beforeUrl=page.url();
    await add.evaluate((button,top)=>scrollBy(0,button.getBoundingClientRect().top-top),anchorTop);await expect.poll(async()=>Math.abs((await add.boundingBox())!.y-anchorTop)).toBeLessThan(1);
    await add.click();const popup=page.locator('.bui-popover:not([data-ending-style])'),search=page.getByRole('textbox',{name:'Find a filter field',exact:true});await expect(search).toBeFocused();
    const overflow=()=>popup.evaluate(element=>{const box=element.getBoundingClientRect();return {left:Math.max(0,-box.left),top:Math.max(0,-box.top),right:Math.max(0,box.right-innerWidth),bottom:Math.max(0,box.bottom-innerHeight)};});
    await expect.poll(overflow).toEqual({left:0,top:0,right:0,bottom:0});await frames();
    await page.evaluate(()=>{(window as Window & {quickFilterResizeGate:{hold:()=>void}}).quickFilterResizeGate.hold();});
    await search.fill('Status');await search.press('ArrowDown');await page.keyboard.press('Enter');await expect(page.getByRole('combobox',{name:'Condition',exact:true})).toBeFocused();await frames();
    // Containment alone is insufficient readiness: delayed position work can
    // move a fully visible back button between native pointerdown and pointerup.
    expect(await overflow(),'Old editor rectangle is fully contained before the native press').toEqual({left:0,top:0,right:0,bottom:0});
    const fields=page.getByRole('button',{name:'Fields',exact:true}),box=(await fields.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
    expect(await page.evaluate(()=>(window as Window & {quickFilterResizeGate:{downInFields:()=>boolean}}).quickFilterResizeGate.downInFields()),'Native press begins on Fields or one of its descendants').toBe(true);
    await page.evaluate(()=>{(window as Window & {quickFilterResizeGate:{flush:()=>void}}).quickFilterResizeGate.flush();});await frames();
    expect(await overflow(),'Resized editor rectangle remains fully contained before release').toEqual({left:0,top:0,right:0,bottom:0});await page.mouse.up();
    await expect(search).toBeFocused();await expect(page.getByRole('button',{name:'Edit Status filter',exact:true})).toHaveCount(0);await expect.poll(rows).toEqual(beforeRows);await expect(page).toHaveURL(beforeUrl);
    await page.keyboard.press('Escape');await expect(add).toBeFocused();await expect(page.locator('.bui-popover')).toHaveCount(0);
  }finally{
    await page.mouse.up();await page.evaluate(()=>{(window as Window & {quickFilterResizeGate?:{restore:()=>void}}).quickFilterResizeGate?.restore();});
  }
});
