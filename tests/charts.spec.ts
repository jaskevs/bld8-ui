import {test,expect,type Locator,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import {chooseOption} from './helpers/controls';

const chart = (page:Page,name='Weekly requests') => page.getByRole('figure',{name,exact:true});
const chartPreview = (page:Page) => page.getByRole('combobox',{name:'Chart preview state',exact:true});
const points = (surface:Locator) => surface.locator('.bui-chart-point');
const point = (surface:Locator,id:string) => surface.locator('[data-chart-point="'+id+'"]');
const analytics = (page:Page) => page.getByRole('region',{name:'Analytics workspace',exact:true});
const reportPreview = (page:Page) => page.getByRole('combobox',{name:'Analytics preview state',exact:true});
const reportPeriod = (page:Page) => analytics(page).getByRole('combobox',{name:'Reporting period',exact:true});
const reportChart = (page:Page) => chart(page,'Request activity');
const dataTable = (surface:Locator,name:string) => surface.getByRole('table',{name:name+' data',exact:true});

async function showData(surface:Locator,name:string) {
  const table=dataTable(surface,name);
  if(!await table.isVisible()) await surface.getByRole('button',{name:'Show data',exact:true}).click();
  await expect(table).toBeVisible();return table;
}

async function expectSeparateLabels(surface:Locator) {
  await expect.poll(()=>surface.locator('.bui-chart-labels').evaluate(element=>{
    const strip=element.getBoundingClientRect();
    const labels=Array.from(element.querySelectorAll('span')).map(label=>label.getBoundingClientRect()).filter(box=>box.width>0&&box.height>0).sort((a,b)=>a.left-b.left);
    return labels.length>=2&&labels.every((box,index)=>box.left>=strip.left-.5&&box.right<=strip.right+.5&&(!index||box.left>=labels[index-1].right-.5));
  }),'Visible chart labels stay within their strip without overlapping').toBe(true);
}

const browserErrors = new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const errors:string[]=[];browserErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(async({page})=>{expect(browserErrors.get(page),'No uncaught chart or analytics errors').toEqual([]);});

test('chart keyboard exploration keeps one tab stop and pointer hover does not move focus',async({page})=>{
  await page.goto('/components/chart');const surface=chart(page);
  await expect(points(surface)).toHaveCount(7);
  await expect(surface.locator('.bui-chart-point[tabindex="0"]')).toHaveCount(1);
  const mon=point(surface,'mon'),tue=point(surface,'tue'),wed=point(surface,'wed'),sun=point(surface,'sun');
  await mon.focus();await mon.press('ArrowRight');await expect(tue).toBeFocused();
  await tue.press('End');await expect(sun).toBeFocused();
  await sun.press('Home');await expect(mon).toBeFocused();
  await wed.hover();await expect(mon).toBeFocused();
  await expect(surface.locator('.bui-chart-point[tabindex="0"]')).toHaveCount(1);
  await mon.press('ArrowRight');await expect(tue).toBeFocused();
  await page.emulateMedia({forcedColors:'active'});await tue.focus();
  const marker=await tue.evaluate(element=>{const style=getComputedStyle(element,'::after');return {content:style.content,width:parseFloat(style.width),height:parseFloat(style.height),paint:style.backgroundColor};});
  expect(marker.content).not.toBe('none');expect(marker.width).toBeGreaterThan(0);expect(marker.height).toBeGreaterThanOrEqual(2);
  expect(marker.paint).not.toMatch(/^(transparent|rgba\([^)]*,\s*0\))$/);
  await expect(surface.getByRole('group',{name:'Point details',exact:true})).toContainText('Tue');
});

test('chart legends keep steady targets, retain exact hidden-series data and recover from all hidden',async({page})=>{
  await page.goto('/components/chart');const surface=chart(page);
  const completed=surface.getByRole('button',{name:'Completed series',exact:true}),failed=surface.getByRole('button',{name:'Failed series',exact:true});
  await expect(completed).toHaveAttribute('aria-pressed','true');const before=await completed.boundingBox();
  await completed.click();await expect(completed).toHaveAttribute('aria-pressed','false');
  const after=await completed.boundingBox();expect(after!.width).toBeCloseTo(before!.width,1);expect(after!.height).toBeCloseTo(before!.height,1);
  const table=await showData(surface,'Weekly requests');
  await expect(table.getByRole('columnheader',{name:/^Completed/})).toBeVisible();
  await expect(table.getByRole('columnheader',{name:'Failed',exact:true})).toBeVisible();
  await failed.click();await expect(surface.getByText('Choose a series to explore.',{exact:true})).toBeVisible();
  const restore=surface.getByRole('button',{name:'Show all series',exact:true});await restore.focus();await restore.press('Enter');
  await expect(completed).toHaveAttribute('aria-pressed','true');await expect(failed).toHaveAttribute('aria-pressed','true');
  await expect(points(surface)).toHaveCount(7);await expect(surface.locator('.bui-chart-point[tabindex="0"]')).toHaveCount(1);
  expect(await surface.evaluate(element=>element.contains(document.activeElement))).toBe(true);
});

