import {test,expect,type Page,type FrameLocator} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {chooseOption} from './helpers/controls';
import {DEFAULT_THEME,THEME_PRESETS,getThemeTokens} from '../packages/ui/src/theme-config';

const previewTitle='Theme preview';
const customAccent='#1967d2';
const preview=(page:Page)=>page.frameLocator(`iframe[title="${previewTitle}"]`);
const controls=(page:Page)=>page.getByRole('region',{name:'Theme controls',exact:true});
const status=(page:Page)=>page.getByRole('status').filter({hasText:/copied|copy|download/i});

async function openLab(page:Page,path='/themes') {
  await page.goto(path);
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await expect(controls(page).getByRole('textbox',{name:'Accent colour',exact:true})).toBeVisible();
  await expect(preview(page).locator('html')).toHaveClass(/bld8-theme/);
}

async function frameToken(frame:FrameLocator,name:string) {
  return frame.locator('html').evaluate((element,token)=>getComputedStyle(element).getPropertyValue(token).trim(),name);
}

async function editAccent(page:Page,value=customAccent) {
  const input=controls(page).getByRole('textbox',{name:'Accent colour',exact:true});
  await input.fill(value);
  await input.blur();
  await expect.poll(()=>frameToken(preview(page),'--bui-accent')).toBe(value);
}

test.beforeEach(async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  // Test failures should report broken frame bootstrapping as well as editor errors.
  (page as Page & {themeErrors?:string[]}).themeErrors=errors;
});

test.afterEach(async({page})=>{
  expect((page as Page & {themeErrors?:string[]}).themeErrors,'No uncaught editor or preview errors').toEqual([]);
});

test('the preview connects and applies edits when its early ready message is missed',async({page})=>{
  await page.addInitScript(()=>{
    // Intercept delivery without replacing postMessage: its native event.source
    // must continue to identify the child frame for the origin/source checks.
    window.addEventListener('message',event=>{
      const message:unknown=event.data;
      if(message && typeof message==='object' && 'type' in message && message.type==='bld8-theme-ready') {
        const host=window as Window & {droppedThemeReady?:number};
        host.droppedThemeReady=(host.droppedThemeReady??0)+1;
        event.stopImmediatePropagation();
      }
    },true);
  });
  await openLab(page);
  await expect.poll(()=>page.evaluate(()=>(window as Window & {droppedThemeReady?:number}).droppedThemeReady??0)).toBeGreaterThan(0);
  await expect(page.getByRole('status').filter({hasText:'Live. Buttons, menus and dialogs use your theme.'})).toBeVisible();
  await editAccent(page);
  await expect(preview(page).getByRole('button',{name:'Mark ready',exact:true})).toHaveCSS('background-color','rgb(25, 103, 210)');
  await expect(page.getByRole('status').filter({hasText:'Preview did not connect.'})).toHaveCount(0);
});

test('custom colour and preview mode stay inside the frame',async({page})=>{
  await openLab(page);
  const parentBefore=await page.locator('html').evaluate(element=>({
    mode:element.getAttribute('data-ui-theme'),
    accent:getComputedStyle(element).getPropertyValue('--bui-accent'),
    primary:getComputedStyle(element).getPropertyValue('--bui-primary'),
  }));
  const headerBefore=await page.locator('.site-header').evaluate(element=>({background:getComputedStyle(element).backgroundColor,colour:getComputedStyle(element).color}));
  await editAccent(page);
  await page.getByRole('button',{name:'Dark preview',exact:true}).click();
  await expect(preview(page).locator('html')).toHaveAttribute('data-ui-theme','dark');
  expect(await page.locator('html').evaluate(element=>({
    mode:element.getAttribute('data-ui-theme'),
    accent:getComputedStyle(element).getPropertyValue('--bui-accent'),
    primary:getComputedStyle(element).getPropertyValue('--bui-primary'),
  }))).toEqual(parentBefore);
  expect(await page.locator('.site-header').evaluate(element=>({background:getComputedStyle(element).backgroundColor,colour:getComputedStyle(element).color}))).toEqual(headerBefore);
});

