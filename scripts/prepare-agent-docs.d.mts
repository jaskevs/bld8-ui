import type {LicenseMetadata} from './license-policy.mjs';
export interface AgentProperty {
  name:string;
  type:string;
  required:boolean;
  defaultValue:string;
  description:string;
  native:boolean;
}
export interface AgentDeclaration {
  name:string;
  kind:string;
  definition?:string;
  properties:AgentProperty[];
}
export interface AgentExample extends LicenseMetadata {
  id:string;componentId:string;title:string;description:string;
  documentationUrl:string;markdownUrl:string;registry:{name:string;url:string};
  language:'tsx';code:string;registryCode:string;complete:true;keyboard:string[];states:string[];
}
export interface AgentEntry extends LicenseMetadata {
  id:string;
  kind:'component'|'block'|'template';
  title:string;
  category:string;
  description:string;
  notes:string;
  documentationUrl:string;
  markdownUrl:string;
  registry:{name:string;url:string;dependencies:string[];registryDependencies:string[];files:{path:string;target?:string;type:string}[]};
  example:LicenseMetadata & {language:'tsx';code:string;complete:false};
  examples:AgentExample[];
  api:AgentDeclaration[];
}
export interface AgentCatalog extends LicenseMetadata {
  schemaVersion:1;
  release:{version:string;status:string;snapshot:string};
  homepage:string;
  license:'MIT';
  installation:{requirements:string[];notes:string[];registryBase:string};
  entries:AgentEntry[];
  guides:(LicenseMetadata & {id:string;title:string;url:string;markdownUrl:string;content:string})[];
}
export function readExportLiteral(source:string,name:string):unknown;
export function buildAgentCatalog(options?:{root?:string;origin?:string}):AgentCatalog;
export function entryMarkdown(entry:AgentEntry,catalog:AgentCatalog):string;
export function exampleMarkdown(example:AgentExample,catalog:AgentCatalog):string;
export function prepareAgentDocs(options?:{root?:string;origin?:string}):AgentCatalog;
