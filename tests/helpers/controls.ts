import {expect,type Locator,type Page} from '@playwright/test';
export async function chooseOption(page:Page,control:Locator,label:string){await control.click();await page.getByRole('option',{name:label,exact:true}).click();}
export async function chooseReviewDate(page:Page,form:Locator,value:string){
  await form.getByRole('button',{name:'Review date',exact:true}).click();
  const [year,month,day]=value.split('-').map(Number);const target=new Date(year,month-1,day);
  const caption=page.locator('.bui-calendar-popup .bui-calendar-label');
  for(let step=0;step<18;step++){
    const monthLabel=target.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    if(await caption.textContent()===monthLabel)break;
    const shown=new Date('1 '+await caption.textContent());const before=shown.getFullYear()*12+shown.getMonth()>target.getFullYear()*12+target.getMonth();
    await page.locator('.bui-calendar-popup').getByRole('button',{name:before?/previous month/i:/next month/i}).click();
  }
  const name=target.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const ordinal=day%10===1&&day!==11?'st':day%10===2&&day!==12?'nd':day%10===3&&day!==13?'rd':'th';
  const label=name.replace(String(day)+',',String(day)+ordinal+',');
  await page.locator('.bui-calendar-popup').getByRole('button',{name:new RegExp('^'+label+'(?:,|$)')}).click();
  await expect(page.locator('.bui-calendar-popup')).not.toBeVisible();
}

export async function projectAction(page:Page,name:string,action:'Edit project'|'Delete project'){
  await page.getByRole('button',{name:'Actions for '+name,exact:true}).click();
  await page.getByRole('menuitem',{name:action,exact:true}).click();
}
