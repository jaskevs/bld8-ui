import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateRawSync} from 'node:zlib';
import {createManifest,byteHash} from './source-release.mjs';
import {supportsDocumentationVersion,documentationSnapshot,documentationUrl,validateDocumentation} from './documentation-versions.mjs';
import {pinDocumentationCatalog} from './prepare-agent-docs.mjs';
import {documentationFiles} from './documentation-renderer.mjs';
import {documentationArchive} from './documentation-archive.mjs';
import {publicReleaseAcceptance} from './publish-source-release.mjs';

const version='0.4.0',homepage='https://ui.bld8.dev',registryBase=homepage+'/releases/'+version+'/r',revision='a'.repeat(40);
const notice={license:'MIT',provenance:{repository:'https://github.com/jaskevs/bld8-ui'},notices:[{path:'LICENSE',content:'MIT fixture notice'}]};
function fixture(){
  const items=[{name:'button',dependencies:[],registryDependencies:[],files:[{target:'@ui/bld8/button.tsx',content:'button source'}]},{name:'example-button-check',dependencies:[],registryDependencies:[registryBase+'/button.json'],files:[{target:'@ui/bld8/examples/button-check.tsx',content:'example source'}]}];
  const options={version,status:'released',sourceRevision:revision,registryBase,items};
  const source=createManifest({...options,artifacts:{}});
  const example={...notice,id:'button-check',componentId:'button',title:'Button check',description:'Complete source',documentationUrl:homepage+'/components/button/examples/button-check',markdownUrl:homepage+'/agent/example/button-check.md',registry:{name:'example-button-check',url:homepage+'/r/example-button-check.json'},language:'tsx',code:'const url = "https://ui.bld8.dev/r/button.json";',registryCode:'export const ButtonCheck = () => null;',complete:true,keyboard:['Enter activates.'],states:['Default state.']};
  const current={...notice,schemaVersion:1,homepage,release:{version,status:'released',sourceRevision:revision,snapshotKind:'source-graph',snapshot:documentationSnapshot(source)},installation:{requirements:['React 19'],notes:['Keep licences.'],registryBase:homepage+'/r'},entries:[{...notice,id:'button',kind:'component',title:'Button',category:'Actions',description:'A button.',notes:'Controlled by the host.',documentationUrl:homepage+'/components/button',markdownUrl:homepage+'/agent/component/button.md',registry:{name:'button',url:homepage+'/r/button.json',dependencies:[],registryDependencies:[],files:[]},example:{...notice,language:'tsx',code:'<Button />',complete:false},examples:[example],api:[{name:'Button',kind:'Component props',properties:[{name:'children',type:'ReactNode',required:false,defaultValue:'—',description:'The label.',native:false}]}]}],guides:[{...notice,id:'guide',title:'Guide',url:homepage+'/agent/guides/guide.md',markdownUrl:homepage+'/agent/guides/guide.md',content:'Read https://github.com/jaskevs/bld8-ui/blob/main/docs/guide.md and install https://ui.bld8.dev/r/button.json'}]};
  const catalog=pinDocumentationCatalog(current,{version,registryBase});
  const files=documentationFiles(catalog),archive=documentationArchive(Object.fromEntries(Object.entries(files).filter(([path])=>path!=='llms-full.txt')));
  const manifest=createManifest({...options,artifacts:{'docs/catalog.json':Buffer.from(files['catalog.json']),'documentation.zip':archive}});
  return {current,catalog,files,archive,manifest,options};
}

test('future documentation freezes registry metadata and viewer links without rewriting complete source',()=>{
  const {current,catalog,files,manifest}=fixture();
  assert.equal(catalog.entries[0].registry.url,registryBase+'/button.json');
  assert.match(catalog.entries[0].documentationUrl,/\/docs\/versions\/0\.4\.0\?entry=component%3Abutton$/);
  assert.match(catalog.entries[0].markdownUrl,/\/docs\/versions\/0\.4\.0\/markdown\?entry=/);
  assert.equal(catalog.entries[0].examples[0].code,current.entries[0].examples[0].code);
  assert.equal(catalog.entries[0].examples[0].registryCode,current.entries[0].examples[0].registryCode);
  assert.equal(current.entries[0].registry.url,homepage+'/r/button.json');
  assert.match(catalog.guides[0].content,new RegExp('/blob/'+revision+'/'));
  assert.ok(files['component/button.md'].includes(registryBase+'/button.json'));
  assert.ok(files['example/button-check.md'].includes(catalog.entries[0].examples[0].code));
  assert.deepEqual(validateDocumentation(manifest,Buffer.from(files['catalog.json']),{version}),catalog);
});

