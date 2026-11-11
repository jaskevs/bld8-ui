import {componentExamples} from './generated/component-examples-data';
export interface ComponentExample {
  id:string;componentId:string;title:string;description:string;source:string;
  registrySource:string;modules:string[];keyboard:string[];states:string[];
  family:string;preview:string;exportName:string;
}
export function examplesFor(componentId:string):ComponentExample[]{return componentExamples.filter(example=>example.componentId===componentId);}
export const componentExampleCount=componentExamples.length;
