import type {DocumentationManifest} from './documentation-versions.mjs';
export interface DocumentationVersionCatalog {schemaVersion:1;versions:{version:string;tag:string;title:string}[]}
export interface DocumentationCacheOptions {cacheRoot?:string;versionCatalog?:DocumentationVersionCatalog}
export interface CachedDocumentation {manifest:DocumentationManifest;catalog:unknown}
export const DEFAULT_DOCUMENTATION_CACHE_ROOT:string;
export function readCachedDocumentation(version:string,options?:DocumentationCacheOptions):CachedDocumentation|null;
export {readPublishedDocumentation} from './documentation-transport.mjs';
export function syncDocumentation(version:string,options?:DocumentationCacheOptions & {fetchImpl?:typeof fetch}):Promise<CachedDocumentation & {cached:boolean}>;
