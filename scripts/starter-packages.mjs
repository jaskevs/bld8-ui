import {readFileSync,readdirSync} from 'node:fs';
import {basename,join} from 'node:path';
import {createSourceGraph} from './source-graph.mjs';

/** Package only the selected modules and their source/build dependencies. */
export function createStarterPackages(root) {
  const graph=createSourceGraph(root),read=file=>readFileSync(join(root,file));
  return ({blocks,ui=['overlays'],examples=[]})=>{
    const extra=examples.flatMap(file=>[...graph.rewriteUiImports(read(file).toString()).modules]);
    const {selected,external}=graph.collect({blocks,ui:[...ui,...extra]}),files={};
    for(const [kind,folder] of [['ui','packages/ui'],['block','packages/blocks']]){
      const modules=selected[kind],manifest=JSON.parse(read(folder+'/package.json'));
      manifest.dependencies=Object.fromEntries(Object.entries(manifest.dependencies||{}).filter(([name])=>name==='@bld8/ui'||external[kind].has(name)));
      if(!modules.has('react-hook-form')){
        delete manifest.peerDependencies?.['react-hook-form'];delete manifest.peerDependenciesMeta?.['react-hook-form'];delete manifest.devDependencies?.['react-hook-form'];
      }
      manifest.exports=Object.fromEntries(Object.entries(manifest.exports).filter(([key,value])=>{
        if(key==='.'||key.endsWith('.css'))return true;
        const filename=typeof value==='string'?value:value.import;
        return modules.has(basename(filename).replace(/\.(js|css)$/,''));
      }));
      files[folder+'/package.json']=JSON.stringify(manifest,null,2);
      files[folder+'/README.md']='# Included source\n\nThis starter contains the modules used by this example. Source and compiled output are both editable under the included MIT and third-party licences.\n';
      files[folder+'/LICENSE']=read(folder+'/LICENSE');
      files[folder+'/tsconfig.json']=read(folder+'/tsconfig.json');
      files[folder+'/scripts/copy-styles.mjs']=read(folder+'/scripts/copy-styles.mjs');
      for(const [key,{file}] of modules){
        if(key==='index')throw Error('Starter graph must use named module imports, not a complete index');
        files[folder+'/src/'+basename(file)]=readFileSync(file);
        files[folder+'/dist/'+key+'.js']=read(folder+'/dist/'+key+'.js');
        files[folder+'/dist/'+key+'.d.ts']=read(folder+'/dist/'+key+'.d.ts');
      }
      const entry=[...modules.keys()].map(key=>`export * from './${key}.js';`).join('\n')+'\n';
      const client=/^['"]use client['"]/.test(read(folder+'/src/index.ts').toString())?"'use client';\n":'';
      files[folder+'/src/index.ts']=client+entry;files[folder+'/dist/index.js']=client+entry;files[folder+'/dist/index.d.ts']=entry;
      for(const file of kind==='ui'?readdirSync(join(root,folder,'src')).filter(name=>name.endsWith('.css')):['styles.css']){
        files[folder+'/src/'+file]=read(folder+'/src/'+file);files[folder+'/dist/'+file]=read(folder+'/dist/'+file);
      }
    }
    for(const name of ['THIRD_PARTY_NOTICES.md','LUCIDE_LICENSE','DAY_PICKER_LICENSE','SHADCN_LICENSE','MOTION_LICENSE','DND_KIT_LICENSE'])files['packages/ui/'+name]=read('packages/ui/'+name);
    return files;
  };
}