test('chart display modes retain signed values, explicit gaps and complete accessible data',async({page})=>{
  await page.goto('/components/chart');await chooseOption(page,chartPreview(page),'Signed values and gaps');const surface=chart(page);
  const table=await showData(surface,'Weekly requests');await expect(table.locator('tbody tr')).toHaveCount(6);
  const wed=table.getByRole('row',{name:/^Wed /});
  await expect(wed).toContainText('Not recorded');await expect(wed).toContainText('-4');
  await expect(table.getByRole('row',{name:/^Fri /})).toContainText('0');
  const display=page.getByRole('group',{name:'Chart type',exact:true});
  for(const type of ['Bar','Area','Line']){
    const button=display.getByRole('button',{name:type,exact:true});await button.click();await expect(button).toHaveAttribute('aria-pressed','true');
    await expect(points(surface)).toHaveCount(6);await expect(table.locator('tbody tr')).toHaveCount(6);
    expect(await surface.locator('svg').evaluateAll(elements=>elements.every(element=>!/(NaN|Infinity|undefined)/.test(element.innerHTML)))).toBe(true);
    if(type==='Bar'){
      const svg=surface.locator('.bui-chart-svg');
      const markerError=async(expected:{series:string;observation:string;negative:boolean}[])=>svg.evaluate((element,checks)=>{
        const markers=Array.from(element.querySelectorAll('.bui-chart-cursor .bui-chart-marker'));
        if(markers.length!==checks.length)return Number.MAX_VALUE;
        return Math.max(...checks.flatMap(check=>{
          const selector='[data-series="'+check.series+'"][data-observation="'+check.observation+'"]';
          const bar=element.querySelector('.bui-chart-bar'+selector),mark=element.querySelector('.bui-chart-preview-marker'+selector+' .bui-chart-marker');
          if(!bar||!mark)return [Number.MAX_VALUE];
          const paintedBar=bar.getBoundingClientRect(),marker=mark.getBoundingClientRect();
          return [Math.abs(marker.x+marker.width/2-(paintedBar.x+paintedBar.width/2)),Math.abs(marker.y+marker.height/2-(check.negative?paintedBar.bottom:paintedBar.top))];
        }));
      },expected);
      await point(surface,'tue').focus();
      await expect(svg.locator('.bui-chart-cursor .bui-chart-marker')).toHaveCount(1);
      await expect.poll(()=>markerError([{series:'completed',observation:'tue',negative:true}]),'Tue negative Completed marker matches its bar bottom; missing Failed has no marker').toBeLessThan(1);
      await point(surface,'mon').focus();
      await expect(svg.locator('.bui-chart-cursor .bui-chart-marker')).toHaveCount(2);
      await expect.poll(()=>markerError([{series:'completed',observation:'mon',negative:false},{series:'failed',observation:'mon',negative:false}]),'Each Mon marker matches its own grouped bar centre and value endpoint').toBeLessThan(1);
      const categoryError=await svg.evaluate(element=>{
        const bars=Array.from(element.querySelectorAll('.bui-chart-bar[data-observation="mon"]')).map(bar=>bar.getBoundingClientRect());
        const cursor=element.querySelector('.bui-chart-cursor>line')!.getBoundingClientRect();
        return Math.abs(cursor.x-((bars[0].x+bars[0].width/2)+(bars[1].x+bars[1].width/2))/2);
      });
      expect(categoryError,'The cursor line stays at the category centre').toBeLessThan(1);
    }
  }
  const hide=surface.getByRole('button',{name:'Hide data',exact:true});await hide.focus();await hide.press('Enter');
  await expect(table).not.toBeVisible();await expect(surface.getByRole('button',{name:'Show data',exact:true})).toBeFocused();
});

