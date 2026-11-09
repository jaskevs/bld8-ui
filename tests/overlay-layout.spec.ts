import {test,expect} from '@playwright/test';

// Chromium's default headless arguments hide the scrollbar and miss this shift.
test.use({viewport:{width:1257,height:1000},launchOptions:{ignoreDefaultArgs:['--hide-scrollbars']},reducedMotion:'no-preference'});

for(const mode of ['light','dark'] as const)for(const scroll of [0,180])test(`${mode} dropdowns keep page geometry stable at scroll ${scroll}`,async({page})=>{
  await page.emulateMedia({colorScheme:mode});
  await page.goto('/themes?starter=outline');
  await expect(page.frameLocator('iframe[title="Theme preview"]').getByRole('region',{name:'Outline workspace preview',exact:true})).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(y=>scrollTo(0,y),scroll);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(scroll);
  await page.evaluate(()=>{
    const host=window as Window & {overlayLayout?:{running:boolean;frames:number[][]}};
    const recording={running:true,frames:[] as number[][]};host.overlayLayout=recording;
    const sample=()=>{
      const geometry=['.site-header','.theme-intro h1','.theme-starter','.theme-starter-controls'].flatMap(selector=>{
        const rect=document.querySelector(selector)!.getBoundingClientRect();return[rect.x,rect.y,rect.width,rect.height];
      });
      recording.frames.push([...geometry,scrollX,scrollY]);
      if(recording.running)requestAnimationFrame(sample);
    };sample();
  });
  for(const label of ['Starter','Starter framework']){
    const trigger=page.getByRole('combobox',{name:label,exact:true});
    await trigger.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    // Sample throughout entry/exit easing, rather than only the final rectangles.
    await page.waitForTimeout(380);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.waitForTimeout(380);
  }
  const frames=await page.evaluate(()=>{
    const recording=(window as Window & {overlayLayout?:{running:boolean;frames:number[][]}}).overlayLayout!;
    recording.running=false;return recording.frames;
  });
  expect(frames.length).toBeGreaterThan(4);
  const first=frames[0];
  const largestShift=Math.max(...frames.flatMap(frame=>frame.map((value,index)=>Math.abs(value-first[index]))));
  expect(largestShift,'Heading, panels, navigation and scroll stay still through opening and closing').toBeLessThanOrEqual(.25);
});
