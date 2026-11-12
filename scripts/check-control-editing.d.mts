import type {Page,Locator} from '@playwright/test';
export function checkEditingExamples(page:Page,getExample:(id:string)=>Locator):Promise<void>;
