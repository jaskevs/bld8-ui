import {readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateManifest,validateReceipt,planUpdate,planReceiptUpdate,mergeReceiptReports,sourceHash} from './source-release.mjs';

export function readSourceRecord(path){
  if(statSync(path).size>8*1024*1024)throw Error('Source manifest exceeds 8 MiB.');
  let value;try{value=JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));}catch{throw Error('Cannot read a valid JSON source manifest.');}
  return value?.kind==='bld8-installation'?validateReceipt(value):validateManifest(value);
}
export function readManifest(path){const value=readSourceRecord(path);if(value.kind)throw Error('A source manifest is required here.');return value;}
export function localReader(directory){
  const root=realpathSync(directory);if(!statSync(root).isDirectory())throw Error('UI directory must be a folder.');
  return path=>{
    const candidate=resolve(root,path);let actual;
    try{actual=realpathSync(candidate);}catch(error){if(error.code==='ENOENT')return null;throw error;}
    const subpath=relative(root,actual);
    if(!subpath||subpath==='..'||subpath.startsWith('..\\')||subpath.startsWith('../')||isAbsolute(subpath))throw Error('Source target leaves the UI directory: '+path);
    const info=statSync(actual);if(!info.isFile()||info.size>8*1024*1024)throw Error('Unsupported local source file: '+path);
    return sourceHash(readFileSync(actual));
  };
}
export function main(args){
  if(args.includes('--help')){console.log('Read-only BLD8 source update report\nnode check-source-updates.mjs --from old.json --to current.json --item button [--ui-dir components/ui] [--json]\nUse --from receipt.json without --item to compare its captured selection. Repeat --from for multiple receipts; conflicting shared baselines require review.\nExit codes: 0 no upstream review, 2 review required, 1 invalid input. No network requests or source writes.');return 0;}
  const options={items:[],from:[]};
  for(let index=0;index<args.length;index++){
    const flag=args[index];if(flag==='--json'){options.json=true;continue;}
    if(!['--from','--to','--item','--ui-dir'].includes(flag)||!args[index+1]||args[index+1].startsWith('--'))throw Error('Unknown or incomplete option: '+flag);
    const value=args[++index];if(flag==='--item')options.items.push(value);else if(flag==='--from')options.from.push(value);else{if(options[flag])throw Error('Duplicate option: '+flag);options[flag]=value;}
  }
  if(!options.from.length||options.from.length>50||!options['--to'])throw Error('Provide --from and --to. Manifests also need --item. Use --help for examples.');
  const target=readManifest(options['--to']),records=options.from.map(readSourceRecord),reader=options['--ui-dir']?localReader(options['--ui-dir']):undefined,selected=[...new Set(options.items)];
  if(records.length>1&&records.some(value=>value.kind!=='bld8-installation'))throw Error('Multiple baselines must be installation receipts.');
  const reports=records.map(value=>value.kind==='bld8-installation'?planReceiptUpdate(value,target,reader,selected.length?selected:value.items):planUpdate(value,target,selected,reader));
  const report=reports.length===1?reports[0]:mergeReceiptReports(reports);
  if(options.json)console.log(JSON.stringify(report,null,2));
  else{
    for(const group of report.reports??[report]){
      console.log(`BLD8 ${group.from.version} → ${group.to.version} (${group.mode})`);
      console.log('From '+group.from.snapshot+'\nTo   '+group.to.snapshot);
      for(const file of group.files)if(!['unchanged','current'].includes(file.status))console.log(file.status.padEnd(18)+' '+file.path);
      for(const action of ['added','removed'])for(const dependency of group.dependencies[action])console.log('dependency '+action+': '+dependency);
    }
    for(const path of report.sharedBaselineConflicts??[])console.log('baseline-conflict  '+path);
    console.log(report.reviewRequired?'Review required. Compare upstream changes with your own customisations before installing.':'No upstream changes need review for these items.');
    console.log('No files changed. Formatting differences may be reported as local edits. Digests identify bytes, not publisher authenticity.');
  }
  return report.reviewRequired?2:0;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{process.exitCode=main(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=1;}}
