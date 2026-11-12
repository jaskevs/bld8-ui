import {test,expect,openQualityPage} from './fixtures';
import {checkInstalledAdoptionExamples} from '../scripts/check-adoption-controls.mjs';

const families:Record<string,string>={'facets-people':'faceted-filter','checkbox-group-native-form':'checkbox-group','form-review-request':'react-hook-form','async-form-lifecycle':'async-combobox','grid-bulk-operations':'data-grid'};

test('complete adoption workflows retain grouped values, form recovery and atomic grid edits',async({page},info)=>{
  // Five complete examples include independent navigation, focus recovery and bulk actions.
  test.setTimeout(60000);
  await checkInstalledAdoptionExamples(page,async id=>{
    await openQualityPage(page,'/components/'+families[id]+'/examples/'+id,info);const example=page.locator('[data-example-id="'+id+'"]'),run=example.getByRole('button',{name:'Run example',exact:true});if(await run.isVisible())await run.click();await expect(example.locator('[data-example-ready]')).toBeVisible();return example;
  });
});
