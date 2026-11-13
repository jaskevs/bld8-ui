import type {AgentCatalog,AgentEntry,AgentExample} from './prepare-agent-docs.mjs';
import type {LicenseMetadata} from './license-policy.mjs';
export function licenseMarkdown(metadata:LicenseMetadata):string;
export function entryMarkdown(entry:AgentEntry,catalog:AgentCatalog):string;
export function exampleMarkdown(example:AgentExample,catalog:AgentCatalog):string;
export function documentationFiles(catalog:AgentCatalog):Record<string,string>;
