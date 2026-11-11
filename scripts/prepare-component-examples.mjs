import ts from 'typescript';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readExportLiteral} from './literal-data.mjs';
import {createSourceGraph} from './source-graph.mjs';
const defaultRoot=fileURLToPath(new URL('../',import.meta.url));
export function readComponentExamples(root=defaultRoot) {
  const read=path=>readFileSync(join(root,path),'utf8');
  const components=readExportLiteral(read('apps/docs/src/lib/catalog.ts'),'components');
  const families=new Set(components.map(item=>item.id)),ids=new Set(),graph=createSourceGraph(root),examples=[];
  for(const family of ['basic','choice','menu','field','grid']) {
    const file=`apps/docs/src/lib/${family}-examples.ts`;
    if(!existsSync(join(root,file))) {if(family==='grid')continue;throw Error('Missing example authority: '+file);}
    for(const item of readExportLiteral(read(file),family+'Examples')) {
      if(!/^[a-z][a-z0-9-]*$/.test(item.id)||ids.has(item.id))throw Error('Duplicate or invalid example ID: '+item.id);
      if(!families.has(item.componentId))throw Error('Unknown example component: '+item.componentId);
      for(const key of ['title','description','source'])if(typeof item[key]!=='string'||!item[key].trim())throw Error('Missing example '+key+': '+item.id);
      for(const key of ['keyboard','states'])if(!Array.isArray(item[key])||!item[key].every(value=>typeof value==='string'))throw Error('Invalid example '+key+': '+item.id);
      let source=item.source.replaceAll('\r\n','\n').trim()+'\n';
      if(source.length>50000)throw Error('Example source too large: '+item.id);
      if(!/^['"]use client['"]/.test(source))source="'use client';\n"+source;
      if(!source.includes('@bld8/ui/styles.css'))source=source.replace(/(['"]use client['"];?)/,"$1\nimport '@bld8/ui/styles.css';");
      const parsed=ts.createSourceFile(item.id+'.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
      if(parsed.parseDiagnostics.length)throw Error('Invalid TSX example: '+item.id);
      const declaration=parsed.statements.find(node=>ts.isFunctionDeclaration(node)&&node.modifiers?.some(mod=>mod.kind===ts.SyntaxKind.ExportKeyword)&&node.name&&/^[A-Z]/.test(node.name.text));
      if(!declaration||declaration.parameters.some(parameter=>!parameter.questionToken&&!parameter.initializer))throw Error('Example needs an exported, no-prop component: '+item.id);
      const exportName=declaration.modifiers.some(mod=>mod.kind===ts.SyntaxKind.DefaultKeyword)?'default':declaration.name.text;
      const rewritten=graph.rewriteUiImports(source,'@/components/ui/bld8/');
      ids.add(item.id);examples.push({...item,source,family,exportName,preview:item.preview??'live',registrySource:rewritten.source,modules:[...rewritten.modules].sort()});
    }
  }
  for(const component of components)if(!examples.some(item=>item.componentId===component.id))throw Error('Missing complete example: '+component.id);
  return examples;
}
export function prepareComponentExamples({root=defaultRoot}={}) {
  const examples=readComponentExamples(root),directory=join(root,'apps/docs/src/lib/generated'),modules=join(directory,'component-examples-src');
  mkdirSync(modules,{recursive:true});
  const roots=[];
  for(const item of examples){const path=join(modules,item.id+'.tsx');writeFileSync(path,item.source);roots.push(path);}
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,lib:['lib.dom.d.ts','lib.dom.iterable.d.ts','lib.esnext.d.ts']};
  const program=ts.createProgram(roots,options),diagnostics=ts.getPreEmitDiagnostics(program);
  if(diagnostics.length)throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>root,getCanonicalFileName:file=>file,getNewLine:()=> '\n'}));
  writeFileSync(join(directory,'component-examples-data.ts'),'// Generated from literal example authorities.\nexport const componentExamples = '+JSON.stringify(examples)+';\n');
  const imports=examples.map(item=>`${JSON.stringify(item.id)}:dynamic(()=>import('./component-examples-src/${item.id}').then(module=>readyPreview(module.${item.exportName})))`).join(',\n');
  const previewShell="'use client';\nimport dynamic from 'next/dynamic';\nimport {useEffect,useState,type ComponentType} from 'react';\nfunction readyPreview(Component:ComponentType){return function ReadyPreview(){const [ready,setReady]=useState(false);useEffect(()=>setReady(true),[]);return <div className=\"component-example-ready\" data-example-ready={ready?'':undefined} inert={!ready||undefined} aria-hidden={!ready||undefined} aria-busy={!ready||undefined}><Component/></div>;};}\n";
  writeFileSync(join(directory,'component-previews.tsx'),previewShell+'export const componentPreviews={\n'+imports+'\n};\n');
  console.log(`Prepared and typechecked ${examples.length} complete component examples.`);
  return examples;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)prepareComponentExamples();
