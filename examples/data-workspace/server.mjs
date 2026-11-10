import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {createPersistentIssueDataSource} from './persistent-store.mjs';
import {createIssueDataHandler} from './http-handler.mjs';

const port=Number(process.env.API_PORT??process.env.PORT??4174);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('API_PORT must be between 1024 and 65535.');
const host='127.0.0.1';
const source=await createPersistentIssueDataSource(process.env.DATA_FILE??'.local/issues.json');
const origins=['http://127.0.0.1:5173','http://localhost:5173'];
if(process.env.APP_ORIGIN){const origin=new URL(process.env.APP_ORIGIN);if(origin.protocol!=='http:'||!['127.0.0.1','localhost'].includes(origin.hostname)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('APP_ORIGIN must be a local HTTP origin.');origins.push(origin.origin);}
const handle=createIssueDataHandler(source,{allowedOrigins:origins});
const server=createServer({maxHeaderSize:100000},async(incoming,outgoing)=>{
  const controller=new AbortController();incoming.on('aborted',()=>controller.abort());outgoing.on('close',()=>{if(!outgoing.writableEnded)controller.abort();});
  try{
    if((incoming.url??'').length>90000){outgoing.writeHead(414);outgoing.end();return;}
    const request=new Request(new URL(incoming.url??'/',`http://${host}:${port}`),{method:incoming.method,headers:incoming.headers,signal:controller.signal,...(!['GET','HEAD'].includes(incoming.method??'GET')?{body:Readable.toWeb(incoming),duplex:'half'}:{})});
    const response=await handle(request);outgoing.writeHead(response.status,Object.fromEntries(response.headers));if(response.body)Readable.fromWeb(response.body).pipe(outgoing);else outgoing.end();
  }catch{if(!outgoing.headersSent)outgoing.writeHead(controller.signal.aborted?499:503,{'Content-Type':'application/json','Cache-Control':'no-store'});outgoing.end(JSON.stringify({error:'The local issue service could not complete this request.'}));}
});
server.requestTimeout=15000;server.headersTimeout=10000;server.maxHeadersCount=40;
server.listen(port,host,()=>console.log(`Local issue API: http://${host}:${port}/api/issues`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
