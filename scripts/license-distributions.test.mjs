import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {unzip} from './starter-archive.mjs';
import {readExportLiteral} from './literal-data.mjs';
import {readComponentExamples} from './prepare-component-examples.mjs';
import {hasFullNotice,mitNotice,uiNoticeNames} from './license-policy.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path),'utf8');
const json=path=>JSON.parse(read(path));
const complete=source=>assert.ok(hasFullNotice(source,mitNotice()),'copied code requires the full original MIT notice');
const metadata=item=>{
  assert.equal(item.license,'MIT');
  assert.equal(item.provenance.repository,'https://github.com/jaskevs/bld8-ui');
  assert.ok(item.provenance.sourcePaths.length);
  assert.deepEqual(item.provenance.upstream,json('packages/ui/UPSTREAM.json'));
  for(const path of ['LICENSE','packages/blocks/LICENSE',...uiNoticeNames.filter(name=>!name.endsWith('.json')).map(name=>'packages/ui/'+name)])assert.equal(item.notices.find(notice=>notice.path===path)?.content,read(path),path);
};

test('raw human source and JSON manifests retain standalone source and portable sidecars',()=>{
  const sources=readExportLiteral(read('apps/docs/src/lib/generated/sources.ts'),'sources');
  for(const source of Object.values(sources)){complete(source.component);complete(source.styles);}
  for(const name of readdirSync(join(root,'apps/docs/public/sources')).filter(name=>name.endsWith('.json'))){
    const manifest=json('apps/docs/public/sources/'+name);metadata(manifest);
    for(const file of manifest.files.filter(file=>/\.(?:tsx?|css)$/.test(file.path)))complete(file.content);
    for(const notice of manifest.notices)assert.equal(manifest.files.find(file=>file.path===notice.path)?.content,notice.content);
    assert.deepEqual(JSON.parse(manifest.files.find(file=>file.path==='packages/ui/UPSTREAM.json').content),json('packages/ui/UPSTREAM.json'));
  }
});

test('all Next.js and Vite starters contain unchanged notices and portable upstream records',()=>{
  const names=readdirSync(join(root,'apps/docs/public/downloads')).filter(name=>name.endsWith('.zip'));
  assert.equal(names.length,47);
  for(const name of names){
    const files=unzip(readFileSync(join(root,'apps/docs/public/downloads',name)));
    assert.equal(JSON.parse(files['package.json']).license,'MIT',name+': root package metadata');
    for(const path of ['LICENSE',...uiNoticeNames.map(name=>'packages/ui/'+name)])assert.equal(files[path]?.toString(),read(path),name+': '+path);
    if(files['packages/blocks/package.json'])assert.equal(files['packages/blocks/LICENSE']?.toString(),read('packages/blocks/LICENSE'));
    const source=files['packages/ui/src/index.ts'].toString();
    const parsed=ts.createSourceFile('index.ts',source,ts.ScriptTarget.Latest,true);
    assert.equal(parsed.statements[0].expression?.text,'use client',name+': client directive');
  }
});

test('registry code and copied adapted source retain full applicable permissions',()=>{
  const registry=json('apps/docs/public/r/registry.json');
  for(const item of registry.items){
    assert.equal(item.license,'MIT');
    assert.ok(item.notices.length);
    for(const file of item.files.filter(file=>/\.(?:tsx?|css)$/.test(file.path)))complete(file.content);
  }
  const styles=json('apps/docs/public/r/bld8-styles.json');
  assert.deepEqual(JSON.parse(styles.files.find(file=>file.path.endsWith('/UPSTREAM.json')).content),json('packages/ui/UPSTREAM.json'));
  for(const name of ['sidebar','drawer','context-menu','variants']){
    const item=json('apps/docs/public/r/bld8-'+name+'.json');
    assert.ok(hasFullNotice(item.files[0].content,read('packages/ui/SHADCN_LICENSE')),name+': upstream notice');
  }
  assert.equal(json('apps/docs/public/r/bld8-block-styles.json').files.find(file=>file.path.endsWith('/LICENSE')).content,read('packages/blocks/LICENSE'));
});

test('complete human and agent examples preserve identical licensed code outside the catalogue',()=>{
  const catalog=json('apps/docs/public/agent/catalog.json');metadata(catalog);
  for(const item of readComponentExamples(root)){
    metadata(item);complete(item.source);complete(item.registrySource);
    const example=catalog.entries.find(entry=>entry.kind==='component'&&entry.id===item.componentId).examples.find(example=>example.id===item.id);
    metadata(example);assert.equal(example.code,item.source);assert.equal(example.registryCode,item.registrySource);
    const parsed=ts.createSourceFile(item.id+'.tsx',example.code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    assert.equal(parsed.statements[0].expression?.text,'use client');
  }
  for(const entry of catalog.entries){metadata(entry);complete(entry.example.code);}
});
