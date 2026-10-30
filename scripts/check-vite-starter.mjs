import {readFileSync,mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {join,dirname,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {inflateRawSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const root=fileURLToPath(new URL('../',import.meta.url));
const starter=process.argv[2]??'outline';
assert.ok(['outline','issue-table','task-workspace','session-setup','file-browser','analytics-dashboard','large-issue-table','schedule-planner'].includes(starter),'Choose outline, issue-table, task-workspace, session-setup, file-browser, analytics-dashboard large-issue-table or schedule-planner.');
const target=mkdtempSync(join(tmpdir(),'bld8-vite-'+starter+'-'));
const archive=readFileSync(join(root,'apps/docs/public/downloads/'+starter+'-vite.zip'));
console.log('Checking independent '+starter+' Vite starter at '+target);
let offset=0;
while(archive.readUInt32LE(offset)===0x04034b50){
  const size=archive.readUInt32LE(offset+18),length=archive.readUInt16LE(offset+26),extra=archive.readUInt16LE(offset+28);
  const name=archive.subarray(offset+30,offset+30+length).toString();
  const output=resolve(target,name);assert.ok(output.startsWith(resolve(target)+sep));assert.ok(!name.split('/').includes('..'));
  const start=offset+30+length+extra;mkdirSync(dirname(output),{recursive:true});writeFileSync(output,inflateRawSync(archive.subarray(start,start+size)));offset=start+size;
}
assert.equal(archive.readUInt32LE(offset),0x02014b50);
const manifest=JSON.parse(readFileSync(join(target,'package.json'),'utf8'));
assert.equal(manifest.dependencies.next,undefined);assert.ok(manifest.devDependencies.vite);
const npm=process.env.npm_execpath;assert.ok(npm,'Run through npm run check:starter:vite.');
for(const args of [['install','--no-audit','--no-fund'],['run','build']])execFileSync(process.execPath,[npm,...args],{cwd:target,stdio:'inherit'});
console.log('Independent Vite starter installed and built successfully.');
