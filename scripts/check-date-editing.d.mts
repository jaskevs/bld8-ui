import type {Page,Locator} from '@playwright/test';
export function checkDateEntryExamples(page:Page,getExample:(id:string)=>Locator):Promise<void>;
export function checkDateRangeExample(page:Page,getExample:(id:string)=>Locator):Promise<void>;
