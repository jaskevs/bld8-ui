import {test,expect} from '@playwright/test';
import {cycleTableSort,tableSorts} from '../packages/ui/src/table-query';
import {createTableViewState,parseTableViewState,serializeTableViewState} from '../packages/ui/src/table-view-state';
import {createMemoryIssueRepository,defaultIssueView,parseIssueView,serializeIssueView} from '../packages/blocks/src/issue-repository';

test('multi-sort preserves legacy state and cycles ordered priorities without duplicates',()=>{
  expect(tableSorts({sort:{key:'status',descending:false}})).toEqual([{key:'status',descending:false}]);
  const first=cycleTableSort([], 'status');
  const second=cycleTableSort(first,'title',true);
  expect(second).toEqual([{key:'status',descending:false},{key:'title',descending:false}]);
  expect(cycleTableSort(second,'status',true)).toEqual([{key:'status',descending:true},{key:'title',descending:false}]);
  expect(cycleTableSort(cycleTableSort(second,'status',true),'status',true)).toEqual([{key:'title',descending:false}]);
  expect(cycleTableSort(second,'id')).toEqual([{key:'id',descending:false}]);
  expect(first).toEqual([{key:'status',descending:false}]);
});
test('portable layouts retain multi-sort and reconcile removed criteria in priority order',()=>{
  const options={columns:[{key:'title'},{key:'status'},{key:'id'}]};
  const old=createTableViewState(options);old.query.sort={key:'title',descending:true};
  expect(parseTableViewState(serializeTableViewState(old,options),options)).toEqual(old);
  const state={...old,query:{...old.query,sorts:[{key:'status',descending:false},{key:'title',descending:true}]}};
  const restored=parseTableViewState(serializeTableViewState(state,options),{columns:[{key:'title'},{key:'id'}]})!;
  expect(restored.query.sorts).toEqual([{key:'title',descending:true}]);
  expect(restored.query.sort).toEqual(restored.query.sorts![0]);
  expect(parseTableViewState(JSON.stringify({...state,query:{...state.query,sorts:[{key:'title',descending:false},{key:'title',descending:true}]}}),options)).toBeNull();
});
test('issue service applies tie-breaking sorts before paging and keeps earlier share links valid',async()=>{
  const repo=createMemoryIssueRepository();const view=defaultIssueView();
  expect(parseIssueView(serializeIssueView(view))).toEqual(view);
  const sorted={...view,pageSize:20,sort:{key:'status',descending:false},sorts:[{key:'status',descending:false},{key:'estimate',descending:true},{key:'id',descending:false}]};
  expect(parseIssueView(serializeIssueView(sorted))).toEqual(sorted);
  const {rows}=await repo.list({view:sorted,page:1},new AbortController().signal);
  for(let index=1;index<rows.length;index++){const a=rows[index-1],b=rows[index];if(a.status===b.status)expect(a.estimate).toBeGreaterThanOrEqual(b.estimate);}
  expect(parseIssueView(JSON.stringify({...sorted,sorts:[{key:'missing',descending:false}]}))).toBeNull();
});

test('table headings append sort priorities and shared views restore them after reload',async({page})=>{
  await page.goto('/blocks/issue-table');
  const workspace=page.getByRole('region',{name:'Issue workspace',exact:true}),table=workspace.getByRole('table',{name:'Issues',exact:true});
  const status=table.getByRole('columnheader',{name:'Status',exact:true}),estimate=table.getByRole('columnheader',{name:'Estimate',exact:true});
  await expect(table.getByRole('row')).toHaveCount(6);
  await status.getByRole('button').first().click();
  await estimate.getByRole('button').first().click({modifiers:['Shift']});
  await estimate.getByRole('button').first().click({modifiers:['Shift']});
  await expect(status).toHaveAttribute('aria-sort','ascending');await expect(estimate).toHaveAttribute('aria-sort','other');
  const expected=[{key:'status',descending:false},{key:'estimate',descending:true}];
  await expect.poll(()=>JSON.parse(new URL(page.url()).searchParams.get('buiIssues')??'{}').sorts).toEqual(expected);
  await page.reload();await expect(status).toHaveAttribute('aria-sort','ascending');await expect(estimate).toHaveAttribute('aria-sort','other');
  await expect(estimate.locator('sup')).toHaveAttribute('aria-label','Sort priority 2');
});
