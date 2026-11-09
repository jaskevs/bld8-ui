import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,lstatSync,symlinkSync} from 'node:fs';
import {join,resolve,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createManifest,createReceipt,validateReceipt,planReceiptUpdate,mergeReceiptReports,sourceHash} from '../scripts/source-release.mjs';
import {localReader} from '../scripts/check-source-updates.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),registryBase='https://ui.bld8.dev/r';
const source=(version='0.1.0',content='upstream',style='styles')=>createManifest({version,registryBase,items:[{name:'button',files:[{target:'@ui/bld8/button.tsx',content}],registryDependencies:[registryBase+'/styles.json'],dependencies:[]},{name:'styles',files:[{target:'@ui/bld8/styles.css',content:style}],registryDependencies:[],dependencies:[]}],artifacts:{'r/button.json':Buffer.from(content)}});
function workspace(){const parent=resolve(root,'.local');mkdirSync(parent,{recursive:true});return mkdtempSync(join(parent,'receipt-tests-'));}
function clean(path:string){const parent=resolve(root,'.local'),target=resolve(path);if(!target.startsWith(parent+sep)||!target.split(sep).at(-1)!.startsWith('receipt-tests-')||lstatSync(target).isSymbolicLink())throw Error('Unexpected receipt fixture.');rmSync(target,{recursive:true,force:true});}
function write(path:string,text:string){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,text);}

test('receipts distinguish CLI transformations from edits without changing upstream identity',()=>{
  const baseline=source(),installed=path=>sourceHash(path.endsWith('.tsx')?'formatted upstream':'formatted styles');
  const receipt=createReceipt(baseline,['button'],installed);expect(receipt.source.snapshot).toBe(baseline.snapshot);expect(receipt.assurance).toBe('local-capture');
  const cleanReport=planReceiptUpdate(receipt,baseline,installed);expect(cleanReport.files.every(file=>file.status==='current')).toBe(true);expect(cleanReport.reviewRequired).toBe(false);
  const update=planReceiptUpdate(receipt,source('0.2.0','new upstream'),installed);expect(update.files[0].status).toBe('update-available');
  const edited=path=>sourceHash(path.endsWith('.tsx')?'my edit':'formatted styles');expect(planReceiptUpdate(receipt,baseline,edited).files[0].status).toBe('local-only');expect(planReceiptUpdate(receipt,source('0.2.0','new upstream'),edited).files[0].status).toBe('conflict');
});
test('receipts reject incomplete captures, tampering and uncaptured item comparisons',()=>{
  expect(()=>createReceipt(source(),['button'],()=>null)).toThrow('missing source file');
  const receipt=createReceipt(source(),['button'],()=>sourceHash('installed'));const changed=structuredClone(receipt);changed.files[0].sha256='a'.repeat(64);expect(()=>validateReceipt(changed)).toThrow('digest');
  expect(()=>planReceiptUpdate(receipt,source(),undefined)).toThrow('UI directory');expect(()=>planReceiptUpdate(receipt,source(),()=>sourceHash('installed'),['styles'])).toThrow('not captured');
});
test('several source versions retain their own baselines and expose ambiguous shared files',()=>{
  const a=createReceipt(source(),['button'],()=>sourceHash('old installed')),b=createReceipt(source('0.2.0','new','new styles'),['button'],()=>sourceHash('new installed'));
  const report=mergeReceiptReports([planReceiptUpdate(a,source('0.3.0'),()=>sourceHash('old installed')),planReceiptUpdate(b,source('0.3.0'),()=>sourceHash('new installed'))]);
  expect(report.sharedBaselineConflicts).toEqual(['bld8/button.tsx','bld8/styles.css']);expect(report.reviewRequired).toBe(true);expect(report.reports.map(item=>item.from.version)).toEqual(['0.1.0','0.2.0']);
});
test('capture and update CLIs support custom directories, portable receipts and exclusive outputs',()=>{
  const directory=workspace();try{
    const ui=join(directory,'custom/ui'),receipt=join(directory,'receipt.json'),manifest=join(directory,'source.json');write(manifest,JSON.stringify(source()));write(join(ui,'bld8/button.tsx'),'formatted upstream');write(join(ui,'bld8/styles.css'),'formatted styles');
    const args=['scripts/capture-installation.mjs','--manifest',manifest,'--item','button','--ui-dir',ui,'--output',receipt];
    const run=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});expect(run.status,run.stderr).toBe(0);const captured=readFileSync(receipt,'utf8');expect(captured).not.toContain(directory.replaceAll('\\','\\\\'));validateReceipt(JSON.parse(captured));
    expect(spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'}).status).toBe(1);expect(readFileSync(receipt,'utf8')).toBe(captured);
    const check=['scripts/check-source-updates.mjs','--from',receipt,'--to',manifest,'--ui-dir',ui,'--json'];const report=spawnSync(process.execPath,check,{cwd:root,encoding:'utf8'});expect(report.status,report.stderr).toBe(0);expect(JSON.parse(report.stdout).files.every(file=>file.status==='current')).toBe(true);
    write(join(ui,'bld8/button.tsx'),'my edit');const changed=spawnSync(process.execPath,check,{cwd:root,encoding:'utf8'});expect(changed.status,changed.stderr).toBe(0);expect(JSON.parse(changed.stdout).files[0].status).toBe('local-only');expect(readFileSync(join(ui,'bld8/button.tsx'),'utf8')).toBe('my edit');
    const intoUi=spawnSync(process.execPath,[...args.slice(0,-1),join(ui,'receipt.json')],{cwd:root,encoding:'utf8'});expect(intoUi.status).toBe(1);expect(intoUi.stderr).toContain('outside the UI');
    const alias=join(directory,'linked-source');symlinkSync(ui,alias,process.platform==='win32'?'junction':'dir');const linked=spawnSync(process.execPath,[...args.slice(0,-1),join(alias,'receipt.json')],{cwd:root,encoding:'utf8'});expect(linked.status).toBe(1);
    const multi=spawnSync(process.execPath,['scripts/check-source-updates.mjs','--from',receipt,'--from',receipt,'--to',manifest,'--ui-dir',ui,'--json'],{cwd:root,encoding:'utf8'});expect(multi.status,multi.stderr).toBe(0);expect(JSON.parse(multi.stdout).sharedBaselineConflicts).toEqual([]);
  }finally{clean(directory);}
});
test('local receipt reads preserve symlink containment and line-ending equivalence',()=>{
  const directory=workspace();try{const ui=join(directory,'ui');write(join(ui,'bld8/button.tsx'),'a\r\nb');write(join(ui,'bld8/styles.css'),'style');const receipt=createReceipt(source(),['button'],localReader(ui));write(join(ui,'bld8/button.tsx'),'a\nb');expect(planReceiptUpdate(receipt,source(),localReader(ui)).files[0].status).toBe('current');}finally{clean(directory);}
});
