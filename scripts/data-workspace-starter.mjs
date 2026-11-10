import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createViteStarter} from './vite-starter.mjs';

/** Both clients use the same server-only persistence and atomic batch protocol. */
export function createDataWorkspaceStarters({root,base,packageFiles}){
  const shared={...Object.fromEntries(Object.entries(base).filter(([name])=>!name.startsWith('packages/'))),...packageFiles({blocks:['data-workspace']})};
  const client=`'use client';
import {useMemo} from 'react';
import {DataWorkspace} from '@bld8/blocks';
import {createIssueDataHttpSource} from '@bld8/blocks/issue-data-source';
export default function Page(){const source=useMemo(()=>createIssueDataHttpSource('/api/issues'),[]);return <div className="bblocks-root"><DataWorkspace dataSource={source}/></div>;}
`;
  shared['app/page.tsx']=client;
  const manifest=JSON.parse(shared['package.json']);manifest.name='bld8-data-workspace-http-starter';manifest.type='module';
  shared['package.json']=JSON.stringify(manifest,null,2);
  for(const name of ['persistent-store.mjs','persistent-store.d.mts','http-handler.mjs','http-handler.d.mts'])shared['lib/'+name]=readFileSync(join(root,'examples/data-workspace/'+name));
  shared['app/api/issues/route.ts']=`import {resolve} from 'node:path';
import {createPersistentIssueDataSource} from '../../../lib/persistent-store.mjs';
import {createIssueDataHandler} from '../../../lib/http-handler.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
let source:ReturnType<typeof createPersistentIssueDataSource>|undefined;
async function handle(request:Request){source??=createPersistentIssueDataSource(resolve(/*turbopackIgnore: true*/ process.cwd(),process.env.DATA_FILE??'.local/issues.json'));return createIssueDataHandler(await source,{allowedOrigins:process.env.APP_ORIGIN?[new URL(process.env.APP_ORIGIN).origin]:[]})(request);}
export {handle as GET,handle as PATCH};
`;
  shared['.gitignore']+='\n.local/\n';
  const readme=`# Data Workspace — persistent HTTP reference

Use Node 22. Install with npm install. This is a complete local single-writer
reference: one typed issue source, nested filters, ordered multi-sort, paging,
editable cell ranges, review, atomic revision-checked saves and conflict recovery.
Both collections are free under MIT. Keep the included licences.

Records and replay receipts are stored in .local/issues.json. DATA_FILE may point
to a path controlled by the server operator. This file and its directory must
remain private. The browser never receives a disk path or server environment.
The server validates the full batch before replacing one snapshot; any stale
revision prevents the whole batch. A retry with the same requestId and payload
returns the recorded result, including after a restart while its receipt remains in the latest 100 batches. Older retries still encounter revision checks. Draft undo/redo is local
and stops at a successful save; it never rewinds another client's committed data.

This reference is for one local server process with an exclusive file lock and
atomic replacement. It is not a multi-instance database, authentication service,
collaboration server or a durable file-hosting service. Do not deploy it to an
ephemeral/serverless filesystem. Use a transactional database and authenticated
record ownership for a hosted application. The supplied lock protects concurrent
transactions; investigate a leftover lock after a crash instead of deleting it
while another writer may be active. A malformed existing snapshot is rejected.

Uploads are opt-in via DataWorkspace's onUploadFile callback. Acknowledging file
bytes does not attach a file to an issue or prove durable storage. Supply your
own authorised receiver and attachment transaction if your product needs these.

The source packages are included under packages/. Rebuild the relevant workspace
after editing them. npm run build rebuilds the packages and application.
`;
  shared['README.md']=readme+'\n## Next.js\n\nRun npm run dev, then open localhost:3000. To use a different browser origin, set APP_ORIGIN to its exact http://127.0.0.1:port or http://localhost:port value in .env.local. GET/PATCH /api/issues use the Node route and lib/ reference. npm run build and npm start run a production build locally. Keep the persistent directory on a local writable disk.\n';
  const vite=createViteStarter({id:'data-workspace-http',name:'Data Workspace',exportName:'DataWorkspace',notes:''},shared);
  vite['src/App.tsx']=client.replace("'use client';\n",'');
  for(const name of ['persistent-store.mjs','persistent-store.d.mts','http-handler.mjs','http-handler.d.mts','server.mjs'])vite['server/'+name]=readFileSync(join(root,'examples/data-workspace/'+name));
  const viteManifest=JSON.parse(vite['package.json']);viteManifest.scripts['dev:api']='node server/server.mjs';vite['package.json']=JSON.stringify(viteManifest,null,2);
  vite['vite.config.ts']=`import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{host:'127.0.0.1',proxy:{'/api/issues':{target:'http://127.0.0.1:'+(process.env.API_PORT??'4174'),changeOrigin:true}}}});
`;
  vite['.gitignore']+='\n.local/\n';
  vite['README.md']=readme+'\n## React + Vite\n\nRun npm run dev:api in one terminal and npm run dev in another. Open http://127.0.0.1:5173 (or the Vite port printed). The Vite development proxy forwards /api/issues to the loopback Node server on 4174. If the frontend origin differs from the default 5173 URL, pass APP_ORIGIN=http://127.0.0.1:your-port when starting the API. The API runs separately from the frontend; change both its port and proxy target together. npm run build verifies and builds the client. Static hosting needs its own authenticated persistent API and reverse proxy; the development proxy is not included in dist/.\n';
  return {nextjs:shared,vite};
}