test('source graph identity avoids a circular artifact digest and rejects version/revision/URL drift',()=>{
  const {catalog,files,manifest,options}=fixture();
  assert.equal(documentationSnapshot(createManifest({...options,artifacts:{}})),catalog.release.snapshot);
  assert.equal(documentationSnapshot(manifest),catalog.release.snapshot);
  assert.notEqual(manifest.snapshot,catalog.release.snapshot);
  for(const change of [value=>{value.release.snapshot='b'.repeat(64);},value=>{value.release.sourceRevision='b'.repeat(40);},value=>{delete value.release.snapshotKind;},value=>{value.entries[0].registry.url=homepage+'/r/button.json';},value=>{value.entries[0].markdownUrl=homepage+'/agent/component/button.md';}]){
    const changed=structuredClone(catalog);change(changed);const bytes=Buffer.from(JSON.stringify(changed));
    const altered=createManifest({...options,artifacts:{'docs/catalog.json':bytes,'documentation.zip':Buffer.from('archive')}});
    assert.throws(()=>validateDocumentation(altered,bytes,{version}));
  }
  assert.throws(()=>validateDocumentation(manifest,Buffer.from(files['catalog.json']+' '),{version}),/digest/);
});

test('documentation archives have deterministic safe paths and preserve exact frozen catalogue bytes',()=>{
  const {files,archive}=fixture();
  const selected=Object.fromEntries(Object.entries(files).filter(([path])=>path!=='llms-full.txt'));
  assert.deepEqual(documentationArchive(selected),archive);
  assert.throws(()=>documentationArchive({'../private':'no'}),/path/);
  assert.throws(()=>documentationArchive({'folder\\private':'no'}),/path/);
  const decoded={};let offset=0;
  while(archive.readUInt32LE(offset)===0x04034b50){const length=archive.readUInt16LE(offset+26),extra=archive.readUInt16LE(offset+28),size=archive.readUInt32LE(offset+18),start=offset+30+length+extra,name=archive.subarray(offset+30,offset+30+length).toString('utf8');decoded[name]=inflateRawSync(archive.subarray(start,start+size)).toString('utf8');offset=start+size;}
  assert.equal(byteHash(Buffer.from(decoded['catalog.json'])),byteHash(Buffer.from(files['catalog.json'])));
  assert.equal(decoded['component/button.md'],files['component/button.md']);
  assert.equal(decoded['example/button-check.md'],files['example/button-check.md']);
});

test('legacy releases remain unsupported and artifact URL selection accepts no paths or origins',()=>{
  for(const value of ['0.2.0','0.3.0','../private','1'.repeat(100)+'.0.0'])assert.equal(supportsDocumentationVersion(value),false);
  assert.equal(supportsDocumentationVersion('0.4.0'),true);assert.equal(supportsDocumentationVersion('1.0.0'),true);
  assert.equal(documentationUrl(version,'docs/catalog.json'),homepage+'/releases/'+version+'/docs/catalog.json');
  for(const path of ['../secret','https://example.com','docs/other.json'])assert.throws(()=>documentationUrl(version,path));
});

test('public release acceptance verifies both frozen documentation assets when present',async()=>{
  const {options,files,archive}=fixture();
  const artifacts={'docs/catalog.json':Buffer.from(files['catalog.json']),'documentation.zip':archive,'r/button.json':Buffer.from('button'),'r/outline.json':Buffer.from('outline'),'downloads/outline-vite.zip':Buffer.from('starter'),'capture-installation.mjs':Buffer.from('receipt')};
  const manifest=createManifest({...options,artifacts});
  const bodies=new Map(Object.entries(artifacts).map(([path,bytes])=>[path.replaceAll('/','--'),bytes]));
  bodies.set('manifest.json',Buffer.from(JSON.stringify(manifest)));
  const calls=[];
  await publicReleaseAcceptance(version,manifest,{fetcher:async url=>{calls.push(url);return new Response(bodies.get(new URL(url).pathname.split('/').at(-1)));},pause:async()=>{}});
  assert.ok(calls.some(url=>url.endsWith('/docs--catalog.json')));
  assert.ok(calls.some(url=>url.endsWith('/documentation.zip')));
  assert.equal(calls.length,7);
});
