import {test,openQualityPage,expectContained} from './fixtures';
import {checkMixedGridEditors,checkCustomGridEditor} from '../scripts/check-grid-editing.mjs';

test('mixed grid editors retain canonical transactions, nested choices and live motion',async({page},info)=>{
  await openQualityPage(page,'/components/data-grid',info);await checkMixedGridEditors(page,id=>page.locator('[data-example-id="'+id+'"]'));await expectContained(page);
});
test('custom grid TreeSelect editor preserves explicit apply, dismissal and outside focus',async({page},info)=>{
  await openQualityPage(page,'/components/data-grid',info);await checkCustomGridEditor(page,id=>page.locator('[data-example-id="'+id+'"]'));await expectContained(page);
});
