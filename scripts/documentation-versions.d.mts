export interface DocumentationManifest {schemaVersion:1;version:string;status:string;registryBase:string;sourceRevision?:string;snapshot:string;items:{name:string;dependencies:string[];registryDependencies:string[];files:{path:string;sha256:string}[]}[];artifacts:{path:string;bytes:number;sha256:string}[]}
export const DOCUMENTATION_ORIGIN:string;
export const MAX_DOCUMENTATION_CATALOG_BYTES:number;
export const MAX_DOCUMENTATION_MANIFEST_BYTES:number;
export const MAX_DOCUMENTATION_ARCHIVE_BYTES:number;
export function supportsDocumentationVersion(version:unknown):boolean;
export function documentationUrl(version:string,path:string):string;
export function documentationSnapshot(manifest:DocumentationManifest):string;
export function validateDocumentation(manifest:DocumentationManifest,catalogBytes:Buffer|string,options?:{version?:string}):unknown;
