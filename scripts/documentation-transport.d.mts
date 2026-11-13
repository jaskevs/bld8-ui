import type {DocumentationManifest} from './documentation-versions.mjs';
export interface DocumentationTransportVersionCatalog {schemaVersion:1;versions:{version:string;tag:string;title:string}[]}
export interface DocumentationTransportOptions {versionCatalog:DocumentationTransportVersionCatalog;fetchImpl?:typeof fetch}
export interface PublishedDocumentation {manifest:DocumentationManifest;catalog:unknown}
export function readPublishedDocumentation(version:string,options:DocumentationTransportOptions):Promise<PublishedDocumentation>;
export function readPublishedDocumentationBytes(version:string,options:DocumentationTransportOptions):Promise<PublishedDocumentation & {manifestBytes:Buffer;catalogBytes:Buffer}>;
