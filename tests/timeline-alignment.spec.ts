import {test,expect} from '@playwright/test';

for(const width of [1440,1104,768,390,320])test('timeline shares panel edges and a centred rail at '+width,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/components/timeline');
  const result=await page.locator('.detail-preview').evaluate(panel=>{
    const list=panel.querySelector('.bui-timeline')!,label=panel.querySelector('.preview-label')!;
    const listBox=list.getBoundingClientRect(),labelBox=label.getBoundingClientRect();
    const rows=Array.from(list.querySelectorAll('.bui-timeline-item')).map((item,index,items)=>{
      const box=item.getBoundingClientRect(),marker=item.querySelector('.bui-timeline-marker')!.getBoundingClientRect();
      const title=item.querySelector('.bui-timeline-title')!,titleBox=title.getBoundingClientRect(),leading=parseFloat(getComputedStyle(title).lineHeight);
      const rail=getComputedStyle(item,'::after'),railWidth=parseFloat(rail.width);
      return {markerX:marker.x,markerCentre:marker.y+marker.height/2,textX:titleBox.x,textCentre:titleBox.y+leading/2,
        railDelta:index===items.length-1?0:(box.x+parseFloat(rail.left)+railWidth/2)-(marker.x+marker.width/2),
        railGaps:index===items.length-1?0:(box.y+parseFloat(rail.top)-marker.bottom)-(items[index+1].querySelector('.bui-timeline-marker')!.getBoundingClientRect().top-(box.bottom-parseFloat(rail.bottom)))};
    });
    return {leftDelta:listBox.left-labelBox.left,rightDelta:listBox.right-labelBox.right,rows,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  expect(Math.abs(result.leftDelta)).toBeLessThan(1);expect(Math.abs(result.rightDelta)).toBeLessThan(1);expect(result.overflow).toBe(false);
  for(const row of result.rows){expect(row.markerX).toBeCloseTo(result.rows[0].markerX,1);expect(row.textX).toBeCloseTo(result.rows[0].textX,1);expect(Math.abs(row.markerCentre-row.textCentre)).toBeLessThan(1);expect(Math.abs(row.railDelta)).toBeLessThan(.2);expect(Math.abs(row.railGaps)).toBeLessThan(.2);}
});

test('timeline responds to its container and keeps long titles clear of dates',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/components/timeline');
  const timeline=page.getByRole('list',{name:'Release steps'});
  await timeline.evaluate(element=>{(element as HTMLElement).style.width='300px';element.querySelector('.bui-timeline-title')!.textContent='A long release title that wraps across several lines without overlapping the date';});
  const first=timeline.getByRole('listitem').first(),title=first.locator('.bui-timeline-title'),date=first.locator('time');
  const titleBox=await title.boundingBox(),dateBox=await date.boundingBox();
  expect(dateBox!.y).toBeGreaterThanOrEqual(titleBox!.y+titleBox!.height);
  expect(await timeline.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
});

test('timeline rail follows logical alignment in a right-to-left container',async({page})=>{
  await page.goto('/components/timeline');const timeline=page.getByRole('list',{name:'Release steps'});await timeline.evaluate(element=>element.setAttribute('dir','rtl'));
  const geometry=await timeline.locator('.bui-timeline-item').first().evaluate(element=>{
    const box=element.getBoundingClientRect(),marker=element.querySelector('.bui-timeline-marker')!.getBoundingClientRect(),body=element.querySelector('.bui-timeline-body')!.getBoundingClientRect(),rail=getComputedStyle(element,'::after');
    return {rail:box.right-parseFloat(rail.right)-parseFloat(rail.width)/2,marker:marker.x+marker.width/2,clear:body.right<=marker.left};
  });
  expect(Math.abs(geometry.rail-geometry.marker)).toBeLessThan(.2);expect(geometry.clear).toBe(true);
});

test('timeline stays visible and contained in the component catalogue',async({page})=>{
  await page.goto('/components');
  const card=page.locator('.component-card').filter({has:page.getByRole('link',{name:'Timeline',exact:true})});
  const list=card.getByRole('list',{name:'Release steps'});
  await expect(list).toBeVisible();
  expect((await list.boundingBox())!.width).toBeGreaterThan(150);
  expect(await list.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
});
