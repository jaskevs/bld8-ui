import {open,mkdir,rename,unlink} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createIssueDataSnapshot,parseIssueDataSnapshot,queryIssueData,saveIssueData} from '@bld8/blocks/issue-data-source';

const MAX_FILE_BYTES=8*1024*1024;
/** Local filesystem reference. Use a transactional database for multiple hosts. */
export async function createPersistentIssueDataSource(filePath) {
  if(typeof filePath!=='string'||!filePath.trim())throw new Error('Configure an issue data file.');
  const file=resolve(filePath),lock=file+'.lock';
  await mkdir(dirname(file),{recursive:true});
  let queue=Promise.resolve();
  const serial=work=>{const next=queue.then(work,work);queue=next.then(()=>undefined,()=>undefined);return next;};
  async function snapshot(){
    let handle;try{handle=await open(file,'r');const stat=await handle.stat();if(!stat.isFile()||stat.size>MAX_FILE_BYTES)throw new Error('The stored issue snapshot is too large or is not a regular file.');const text=await handle.readFile('utf8');const value=parseIssueDataSnapshot(JSON.parse(text));if(!value)throw new Error('The stored issue snapshot is invalid.');return value;}catch(error){if(error?.code==='ENOENT')return null;throw error;}finally{await handle?.close();}
  }
  async function write(value){
    const text=JSON.stringify(value);if(Buffer.byteLength(text)>MAX_FILE_BYTES)throw new Error('The local issue store reached its size limit.');
    const temporary=file+'.'+randomUUID()+'.tmp';let handle;
    try{handle=await open(temporary,'wx',0o600);await handle.writeFile(text);await handle.sync();await handle.close();handle=undefined;await rename(temporary,file);}finally{await handle?.close();try{await unlink(temporary);}catch(error){if(error?.code!=='ENOENT')throw error;}}
  }
  async function transaction(work){
    let handle;
    try{handle=await open(lock,'wx',0o600);}catch(error){if(error?.code==='EEXIST')throw new Error('The local issue store is locked by another writer. Retry when it finishes. If a process crashed, inspect its lock file before removing it.');throw error;}
    try{const previous=await snapshot();return await work(previous);}finally{await handle.close();await unlink(lock);}
  }
  await serial(()=>transaction(async previous=>{if(!previous)await write(createIssueDataSnapshot());}));
  return {
    async load(query,{signal}){if(signal.aborted)throw new DOMException('Request aborted.','AbortError');return serial(async()=>{const current=await snapshot();if(!current)throw new Error('The local issue file is missing. Restore it before continuing.');if(signal.aborted)throw new DOMException('Request aborted.','AbortError');return queryIssueData(current,query);});},
    async save(request,{signal}){if(signal.aborted)throw new DOMException('Request aborted.','AbortError');return serial(()=>transaction(async previous=>{if(!previous)throw new Error('The local issue file is missing. Restore it before continuing.');if(signal.aborted)throw new DOMException('Request aborted.','AbortError');const {result,next}=saveIssueData(previous,request);if(next!==previous)await write(next);return result;}));},
  };
}
