import { copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const require=createRequire(import.meta.url);
if(!process.argv.includes('--copy-only')) {
  const cli=join(dirname(require.resolve('@tailwindcss/cli/package.json')),'dist/index.mjs');
  execFileSync(process.execPath,[cli,'--input','src/tailwind.css','--output','dist/tailwind.css','--minify'],{cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:'inherit'});
}
for (const file of ['styles.css', 'tokens.css']) await copyFile(new URL(`../src/${file}`, import.meta.url), new URL(`../dist/${file}`, import.meta.url));
