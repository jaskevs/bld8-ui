import {test,expect,type Locator,type Page} from '@playwright/test';
import {DEFAULT_THEME,THEME_PRESETS,contrastRatio,exportThemeCss,getThemeTokens,type ThemeConfig,type ThemeTokens,type ThemeMode} from '../packages/ui/src/theme-config';
import {validateChartData,type ChartSeries} from '../packages/ui/src/chart-state';
import {chooseOption} from './helpers/controls';

const families=['blue','teal','coral','violet','amber','pink'] as const;
function tokenColor(tokens:ThemeTokens,key:`--bui-${string}`,seen=new Set<string>()):string{
  if(seen.has(key))throw new Error('Cyclic colour token: '+key);
  seen.add(key);
  const value=tokens[key],alias=/^var\((--bui-[\w-]+)\)$/.exec(value??'');
  if(alias)return tokenColor(tokens,alias[1] as `--bui-${string}`,seen);
  expect(value,'Opaque colour token '+key).toMatch(/^#[\da-f]{6}$/i);
  return value;
}
async function setMode(page:Page,mode:ThemeMode){await page.locator('html').evaluate((element,value)=>element.setAttribute('data-ui-theme',value),mode);}
async function paint(locator:Locator){
  return locator.evaluate(element=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
    const context=canvas.getContext('2d')!;
    const rgba=(value:string)=>{context.clearRect(0,0,1,1);context.fillStyle=value;context.fillRect(0,0,1,1);return Array.from(context.getImageData(0,0,1,1).data);};
    const hex=(value:readonly number[])=>'#'+value.slice(0,3).map(channel=>Math.round(channel).toString(16).padStart(2,'0')).join('');
    const ancestors:Element[]=[];for(let host:Element|null=element;host;host=host.parentElement)ancestors.unshift(host);
    let background=[255,255,255];
    for(const host of ancestors){const layer=rgba(getComputedStyle(host).backgroundColor),alpha=layer[3]/255;background=background.map((channel,index)=>layer[index]*alpha+channel*(1-alpha));}
    const foreground=rgba(getComputedStyle(element).color),alpha=foreground[3]/255;
    return {foreground:hex(background.map((channel,index)=>foreground[index]*alpha+channel*(1-alpha))),background:hex(background)};
  });
}

test('supporting colours and six chart shades remain readable in presets and portable custom themes',()=>{
  const themes:readonly Partial<ThemeConfig>[]=[DEFAULT_THEME,...THEME_PRESETS.map(item=>item.config),{accent:'#00aaff',primary:'#182a44'},{accent:'#ffffff',primary:'#000000'},{accent:'#000000',primary:'#ffffff'}];
  for(const config of themes)for(const mode of ['light','dark'] as const){
    const tokens=getThemeTokens(config,mode),chart=families.map((_,index)=>tokenColor(tokens,`--bui-chart-${index+1}`));
    expect(new Set(chart).size,mode+' independent data colours').toBe(6);
    for(const color of chart)for(const surface of ['--bui-bg','--bui-surface'] as const)expect(contrastRatio(color,tokenColor(tokens,surface)),mode+' chart on '+surface).toBeGreaterThanOrEqual(3);
    for(const family of families)expect(contrastRatio(tokenColor(tokens,`--bui-support-${family}`),tokenColor(tokens,`--bui-support-${family}-bg`)),mode+' '+family+' supporting text').toBeGreaterThanOrEqual(4.5);
    for(const role of ['success','warning','danger','info'] as const)expect(contrastRatio(tokenColor(tokens,`--bui-${role}`),tokenColor(tokens,`--bui-${role}-bg`)),mode+' '+role+' feedback').toBeGreaterThanOrEqual(4.5);
    expect(tokenColor(tokens,'--bui-progress-fill')).toBe(chart[0]);
  }
});

