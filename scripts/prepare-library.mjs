import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { zip, themeStarter } from './starter-archive.mjs';
import { createStarterPackages } from './starter-packages.mjs';
import { DEFAULT_THEME, exportThemeCss, serializeThemeConfig } from '../packages/ui/dist/theme-config.js';
import { blocks, templates } from './library-catalog.mjs';
import { createViteStarter } from './vite-starter.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFileSync(join(root,name));
const write = (name,value) => { const target = join(root,name); mkdirSync(dirname(target),{recursive:true}); writeFileSync(target,value); };
if (!process.argv.includes('--source-only')) {
  execFileSync(process.execPath,['scripts/prepare-icons.mjs'],{cwd:root,stdio:'inherit'});
  execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','packages/blocks/tsconfig.json'],{cwd:root,stdio:'inherit'});
  copyFileSync(join(root,'packages/blocks/src/styles.css'),join(root,'packages/blocks/dist/styles.css'));
}
const entries = [...blocks,...templates];
const styles = read('packages/blocks/src/styles.css').toString();
const sources = Object.fromEntries(entries.map(item => [item.id,{ component:read('packages/blocks/src/' + item.file).toString(), styles }]));
write('apps/docs/src/lib/generated/catalog.ts',`// Generated from scripts/library-catalog.mjs.\nexport const library = ${JSON.stringify({blocks,templates},null,2)} as const;\n`);
write('apps/docs/src/lib/generated/sources.ts',`// Generated from the actual reusable package source.\nexport const sources: Record<string, { component: string; styles: string }> = ${JSON.stringify(sources)};\n`);

const packageFiles=createStarterPackages(root);
function themed(files,framework) {
  const base=framework==='nextjs'?'app':'src';
  files={...files};
  for(const [name,pkg] of [['dm-sans','dm-sans'],['manrope','manrope']]) {
    files[base+'/fonts/'+name+'.woff2']=read('node_modules/@fontsource-variable/'+pkg+'/files/'+pkg+'-latin-wght-normal.woff2');
    files['font-licenses/'+name+'-OFL.txt']=read('node_modules/@fontsource-variable/'+pkg+'/LICENSE');
  }
  return themeStarter(files,{framework,config:DEFAULT_THEME,mode:'light',css:exportThemeCss(DEFAULT_THEME),serialized:serializeThemeConfig(DEFAULT_THEME)});
}
let outlineStarter;
for(const item of entries) {
  const files={...packageFiles({blocks:[item.file.replace(/\.tsx$/,'')]}),
    'LICENSE':read('LICENSE'),
    'package.json':JSON.stringify({name:'bld8-' + item.id + '-starter',private:true,scripts:{dev:'next dev',build:'npm run build --workspace=@bld8/ui && npm run build --workspace=@bld8/blocks && next build',start:'next start'},workspaces:['packages/*'],dependencies:{'@bld8/ui':'*','@bld8/blocks':'*',next:'16.3.8',react:'19.3.0','react-dom':'19.3.0'},devDependencies:{typescript:'~5.9.3','@types/react':'19.3.0','@types/react-dom':'19.3.0','@types/node':'^22.0.0'}},null,2),
    'app/layout.tsx':`import '@bld8/ui/styles.css';\nimport '@bld8/blocks/styles.css';\nimport './globals.css';\nimport { UIProvider } from '@bld8/ui';\nexport const metadata = { title: ${JSON.stringify(item.name + ' — BLD8 UI')} };\nexport default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><UIProvider><main>{children}</main></UIProvider></body></html>; }\n`,
    'app/page.tsx':`'use client';\nimport { ${item.exportName} } from '@bld8/blocks';\nexport default function Page() { return <div className="bblocks-root"><${item.exportName} /></div>; }\n`,
    'next.config.ts':'export default { agentRules: false };',
    'app/globals.css':'* { box-sizing: border-box; } body { position:relative; margin:0; padding:clamp(1rem,4vw,3rem); font-family:var(--bui-font); background:var(--bui-canvas); color:var(--bui-ink); line-height:1.6; } main { isolation:isolate; max-width:1200px; margin:auto; } h1,h2,h3,h4,p { margin:0; } :focus-visible { outline:2px solid var(--bui-focus); outline-offset:4px; }',
    'tsconfig.json':JSON.stringify({compilerOptions:{target:'ES2020',lib:['dom','dom.iterable','esnext'],allowJs:true,skipLibCheck:true,strict:true,noEmit:true,esModuleInterop:true,module:'esnext',moduleResolution:'bundler',resolveJsonModule:true,isolatedModules:true,jsx:'react-jsx',plugins:[{name:'next'}]},include:['next-env.d.ts','**/*.ts','**/*.tsx','.next/types/**/*.ts'],exclude:['node_modules','packages']},null,2),
    '.gitignore':'node_modules/\n.next/\n.env*\n*.tsbuildinfo\n',
    'README.md':`# ${item.name}\n\nA BLD8 UI frontend starter. Both Free and Premium collections use the MIT licence and cost $0.\n\nUse Node 22 and run:\n\n\`\`\`sh\nnpm install\nnpm run dev\n\`\`\`\n\nOpen http://localhost:3000. No backend or authentication service is included. Storage behaviour varies by example; the notes below describe it.\n\n${item.notes}\n\nEdit app/page.tsx and app/globals.css. Reusable source is included in packages/ui/src and packages/blocks/src; rebuild those packages if you edit them. The starter consumes the included compiled dist files. Run npm run build to rebuild both packages (including prefixed Tailwind CSS) and the app. For package edits during dev, run npm run build --workspace=@bld8/ui and npm run build --workspace=@bld8/blocks before refreshing.\n\nKeep LICENSE, SHADCN_LICENSE and all third-party notices when sharing the code. No BLD8 packages are fetched from npm; they are included as local workspaces.\n`,
    'packages/ui/tsconfig.json':read('packages/ui/tsconfig.json'),
    'packages/blocks/tsconfig.json':read('packages/blocks/tsconfig.json'),
    'packages/ui/scripts/copy-styles.mjs':read('packages/ui/scripts/copy-styles.mjs'),
    'packages/blocks/scripts/copy-styles.mjs':read('packages/blocks/scripts/copy-styles.mjs'),
  };
  const nextFiles=themed(files,'nextjs');
  if(item.id==='outline')outlineStarter=nextFiles;
  write(`apps/docs/public/downloads/${item.id}.zip`,zip(nextFiles));
  write(`apps/docs/public/downloads/${item.id}-vite.zip`,zip(themed(createViteStarter(item,files),'vite')));
  write(`apps/docs/public/sources/${item.id}.json`,JSON.stringify({schemaVersion:1,name:item.id,title:item.name,tier:item.tier,price:0,license:'MIT',framework:'React 19',dependencies:['@bld8/ui'],description:item.description,notes:item.notes,files:Object.entries(files).filter(([path])=>path.startsWith('packages/blocks/src/')).map(([path,content])=>({path,content:content.toString()})),download:`/downloads/${item.id}.zip`,downloads:{nextjs:`/downloads/${item.id}.zip`,vite:`/downloads/${item.id}-vite.zip`},frameworks:['React + Next.js','React + Vite']},null,2));
}
write('apps/docs/public/r/index.json',JSON.stringify({schemaVersion:1,license:'MIT',collections:{Free:0,Premium:0},items:entries.map(({id,name,tier}) => ({id,name,tier,url:`/sources/${id}.json`}))},null,2));
console.log(`Prepared ${blocks.length} blocks and ${templates.length} templates with source manifests and ZIP starters.`);

