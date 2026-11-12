import {test,openQualityPage,expectContained} from './fixtures';
import {checkGridBulk} from '../scripts/check-grid-bulk.mjs';

test('bulk grid actions preserve one validated host transaction and explicit save',async({page},info)=>{
  await openQualityPage(page,'/components/data-grid/examples/grid-bulk-operations',info);await checkGridBulk(page,id=>page.locator('[data-example-id="'+id+'"]'));await expectContained(page);
});