test('chart tone aliases accept intensity roles without arbitrary colour names',()=>{
  for(const tone of ['primary','accent','muted'] as const)expect(()=>validateChartData([{id:'a',label:'A',values:{value:1}}],[{id:'value',label:'Value',tone}])).not.toThrow();
  for(const tone of ['blue','teal','coral','rainbow','var(--custom)','url(example)'])expect(()=>validateChartData([{id:'a',label:'A',values:{value:1}}],[{id:'value',label:'Value',tone} as unknown as ChartSeries])).toThrow();
});

const browserErrors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const errors:string[]=[];browserErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(async({page})=>expect(browserErrors.get(page),'No uncaught colour-system errors').toEqual([]));

async function seriesPaint(surface:Locator){
  return surface.evaluate(element=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d')!;
    const hex=(value:string)=>{context.clearRect(0,0,1,1);context.fillStyle=value;context.fillRect(0,0,1,1);return '#'+Array.from(context.getImageData(0,0,1,1).data).slice(0,3).map(channel=>channel.toString(16).padStart(2,'0')).join('');};
    const definitions=Array.from(element.querySelectorAll('.bui-chart-legend>button'));
    return Array.from(element.querySelectorAll('.bui-chart-series[data-series]')).map(group=>({id:group.getAttribute('data-series')!,stroke:hex(getComputedStyle(group.querySelector('.bui-chart-line')!).stroke),legend:hex(getComputedStyle(definitions.find(button=>button.getAttribute('aria-label')==='Series '+group.getAttribute('data-series')!.replace('series-','')+' series')!.querySelector('svg')!).color)}));
  });
}

for(const fixture of [{name:'BLD8',config:DEFAULT_THEME},{name:'Sage',config:THEME_PRESETS[2].config},{name:'custom',config:{...DEFAULT_THEME,accent:'#00aaff',primary:'#182a44'}}])test('rendered chart series retain distinct readable colours in '+fixture.name,async({page})=>{
  await page.goto('/components/chart');
  await chooseOption(page,page.getByRole('combobox',{name:'Chart preview state',exact:true}),'Full year (366 points)');
  const chart=page.getByRole('figure',{name:'Daily observations',exact:true});
  await expect(chart.locator('.bui-chart-point')).toHaveCount(366);
  await page.addStyleTag({content:exportThemeCss(fixture.config)});
  await page.locator('html').evaluate(element=>element.classList.add('bld8-theme'));
  for(const mode of ['light','dark'] as const){
    await setMode(page,mode);const tokens=getThemeTokens(fixture.config,mode),background=tokenColor(tokens,'--bui-bg');
    await expect.poll(async()=>{
      const colors=await seriesPaint(chart);return colors.length===6&&new Set(colors.map(item=>item.stroke)).size===6&&colors.every(item=>contrastRatio(item.stroke,background)>=3&&item.stroke===item.legend);
    },mode+' data and legend colours are distinct and readable').toBe(true);
  }
  const before=Object.fromEntries((await seriesPaint(chart)).map(item=>[item.id,item.stroke]));
  const legend=chart.getByRole('button',{name:'Series 1 series',exact:true});await legend.focus();await legend.press('Space');
  await expect(chart.locator('.bui-chart-series[data-series]')).toHaveCount(5);
  for(const item of await seriesPaint(chart))expect(item.stroke,'Hiding a series must not reassign another colour').toBe(before[item.id]);
  await expect(legend).toBeFocused();
});

test('solid chart bars retain pattern distinction when forced colours are active',async({page})=>{
  await page.goto('/components/chart');
  await page.getByRole('group',{name:'Chart type',exact:true}).getByRole('button',{name:'Bar',exact:true}).click();
  const chart=page.getByRole('figure',{name:'Weekly requests',exact:true}),pattern=chart.locator('.bui-chart-bar-pattern');
  await expect(pattern.first()).toHaveCSS('display','none');
  const point=chart.locator('.bui-chart-point').first();await point.focus();const before=await point.boundingBox();
  await page.emulateMedia({forcedColors:'active'});await expect(pattern.first()).toHaveCSS('display','inline');
  expect((await pattern.first().boundingBox())!.height).toBeGreaterThan(0);
  await expect(point).toBeFocused();const after=await point.boundingBox();
  expect(after!.width).toBeCloseTo(before!.width,1);expect(after!.height).toBeCloseTo(before!.height,1);
});

