import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const directory=fileURLToPath(new URL('../',import.meta.url));
if(!process.argv.includes('--copy-only')) {
  const cli=join(dirname(require.resolve('@tailwindcss/cli/package.json')),'dist/index.mjs');
  execFileSync(process.execPath,[cli,'--input','src/tailwind.css','--output','dist/tailwind.css','--minify'],{cwd:directory,stdio:'inherit'});
}
await mkdir(join(directory,'dist'),{recursive:true});
// Flatten local control fragments for editable registry source. Tokens and the
// compiled utility sheet stay separate, so the installed CSS has three entries.
async function flatten(name,parents=[]) {
  if(!/^[a-z0-9-]+\.css$/.test(name)||parents.includes(name))throw Error('Invalid or cyclic local stylesheet import: '+name);
  let text=await readFile(join(directory,'src',name),'utf8');
  const imports=[...text.matchAll(/@import\s+['"]\.\/([a-z0-9-]+\.css)['"];?/g)];
  for(const match of imports)if(!['tokens.css','tailwind.css'].includes(match[1]))text=text.replace(match[0],await flatten(match[1],[...parents,name]));
  return text;
}
for(const name of (await readdir(join(directory,'src'))).filter(name=>name.endsWith('.css')&&name!=='tailwind.css'))await writeFile(join(directory,'dist',name),name==='styles.css'?await flatten(name):await readFile(join(directory,'src',name)));
