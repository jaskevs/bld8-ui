import {hasDocumentationVersion,versionedDocumentation} from '@/lib/versioned-documentation';
import {entryMarkdown,exampleMarkdown} from '../../../../../../../../scripts/documentation-renderer.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{version:string}>}){
  const {version}=await params;if(!hasDocumentationVersion(version))return new Response('Unknown source version.',{status:404});
  try{
    const {catalog}=await versionedDocumentation(version),query=new URL(request.url).searchParams;
    const entry=catalog.entries.find(item=>item.kind+':'+item.id===query.get('entry'));
    const example=catalog.entries.flatMap(item=>item.examples).find(item=>item.id===query.get('example'));
    const guide=catalog.guides.find(item=>item.id===query.get('guide'));
    const text=entry?entryMarkdown(entry,catalog):example?exampleMarkdown(example,catalog):guide?.content;
    if(!text)return new Response('No documentation matched this selected version.',{status:404});
    return new Response(text,{headers:{'Content-Type':'text/markdown; charset=utf-8','X-Content-Type-Options':'nosniff'}});
  }catch{return new Response('Verified documentation is unavailable for this selected source version.',{status:404});}
}
