import {sourceVersionAsset} from '@/lib/source-versions';

export async function GET(_request:Request,{params}:{params:Promise<{version:string;path:string[]}>}){
  const {version,path}=await params,url=sourceVersionAsset(version,path.join('/'));
  if(!url)return new Response('Source version or artifact not found.',{status:404,headers:{'Cache-Control':'no-store'}});
  return new Response(null,{status:308,headers:{Location:url,'Cache-Control':'public, max-age=31536000, immutable'}});
}
export const HEAD=GET;
