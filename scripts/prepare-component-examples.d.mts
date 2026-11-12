import type {LicenseMetadata} from './license-policy.mjs';
export interface CompleteComponentExample extends LicenseMetadata {id:string;componentId:string;title:string;description:string;source:string;registrySource:string;modules:string[];keyboard:string[];states:string[];family:string;documentationPath:string;registryName:string;exportName:string;preview:string}
export function readComponentExamples(root?:string):CompleteComponentExample[];
export function prepareComponentExamples(options?:{root?:string}):CompleteComponentExample[];
