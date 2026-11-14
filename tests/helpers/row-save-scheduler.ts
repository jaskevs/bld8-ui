/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {expect,type Page} from '@playwright/test';

interface SchedulerSnapshot {
  held:boolean;
  queued:number;
  completedSaveTimers:number;
  delivered:number;
  saveDisabled:boolean|null;
  active:string;
  focusAttempts:{disabled:boolean;inAnimationFrame:boolean}[];
}
interface RowSaveSchedulerGate {
  arm():void;
  release():void;
  frames():Promise<void>;
  snapshot():SchedulerSnapshot;
  restore():void;
}
declare global {interface Window {rowSaveSchedulerGate?:RowSaveSchedulerGate}}

/** Defer queued scheduler delivery while native save timers and animation frames continue. */
export async function installRowSaveScheduler(page:Page) {
  await page.addInitScript(()=>{
    const NativeChannel=window.MessageChannel,descriptor=Object.getOwnPropertyDescriptor(MessagePort.prototype,'onmessage');
    const nativeSet=descriptor?.set;
    if(!nativeSet)throw Error('Native MessagePort.onmessage is required for the scheduler fixture.');
    type BrowserTimer=(handler:TimerHandler,delay?:number,...args:unknown[])=>number;
    const nativeRAF=window.requestAnimationFrame,originalTimer=window.setTimeout,nativeTimer=originalTimer as unknown as BrowserTimer,nativeFocus=HTMLElement.prototype.focus;
    type Handler=(this:MessagePort,event:MessageEvent)=>unknown;
    type Entry={port:MessagePort;handler:Handler|null};
    const entries:Entry[]=[],pending:{entry:Entry;handler:Handler;event:MessageEvent}[]=[],attempts:{disabled:boolean;inAnimationFrame:boolean}[]=[];
    let held=false,armed=false,inFrame=false,completedSaveTimers=0,delivered=0;
    const save=()=>document.querySelector<HTMLButtonElement>('.bui-table-move-form button[type="submit"]');
    window.MessageChannel=class extends NativeChannel {
      constructor(){
        super();const entry:Entry={port:this.port1,handler:null};entries.push(entry);
        Object.defineProperty(entry.port,'onmessage',{configurable:true,get:()=>entry.handler,set(handler:Handler|null){
          entry.handler=handler;
          nativeSet!.call(entry.port,typeof handler==='function'?function(this:MessagePort,event:MessageEvent){if(held)pending.push({entry,handler,event});else Reflect.apply(handler,this,[event]);}:handler);
        }});
      }
    };
    window.requestAnimationFrame=callback=>nativeRAF.call(window,timestamp=>{const previous=inFrame;inFrame=true;try{callback(timestamp);}finally{inFrame=previous;}});
    window.setTimeout=((handler:TimerHandler,delay?:number,...args:unknown[])=>{
      if(typeof handler!=='function'||delay!==280)return nativeTimer.call(window,handler,delay,...args);
      // The reference adapter's real acknowledgement timer is never accelerated.
      return nativeTimer.call(window,()=>{try{Reflect.apply(handler,window,args);}finally{if(held&&save()?.disabled)completedSaveTimers++;}},delay);
    }) as unknown as typeof window.setTimeout;
    HTMLElement.prototype.focus=function(options?:FocusOptions){if(this.matches('.bui-table-move-form button[type="submit"]'))attempts.push({disabled:(this as HTMLButtonElement).disabled,inAnimationFrame:inFrame});nativeFocus.call(this,options);};
    const observer=new MutationObserver(records=>{
      if(armed&&records.some(record=>record.target instanceof HTMLButtonElement&&record.target.matches('.bui-table-move-form button[type="submit"]')&&record.target.disabled)){armed=false;held=true;}
    });
    observer.observe(document,{subtree:true,attributes:true,attributeFilter:['disabled']});
    const gate:RowSaveSchedulerGate={
      arm(){armed=true;completedSaveTimers=0;attempts.length=0;},
      release(){held=false;for(const item of pending.splice(0))nativeTimer.call(window,()=>{if(item.entry.handler===item.handler){delivered++;Reflect.apply(item.handler,item.entry.port,[item.event]);}},0);},
      frames(){return new Promise(resolve=>nativeRAF.call(window,()=>nativeRAF.call(window,()=>resolve())));},
      snapshot(){return {held,queued:pending.length,completedSaveTimers,delivered,saveDisabled:save()?.disabled??null,active:document.activeElement?.getAttribute('aria-label')??document.activeElement?.tagName??'',focusAttempts:[...attempts]};},
      restore(){armed=false;observer.disconnect();gate.release();window.MessageChannel=NativeChannel;window.requestAnimationFrame=nativeRAF;window.setTimeout=originalTimer;HTMLElement.prototype.focus=nativeFocus;for(const entry of entries){delete (entry.port as unknown as {onmessage?:Handler|null}).onmessage;nativeSet!.call(entry.port,entry.handler);}}
    };
    window.rowSaveSchedulerGate=gate;
  });
}

