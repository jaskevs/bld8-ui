import type {Page,Locator} from '@playwright/test';
export function checkMixedGridEditors(page:Page,getExample:(id:string)=>Locator):Promise<void>;
export function checkCustomGridEditor(page:Page,getExample:(id:string)=>Locator):Promise<void>;