test('a brand preset changes the specimen without recolouring site navigation',async({page})=>{
  await openLab(page);
  const frame=preview(page);
  const before=await frameToken(frame,'--bui-accent');
  const navigationBefore=await page.locator('.site-header').evaluate(element=>({
    colour:getComputedStyle(element).color,
    background:getComputedStyle(element).backgroundColor,
    accent:getComputedStyle(element).getPropertyValue('--bui-accent'),
  }));
  await page.getByRole('button',{name:/^Cobalt /}).click();
  await expect.poll(()=>frameToken(frame,'--bui-accent')).not.toBe(before);
  await expect(frame.getByRole('region',{name:'Themed workspace',exact:true})).toBeVisible();
  expect(await page.locator('.site-header').evaluate(element=>({
    colour:getComputedStyle(element).color,
    background:getComputedStyle(element).backgroundColor,
    accent:getComputedStyle(element).getPropertyValue('--bui-accent'),
  }))).toEqual(navigationBefore);
  await controls(page).getByRole('button',{name:'Reset theme',exact:true}).click();
  await expect.poll(()=>frameToken(frame,'--bui-accent')).toBe(before);
});

test('compact density changes actual field, button and number geometry together',async({page})=>{
  await openLab(page);
  const frame=preview(page);
  await chooseOption(page,controls(page).getByRole('combobox',{name:'Density',exact:true}),'Compact');
  await frame.getByRole('tab',{name:'Controls',exact:true}).click();
  const title=frame.getByRole('textbox',{name:'Project title',exact:true});
  const number=frame.locator('.bui-number-group');
  const action=frame.getByRole('button',{name:'New project',exact:true});
  await expect(title).toBeVisible();
  for(const control of [title,number,action]) {
    await expect.poll(()=>control.evaluate(element=>Math.round(element.getBoundingClientRect().height))).toBe(40);
  }
});

test('frame Select and Dialog portals inherit custom tokens and restore keyboard focus',async({page})=>{
  await openLab(page);
  await editAccent(page);
  await page.getByRole('button',{name:'Dark preview',exact:true}).click();
  const frame=preview(page);
  const select=frame.getByRole('combobox',{name:'Project status',exact:true});
  await select.focus();
  await page.keyboard.press('ArrowDown');
  const listbox=frame.getByRole('listbox');
  await expect(listbox).toBeVisible();
  expect(await listbox.evaluate(element=>getComputedStyle(element).getPropertyValue('--bui-accent').trim())).toBe(customAccent);
  expect(await listbox.evaluate(element=>getComputedStyle(element).getPropertyValue('--bui-bg').trim())).toBe(await frameToken(frame,'--bui-bg'));
  expect(await listbox.evaluate(element=>element.closest('[aria-label="Themed workspace"]')===null)).toBe(true);
  await frame.getByRole('option',{name:'In progress',exact:true}).click();
  await expect(select).toContainText('In progress');
  await expect(select).toBeFocused();
  const trigger=frame.getByRole('button',{name:'New project',exact:true});
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog=frame.getByRole('dialog',{name:'Create a project',exact:true});
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(element=>getComputedStyle(element).getPropertyValue('--bui-accent').trim())).toBe(customAccent);
  expect(await dialog.evaluate(element=>element.closest('[aria-label="Themed workspace"]')===null)).toBe(true);
  await dialog.getByRole('textbox',{name:'Project name',exact:true}).fill('Theme review');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the URL restores custom values and discrete edits support back and forward',async({page})=>{
  await openLab(page,'/themes?campaign=review#live-preview');
  await editAccent(page);
  await expect.poll(()=>new URL(page.url()).searchParams.get('theme')).not.toBeNull();
  await chooseOption(page,controls(page).getByRole('combobox',{name:'Density',exact:true}),'Compact');
  const compactURL=page.url();
  await page.getByRole('button',{name:'Dark preview',exact:true}).click();
  const darkURL=page.url();
  expect(new URL(darkURL).searchParams.get('campaign')).toBe('review');
  expect(new URL(darkURL).hash).toBe('#live-preview');
  await page.goBack();
  await expect(page).toHaveURL(compactURL);
  await expect(controls(page).getByRole('combobox',{name:'Density',exact:true})).toContainText('Compact');
  await expect(preview(page).locator('html')).toHaveAttribute('data-ui-theme','light');
  await page.goForward();
  await expect(page).toHaveURL(darkURL);
  await expect(preview(page).locator('html')).toHaveAttribute('data-ui-theme','dark');
  await page.reload();
  await expect(controls(page).getByRole('textbox',{name:'Accent colour',exact:true})).toHaveValue(customAccent.toUpperCase());
  await expect(controls(page).getByRole('combobox',{name:'Density',exact:true})).toContainText('Compact');
  await expect.poll(()=>frameToken(preview(page),'--bui-accent')).toBe(customAccent);
  await expect(preview(page).locator('html')).toHaveAttribute('data-ui-theme','dark');
});

