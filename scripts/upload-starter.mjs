import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export function createUploadStarter({root,base,packageFiles}){
  const files={...Object.fromEntries(Object.entries(base).filter(([name])=>!name.startsWith('packages/'))),...packageFiles({blocks:[],ui:['upload-queue','upload-http','overlays']})};
  for(const name of Object.keys(files))if(name.startsWith('packages/blocks/'))delete files[name];
  const manifest=JSON.parse(files['package.json']);manifest.name='bld8-upload-http-starter';manifest.workspaces=['packages/ui'];delete manifest.dependencies['@bld8/blocks'];
  manifest.scripts.build='npm run build --workspace=@bld8/ui && next build';files['package.json']=JSON.stringify(manifest,null,2);
  files['app/layout.tsx']=files['app/layout.tsx'].replace("import '@bld8/blocks/styles.css';\n",'');
  files['app/page.tsx']=`'use client';
import {useMemo} from 'react';
import {UploadQueue,createUploadHttpAdapter} from '@bld8/ui';
export default function Page(){
  const uploadFile=useMemo(()=>{let session:string|undefined;
    return createUploadHttpAdapter({endpoint:'/api/upload',headers:()=>{
      session??=crypto.randomUUID();return {'X-BLD8-Session':session};
    }});
  },[]);
  return <section style={{maxWidth:800,margin:'auto'}}><h1>Files, one at a time.</h1><p style={{marginBlock:'16px 32px'}}>A working HTTP example. The receiver hashes and discards file bytes.</p><UploadQueue label="Files" onUploadFile={uploadFile} maxFiles={5} maxSize={2*1024*1024} concurrency={2}/></section>;
}
`;
  files['lib/upload-demo-api.ts']=readFileSync(join(root,'examples/upload-http/demo-api.ts'));
  files['app/api/upload/route.ts']=`export {handleUploadDemo as POST} from '../../../lib/upload-demo-api';\nexport const runtime='nodejs';\nexport const maxDuration=30;\n`;
  files['README.md']=`# Per-file upload HTTP starter

Use Node 22. Run npm install, then npm run dev and open localhost:3000.
The component and raw-body receiver work together. Run npm run build to rebuild
the editable included UI package and Next.js application.

The example accepts up to five files in the UI, 2 MiB each and two simultaneous
transfers. Native XHR events report bytes sent. Processing means bytes have been
sent; Acknowledged means the server returned a matching receipt.

lib/upload-demo-api.ts incrementally reads a bounded body, computes SHA-256 and
discards the bytes. Temporary process-local receipts expire after five minutes.
Retry uses the same request ID and resends the whole file; conflicting bytes or
names return 409. The random session header namespaces receipts and is not
authentication. Bounds apply per server process, not across a deployment fleet.

Connect authenticated ownership and durable storage in your own receiver. The
sample does not host files, reserve disk paths or implement resumable transfers.
For React + Vite, use the same UploadQueue and createUploadHttpAdapter with your
own HTTP endpoint; the included receiver uses Next.js Node routes.

Both collections are free under MIT. Keep the included licences and notices.
`;
  return files;
}
