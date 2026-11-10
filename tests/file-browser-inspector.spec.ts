import {test,expect} from '@playwright/test';

/** Offscreen/throttled frames must not make selection wait for an old pane's exit. */
test('file inspector immediately follows the latest selection when animation frames are interrupted',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/blocks/file-browser');
  const browser=page.getByRole('region',{name:'File browser',exact:true}),details=browser.getByRole('region',{name:'File details',exact:true});
  await expect(details.getByRole('heading',{name:'Workspace',exact:true})).toBeVisible();
  await page.evaluate(()=>{
    const host=window as Window & {restoreFileFrames?:()=>void},request=window.requestAnimationFrame,cancel=window.cancelAnimationFrame,animate=Element.prototype.animate,animations:Animation[]=[],callbacks=new Map<number,FrameRequestCallback>();let next=1_000_000_000;
    Element.prototype.animate=function(keyframes,options){const animation=animate.call(this,keyframes,options);if(this.classList.contains('bblocks-files-detail')){animation.pause();animations.push(animation);}return animation;};
    window.requestAnimationFrame=callback=>{const id=next++;callbacks.set(id,callback);return id;};
    window.cancelAnimationFrame=id=>{if(!callbacks.delete(id))cancel.call(window,id);};
    host.restoreFileFrames=()=>{window.requestAnimationFrame=request;window.cancelAnimationFrame=cancel;Element.prototype.animate=animate;for(const animation of animations)if(animation.playState==='paused')animation.play();for(const callback of callbacks.values())request.call(window,callback);callbacks.clear();delete host.restoreFileFrames;};
  });
  try{
    const archive=browser.getByRole('treeitem',{name:'Archive',exact:true});await archive.focus();await archive.press('Space');
    const files=browser.getByRole('table',{name:'Files in Archive',exact:true}),brief=files.getByRole('button',{name:'Inspect archived-brief.pdf',exact:true}),notes=files.getByRole('button',{name:'Inspect earlier-notes.txt',exact:true});
    await expect(brief).toBeAttached();await brief.focus();await brief.press('Enter');await expect(brief).toHaveAttribute('aria-pressed','true');
    await expect(details.getByRole('heading',{name:'archived-brief.pdf',exact:true})).toBeAttached();
    await notes.focus();await notes.press('Enter');await expect(notes).toHaveAttribute('aria-pressed','true');await expect(brief).toHaveAttribute('aria-pressed','false');
    await expect(details.getByRole('heading',{name:'earlier-notes.txt',exact:true})).toBeAttached();await expect(details.getByRole('heading')).toHaveCount(1);await expect(details).toContainText('Workspace / Archive');
  }finally{await page.evaluate(()=>(window as Window & {restoreFileFrames?:()=>void}).restoreFileFrames?.());}
  await expect(details.getByRole('heading',{name:'earlier-notes.txt',exact:true})).toBeVisible();await expect(details.locator('.bblocks-files-detail')).toHaveCSS('opacity','1');await expect(details.getByRole('heading',{name:'Workspace',exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
