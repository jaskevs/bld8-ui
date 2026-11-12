import {test,expect} from '@playwright/test';
import ts from 'typescript';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,lstatSync} from 'node:fs';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {playgroundNames,readPlayground,statesFor,playgroundInstall} from '../apps/docs/src/lib/playground-state';
import {playgroundCode} from '../apps/docs/src/lib/playground-code';
import {hasFullNotice,mitNotice} from '../scripts/license-policy.mjs';
import {withSourceNotice} from '../apps/docs/src/lib/source-notice';

test('generated playground variants typecheck against the actual registry source and aliases',()=>{
  const root=fileURLToPath(new URL('../',import.meta.url)),parent=resolve(root,'.local');mkdirSync(parent,{recursive:true});const workspace=mkdtempSync(join(parent,'playground-code-'));
  try{
    const visited=new Set<string>();
    function install(name:string){
      if(visited.has(name))return;expect(name).toMatch(/^[a-z0-9-]+$/);visited.add(name);const item=JSON.parse(readFileSync(join(root,'apps/docs/public/r',name+'.json'),'utf8'));
      for(const dependency of item.registryDependencies??[]){expect(dependency).toMatch(/^https:\/\/ui\.bld8\.dev\/r\/[a-z0-9-]+\.json$/);install(dependency.split('/').at(-1)!.replace('.json',''));}
      for(const file of item.files??[]){expect(file.target).toMatch(/^@ui\/bld8\//);const target=resolve(workspace,file.target.replace(/^@ui\//,'components/ui/'));expect(target.startsWith(workspace+sep)).toBe(true);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,file.content);}
    }
    const variants=playgroundNames.flatMap(component=>statesFor(component).map(state=>readPlayground('?component='+component+'&state='+state)));
    variants.push(...['?component=Checkbox&mixed=true','?component=Accordion&multiple=true&accordionOpen=overview,keyboard','?component=RadioGroup&disabledOption=true','?component=DataTable&bulkActions=false&selectable=false','?component=DataTable&inlineEditing=true&groupRows=true&resizable=true&tableSelected=1,6&tableColumns=name,status,due&tableSort=due-desc','?component=DataTable&advancedFilters=true&actionResult=Error','?component=FilterBuilder&inlineEditing=true&state=Disabled'].map(query=>readPlayground(query)));
    variants.push(readPlayground('?component=FilterBuilder&bulkActions=false&selectable=false'),{...readPlayground('?component=DataTable'),appliedFilters:{version:1,match:'all',rules:[{id:'ready',field:'status',operator:'anyOf',values:['Ready']}]}});
    variants.push(...['?component=Kanban&kanbanLayout=backlog&actionResult=Error&kanbanLimit=1','?component=Tree&treeFailure=true&treeExpanded=assets&treeLoaded=true&treeSelected=tokens','?component=Chart&chartType=area&chartPeriod=fortnight&chartMissing=true&chartHeight=480'].map(query=>readPlayground(query)));
    const files=variants.map((settings,index)=>{for(const url of playgroundInstall(settings).split(' ').slice(3))install(url.split('/').at(-1)!.replace('.json',''));const file=join(workspace,'example-'+index+'.tsx');const source=playgroundCode(settings);expect(hasFullNotice(source,mitNotice())).toBe(true);expect(withSourceNotice(source)).toBe(source);writeFileSync(file,source);return file;});
    const program=ts.createProgram(files,{target:ts.ScriptTarget.ES2017,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,strict:true,noEmit:true,skipLibCheck:true,esModuleInterop:true,baseUrl:workspace,paths:{'@/*':['./*']}});
    const diagnostics=ts.getPreEmitDiagnostics(program).map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')+(item.file?' in '+item.file.fileName:''));expect(diagnostics).toEqual([]);
    test.info().annotations.push({type:'generated-examples',description:String(files.length)+' configured examples checked against '+visited.size+' actual registry items.'});
  }finally{
    const target=resolve(workspace);if(!target.startsWith(parent+sep)||!target.split(sep).at(-1)!.startsWith('playground-code-')||lstatSync(target).isSymbolicLink())throw new Error('Unexpected generated-code fixture path; leaving it alone.');rmSync(target,{recursive:true,force:true});
  }
});
