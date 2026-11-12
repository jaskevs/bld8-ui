import {checkDateEntryExamples,checkDateRangeExample} from './check-date-editing.mjs';
import {checkTreeSelectionExample,checkLazyTreeSelectionExample} from './check-tree-selection.mjs';
import {checkMixedGridEditors,checkCustomGridEditor} from './check-grid-editing.mjs';
/** Exercise the same complete examples on the showcase and configured-alias source installs. */
export async function checkEditingExamples(page,getExample){
  await checkDateEntryExamples(page,getExample);
  await checkDateRangeExample(page,getExample);
  await checkTreeSelectionExample(page,getExample);
  await checkLazyTreeSelectionExample(page,getExample);
  await checkMixedGridEditors(page,getExample);
  await checkCustomGridEditor(page,getExample);
}
