import {test,openQualityPage,expectContained} from './fixtures';
import {checkMixedGridTransactions,checkMixedGridRecovery,checkMixedGridMotion,checkCustomGridEditor} from '../scripts/check-grid-editing.mjs';

test('mixed grid editors retain canonical transactions and nested choices',async({page},info)=>{
  await openQualityPage(page,'/components/data-grid/examples/grid-editor-mixed',info);await checkMixedGridTransactions(page,id=>page.locator('[data-example-id="'+id+'"]'));await expectContained(page);
});
test('mixed grid date recovery preserves each invalid draft and action geometry',async({page},info)=>{
  await openQualityPage(page,'/components/data-grid/examples/grid-editor-mixed',info);await checkMixedGridRecovery(page,id=>page.locator('[data-example-id="'+id+'"]'));await expectContained(page);
});
test('mixed grid motion responds to live reduced-motion preferences after a canonical commit',async({page},info)=>{
  await openQualityPage(page,'/components/data-grid/examples/grid-editor-mixed',info);await checkMixedGridMotion(page,id=>page.locator('[data-example-id="'+id+'"]'));await expectContained(page);
});
test('custom grid TreeSelect editor preserves explicit apply, dismissal and outside focus',async({page},info)=>{
  await openQualityPage(page,'/components/data-grid/examples/grid-editor-custom',info);await checkCustomGridEditor(page,id=>page.locator('[data-example-id="'+id+'"]'));await expectContained(page);
});