test('invalid colour text keeps the last valid preview and can be corrected',async({page})=>{
  await openLab(page);
  await editAccent(page);
  const accent=controls(page).getByRole('textbox',{name:'Accent colour',exact:true});
  await accent.fill('#12zz00');
  await accent.blur();
  await expect(accent).toHaveAttribute('aria-invalid','true');
  await expect(accent).toHaveAttribute('aria-describedby',/.+/);
  expect(await frameToken(preview(page),'--bui-accent')).toBe(customAccent);
  await editAccent(page,'#7c3aed');
  await expect(accent).not.toHaveAttribute('aria-invalid','true');
});

test('untrusted URL settings cannot become CSS or executable markup',async({page})=>{
  const requests:string[]=[];
  page.on('request',request=>{if(new URL(request.url()).pathname==='/theme-test-css-injection')requests.push(request.url());});
  const hostile=JSON.stringify({version:1,accent:'url("/theme-test-css-injection")',primary:'</style><script>window.themeInjection=true</script>',font:'url("/theme-test-css-injection")',radius:'0; background:url(/theme-test-css-injection)'});
  await openLab(page,'/themes?theme='+encodeURIComponent(hostile));
  await expect(page.getByRole('status').filter({hasText:'This theme link is invalid or unsupported. The default theme is shown.'})).toBeVisible();
  await expect(controls(page).getByRole('textbox',{name:'Accent colour',exact:true})).toHaveValue(DEFAULT_THEME.accent.toUpperCase());
  expect(await frameToken(preview(page),'--bui-accent')).toBe(DEFAULT_THEME.accent);
  expect(await page.evaluate(()=>(window as Window & {themeInjection?:boolean}).themeInjection)).toBeUndefined();
  expect(await preview(page).locator('html').evaluate(()=>(window as Window & {themeInjection?:boolean}).themeInjection)).toBeUndefined();
  expect(requests).toEqual([]);
});

test('copy actions report success only after writing their complete CSS or link',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>{(window as Window & {copiedTheme?:string}).copiedTheme=value;}}});
  });
  await openLab(page);
  await editAccent(page);
  await page.getByRole('button',{name:'Copy CSS',exact:true}).click();
  await expect(status(page).filter({hasText:'CSS copied.'})).toBeVisible();
  const css=await page.evaluate(()=>(window as Window & {copiedTheme?:string}).copiedTheme);
  expect(css).toContain('--bui-accent: '+customAccent);
  expect(css).toMatch(/\[data-ui-theme=["']dark["']\]/);
  expect(css).toContain('--bui-font:');
  await page.getByRole('button',{name:'Copy theme link',exact:true}).click();
  await expect(status(page).filter({hasText:'Theme link copied.'})).toBeVisible();
  const link=await page.evaluate(()=>(window as Window & {copiedTheme?:string}).copiedTheme);
  expect(new URL(link!).pathname).toBe('/themes');
  expect(new URL(link!).searchParams.has('theme')).toBe(true);
});

test('clipboard denial offers manual recovery without a success claim',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('Clipboard is blocked','NotAllowedError');}}});
  });
  await openLab(page);
  await page.getByRole('button',{name:'Copy CSS',exact:true}).click();
  await expect(status(page).filter({hasText:/Could not copy CSS/})).toBeVisible();
  await expect(status(page).filter({hasText:'CSS copied.'})).toHaveCount(0);
  await expect(page.locator('.theme-css code')).toBeVisible();
  await expect(page.locator('.theme-css code')).toContainText('--bui-accent');
  await page.getByRole('button',{name:'Copy theme link',exact:true}).click();
  await expect(status(page).filter({hasText:/Could not copy/})).toBeVisible();
  await expect(status(page).filter({hasText:'Theme link copied.'})).toHaveCount(0);
  const manualLink=page.getByRole('textbox',{name:'Theme link',exact:true});
  await expect(manualLink).toHaveAttribute('readonly','');
  expect(new URL(await manualLink.inputValue()).searchParams.has('theme')).toBe(true);
});

