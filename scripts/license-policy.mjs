import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const repositoryRoot=fileURLToPath(new URL('../',import.meta.url));
export const copyright='Copyright (c) 2026 Jaison';
export const mitBody=`Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
export const mitNotice=(holder=copyright)=>`MIT License\n\n${holder}\n\n${mitBody}\n`;
// Formatting (line wrapping, CRLF, comment decoration) is insignificant; every word is required.
export const normalizeNotice=value=>Buffer.from(value).toString('utf8').replace(/^\s*\* ?/gm,'').replace(/\s+/g,' ').trim();
export const hasFullNotice=(value,notice)=>normalizeNotice(value).includes(normalizeNotice(notice));
export const uiNoticeNames=['LICENSE','LUCIDE_LICENSE','DAY_PICKER_LICENSE','SHADCN_LICENSE','MOTION_LICENSE','DND_KIT_LICENSE','THIRD_PARTY_NOTICES.md','UPSTREAM.json'];
export function distributionNotices({root=repositoryRoot}={}){
  return Object.fromEntries(['LICENSE','packages/blocks/LICENSE',...uiNoticeNames.map(name=>'packages/ui/'+name)].map(path=>[path,readFileSync(join(root,path))]));
}
export function licenseMetadata(options={}){
  if(typeof options==='string')options={sourcePaths:[options]};
  const {sourcePaths=[],root=repositoryRoot}=options;
  const upstreamPath=existsSync(join(root,'packages/ui/UPSTREAM.json'))?'packages/ui/UPSTREAM.json':'docs/upstream.json';
  const upstream=JSON.parse(readFileSync(join(root,upstreamPath),'utf8'));
  const notices=Object.entries(distributionNotices({root})).filter(([path])=>!path.endsWith('.json')).map(([path,content])=>({path,content:content.toString('utf8')}));
  return {license:'MIT',provenance:{repository:'https://github.com/jaskevs/bld8-ui',sourcePaths:[...sourcePaths],upstream},notices};
}
/** A copyable source file must retain its complete permission notice independently of sidecars. */
export function licenseCode(source,{standalone=false,sourcePath='',root=repositoryRoot}={}){
  source=Buffer.from(source).toString('utf8');
  if(!standalone)return source;
  const own=mitNotice(),notices=[];
  if(!hasFullNotice(source,own))notices.push(own.trim());
  const upstreamPath=existsSync(join(root,'packages/ui/UPSTREAM.json'))?'packages/ui/UPSTREAM.json':'docs/upstream.json';
  const upstream=JSON.parse(readFileSync(join(root,upstreamPath),'utf8'));
  if(upstream.files.some(file=>file.adaptedIn===sourcePath||'packages/ui/'+file.adaptedIn===sourcePath)){
    const shadcn=readFileSync(join(root,'packages/ui/SHADCN_LICENSE'),'utf8');
    if(!hasFullNotice(source,shadcn))notices.push(shadcn.trim());
  }
  return notices.length?`/*!\n${notices.join('\n\n---\n\n').replaceAll('*/','* /')}\n*/\n${source}`:source;
}