test('empty and invalid chart inputs have honest recoverable states',async({page})=>{
  await page.goto('/components/chart');const table=await showData(chart(page),'Weekly requests');
  await chooseOption(page,chartPreview(page),'Empty');
  await expect(chart(page)).toContainText('No observations');await expect(points(chart(page))).toHaveCount(0);
  await expect(chartPreview(page)).toBeFocused();
  const hide=chart(page).getByRole('button',{name:'Hide data',exact:true});await expect(hide).toBeEnabled();
  await hide.focus();await hide.press('Enter');await expect(table).not.toBeVisible();
  expect(await chart(page).evaluate(element=>element.contains(document.activeElement))).toBe(true);
  await chooseOption(page,chartPreview(page),'Invalid data');await expect(chart(page).getByRole('alert')).toBeVisible();
  await expect(points(chart(page))).toHaveCount(0);
  await chooseOption(page,chartPreview(page),'Sample data');await expect(points(chart(page))).toHaveCount(7);
  await expect(chartPreview(page)).toBeFocused();
});

test('a full leap-year dataset remains keyboard navigable and exposes all exact records',async({page},info)=>{
  test.setTimeout(45000);await page.goto('/components/chart');
  const started=Date.now();await chooseOption(page,chartPreview(page),'Full year (366 points)');const surface=chart(page,'Daily observations');
  await expect(points(surface)).toHaveCount(366);
  await expect(surface.locator('.bui-chart-point[tabindex="0"]')).toHaveCount(1);
  const first=point(surface,'day-1');await first.focus();await first.press('End');await expect(point(surface,'day-366')).toBeFocused();
  await page.keyboard.press('ArrowLeft');await expect(point(surface,'day-365')).toBeFocused();
  const table=await showData(surface,'Daily observations');await expect(table.locator('tbody tr')).toHaveCount(366);
  await expect(table.getByRole('columnheader')).toHaveCount(7);
  const measurement={observations:366,series:6,values:2196,pointButtons:await points(surface).count(),tableRows:await table.locator('tbody tr').count(),chartDomElements:await surface.locator('*').count(),completeInteractionMs:Date.now()-started};
  await info.attach('chart-full-year-measurement',{body:JSON.stringify(measurement,null,2),contentType:'application/json'});
  console.log('Chart bounded-data observation: '+JSON.stringify(measurement));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('chart motion reacts to live reduced motion without changing point targets',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/components/chart');const surface=chart(page);
  await expect(surface).toHaveAttribute('data-reduced-motion','false');
  const mon=point(surface,'mon'),before=await mon.boundingBox();await mon.focus();await mon.press('ArrowRight');await expect(point(surface,'tue')).toBeFocused();
  await page.getByRole('group',{name:'Chart type',exact:true}).getByRole('button',{name:'Area',exact:true}).click();
  await page.emulateMedia({reducedMotion:'reduce'});await expect(surface).toHaveAttribute('data-reduced-motion','true');
  await expect.poll(()=>surface.evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length)).toBe(0);
  const after=await mon.boundingBox();expect(after!.width).toBeCloseTo(before!.width,1);expect(after!.height).toBeCloseTo(before!.height,1);
});

test('analytics periods, totals and display modes use the same exact report',async({page})=>{
  await page.goto('/blocks/analytics-dashboard');const surface=analytics(page),visual=reportChart(page);
  await expect(points(visual)).toHaveCount(7);const table=await showData(visual,'Request activity');
  const totals=await table.locator('tbody tr').evaluateAll(rows=>rows.reduce((total,row)=>{const cells=Array.from(row.querySelectorAll('td'));return total+Number(cells[0].textContent!.replaceAll(',',''))+Number(cells[1].textContent!.replaceAll(',',''));},0));
  await expect(surface.getByRole('article',{name:'Total requests',exact:true})).toContainText(new Intl.NumberFormat('en-US').format(totals));
  const display=surface.getByRole('group',{name:'Chart display',exact:true});
  for(const name of ['Bar','Area','Line']){const button=display.getByRole('button',{name,exact:true});await button.click();await expect(button).toHaveAttribute('aria-pressed','true');await expect(points(visual)).toHaveCount(7);}
  await chooseOption(page,reportPeriod(page),'Last 30 days');await expect(points(visual)).toHaveCount(30);
  await expect(reportPeriod(page)).toBeFocused();
  await showData(visual,'Request activity');await expect(dataTable(visual,'Request activity').locator('tbody tr')).toHaveCount(30);
  await expect(visual.getByRole('button',{name:'Hide data',exact:true})).toBeFocused();
});