execFileSync(process.execPath,['scripts/prepare-registry.mjs'],{cwd:root,stdio:'inherit'});

execFileSync(process.execPath,['scripts/prepare-api.mjs'],{cwd:root,stdio:'inherit'});

for(const kind of ['outline-http','react-hook-form']) {
  const files={...Object.fromEntries(Object.entries(outlineStarter).filter(([name])=>!name.startsWith('packages/'))),...packageFiles({blocks:['outline-http-demo'],examples:kind==='react-hook-form'?['examples/react-hook-form/project-form.tsx']:[]})};
  const manifest=JSON.parse(files['package.json']);manifest.name='bld8-'+kind+'-starter';
  if(kind==='react-hook-form')manifest.dependencies['react-hook-form']='7.90.0';
  files['package.json']=JSON.stringify(manifest,null,2);
  const config=JSON.parse(files['tsconfig.json']);config.compilerOptions.baseUrl='.';config.compilerOptions.paths={'@/*':['./*']};files['tsconfig.json']=JSON.stringify(config,null,2);
  files['lib/outline-demo-api.ts']=read('examples/outline-http/demo-api.ts');
  files['app/api/outline/[[...path]]/route.ts']=read('examples/outline-http/route.ts');
  if(kind==='react-hook-form'){
    files['components/project-form.tsx']=read('examples/react-hook-form/project-form.tsx');
    files['app/page.tsx']=`'use client';\nimport {RHFProjectExample} from '@/components/project-form';\nexport default function Page(){return <div className="bblocks-root"><RHFProjectExample /></div>}\n`;
  }else files['app/page.tsx']=`'use client';\nimport {OutlineHttpDemo} from '@bld8/blocks';\nexport default function Page(){return <OutlineHttpDemo />}\n`;
  files['README.md']=`# ${kind==='outline-http'?'Outline HTTP':'React Hook Form'} starter\n\nUse Node 22. Run npm install, then npm run dev and open localhost:3000. Both BLD8 collections are free under MIT.\n\nThis app includes a real JSON API example. Its process-local session data expires after inactivity or a server restart. It demonstrates validation, record versions, paging and retry; add authenticated ownership and database persistence for a real service. The sample session header is not authentication.\n\nEdit lib/outline-demo-api.ts to implement your server and packages/blocks/src/outline-http.ts to change the client contract. UI and blocks source and compiled packages are included. npm run build rebuilds them.\n\nKeep the included licences and notices.\n`;
  write(`apps/docs/public/downloads/${kind}.zip`,zip(files));
}

execFileSync(process.execPath,['scripts/prepare-source-release.mjs'],{cwd:root,stdio:'inherit'});
