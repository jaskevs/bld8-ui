import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import imports from 'lucide-react/dynamicIconImports.mjs';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const metadata=JSON.parse(readFileSync(join(root,'node_modules/lucide-react/package.json'),'utf8'));
const license=readFileSync(join(root,'node_modules/lucide-react/LICENSE'),'utf8');
const generated=join(root,'apps/docs/src/lib/generated');
const assets=join(root,'apps/docs/public/icon-assets');
const fingerprint=createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).update(metadata.version).digest('hex');
const cache=join(generated,'icons-meta.json');
if(existsSync(cache) && existsSync(join(generated,'icons.ts')) && existsSync(assets)) {
  const previous=JSON.parse(readFileSync(cache,'utf8'));
  if(previous.fingerprint===fingerprint && readdirSync(assets).length===previous.count*3+1) { console.log(`Lucide directory ready: ${previous.count} icons.`); process.exit(0); }
}
mkdirSync(generated,{recursive:true});mkdirSync(assets,{recursive:true});
function category(name) {
  for(const [label,expression] of [
    ['Navigation',/^(arrow|chevron|move|navigation|compass|corner|menu|panel|sidebar)/],
    ['Communication',/^(mail|message|phone|bell|contact|user|users|person|at-sign)/],
    ['Files',/^(file|folder|clipboard|book|notebook|archive|download|upload|save|copy)/],
    ['Development',/^(code|terminal|database|server|git|bug|braces|brackets|webhook|cpu|binary|bot)/],
    ['Media',/^(camera|image|video|music|mic|volume|headphone|play|pause|film|radio)/],
    ['Commerce',/^(shopping|store|wallet|credit|banknote|receipt|dollar|euro|pound|currency|coins|package|truck)/],
    ['Weather',/^(sun|moon|cloud|snow|wind|rain|thermometer|umbrella)/],
    ['Interface',/^(layout|grid|list|table|settings|sliders|search|filter|check|x$|plus|minus|circle|square|toggle|calendar|clock|lock|key|eye|info|help|shield)/],
  ]) if(expression.test(name)) return label;
  return 'General';
}
const entries=[];
for(const name of Object.keys(imports).sort()) {
  const module=await imports[name]();
  if(!module.__iconData) throw new Error(`Lucide ${metadata.version} has changed its icon metadata contract: ${name}`);
  if(module.__iconData.name!==name) continue;
  const exportName=module.default.displayName;
  if(!/^[A-Za-z][A-Za-z0-9]*$/.test(exportName)) throw new Error(`Unsupported icon export: ${name}`);
  entries.push({name,label:name.split('-').map(word => word[0].toUpperCase()+word.slice(1)).join(' '),exportName,category:category(name)});
  for(const strokeWidth of [1.5,1.75,2]) {
    const svg=renderToStaticMarkup(createElement(module.default,{size:24,strokeWidth,color:'#000',role:'img','aria-label':name,xmlns:'http://www.w3.org/2000/svg'}));
    writeFileSync(join(assets,`${name}-${strokeWidth}.svg`),`<!-- Lucide React ${metadata.version}. Original licence notices retained below.\n${license.replaceAll('--','—')}\n-->\n${svg}`);
  }
}
writeFileSync(join(assets,'LICENSE.txt'),license);
writeFileSync(join(generated,'icons.ts'),`// Generated from pinned Lucide ${metadata.version}; no icon JS is included in this metadata.\nexport const lucideVersion=${JSON.stringify(metadata.version)};\nexport const iconCatalog=${JSON.stringify(entries)};\n`);
writeFileSync(cache,JSON.stringify({fingerprint,count:entries.length}));
console.log(`Prepared ${entries.length} canonical Lucide icons, three stroke profiles and licence notices.`);
