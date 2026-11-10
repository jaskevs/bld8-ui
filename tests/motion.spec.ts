import { test, expect } from '@playwright/test';

type TabMotionWindow = Window & {tabMotionCapture?:{observer:MutationObserver;animation?:Animation;wasRunning?:boolean;duration?:number}};

test('tab indicator follows interrupted selection and keyboard input', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/motion');
  await page.evaluate(() => document.fonts.ready);
  const tabs = page.getByRole('tablist', { name: 'Study stage' });
  const indicator = tabs.locator('.bui-tab-indicator');
  const building = tabs.getByRole('tab', { name: 'Building', exact: true });
  const initial = (await indicator.boundingBox())!, target = (await building.boundingBox())!;
  await indicator.evaluate(el => {
    const host=window as TabMotionWindow;
    // Capture the native transition at its creation, before runner load can let it finish.
    const observer=new MutationObserver(()=>{
      const animation=el.getAnimations().find(item=>item instanceof CSSTransition&&item.transitionProperty==='transform'&&item.playState==='running');
      if(!animation)return;
      const capture=host.tabMotionCapture!;
      capture.wasRunning=animation.playState==='running';capture.duration=Number(animation.effect!.getComputedTiming().duration);capture.animation=animation;
      animation.pause();animation.currentTime=capture.duration*.2;observer.disconnect();
    });
    host.tabMotionCapture={observer};observer.observe(el.parentElement!,{attributes:true,subtree:true});
  });
  await building.click();
  await expect.poll(()=>page.evaluate(() => !!(window as TabMotionWindow).tabMotionCapture?.animation),'Selection starts a native transform transition').toBe(true);
  const captured=await page.evaluate(async()=>{const capture=(window as TabMotionWindow).tabMotionCapture!;await capture.animation!.ready;return {wasRunning:capture.wasRunning,duration:capture.duration,playState:capture.animation!.playState};});
  expect(captured.wasRunning).toBe(true);expect(captured.duration).toBeGreaterThan(0);expect(captured.playState).toBe('paused');
  const midway=(await indicator.boundingBox())!;expect(midway.x).toBeGreaterThan(initial.x+.5);expect(midway.x).toBeLessThan(target.x-.5);
  await tabs.getByRole('tab', { name: 'Review', exact: true }).click();
  await expect.poll(()=>page.evaluate(()=>(window as TabMotionWindow).tabMotionCapture!.animation!.playState),'A new selection interrupts the captured transition').toBe('idle');
  await page.evaluate(()=>{const host=window as TabMotionWindow;host.tabMotionCapture!.observer.disconnect();delete host.tabMotionCapture;});
  await tabs.getByRole('tab', { name: 'Idea', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const active = tabs.getByRole('tab', { name: 'Building', exact: true });
  await expect(active).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Building', exact: true })).toContainText('Taking shape.');
  await expect(page.locator('.bui-tab-panel:visible')).toHaveCount(1);
  await expect.poll(async () => indicator.evaluate(el => {
    const selected = el.parentElement!.querySelector('[aria-selected="true"]')!.getBoundingClientRect();
    const line = el.getBoundingClientRect();
    return Math.abs(line.left - selected.left) < 1 && Math.abs(line.width - selected.width) < 1;
  })).toBe(true);
});

test('save feedback preserves the button size and hover target', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/motion');
  const button = page.getByRole('button', { name: 'Save preference' });
  await page.evaluate(() => document.fonts.ready);
  await button.scrollIntoViewIfNeeded();
  const initial = await button.boundingBox();
  const layout = await button.evaluate(el => ({ width: el.offsetWidth, height: el.offsetHeight }));
  await button.hover();
  await expect.poll(() => button.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  expect(await button.boundingBox()).toEqual(initial);
  await page.clock.install();
  await button.click();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toBeDisabled();
  expect(await button.evaluate(el => ({ width: el.offsetWidth, height: el.offsetHeight }))).toEqual(layout);
  await page.clock.fastForward(800);
  await expect(button).toBeEnabled();
  await expect(page.getByRole('status').filter({ hasText: 'Saved for this session.' })).toBeVisible();
});

test('animated dialogs and sheets dismiss and return focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/motion');
  for (const label of ['Open a dialog', 'Open a sheet']) {
    const trigger = page.getByRole('button', { name: label, exact: true });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test('reduced motion keeps state changes immediate', async ({ page }) => {
  await page.goto('/motion');
  await page.getByRole('tab', { name: 'Review', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Look a little closer.');
  const styles = await page.locator('.bui-tab-indicator').evaluate(el => ({ duration: getComputedStyle(el).transitionDuration, animations: el.getAnimations().length }));
  expect(styles).toEqual({ duration: '0s', animations: 0 });
  expect(await page.getByRole('switch', { name: 'Weekly digest' }).evaluate(el => getComputedStyle(el, '::after').transitionDuration)).toBe('0s');
  await page.getByRole('button', { name: 'Give the content room.' }).click();
  await expect(page.getByText('The panel opens from its own edge.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Open a dialog', exact: true }).click();
  expect(await page.getByRole('dialog').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
});
