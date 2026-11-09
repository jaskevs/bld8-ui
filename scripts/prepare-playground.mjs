import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),sources={};
for(const [name,file] of [['Kanban','kanban'],['Tree','tree'],['Chart','chart']]){
  const source=readFileSync(join(root,'apps/docs/src/examples/playground-'+file+'.tsx'),'utf8');
  sources[name]=source.replace(/(['"])@bld8\/ui\/([a-z0-9-]+)\1/g,'"@/components/ui/bld8/$2"');
}
const target=join(root,'apps/docs/src/lib/generated');mkdirSync(target,{recursive:true});writeFileSync(join(target,'playground-workflows.ts'),'// Prepared from the working public-API examples.\nexport const workflowSources = '+JSON.stringify(sources)+' as const;\n');
