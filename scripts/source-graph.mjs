import ts from 'typescript';
import {readFileSync, existsSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';

/** Resolve the public UI API once; consumers receive its actual module imports. */
export function createSourceGraph(root) {
  const uiRoot=join(root,'packages/ui/src'),blockRoot=join(root,'packages/blocks/src');
  const entry=join(uiRoot,'index.ts');
  const program=ts.createProgram([entry],{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,skipLibCheck:true});
  const checker=program.getTypeChecker(),api=checker.getSymbolAtLocation(program.getSourceFile(entry));
  if(!api)throw Error('UI entry point has no exported API');
  const exports=new Map(checker.getExportsOfModule(api).map(symbol=>{
    const resolved=(symbol.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol).declarations?.[0];
    const declaration=resolved&&resolve(resolved.getSourceFile().fileName).startsWith(resolve(uiRoot))?resolved:symbol.declarations?.find(node=>resolve(node.getSourceFile().fileName).startsWith(resolve(uiRoot)));
    if(!declaration)throw Error('Cannot resolve UI export '+symbol.name);
    const filename=declaration.getSourceFile().fileName;
    if(!resolve(filename).startsWith(resolve(uiRoot)))throw Error('UI export is outside its source package: '+symbol.name);
    return[symbol.name,relative(uiRoot,filename).replaceAll('\\','/').replace(/\.tsx?$/,'')];
  }));
  const filename=(kind,key)=>{
    if(!/^[a-z0-9-]+$/.test(key))throw Error('Unsupported source module '+key);
    const base=join(kind==='ui'?uiRoot:blockRoot,key);
    const found=['.ts','.tsx'].map(extension=>base+extension).find(existsSync);
    if(!found)throw Error('Missing '+kind+' module '+key);
    return found;
  };
  const parse=source=>ts.createSourceFile('source.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function rewriteUiImports(source,prefix='../') {
    const modules=new Set(),changes=[];
    for(const node of parse(source).statements){
      if(!ts.isImportDeclaration(node)||!ts.isStringLiteral(node.moduleSpecifier))continue;
      const specifier=node.moduleSpecifier.text;
      if(specifier==='@bld8/ui'){
        const clause=node.importClause;
        if(!clause?.namedBindings||!ts.isNamedImports(clause.namedBindings)||clause.name)throw Error('Use named imports for the BLD8 UI API');
        const groups=new Map();
        for(const item of clause.namedBindings.elements){
          const name=(item.propertyName||item.name).text,module=exports.get(name);
          if(!module)throw Error('Unknown public UI export '+name);
          modules.add(module);if(!groups.has(module))groups.set(module,[]);
          groups.get(module).push(item.getText(node.getSourceFile()));
        }
        changes.push({start:node.getStart(),end:node.getEnd(),text:[...groups].map(([module,members])=>`import ${clause.isTypeOnly?'type ':''}{${members.join(',')}} from '${prefix}${module}';`).join('\n')});
      }else if(specifier.startsWith('@bld8/ui/')){
        const module=specifier.slice('@bld8/ui/'.length);filename('ui',module);modules.add(module);
        changes.push({start:node.moduleSpecifier.getStart(),end:node.moduleSpecifier.getEnd(),text:`'${prefix}${module}'`});
      }
    }
    for(const change of changes.sort((a,b)=>b.start-a.start))source=source.slice(0,change.start)+change.text+source.slice(change.end);
    return{source,modules};
  }
  function imports(source){
    const result=new Set();const walk=node=>{
      if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))result.add(node.moduleSpecifier.text);
      if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0]))result.add(node.arguments[0].text);
      ts.forEachChild(node,walk);
    };walk(parse(source));return[...result];
  }
  function collect({blocks=[],ui=[]}={}){
    const selected={ui:new Map(),block:new Map()},external={ui:new Set(),block:new Set()};
    const visit=(kind,key)=>{
      if(selected[kind].has(key))return;
      const file=filename(kind,key),source=readFileSync(file,'utf8');selected[kind].set(key,{file,source});
      for(const specifier of imports(source)){
        if(specifier.startsWith('./'))visit(kind,specifier.slice(2).replace(/\.js$/,''));
        else if(specifier==='@bld8/ui')for(const module of rewriteUiImports(source).modules)visit('ui',module);
        else if(specifier.startsWith('@bld8/ui/'))visit('ui',specifier.slice('@bld8/ui/'.length));
        else external[kind].add(specifier.startsWith('@')?specifier.split('/').slice(0,2).join('/'):specifier.split('/')[0]);
      }
    };
    blocks.forEach(key=>visit('block',key));ui.forEach(key=>visit('ui',key));
    return{selected,external};
  }
  return{rewriteUiImports,imports,collect};
}
