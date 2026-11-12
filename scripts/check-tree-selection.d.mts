import type {Page,Locator} from '@playwright/test';
export declare function checkTreeSelectionExample(page:Page,getExample:(id:string)=>Locator):Promise<void>;
export declare function checkLazyTreeSelectionExample(page:Page,getExample:(id:string)=>Locator):Promise<void>;
