import type {Page,Locator} from '@playwright/test';
export function checkMixedGridEditors(page:Page,getExample:(id:string)=>Locator):Promise<void>;
export function checkMixedGridTransactions(page:Page,getExample:(id:string)=>Locator):Promise<void>;
export function checkMixedGridRecovery(page:Page,getExample:(id:string)=>Locator):Promise<void>;
export function checkMixedGridMotion(page:Page,getExample:(id:string)=>Locator):Promise<void>;
export function checkCustomGridEditor(page:Page,getExample:(id:string)=>Locator):Promise<void>;
