import { spawn, execFileSync } from 'node:child_process';
import { watch, copyFileSync } from 'node:fs';
const compiler = 'node_modules/typescript/bin/tsc';
const config = 'packages/ui/tsconfig.json';
execFileSync(process.execPath, [compiler, '-p', config], { stdio: 'inherit' });
for (const file of ['styles.css','tokens.css']) copyFileSync('packages/ui/src/' + file, 'packages/ui/dist/' + file);
const types = spawn(process.execPath, [compiler, '-p', config, '--watch', '--preserveWatchOutput'], { stdio: 'inherit' });
const watcher = watch('packages/ui/src', (_event, filename) => { if (filename === 'styles.css' || filename === 'tokens.css') copyFileSync('packages/ui/src/' + filename, 'packages/ui/dist/' + filename); });
const docs = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', 'apps/docs', '--hostname', '127.0.0.1', '--port', '3120'], { stdio: 'inherit' });
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; watcher.close(); types.kill(); docs.kill(); process.exit(code); }
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop()); docs.on('exit', code => stop(code ?? 0));