test('feedback and avatar colours stay readable and stable across light and dark',async({page})=>{
  for(const mode of ['light','dark'] as const){
    await page.goto('/components/badge');await setMode(page,mode);
    const badges=page.locator('.detail-demo .bui-badge');await expect(badges).toHaveCount(5);
    for(const badge of await badges.all()){const color=await paint(badge);expect(contrastRatio(color.foreground,color.background),'Readable status '+await badge.innerText()).toBeGreaterThanOrEqual(4.5);}
  }
  await page.goto('/components/avatar');const names=['Alex Morgan','Sam Lee','Taylor Kim'];
  const baseline=new Map<string,{width:number;height:number}>();
  for(const mode of ['light','dark'] as const){
    await setMode(page,mode);const colors=[];
    for(const name of names){const avatar=page.getByRole('img',{name,exact:true}),color=await paint(avatar),box=(await avatar.boundingBox())!;colors.push(color);expect(contrastRatio(color.foreground,color.background),mode+' avatar initials').toBeGreaterThanOrEqual(4.5);if(mode==='light')baseline.set(name,{width:box.width,height:box.height});else expect({width:box.width,height:box.height}).toEqual(baseline.get(name));}
    expect(new Set(colors.map(color=>color.background)).size,'Avatar fallback uses one coherent supporting family').toBe(1);
  }
});

test('catalogue composition previews share a top baseline while simple controls stay centred',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});await page.goto('/components');await page.evaluate(()=>document.fonts.ready);
  const card=(id:string)=>page.locator('.component-card').filter({has:page.locator('.component-bottom a[href="/components/'+id+'"]')});
  const placement=async(id:string)=>card(id).locator('.component-preview').evaluate(element=>{
    const bounds=element.getBoundingClientRect(),child=element.firstElementChild!.getBoundingClientRect(),style=getComputedStyle(element);
    return {top:child.top,inset:child.top-bounds.top,expectedInset:parseFloat(style.paddingTop),centreError:(child.top+child.bottom)/2-(bounds.top+parseFloat(style.paddingTop)+bounds.bottom-parseFloat(style.paddingBottom))/2};
  });
  await expect(card('chart')).toBeVisible();await expect(card('tree')).toBeVisible();
  const chart=await placement('chart'),tree=await placement('tree');
  expect(Math.abs(chart.top-tree.top),'Paired composed previews begin on the same baseline').toBeLessThanOrEqual(1);
  for(const item of [chart,tree])expect(Math.abs(item.inset-item.expectedInset),'Composition starts at the padded top edge').toBeLessThanOrEqual(1);
  expect(Math.abs((await placement('button')).centreError),'Standalone controls remain vertically centred').toBeLessThanOrEqual(1);
  await page.setViewportSize({width:320,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'The aligned catalogue still fits a narrow viewport').toBe(true);
});

