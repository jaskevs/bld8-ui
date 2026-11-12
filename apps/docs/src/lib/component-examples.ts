import {componentExamples} from './generated/component-examples-data';
export interface ComponentExample {
  documentationPath:string;registryName:string;
  id:string;componentId:string;title:string;description:string;source:string;
  registrySource:string;modules:string[];keyboard:string[];states:string[];
  family:string;preview:string;exportName:string;
}
export function examplesFor(componentId:string):ComponentExample[]{return componentExamples.filter(example=>example.componentId===componentId);}
export const componentExampleCount=componentExamples.length;

export function allComponentExamples():ComponentExample[]{return componentExamples;}
export function findComponentExample(componentId:string,id:string):ComponentExample|undefined{return componentExamples.find(example=>example.componentId===componentId&&example.id===id);}
