import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {DEFAULT_THEME,parseThemeConfig,exportThemeCss,serializeThemeConfig} from '@bld8/ui/theme-config';
import {isStarter} from '@/lib/starter-options';
import {zip,unzip,themeStarter} from '../../../../../../../scripts/starter-archive.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!isStarter(id))return Response.json({error:'Choose an available starter.'},{status:404});
  const query=new URL(request.url).searchParams;
  if([...query.keys()].some(key=>!['framework','mode','theme'].includes(key)||query.getAll(key).length!==1))return Response.json({error:'Invalid starter options.'},{status:400});
  const framework=query.get('framework')??'nextjs',mode=query.get('mode')??'light';
  const config=query.has('theme')?parseThemeConfig(query.get('theme')):{...DEFAULT_THEME};
  if(!config||!['nextjs','vite'].includes(framework)||!['light','dark'].includes(mode))return Response.json({error:'Invalid starter options.'},{status:400});
  try{
    const directory=existsSync(join(process.cwd(),'public/downloads'))?join(process.cwd(),'public/downloads'):join(process.cwd(),'apps/docs/public/downloads');
    if(!existsSync(directory))throw Error('Starter assets are missing');
    const base=unzip(await readFile(join(directory,id+(framework==='vite'?'-vite':'')+'.zip')));
    const output=zip(themeStarter(base,{framework:framework as 'nextjs'|'vite',config,mode:mode as 'light'|'dark',css:exportThemeCss(config),serialized:serializeThemeConfig(config)}));
    return new Response(Uint8Array.from(output),{headers:{'Content-Type':'application/zip','Content-Disposition':`attachment; filename="${id}-${framework}-themed.zip"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }catch(error){
    console.error('Starter preparation failed:',error instanceof Error?error.message:'Unknown error');
    return Response.json({error:'The starter could not be prepared. Please try again shortly.'},{status:503});
  }
}
