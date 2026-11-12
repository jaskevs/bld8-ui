export interface UpstreamProvenance {
  repository: string;
  revision: string;
  license: string;
  copyright?: string;
  licenseFile?: string;
  sourcePathScope: string;
  distributionMappings: Record<'starter' | 'npm' | 'registry', {relativeTo: string; files: Record<string, string[]>; notes: string}>;
  files: Array<{source: string; sha256: string; adaptedIn: string}>;
  notes?: string;
}
export interface LicenseMetadata {
  license: 'MIT';
  provenance: {repository: string; sourcePaths: string[]; upstream: UpstreamProvenance};
  notices: Array<{path: string; content: string}>;
}
export const repositoryRoot: string;
export const copyright: string;
export const mitBody: string;
export const uiNoticeNames: string[];
export function mitNotice(holder?: string): string;
export function normalizeNotice(value: string | Uint8Array): string;
export function hasFullNotice(value: string | Uint8Array, notice: string | Uint8Array): boolean;
export function distributionNotices(options?: {root?: string}): Record<string, Buffer>;
export function licenseMetadata(options?: string | {sourcePaths?: string[]; root?: string}): LicenseMetadata;
export function licenseCode(source: string | Uint8Array, options?: {standalone?: boolean; sourcePath?: string; root?: string}): string;
