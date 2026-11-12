import type {Locator,Page} from '@playwright/test';
export function checkGridBulk(page:Page,getExample:(id:string)=>Locator):Promise<void>;