test('analytics CSV download exports the actual report and keeps its trigger focus',async({page})=>{
  await page.goto('/blocks/analytics-dashboard');const surface=analytics(page),visual=reportChart(page);
  await expect(points(visual)).toHaveCount(7);const table=await showData(visual,'Request activity');
  const firstRow=await table.locator('tbody tr').first().innerText();
  const button=surface.getByRole('button',{name:'Export report CSV',exact:true});await button.focus();
  const ready=page.waitForEvent('download');await button.press('Enter');const download=await ready;
  expect(download.suggestedFilename()).toBe('analytics-week.csv');const path=await download.path();expect(path).not.toBeNull();
  const csv=await readFile(path!,'utf8');expect(csv.startsWith('Day,Completed,Failed,Total\r\n')).toBe(true);
  expect(csv.trimEnd().split('\r\n')).toHaveLength(8);
  const cells=firstRow.split('\t');for(const value of cells.slice(1))expect(csv).toContain(value.replaceAll(',',''));
  await expect(button).toBeFocused();await expect(surface.getByRole('status').filter({hasText:'CSV prepared for 7 days.'})).toBeVisible();
});

test('analytics loading, empty and invalid reports do not masquerade as real values',async({page})=>{
  await page.goto('/blocks/analytics-dashboard');await expect(points(reportChart(page))).toHaveCount(7);
  await chooseOption(page,reportPreview(page),'Loading');await expect(analytics(page).getByRole('status').filter({hasText:'Loading report'})).toBeVisible();
  await expect(analytics(page).getByRole('button',{name:'Export report CSV',exact:true})).toBeDisabled();
  await chooseOption(page,reportPreview(page),'Empty');await expect(analytics(page).getByText('No activity for this period.',{exact:true})).toBeVisible();
  await expect(points(reportChart(page))).toHaveCount(0);
  await chooseOption(page,reportPreview(page),'Connection error');await expect(analytics(page).getByRole('status').filter({hasText:'Report could not be loaded'})).toBeVisible();
  await expect(analytics(page).getByRole('button',{name:'Export report CSV',exact:true})).toBeDisabled();
  await chooseOption(page,reportPreview(page),'Invalid report');await expect(analytics(page).getByRole('status').filter({hasText:'Report could not be loaded'})).toBeVisible();
  await expect(analytics(page).getByRole('button',{name:'Export report CSV',exact:true})).toBeDisabled();
  await chooseOption(page,reportPreview(page),'Sample data');await expect(points(reportChart(page))).toHaveCount(7);
});

test('analytics retry retains context and never reclaims focus after asynchronous success',async({page})=>{
  await page.goto('/blocks/analytics-dashboard');await chooseOption(page,reportPreview(page),'Rejected report');
  const surface=analytics(page);await expect(surface.getByRole('status').filter({hasText:'Report could not be loaded'})).toBeVisible();
  const retry=surface.getByRole('button',{name:'Retry report',exact:true});await retry.focus();await retry.press('Enter');
  await expect(surface.getByRole('heading',{name:'Analytics workspace.',exact:true})).toBeFocused();
  await reportPeriod(page).focus();await expect(points(reportChart(page))).toHaveCount(7);await expect(reportPeriod(page)).toBeFocused();
});

test('analytics replacement and period changes discard late slow reports',async({page})=>{
  await page.goto('/blocks/analytics-dashboard');await page.clock.install();
  await chooseOption(page,reportPreview(page),'Slow report');await chooseOption(page,reportPeriod(page),'Last 30 days');
  await page.clock.runFor(4000);await expect(points(reportChart(page))).toHaveCount(30);await expect(reportPeriod(page)).toBeFocused();
  await chooseOption(page,reportPreview(page),'Slow report');await chooseOption(page,reportPeriod(page),'Last 90 days');
  await chooseOption(page,reportPreview(page),'Sample data');await page.clock.runFor(5000);
  await expect(points(reportChart(page))).toHaveCount(7);await expect(reportPreview(page)).toBeFocused();
});

