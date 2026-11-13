import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {donutModel,sparklineModel,stackedModel} from '../packages/ui/src/analytics-chart-state';

async function example(page:Page,family:string,id:string){await page.goto('/components/'+family+'/examples/'+id);const region=page.locator('[data-example-id="'+id+'"]'),run=region.getByRole('button',{name:'Run example',exact:true});if(await run.isVisible())await run.click();await expect(region.locator('[data-example-ready]')).toBeVisible();return region;}
test('donut geometry keeps original data and visible totals distinct',()=>{
 const data=Object.freeze([Object.freeze({id:'a',label:'A',value:10}),Object.freeze({id:'b',label:'B',value:30})]);expect(donutModel(data).segments.map(item=>[item.share,item.offset])).toEqual([[25,0],[75,25]]);expect(donutModel(data,['a']).total).toBe(30);expect(donutModel(data,['a']).segments[0].share).toBe(100);expect(donutModel(data,['a','b']).total).toBe(0);expect(data[0].value).toBe(10);
 for(const invalid of [[{id:'a',label:'A',value:-1}],[{id:'a',label:'A',value:Infinity}],[...data,{id:'a',label:'Again',value:1}]])expect(()=>donutModel(invalid)).toThrow();
});
test('sparkline geometry preserves missing observations and finite extreme ranges',()=>{
 const model=sparklineModel([{id:'a',label:'A',value:-5},{id:'b',label:'B',value:null},{id:'c',label:'C',value:5}]);expect(model.path.match(/M/g)).toHaveLength(2);expect(model.points[1].y).toBeNull();expect(model.minimum).toBe(-5);expect(model.maximum).toBe(5);expect(model.missing).toBe(1);expect(sparklineModel([]).last).toBeNull();
 for(const values of [[0,0],[-Number.MAX_VALUE,Number.MAX_VALUE]]){const geometry=sparklineModel(values.map((value,index)=>({id:String(index),label:String(index),value})));expect(geometry.path).not.toMatch(/NaN|Infinity/);}
});
test('stacked totals distinguish missing values and reject invalid series atomically',()=>{
 const data=[{id:'a',label:'A',values:{one:10,two:null}},{id:'b',label:'B',values:{one:20,two:5}}],series=[{id:'one',label:'One'},{id:'two',label:'Two'}];expect(stackedModel(data,series).rows.map(item=>item.total)).toEqual([10,25]);expect(stackedModel(data,series,['one']).rows.map(item=>item.total)).toEqual([0,5]);expect(data[0].values.two).toBeNull();expect(()=>stackedModel([{id:'bad',label:'Bad',values:{one:-1,two:0}}],series)).toThrow();expect(()=>stackedModel([{id:'bad',label:'Bad',values:{one:3}}],series)).toThrow();
});
test('animated keyed updates retain drafts through reorder and repair removed-row focus',async({page})=>{
 const region=await example(page,'animated-list','motion-list-updates'),input=region.getByRole('textbox',{name:'Title for one',exact:true});await input.fill('A retained draft');await region.getByRole('button',{name:'Reverse order',exact:true}).click();await expect(input).toHaveValue('A retained draft');await region.getByRole('button',{name:'Remove Keyboard review',exact:true}).click();await expect(input).toHaveCount(0);await expect(region.getByRole('textbox',{name:'Title for two',exact:true})).toBeFocused();
 await region.getByRole('button',{name:'Add update',exact:true}).click();await expect(region.getByRole('textbox',{name:'Title for 4',exact:true})).toBeVisible();
});
test('number animation exposes one committed value and settles when reduced motion changes',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});const region=await example(page,'animated-number','motion-number-metric');await region.getByRole('button',{name:'Add 125',exact:true}).click();await region.getByRole('button',{name:'Add 125',exact:true}).click();await page.emulateMedia({reducedMotion:'reduce'});await expect(region.locator('.bui-animated-number .bui-sr-only')).toContainText('2,650');await expect(region.locator('.bui-animated-number [aria-hidden=true]')).toContainText('2,650');await expect(region.locator('.bui-animated-number [aria-live]')).toHaveCount(0);
});
test('intrinsic height supports interrupted changes with stable button focus',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});const region=await example(page,'auto-height','motion-intrinsic-height'),button=region.getByRole('button',{name:'More notes',exact:true});await button.click();await region.getByRole('button',{name:'Fewer notes',exact:true}).click();await expect(button).toBeFocused();await expect(region.getByText('Changes can arrive while the previous transition is still running.',{exact:true})).toHaveCount(0);await expect(region.getByRole('heading',{name:'Keep the useful details.',exact:true})).toBeVisible();
});
test('donut and stacked legends preserve focus and exact original values',async({page})=>{
 let region=await example(page,'donut-chart','chart-donut-allocation'),toggle=region.getByRole('button',{name:'Engineering 52',exact:true});await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','false');await expect(toggle).toBeFocused();await region.getByText('View data',{exact:true}).click();await expect(region.getByRole('row',{name:'Engineering 52 — No',exact:true})).toBeVisible();
 region=await example(page,'stacked-bar-chart','chart-stacked-periods');await region.getByRole('button',{name:'Percentage view',exact:true}).click();await region.getByRole('button',{name:'Pending',exact:true}).click();await expect(region.getByRole('button',{name:'Pending',exact:true})).toBeFocused();await region.getByText('View data',{exact:true}).click();await expect(region.getByRole('row',{name:'November 40 Missing 40',exact:true})).toBeVisible();
});
for(const [family,id] of [['donut-chart','chart-donut-allocation'],['sparkline','chart-sparkline-missing'],['stacked-bar-chart','chart-stacked-periods'],['animated-list','motion-list-updates'],['layout-transition','motion-shared-selection']])test(family+' is accessible and contained at 320px in both themes',async({page})=>{
 await page.setViewportSize({width:320,height:900});for(const theme of ['light','dark']){const region=await example(page,family,id);await page.evaluate(value=>document.documentElement.dataset.uiTheme=value,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const results=await new AxeBuilder({page}).include('[data-example-id="'+id+'"]').analyze();expect(results.violations).toEqual([]);await expect(region).toBeVisible();}
});

test('finite extreme animated values never expose invalid intermediate text',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});const region=await example(page,'animated-number','motion-number-finite-range');const visual=region.locator('.bui-animated-number [aria-hidden=true]');await region.getByRole('button',{name:'Change sign',exact:true}).click();for(let index=0;index<12;index++){await expect(visual).not.toHaveText(/NaN|∞|Infinity/);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));}await expect(region.locator('.bui-animated-number .bui-sr-only')).toContainText(/1\.798[eE]308/);
});
