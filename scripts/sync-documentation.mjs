import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {syncDocumentation} from './documentation-cache.mjs';

export async function syncMain(args,{sync=syncDocumentation,log=console.log}={}){
  if(args.length===1&&args[0]==='--help'){
    log('Cache retained BLD8 UI documentation for local read-only MCP discovery.\nnode scripts/sync-documentation.mjs --version VERSION\nOnly versions in releases/catalog.json and fixed public release hosts are allowed. No API key is used. Existing unequal cache contents are never overwritten. Restart the MCP connection after syncing.');return 0;
  }
  if(args.length!==2||args[0]!=='--version'||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(args[1])||args[1].length>64)throw Error('Provide only --version VERSION for an exact retained source version.');
  const result=await sync(args[1]);
  log(`${result.cached?'Verified existing':'Cached verified'} BLD8 UI ${result.manifest.version} documentation. Restart the MCP connection to read it.`);
  return 0;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  try{process.exitCode=await syncMain(process.argv.slice(2));}
  catch(error){console.error(String(error?.message??error));process.exitCode=1;}
}
