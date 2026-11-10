import {createMemoryIssueDataSource} from '@bld8/blocks/issue-data-source';
import type {DataSource} from '@bld8/ui/data-workspace-state';
import type {Issue} from '@bld8/blocks/issue-repository';
import {createIssueDataHandler} from '../../../../../../../examples/data-workspace/http-handler.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const sessions=new Map<string,{source:DataSource<Issue>;at:number}>();
/** An isolated, bounded illustrative session. The random header is not authentication. */
async function handle(request:Request){
  const session=request.headers.get('X-BLD8-Session');
  if(!session||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(session))return Response.json({error:'Start a new example session.'},{status:400});
  const now=Date.now();for(const [key,entry]of sessions)if(now-entry.at>15*60*1000)sessions.delete(key);
  let entry=sessions.get(session);
  if(!entry){if(sessions.size>=32)return Response.json({error:'The example is busy. Try again later.'},{status:429});entry={source:createMemoryIssueDataSource(),at:now};sessions.set(session,entry);}
  entry.at=now;
  const url=new URL(request.url),host=request.headers.get('host')??'';
  // Next's local production server can normalize the URL to localhost while
  // the browser uses 127.0.0.1. Accept only a loopback Host for that local case.
  const localOrigin=['localhost','127.0.0.1'].includes(url.hostname)&&/^(?:localhost|127\.0\.0\.1):\d{1,5}$/.test(host)?['http://'+host]:[];
  return createIssueDataHandler(entry.source,{path:'/api/examples/data-workspace',allowedOrigins:[...localOrigin,'https://ui.bld8.dev','https://bld8-ui.vercel.app']})(request);
}
export {handle as GET,handle as PATCH};