test('download produces a usable CSS file containing the displayed custom theme',async({page})=>{
  await openLab(page);
  await editAccent(page);
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download CSS',exact:true}).click();
  const download=await pending;
  expect(download.suggestedFilename()).toMatch(/\.css$/);
  expect(await download.failure()).toBeNull();
  await expect(status(page).filter({hasText:'Theme CSS download started.'})).toBeVisible();
  const stream=await download.createReadStream();
  expect(stream).not.toBeNull();
  const chunks:Buffer[]=[];
  for await(const chunk of stream!)chunks.push(Buffer.from(chunk));
  const css=Buffer.concat(chunks).toString('utf8');
  expect(css).toContain('--bui-accent: '+customAccent);
  expect(css).toMatch(/\[data-ui-theme=["']dark["']\]/);
  expect(css).not.toMatch(/__className|__variable|localhost|127\.0\.0\.1/);
});

test('download preparation failure is reported without claiming the file was saved',async({page})=>{
  await page.addInitScript(()=>{URL.createObjectURL=()=>{throw new Error('Object URLs unavailable');};});
  await openLab(page);
  const downloads:string[]=[];
  page.on('download',download=>downloads.push(download.suggestedFilename()));
  await page.getByRole('button',{name:'Download CSS',exact:true}).click();
  await expect(status(page).filter({hasText:/Could not.*download|Could not.*CSS file/i})).toBeVisible();
  expect(downloads).toEqual([]);
});

for(const width of [320,390])test(`theme controls and frame remain keyboard usable and contained at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await openLab(page);
  const accent=controls(page).getByRole('textbox',{name:'Accent colour',exact:true});
  await accent.focus();
  await expect(accent).toBeFocused();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(customAccent);
  await page.keyboard.press('Tab');
  await expect.poll(()=>frameToken(preview(page),'--bui-accent')).toBe(customAccent);
  await page.getByRole('button',{name:'Phone preview',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await preview(page).locator('html').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const frameBounds=await page.locator(`iframe[title="${previewTitle}"]`).boundingBox();
  expect(frameBounds!.width).toBeLessThanOrEqual(width);
  const trigger=preview(page).getByRole('button',{name:'New project',exact:true});
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog=preview(page).getByRole('dialog',{name:'Create a project',exact:true});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox',{name:'Project name',exact:true}).fill('Phone review');
  expect(await preview(page).locator('html').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

for(const mode of ['light','dark'] as const)test(`theme editor and live frame have no automated accessibility violations in ${mode}`,async({page})=>{
  await openLab(page);
  if(mode==='dark') {
    await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
    await page.getByRole('button',{name:'Dark preview',exact:true}).click();
  }
  for(const preset of THEME_PRESETS) {
    await page.getByRole('button',{name:new RegExp('^'+preset.label+' ')}).click();
    await expect.poll(()=>frameToken(preview(page),'--bui-accent')).toBe(getThemeTokens(preset.config,mode)['--bui-accent']);
    await expect(preview(page).locator('html')).toHaveAttribute('data-ui-theme',mode);
    const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(scan.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)})),preset.label+' '+mode).toEqual([]);
  }
});

test('live reduced motion reaches the frame choices and newly opened dialogs',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await openLab(page);
  const frame=preview(page);
  const toggle=frame.getByRole('switch',{name:'Weekly digest',exact:true});
  await expect.poll(()=>toggle.evaluate(element=>getComputedStyle(element,'::after').transitionDuration)).not.toBe('0s');
  const checked=await toggle.isChecked();
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>toggle.evaluate(element=>getComputedStyle(element,'::after').transitionDuration)).toBe('0s');
  await toggle.setChecked(!checked);
  await expect(toggle).toBeChecked({checked:!checked});
  expect(await toggle.evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length)).toBe(0);
  await frame.getByRole('button',{name:'New project',exact:true}).click();
  await expect(frame.getByRole('dialog',{name:'Create a project',exact:true})).toHaveCSS('transition-duration','0s');
  await page.keyboard.press('Escape');
  await expect(frame.getByRole('button',{name:'New project',exact:true})).toBeFocused();
});

test('compact themes retain coarse-pointer control and menu targets',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  try {
    const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await openLab(page);await chooseOption(page,controls(page).getByRole('combobox',{name:'Density',exact:true}),'Compact');
    const frame=preview(page);
    await expect.poll(()=>frameToken(frame,'--bui-control-md')).toBe('40px');
    expect(await frame.locator('html').evaluate(()=>matchMedia('(pointer:coarse)').matches)).toBe(true);
    await frame.getByRole('combobox',{name:'Project status',exact:true}).click();
    expect((await frame.getByRole('option',{name:'Ready',exact:true}).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape');await frame.getByRole('tab',{name:'Controls',exact:true}).click();
    for(const control of [frame.getByRole('textbox',{name:'Project title',exact:true}),frame.locator('.bui-number-group'),frame.getByRole('button',{name:'New project',exact:true}),frame.getByRole('checkbox',{name:'Include archived',exact:true}).locator('..'),frame.getByRole('switch',{name:'Weekly digest',exact:true}).locator('..')]){
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(errors).toEqual([]);
  } finally {await context.close();}
});
