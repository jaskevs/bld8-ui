import {writeFileSync,realpathSync} from 'node:fs';
import {resolve,dirname,relative,isAbsolute,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readManifest,localReader} from './check-source-updates.mjs';
import {createReceipt} from './source-release.mjs';

export function captureMain(args){
  if(args.includes('--help')){console.log('Capture a BLD8 installation baseline immediately after a clean install, before customising.\nnode capture-installation.mjs --manifest source.json --item button --ui-dir src/components/ui [--output receipts/button.json]\nThis records current files; it does not certify a clean install or reconstruct earlier source. Source is never changed. Existing receipt files are never overwritten.');return 0;}
  const options={items:[]};
  for(let index=0;index<args.length;index++){
    const flag=args[index];if(!['--manifest','--item','--ui-dir','--output'].includes(flag)||!args[index+1]||args[index+1].startsWith('--'))throw Error('Unknown or incomplete option: '+flag);
    const value=args[++index];if(flag==='--item')options.items.push(value);else{if(options[flag])throw Error('Duplicate option: '+flag);options[flag]=value;}
  }
  if(!options['--manifest']||!options['--ui-dir']||!options.items.length)throw Error('Provide --manifest, --item and --ui-dir.');
  const receipt=createReceipt(readManifest(options['--manifest']),options.items,localReader(options['--ui-dir'])),text=JSON.stringify(receipt,null,2)+'\n';
  if(options['--output']){
    const output=resolve(options['--output']),ui=realpathSync(options['--ui-dir']),parent=realpathSync(dirname(output)),subpath=relative(ui,parent);
    const inside=!subpath||(!isAbsolute(subpath)&&subpath!=='..'&&!subpath.startsWith('..\\')&&!subpath.startsWith('../'));
    if(extname(output).toLowerCase()!=='.json'||inside)throw Error('Save a JSON receipt outside the UI source directory.');
    writeFileSync(output,text,{flag:'wx',mode:0o600});console.log('Installation receipt recorded. Source files were not changed.');
  }else console.log(text.trimEnd());
  return 0;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{process.exitCode=captureMain(process.argv.slice(2));}catch(error){console.error(error.code==='EEXIST'?'Receipt already exists; it was not overwritten.':error.message);process.exitCode=1;}}
