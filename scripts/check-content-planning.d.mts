import type {Page,Locator} from '@playwright/test';
export const contentPlanningExampleIds:readonly string[];
export function checkInstalledContentPlanning(page:Page,region:(id:string)=>Locator|Promise<Locator>):Promise<void>;