/** Use the real failed-save workflow; only scheduler delivery is held. */
export async function exerciseDeferredRowSave(page:Page,{keepCloseFocus=false}:{keepCloseFocus?:boolean}={}) {
  const example=page.getByRole('region',{name:'Table ordering example',exact:true,includeHidden:true});
  const table=example.getByRole('table',{name:'Ordered projects',exact:true,includeHidden:true});
  const order=()=>table.locator('tbody tr[data-row-key]').evaluateAll(rows=>rows.map(row=>row.getAttribute('data-row-key')));
  const selection=example.getByRole('checkbox',{name:'Select Navigation study',exact:true,includeHidden:true});
  const handle=example.getByRole('button',{name:'Move Navigation study',exact:true});
  try{
    await expect(handle).toBeEnabled();await selection.check();await expect(selection).toBeChecked();
    await example.getByRole('checkbox',{name:'Fail next row save',exact:true}).check();
    await handle.focus();await page.keyboard.press('Enter');
    const dialog=page.getByRole('dialog',{name:'Move row',exact:true});await expect(dialog).not.toHaveAttribute('data-starting-style');
    const position=dialog.getByRole('combobox',{name:'Row position',exact:true});await position.focus();await page.keyboard.press('Enter');
    await page.getByRole('option',{name:'Before Icon audit',exact:true}).focus();await page.keyboard.press('Enter');
    await expect(position).toContainText('Before Icon audit');
    const submit=dialog.getByRole('button',{name:'Save row position',exact:true}),close=dialog.getByRole('button',{name:'Close dialog',exact:true});
    await submit.focus();await page.evaluate(()=>window.rowSaveSchedulerGate!.arm());await page.keyboard.press('Enter');
    await expect(submit).toBeDisabled();await expect.poll(()=>page.evaluate(()=>window.rowSaveSchedulerGate!.snapshot().held)).toBe(true);
    if(keepCloseFocus){await close.focus();await expect(close).toBeFocused();}
    else {
      // Browsers can drop native focus when a focused control becomes disabled.
      // Make that handoff explicit so the recovery contract is cross-engine.
      await submit.evaluate(button=>button.blur());await expect(submit).not.toBeFocused();
    }
    await expect.poll(()=>page.evaluate(()=>window.rowSaveSchedulerGate!.snapshot().completedSaveTimers)).toBeGreaterThan(0);
    await expect.poll(()=>page.evaluate(()=>window.rowSaveSchedulerGate!.snapshot().queued)).toBeGreaterThan(0);
    await page.evaluate(()=>window.rowSaveSchedulerGate!.frames());await expect(submit).toBeDisabled();
    const beforeRelease=await page.evaluate(()=>window.rowSaveSchedulerGate!.snapshot());
    await page.evaluate(()=>window.rowSaveSchedulerGate!.release());
    await expect(dialog.getByRole('alert')).toContainText('could not be saved');await expect(submit).toBeEnabled();
    await expect.poll(order).toEqual(['navigation','forms','motion','end']);await expect(position).toContainText('Before Icon audit');await expect(selection).toBeChecked();
    const afterFailure=await page.evaluate(()=>window.rowSaveSchedulerGate!.snapshot());
    if(keepCloseFocus){
      await expect(close).toBeFocused();await page.keyboard.press('Enter');await expect(dialog).not.toBeVisible();
      await expect.poll(order).toEqual(['navigation','forms','motion','end']);
    }else{
      await expect(submit).toBeFocused();await page.keyboard.press('Enter');await expect(dialog).not.toBeVisible();
      await expect.poll(order).toEqual(['forms','motion','navigation','end']);
    }
    await expect(handle).toBeFocused();await expect(selection).toBeChecked();
    return {beforeRelease,afterFailure};
  }finally{await page.evaluate(()=>window.rowSaveSchedulerGate?.restore());}
}
