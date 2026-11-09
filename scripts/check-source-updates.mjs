import {readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateManifest,planUpdate,sourceHash} from './source-release.mjs';

export function readManifest(path){
  if(statSync(path).size>8*1024*1024)throw Error('Source manifest exceeds 8 MiB.');
  let value;try{value=JSON.parse(readFileSync(path,'utf8'));}catch{throw Error('Cannot read a valid JSON source manifest.');}
  return validateManifest(value);
}
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
  if(args.includes('--help')){console.log('Read-only BLD8 source update report\nnode check-source-updates.mjs --from old.json --to current.json --item button [--item outline] [--ui-dir components/ui] [--json]\nExit codes: 0 no upstream review, 2 review required, 1 invalid input. No network requests or source writes.');return 0;}
  const options={items:[]};
  for(let index=0;index<args.length;index++){
    const flag=args[index];if(flag==='--json'){options.json=true;continue;}
    if(!['--from','--to','--item','--ui-dir'].includes(flag)||!args[index+1]||args[index+1].startsWith('--'))throw Error('Unknown or incomplete option: '+flag);
    const value=args[++index];if(flag==='--item')options.items.push(value);else{if(options[flag])throw Error('Duplicate option: '+flag);options[flag]=value;}
  }
  if(!options['--from']||!options['--to']||!options.items.length)throw Error('Provide --from, --to and at least one --item. Use --help for examples.');
  const report=planUpdate(readManifest(options['--from']),readManifest(options['--to']),[...new Set(options.items)],options['--ui-dir']?localReader(options['--ui-dir']):undefined);
  if(options.json)console.log(JSON.stringify(report,null,2));
  else{
    console.log(`BLD8 ${report.from.version} → ${report.to.version} (${report.mode})`);
    console.log('From '+report.from.snapshot+'\nTo   '+report.to.snapshot);
    for(const file of report.files)if(!['unchanged','current'].includes(file.status))console.log(file.status.padEnd(18)+' '+file.path);
    for(const action of ['added','removed'])for(const dependency of report.dependencies[action])console.log('dependency '+action+': '+dependency);
    console.log(report.reviewRequired?'Review required. Compare upstream changes with your own customisations before installing.':'No upstream changes need review for these items.');
    console.log('No files changed. Formatting differences may be reported as local edits. Digests identify bytes, not publisher authenticity.');
  }
  return report.reviewRequired?2:0;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{process.exitCode=main(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=1;}}
