import {test,expect} from '@playwright/test';
import type {Locator} from '@playwright/test';

async function settle(control:Locator){
  await control.evaluate(async el=>{
    getComputedStyle(el,'::after').transform;
    await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));
  });
}

async function geometry(control:Locator){
  return control.evaluate(el=>{
    const box=el.getBoundingClientRect(),style=getComputedStyle(el),thumb=getComputedStyle(el,'::after');
    const matrix=new DOMMatrixReadOnly(thumb.transform==='none'?undefined:thumb.transform);
    return {
      width:box.width,height:box.height,
      left:parseFloat(style.borderLeftWidth)+parseFloat(thumb.left)+matrix.m41,
      top:parseFloat(style.borderTopWidth)+parseFloat(thumb.top)+matrix.m42,
      thumbWidth:parseFloat(thumb.width),thumbHeight:parseFloat(thumb.height),
      thumbColour:thumb.backgroundColor,background:style.backgroundColor,
      bounds:{x:box.left+scrollX,y:box.top+scrollY,width:box.width,height:box.height},
    };
  });
}

async function sampleTravel(control:Locator){
  return control.evaluate(async el=>{
    getComputedStyle(el,'::after').transform;
    (el as HTMLInputElement).click();
    const travel=el.getAnimations({subtree:true}).find(a=>(a as CSSTransition).transitionProperty==='transform');
    if(!travel)throw new Error('The switch should ease between states.');
    await travel.ready;
    travel.pause();
    const duration=Number(travel.effect!.getComputedTiming().duration);
    const frames=[0,.2,.5,.8,1].map(progress=>{
      travel.currentTime=duration*progress;
      const thumb=getComputedStyle(el,'::after');
      const matrix=new DOMMatrixReadOnly(thumb.transform==='none'?undefined:thumb.transform);
      return {width:parseFloat(thumb.width),height:parseFloat(thumb.height),x:matrix.m41,scaleX:matrix.a,scaleY:matrix.d,skewX:matrix.c,skewY:matrix.b};
    });
    for(const animation of el.getAnimations({subtree:true}))animation.finish();
    return frames;
  });
}

for(const theme of ['light','dark'])test('recessed switch keeps a rigid thumb and even insets in '+theme,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/foundations#control-states');
  if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme'}).click();
  const specimen=page.getByRole('region',{name:'Control standards'});
  const toggle=specimen.getByRole('switch',{name:'Weekly digest',exact:true});
  await toggle.uncheck();await settle(toggle);
  const off=await geometry(toggle);
  expect(off.thumbColour).toBe(theme==='dark'?'rgb(244, 242, 237)':'rgb(23, 23, 23)');
  expect(off.background).not.toBe(off.thumbColour);
  for(const on of [true,false]){
    const frames=await sampleTravel(toggle);
    await expect(toggle).toBeChecked({checked:on});
    const travel=off.width-off.height;
    for(const frame of frames){
      expect(frame.width).toBe(off.thumbWidth);expect(frame.height).toBe(off.thumbHeight);
      expect(frame.scaleX).toBe(1);expect(frame.scaleY).toBe(1);
      expect(frame.skewX).toBe(0);expect(frame.skewY).toBe(0);
      expect(frame.x).toBeGreaterThanOrEqual(0);expect(frame.x).toBeLessThanOrEqual(travel);
    }
    const positions=frames.map(frame=>frame.x);
    expect(positions).toEqual([...positions].sort((a,b)=>on?a-b:b-a));
    expect(positions[0]).toBeCloseTo(on?0:travel,1);
    expect(positions.at(-1)).toBeCloseTo(on?travel:0,1);
    expect(positions[2]).toBeGreaterThan(0);expect(positions[2]).toBeLessThan(travel);
    const shape=await geometry(toggle);
    expect(shape.bounds).toEqual(off.bounds);
    expect(shape.thumbColour).toBe(on?'rgb(23, 23, 23)':off.thumbColour);
    expect(shape.top).toBeCloseTo((shape.height-shape.thumbHeight)/2,1);
    expect(on?shape.width-shape.left-shape.thumbWidth:shape.left).toBeCloseTo(shape.top,1);
    if(on)expect(shape.background).toBe('rgb(255, 226, 74)');
  }
  // A press changes the lighting, never the shape or endpoint.
  for(const on of [false,true]){
    await toggle.setChecked(on);await settle(toggle);await toggle.hover();
    const before=await geometry(toggle);
    await page.mouse.down();await settle(toggle);
    expect(await geometry(toggle)).toEqual(before);
    await page.mouse.up();await settle(toggle);
  }
  // Consumer size/inset overrides preserve the same even clearance.
  await toggle.evaluate(el=>{el.style.setProperty('--bui-switch-width','52px');el.style.setProperty('--bui-switch-height','30px');el.style.setProperty('--bui-switch-inset','4px');});
  for(const on of [false,true]){
    await toggle.setChecked(on);await settle(toggle);const shape=await geometry(toggle);
    expect(shape.thumbWidth).toBe(22);expect(shape.thumbHeight).toBe(22);
    expect(shape.top).toBe(4);expect(on?shape.width-shape.left-shape.thumbWidth:shape.left).toBe(4);
  }
  await toggle.evaluate(el=>{for(const token of ['--bui-switch-width','--bui-switch-height','--bui-switch-inset'])el.style.removeProperty(token);});
  const panel=specimen.locator('.control-standards-panel').filter({has:page.getByRole('heading',{name:'Choices',exact:true})});
  for(const control of [specimen.getByRole('radio',{name:'Compact',exact:true}),specimen.getByRole('checkbox',{name:'Include archived',exact:true})])await control.check();
  for(const on of [false,true]){
    await toggle.setChecked(on);await settle(toggle);await page.mouse.move(0,0);
    await panel.screenshot({path:'.local/previews/recessed-switch-'+theme+'-'+(on?'on':'off')+'.png',animations:'disabled',style:'.site-header,.skip-link{visibility:hidden!important}'});
  }
  await page.emulateMedia({forcedColors:'active'});await toggle.focus();
  await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(toggle).toBeFocused();
  for(const on of [true,false]){
    if(!on)await page.keyboard.press('Space');
    await expect(toggle).toBeChecked({checked:on});
    const contrast=await toggle.evaluate(el=>({track:getComputedStyle(el).backgroundColor,thumb:getComputedStyle(el,'::after').backgroundColor,border:getComputedStyle(el).borderWidth,focus:getComputedStyle(el).outlineStyle,shadow:getComputedStyle(el).boxShadow,motion:getComputedStyle(el,'::after').transitionDuration}));
    expect(contrast.thumb).not.toBe(contrast.track);expect(contrast.border).toBe('1px');expect(contrast.focus).toBe('solid');expect(contrast.shadow).toBe('none');expect(contrast.motion).toBe('0s');
  }
});