test('chart view backplate eases between rigid keyboard targets and reacts to reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/components/chart');await page.evaluate(()=>document.fonts.ready);
  const group=page.getByRole('group',{name:'Chart type',exact:true}),chart=page.getByRole('figure',{name:'Weekly requests',exact:true});
  const line=group.getByRole('button',{name:'Line',exact:true}),bar=group.getByRole('button',{name:'Bar',exact:true}),area=group.getByRole('button',{name:'Area',exact:true});
  await expect(chart.locator('.bui-chart-point')).toHaveCount(7);
  const controls=[line,bar,area],before=await Promise.all(controls.map(control=>control.boundingBox()));
  const motion=()=>group.evaluate(element=>{const style=getComputedStyle(element,'::before');return {property:style.transitionProperty,duration:style.transitionDuration.split(',').map(parseFloat),x:new DOMMatrixReadOnly(style.transform).m41};});
  const initial=await motion();expect(initial.property).toContain('transform');expect(initial.duration.some(value=>value>0)).toBe(true);
  await bar.click();await expect(bar).toHaveAttribute('aria-pressed','true');await expect(bar).toBeFocused();
  const barOffset=before[1]!.x-before[0]!.x;
  await expect.poll(async()=>Math.abs((await motion()).x-barOffset),'Backplate reaches the Bar target').toBeLessThan(.5);
  await line.focus();await line.press('Space');await expect(line).toHaveAttribute('aria-pressed','true');
  await bar.focus();await bar.press('Enter');await expect(bar).toHaveAttribute('aria-pressed','true');await expect(bar).toBeFocused();
  for(let index=0;index<controls.length;index++)expect(await controls[index].boundingBox(),'Chart selector hit target '+index).toEqual(before[index]);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(chart).toHaveAttribute('data-reduced-motion','true');
  await expect.poll(async()=>(await motion()).duration.every(value=>value===0),'Reduced motion removes backplate travel').toBe(true);
  await area.focus();await area.press('Space');await expect(area).toBeFocused();await expect(area).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>group.evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length)).toBe(0);
  await expect(chart.locator('.bui-chart-point')).toHaveCount(7);
});

test('the composed theme study shares action, selection and chart roles in both modes',async({page})=>{
  await page.goto('/themes');
  const frame=page.frameLocator('iframe[title="Theme preview"]');
  await expect(frame.locator('html')).toHaveAttribute('data-theme-ready','true');
  await frame.getByRole('tab',{name:'Interface study',exact:true}).click();
  const save=frame.getByRole('button',{name:'Save settings',exact:true});
  const chart=frame.getByRole('figure',{name:'Review activity',exact:true});
  await expect(chart).toBeVisible();
  for(const mode of ['light','dark'] as const){
    await page.getByRole('button',{name:mode==='light'?'Light preview':'Dark preview',exact:true}).click();
    await expect(frame.locator('html')).toHaveAttribute('data-ui-theme',mode);
    const tokens=getThemeTokens(DEFAULT_THEME,mode);
    await expect.poll(async()=>{
      const colours=await save.evaluate(element=>{const style=getComputedStyle(element);return {background:style.backgroundColor,foreground:style.color};});
      const rgb=(hex:string)=>'rgb('+[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)).join(', ')+')';
      return colours.background===rgb(tokens['--bui-primary'])&&colours.foreground===rgb(tokens['--bui-primary-ink']);
    },mode+' action uses the shared theme').toBe(true);
    await expect(chart.locator('.bui-chart-point')).toHaveCount(5);
    const switchControl=frame.getByRole('switch',{name:'Weekly digest',exact:true});
    await switchControl.check();
    await expect.poll(()=>switchControl.evaluate(element=>getComputedStyle(element,'::after').backgroundColor)).toBe('rgb('+[1,3,5].map(index=>parseInt(tokens['--bui-accent-ink'].slice(index,index+2),16)).join(', ')+')');
    await expect(frame.getByRole('row',{name:/Interface audit/})).toHaveAttribute('data-selected','true');
  }
  await frame.getByRole('textbox',{name:'Study name',exact:true}).fill('A clearer interface');
  await save.click();await expect(frame.locator('.theme-sample-status')).toContainText('Settings saved for this preview.');
  await page.getByRole('button',{name:'Phone preview',exact:true}).click();
  expect(await frame.locator('html').evaluate(element=>element.scrollWidth<=innerWidth),'Composed controls fit the phone preview').toBe(true);
  await frame.getByRole('checkbox',{name:'Select Interface audit',exact:true}).uncheck();
  await expect(frame.getByRole('row',{name:/Interface audit/})).not.toHaveAttribute('data-selected','true');
});