for(const width of [320,390])test('chart and analytics layouts fit with readable data at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.goto('/components/chart');await chooseOption(page,chartPreview(page),'Full year (366 points)');const surface=chart(page,'Daily observations');
  await expect(points(surface)).toHaveCount(366);await point(surface,'day-1').focus();await page.keyboard.press('End');await expect(point(surface,'day-366')).toBeFocused();
  await showData(surface,'Daily observations');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/blocks/analytics-dashboard');await expect(points(reportChart(page))).toHaveCount(7);await page.evaluate(()=>document.fonts.ready);
  await expectSeparateLabels(reportChart(page));await showData(reportChart(page),'Request activity');
  const weekRows=dataTable(reportChart(page),'Request activity').locator('tbody tr');await expect(weekRows).toHaveCount(7);
  const weekLabels=await reportChart(page).locator('.bui-chart-labels>span').allTextContents();
  expect(weekLabels[0]).toBe(await weekRows.first().getByRole('rowheader').innerText());expect(weekLabels.at(-1)).toBe(await weekRows.last().getByRole('rowheader').innerText());
  await chooseOption(page,reportPeriod(page),'Last 30 days');await expect(points(reportChart(page))).toHaveCount(30);
  await expectSeparateLabels(reportChart(page));await showData(reportChart(page),'Request activity');
  const monthRows=dataTable(reportChart(page),'Request activity').locator('tbody tr');await expect(monthRows).toHaveCount(30);
  const monthLabels=await reportChart(page).locator('.bui-chart-labels>span').allTextContents();
  expect(monthLabels[0]).toBe(await monthRows.first().getByRole('rowheader').innerText());expect(monthLabels.at(-1)).toBe(await monthRows.last().getByRole('rowheader').innerText());
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const exportButton=analytics(page).getByRole('button',{name:'Export report CSV',exact:true});const bounds=await exportButton.boundingBox();expect(bounds!.width).toBeGreaterThan(40);
});

for(const theme of ['light','dark'])test('chart and analytics have no automated accessibility violations in '+theme,async({page})=>{
  for(const route of ['/components/chart','/blocks/analytics-dashboard']){
    await page.goto(route);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
    const surface=route==='/components/chart'?chart(page):reportChart(page);await expect(points(surface)).toHaveCount(7);
    await showData(surface,route==='/components/chart'?'Weekly requests':'Request activity');
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(results.violations.map(violation=>({id:violation.id,targets:violation.nodes.map(node=>node.target)})),route).toEqual([]);
  }
});
test('analytics loading reserves the natural report height without moving its toolbar',async({page})=>{
  test.setTimeout(60000);
  for(const width of [1440,768,390,320]){
    await page.setViewportSize({width,height:1100});await page.goto('/blocks/analytics-dashboard');
    await expect(points(reportChart(page))).toHaveCount(7);await page.evaluate(()=>document.fonts.ready);
    const layout=()=>analytics(page).evaluate(element=>{
      const body=element.querySelector('.bblocks-analytics-report-body')!.getBoundingClientRect(),toolbar=element.querySelector('.bblocks-analytics-report-toolbar')!.getBoundingClientRect();
      return {height:body.height,toolbarY:toolbar.top+scrollY};
    });
    const before=await layout();if(width===1440)await page.clock.install();
    await chooseOption(page,reportPeriod(page),'Last 30 days');
    await expect(analytics(page).getByRole('status').filter({hasText:'Loading report'})).toBeVisible();
    const pending=await layout();
    expect(pending.height,'Pending report retains natural height at '+width).toBeGreaterThanOrEqual(before.height-1);
    expect(Math.abs(pending.toolbarY-before.toolbarY),'Toolbar stays steady while loading at '+width).toBeLessThanOrEqual(1);
    await expect(reportPeriod(page)).toBeFocused();await page.clock.runFor(500);await expect(points(reportChart(page))).toHaveCount(30);
    const ready=await layout();expect(Math.abs(ready.toolbarY-before.toolbarY),'Toolbar stays steady after loading at '+width).toBeLessThanOrEqual(1);
    await expect(reportPeriod(page)).toBeFocused();
    if(width===320){
      await chooseOption(page,reportPeriod(page),'Last 90 days');await page.clock.runFor(500);await expect(points(reportChart(page))).toHaveCount(90);
      const naturalQuarter=await layout();await showData(reportChart(page),'Request activity');
      const tablePresence=reportChart(page).locator('.bui-chart-table-presence');
      await expect.poll(()=>tablePresence.evaluate(element=>element.getBoundingClientRect().height-element.querySelector('.bui-chart-table-wrap')!.getBoundingClientRect().height),'Expanded data table finishes opening before measuring its reserve').toBeGreaterThanOrEqual(-1);
      const expanded=await layout();expect(expanded.height).toBeGreaterThan(naturalQuarter.height);
      await chooseOption(page,reportPeriod(page),'Last 7 days');
      await expect(analytics(page).getByRole('status').filter({hasText:'Loading report'})).toBeVisible();
      const afterTable=await layout();
      expect(afterTable.height,'Loading excludes the previously expanded table height').toBeLessThanOrEqual(Math.max(before.height,ready.height,naturalQuarter.height)+2);
      expect(afterTable.height).toBeLessThan(expanded.height);
      expect(Math.abs(afterTable.toolbarY-before.toolbarY),'Expanded-table recovery keeps the toolbar steady').toBeLessThanOrEqual(1);
      await page.clock.runFor(500);await expect(points(reportChart(page))).toHaveCount(7);
    }
  }
});