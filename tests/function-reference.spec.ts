import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {readExportLiteral} from '../scripts/prepare-agent-docs.mjs';
const signatures=[['gridFillDownEdits',['rows','columns','range']],['gridApplySelectionEdits',['rows','columns','range','value']]] as const;
test('bulk helper APIs document real parameters and return types in human and agent references',async({page,request})=>{
  const api=readExportLiteral(readFileSync('apps/docs/src/lib/generated/api.ts','utf8'),'api') as Record<string,{name:string;kind:string;definition?:string;properties:{name:string}[]}[]>;
  const catalog=await(await request.get('/agent/catalog.json')).json(),entry=catalog.entries.find((item:{id:string})=>item.id==='data-grid');
  await page.goto('/components/data-grid');
  for(const [name,parameters] of signatures){const section=api['data-grid'].find(item=>item.name===name)!;expect(section.kind).toBe('Function parameters');expect(section.properties.map(property=>property.name)).toEqual(parameters);expect(section.definition).toContain('=> DataEdit<T>[]');expect(entry.api.find((item:{name:string})=>item.name===name)).toEqual(section);const human=page.getByRole('region',{name:name+' parameters',exact:true});await expect(human.getByRole('columnheader',{name:'Parameter',exact:true})).toBeVisible();for(const parameter of parameters)await expect(human.getByRole('rowheader',{name:new RegExp('^'+parameter+' ?Required$'),exact:true})).toBeVisible();await expect(human.getByRole('rowheader',{name:/^map/})).toHaveCount(0);}
  const markdown=await(await request.get('/agent/component/data-grid.md')).text();for(const [name] of signatures){const section=markdown.split('### '+name+'\n')[1]?.split('### ')[0];expect(section).toContain('Function parameters.');expect(section).toContain('| Parameter | Type |');expect(section).not.toContain('| map |');expect(section).toContain('=> DataEdit<T>[]');}
});
