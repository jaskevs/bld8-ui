import type {Page,Locator} from '@playwright/test';
export const installedAdoptionExampleIds:readonly string[];
export function checkInstalledAdoptionExamples(page:Page,getExample:(id:string)=>Locator|Promise<Locator>):Promise<void>;
