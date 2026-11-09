export type StarterFiles=Record<string,string|Uint8Array>;
export function zip(files:StarterFiles):Buffer;
export function unzip(input:Uint8Array):Record<string,Buffer>;
export function themeStarter(files:StarterFiles,options:{framework:'nextjs'|'vite';config:{typography:'standard'|'geometric'|'system'};mode:'light'|'dark';css:string;serialized:string}):StarterFiles;
