import {spawnSync} from 'node:child_process';
import {cpSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

// Run from any host OS; all builds and pixels stay inside this pinned Linux image.
const image = 'mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27';
const args = process.argv.slice(2);
if (args.length > 1 || args.some(arg => arg !== '--update')) {
  throw new Error('Usage: node quality-tests/run-linux.mjs [--update]');
}
const update = args.includes('--update');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const id = randomUUID();
const output = join(root, '.local', 'quality-linux', id);
mkdirSync(output, {recursive:true});
const script = `
set -euo pipefail
mkdir -p /work /opt/bld8-node22
# Do not mount host credentials or reuse Windows native dependencies/build output.
tar -C /source --exclude=node_modules --exclude=.git --exclude=.local --exclude='.env*' --exclude=.npmrc --exclude=.vercel --exclude=.next --exclude=dist --exclude=.cache --exclude=.turbo --exclude=coverage --exclude='.ssh' --exclude='.aws' --exclude='.codex' --exclude='.agents' --exclude='*.tgz' --exclude='*.zip' --exclude='*.pem' --exclude='*.key' --exclude=test-results --exclude=playwright-report --exclude=apps/docs/public/downloads --exclude=apps/docs/public/r --exclude=apps/docs/public/sources --exclude=apps/docs/public/icon-assets --exclude=apps/docs/src/lib/generated -cf - apps packages scripts examples quality-tests tests docs package.json package-lock.json playwright.config.ts playwright.quality.config.ts tsconfig.quality.json README.md CONTRIBUTING.md LICENSE SECURITY.md .gitignore | tar -xf - -C /work
cd /work
# The browser image currently includes Node 24. Use the repository's Node 22.
curl -fsSL https://nodejs.org/dist/v22.22.0/node-v22.22.0-linux-x64.tar.gz -o /tmp/node22.tar.gz
curl -fsSL https://nodejs.org/dist/v22.22.0/SHASUMS256.txt -o /tmp/node22-shasums.txt
grep ' node-v22.22.0-linux-x64.tar.gz$' /tmp/node22-shasums.txt | sed 's#node-v22.22.0-linux-x64.tar.gz#/tmp/node22.tar.gz#' | sha256sum --check -
tar -xzf /tmp/node22.tar.gz --strip-components=1 -C /opt/bld8-node22
export PATH=/opt/bld8-node22/bin:$PATH
node --version
npm ci --no-audit --no-fund
npm run typecheck:quality
npm run build
# Preserve failure diagnostics as well as successful reports on the host.
trap 'cp -a /work/test-results /output/ 2>/dev/null || true; cp -a /work/playwright-report /output/ 2>/dev/null || true' EXIT
${update ? "npx playwright test --config=playwright.quality.config.ts --project='visual-*' --update-snapshots=changed" : ''}
npx playwright test --config=playwright.quality.config.ts
${update ? 'cp -a /work/quality-tests/__screenshots__ /output/goldens' : ''}
`;
const result = spawnSync('docker', [
  'run', '--rm', '--ipc=host', '--platform=linux/amd64', '--name', `bld8-ui-quality-${id}`,
  '--env', 'CI=1', '--env', 'NEXT_TELEMETRY_DISABLED=1',
  '--mount', `type=bind,source=${root},target=/source,readonly`,
  '--mount', `type=bind,source=${output},target=/output`,
  image, 'bash', '-lc', script,
], {stdio:'inherit', shell:false});
console.log(`Quality reports: ${output}`);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
if (update) {
  // Only copy goldens after a complete comparison run passed without updating.
  cpSync(join(output, 'goldens'), join(root, 'quality-tests', '__screenshots__'), {recursive:true});
  console.log('Linux baselines updated and compared successfully. Review every changed PNG before committing.');
}
