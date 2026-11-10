import {validateCascaderPage,validateCascaderResolvedPath,type CascaderOptionsLoader,type CascaderPathResolver} from '@bld8/ui/cascader-state';

export function createProjectAreaSource({endpoint='/api/examples/locations',failNext}:{endpoint?:string;failNext?:()=>boolean}={}) {
  async function get(params:URLSearchParams,signal:AbortSignal):Promise<unknown> {
    const response=await fetch(endpoint+'?'+params,{signal,cache:'no-store'});
    if(!response.ok)throw Error('Project areas could not be loaded.');
    const reader=response.body?.getReader();if(!reader)throw Error('Missing directory response.');
    let text='',bytes=0;const decoder=new TextDecoder();
    try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>256000){await reader.cancel();throw Error('Directory response exceeds its bound.');}text+=decoder.decode(part.value,{stream:true});}text+=decoder.decode();}
    finally{reader.releaseLock();}
    return JSON.parse(text);
  }
  const loadOptions:CascaderOptionsLoader=async({path,parentValue,query,cursor,signal})=>{
    const params=new URLSearchParams({path:JSON.stringify(path),query});if(cursor!==null)params.set('cursor',cursor);if(failNext?.())params.set('fail','1');
    return validateCascaderPage(await get(params,signal),path,parentValue);
  };
  const resolvePath:CascaderPathResolver=async({values,signal})=>validateCascaderResolvedPath(await get(new URLSearchParams({values:JSON.stringify(values)}),signal),values);
  return {loadOptions,resolvePath};
}
