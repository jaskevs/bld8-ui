import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createRequire} from 'node:module';
import {mkdtemp, mkdir, readFile, readdir, realpath, lstat, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, dirname, isAbsolute, join, relative, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {validateManifest,byteHash,createReceipt,planReceiptUpdate,manifestHash,sourceHash} from './source-release.mjs';
import {localReader} from './check-source-updates.mjs';
import {hasFullNotice,mitNotice} from './license-policy.mjs';
import {readComponentExamples} from './prepare-component-examples.mjs';
import {foundationExampleIds,checkInstalledFoundations} from './check-foundations.mjs';
import {inputVisualExampleIds,checkInstalledInputVisual} from './check-input-visual.mjs';
import {contentPlanningExampleIds,checkInstalledContentPlanning} from './check-content-planning.mjs';
import {checkEditingExamples} from './check-control-editing.mjs';
import {installedCompositionExampleIds,checkInstalledCompositionExamples} from './check-new-controls.mjs';
import {installedAdoptionExampleIds,checkInstalledAdoptionExamples} from './check-adoption-controls.mjs';
import {createGridEditorRaceFixture,checkGridEditorRaceFixture} from './grid-editor-race-fixture.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(join(root, 'package.json'));
const npm = process.env.npm_execpath;
assert.ok(npm, 'Run this check with npm run check:registry:consumers.');
assert.equal(process.versions.node.split('.')[0], '22', 'Use the supported Node 22 runtime.');
const frameworks = process.argv.slice(2);
if (!frameworks.length) frameworks.push('next', 'vite');
assert.ok(new Set(frameworks).size === frameworks.length && frameworks.every(value => ['next', 'vite'].includes(value)), 'Choose next, vite, or no arguments for both.');

// Exact CLI/Vite pins come from the previously verified consumer installations.
// Shared framework/type versions come from this checkout's npm ci installation.
const tools = {shadcn: '4.21.4', vite: '8.3.4'};
const installedVersion = name => require(`${name}/package.json`).version;
const sharedDependencies = Object.fromEntries(['react', 'react-dom'].map(name => [name, installedVersion(name)]));
const sharedDevDependencies = Object.fromEntries(['typescript', '@types/node', '@types/react', '@types/react-dom'].map(name => [name, installedVersion(name)]));
const {chromium, expect} = require('@playwright/test');
const typescript = require('typescript');
// Published checks use the real retained URLs without a loopback rewrite.
// Prepared candidates remain independently testable before publication.
const publishedVersion=process.env.BLD8_PUBLISHED_VERSION;
if(publishedVersion&&(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(publishedVersion)||process.env.BLD8_SOURCE_RELEASE))throw Error('Choose one valid published version or a local candidate.');
async function publishedBytes(path){
  const response=await fetch(`https://ui.bld8.dev/releases/${publishedVersion}/${path}`,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(60000)});
  assert.ok(response.ok,'Published artifact must be available: '+path);const bytes=Buffer.from(await response.arrayBuffer());assert.ok(bytes.length<=16*1024*1024,'Published artifact exceeds the check bound.');return bytes;
}
const releaseManifest=publishedVersion?validateManifest(JSON.parse((await publishedBytes('manifest.json')).toString('utf8'))):process.env.BLD8_SOURCE_RELEASE ? validateManifest(JSON.parse(await readFile(process.env.BLD8_SOURCE_RELEASE,'utf8'))) : undefined;
if(publishedVersion)assert.ok(releaseManifest.status==='released'&&releaseManifest.version===publishedVersion&&releaseManifest.registryBase===`https://ui.bld8.dev/releases/${publishedVersion}/r`,'Published manifest must identify that exact fixed version.');
const productionPrefix = releaseManifest ? releaseManifest.registryBase+'/' : 'https://ui.bld8.dev/r/';
const registryDirectory = publishedVersion?undefined:releaseManifest ? join(dirname(await realpath(process.env.BLD8_SOURCE_RELEASE)),'r') : join(root, 'apps/docs/public/r');
const originals = new Map();
const registryNames=publishedVersion?releaseManifest.items.map(item=>item.name+'.json'):await readdir(registryDirectory).catch(() => {throw new Error('Generated registry missing. Run npm run build before this check.');});
async function readRegistryItem(name){
  if (/^[a-z0-9-]+\.json$/.test(name)) {
    const bytes=publishedVersion?await publishedBytes('r/'+name):await readFile(join(registryDirectory,name));
    if(releaseManifest)assert.equal(byteHash(bytes),releaseManifest.artifacts.find(file=>file.path==='r/'+name)?.sha256,'Candidate registry artifact digest: '+name);
    originals.set(name,bytes);
  }
}
if(publishedVersion){for(let offset=0;offset<registryNames.length;offset+=8)await Promise.all(registryNames.slice(offset,offset+8).map(readRegistryItem));}
else for(const name of registryNames)await readRegistryItem(name);
assert.ok(originals.has('session-setup.json'), 'Build the current registry before checking consumers.');
const graph = new Set();
function visit(name) {
  if (graph.has(name)) return;
  graph.add(name);
  assert.ok(originals.has(name), `Missing registry dependency: ${name}`);
  const item = JSON.parse(originals.get(name));
  for (const dependency of item.registryDependencies ?? []) {
    assert.ok(dependency.startsWith(productionPrefix), `Expected a production dependency URL in ${name}: ${dependency}`);
    const target = dependency.slice(productionPrefix.length);
    assert.match(target, /^[a-z0-9-]+\.json$/);
    visit(target);
  }
}
visit('session-setup.json');
visit('theme-config.json');
visit('file-browser.json');
visit('chart.json');
visit('analytics-dashboard.json');
visit('windowed-table.json');
visit('table-grouping.json');
visit('large-issue-table.json');
visit('day-agenda.json');
visit('schedule-state.json');
visit('schedule-planner.json');
visit('outline.json');
const tableViewsAvailable=originals.has('table-view-state.json');
if(tableViewsAvailable){visit('table-view-state.json');visit('issue-table.json');}
const dataWorkspaceAvailable=originals.has('data-workspace.json');
// New control files identify the 0.3 source API; retained 0.2 consumers keep their original fixture.
const coreControlNames=['toggle-group','tag-input','range-slider','otp-input'];
const availableCoreControls=coreControlNames.filter(name=>originals.has(name+'.json'));
const richCoreControlsAvailable=coreControlNames.every(name=>originals.has(name+'.json'))&&originals.has('select.json')&&originals.has('dropdown.json');
const coreControlInstallItems=[...availableCoreControls,...(richCoreControlsAvailable?['select','dropdown']:[])];
const editingExampleIds=new Set(['date-entry-lifecycle','date-range-presets','date-controlled-entry','tree-select-native','tree-select-lazy','grid-editor-mixed','grid-editor-custom']);
const installedEditingExamples=originals.has('tree-select.json')?readComponentExamples(root).filter(item=>editingExampleIds.has(item.id)):[];
if(originals.has('tree-select.json'))assert.equal(installedEditingExamples.length,editingExampleIds.size,'The current editing controls need all complete installation examples.');
const editingInstallItems=installedEditingExamples.length?['tree-select','date-picker','date-range','data-grid']:[];
const editingModules=[...new Set(installedEditingExamples.flatMap(item=>item.modules))].map(name=>'bld8-'+name);
// New examples are installed through their real public registry entries. Retained
// releases without this family retain their original consumer fixture and graph.
const compositionControls=['autocomplete','toolbar','alert-dialog','navigation-menu','preview-card'];
const compositionExamplesAvailable=compositionControls.every(name=>originals.has(name+'.json'));
const adoptionAvailable=originals.has('faceted-filter.json')&&originals.has('checkbox-group.json');
const foundationsAvailable=originals.has('resizable-panels.json')&&originals.has('donut-chart.json');
const expansionAvailable=originals.has('import-wizard.json');
if(expansionAvailable)for(const id of [...inputVisualExampleIds,...contentPlanningExampleIds])assert.ok(originals.has('example-'+id+'.json'),'A complete expansion example is missing: '+id);
const compositionExampleIds=[...(expansionAvailable?[...inputVisualExampleIds,...contentPlanningExampleIds]:[]),...(foundationsAvailable?foundationExampleIds:[]),...installedCompositionExampleIds,...(adoptionAvailable?installedAdoptionExampleIds:[])];
const installedCompositionExamples=compositionExamplesAvailable?readComponentExamples(root).filter(item=>compositionExampleIds.includes(item.id)):[];
if(compositionExamplesAvailable)assert.equal(installedCompositionExamples.length,compositionExampleIds.length,'All representative new controls and workflow examples must be available.');
const compositionInstallItems=installedCompositionExamples.map(item=>item.registryName);
for(const name of compositionInstallItems){assert.match(name,/^example-[a-z0-9-]+$/);visit(name+'.json');}

const extendedControls=['async-combobox','async-multi-select','cascader','event-calendar','calendar-workspace','upload-queue','upload-http','data-grid','data-workspace-state','data-workspace'].filter(name=>originals.has(name+'.json'));
for(const name of [...extendedControls,...coreControlInstallItems,...editingInstallItems,...editingModules])visit(name+'.json');
assert.ok(graph.size > 11, 'The representative workflow must install its transitive graph.');

const temporaryParent = await realpath(tmpdir());
const workspace = await mkdtemp(join(temporaryParent, 'bld8-registry-consumers-'));
console.log(`Checking ${frameworks.join(' + ')} registry consumers in ${workspace}`);
const env = {...process.env};
const cache = Object.entries(env).find(([name]) => name.toLowerCase() === 'npm_config_cache')?.[1];
for (const name of Object.keys(env)) {
  if (/^npm_config_/i.test(name) || /^(NPM_TOKEN|NODE_AUTH_TOKEN|GH_TOKEN|GITHUB_TOKEN|BLD8_RELEASE_TOKEN)$/i.test(name)) delete env[name];
}
Object.assign(env, {
  npm_config_userconfig: join(workspace, 'user.npmrc'),
  npm_config_globalconfig: join(workspace, 'global.npmrc'),
  npm_config_registry: 'https://registry.npmjs.org/',
  npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false', npm_config_prefer_offline: 'true',
  NEXT_TELEMETRY_DISABLED: '1',
});
if (cache) env.npm_config_cache = cache;

// Async children keep the loopback registry responsive while the real CLI runs.
async function run(args, cwd) {
  console.log(`\n[${basename(cwd)}] npm ${args.join(' ')}`);
  const child = spawn(process.execPath, [npm, ...args], {cwd, env, stdio: 'inherit', timeout: 10 * 60 * 1000});
  const [code, signal] = await once(child, 'exit');
  assert.equal(code, 0, `npm ${args[0]} failed${signal ? ` (${signal})` : ` with exit ${code}`}`);
}
async function write(folder, name, content) {
  const target = join(folder, name);
  await mkdir(dirname(target), {recursive: true});
  await writeFile(target, typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
}

const requests = new Set();
let origin;
const installOrigin=()=>publishedVersion?`https://ui.bld8.dev/releases/${publishedVersion}`:origin;
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://127.0.0.1').pathname;
  const match = /^\/r\/([a-z0-9-]+\.json)$/.exec(path);
  if (request.method !== 'GET' || !match || !originals.has(match[1])) {
    response.writeHead(404).end();
    return;
  }
  const item = JSON.parse(originals.get(match[1]));
  if (item.registryDependencies) item.registryDependencies = item.registryDependencies.map(url => {
    assert.ok(url.startsWith(productionPrefix), `Unexpected dependency URL: ${url}`);
    return `${origin}/r/${url.slice(productionPrefix.length)}`;
  });
  requests.add(match[1]);
  response.writeHead(200, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'});
  response.end(JSON.stringify(item));
});

const themeConfig = framework => ({
  accent: '#4768d8', primary: '#314b3f', typography: 'system',
  radius: framework === 'next' ? 9 : 10, density: 'compact', shadow: 'flat',
});

async function exportConsumerTheme(target, uiDirectory, framework) {
  // Evaluate only the installed pure source, with the checkout's existing TS
  // compiler. The fixture consumes the resulting ordinary CSS, not lab state.
  const source = await readFile(join(uiDirectory, 'theme-config.ts'), 'utf8');
  const compiled = typescript.transpileModule(source, {
    compilerOptions: {module: typescript.ModuleKind.ES2022, target: typescript.ScriptTarget.ES2022},
    reportDiagnostics: true,
  });
  assert.ok(!compiled.diagnostics?.some(item => item.category === typescript.DiagnosticCategory.Error), 'Installed theme helper must transpile independently.');
  const modulePath = join(target, 'installed-theme-helper.mjs');
  await writeFile(modulePath, compiled.outputText);
  const helper = await import(pathToFileURL(modulePath).href);
  const config = {...helper.DEFAULT_THEME, ...themeConfig(framework)};
  assert.deepEqual(helper.parseThemeConfig(helper.serializeThemeConfig(config)), config, 'Installed theme configuration must round-trip.');
  const css = helper.exportThemeCss(config);
  assert.match(css, /\.bld8-theme\[data-ui-theme="dark"\]/);
  await write(target, framework === 'next' ? 'app/theme.css' : 'src/theme.css', css);
  return {config, light: helper.getThemeTokens(config, 'light'), dark: helper.getThemeTokens(config, 'dark')};
}

async function stopServer(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  const exit = once(child, 'exit');
  child.kill('SIGTERM');
  const timeout = setTimeout(() => child.kill('SIGKILL'), 5000);
  try { await exit; } finally { clearTimeout(timeout); }
}

async function checkThemeInBrowser(browser, target, framework, theme) {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise((done, reject) => reservation.close(error => error ? reject(error) : done()));
  const args = framework === 'next'
    ? [join(target, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)]
    : [join(target, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'];
  const child = spawn(process.execPath, args, {cwd: target, env, stdio: ['ignore', 'pipe', 'pipe']});
  let output = '', startupError;
  child.on('error', error => {startupError = error;});
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {output = (output + chunk).slice(-8000);});
  const url = `http://127.0.0.1:${port}`;
  const rgb = hex => `rgb(${[1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16)).join(', ')})`;
  try {
    const deadline = Date.now() + 45000;
    while (true) {
      if (startupError) throw startupError;
      assert.equal(child.exitCode, null, `Consumer server exited before readiness:\n${output}`);
      if (await fetch(url, {signal: AbortSignal.timeout(1500)}).then(response => response.ok).catch(() => false)) break;
      assert.ok(Date.now() < deadline, `Consumer server did not become ready:\n${output}`);
      await delay(100);
    }
    for (const mode of ['light', 'dark']) {
      const context = await browser.newContext({viewport: {width: 1280, height: 1000}, colorScheme: mode, reducedMotion: 'reduce'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.goto(url);
        const input = page.getByRole('textbox', {name: 'Workspace name', exact: true});
        await expect(input).toBeEnabled();
        await page.evaluate(value => {document.documentElement.dataset.uiTheme = value;}, mode);
        await page.mouse.move(0, 0);
        if(dataWorkspaceAvailable){
          const workspace=page.getByRole('region',{name:'Data workspace',exact:true});
          const cell=workspace.locator('[data-row-id="ISS-101"][data-column-key="title"]');
          await expect(cell).toBeVisible();await cell.focus();await page.keyboard.press('Enter');
          const editor=workspace.getByRole('textbox',{name:'Title for ISS-101',exact:true});
          await editor.fill('Installed source batch');await editor.press('Enter');
          await workspace.getByRole('button',{name:'Review changes',exact:true}).click();
          const review=page.getByRole('dialog',{name:'Review pending changes',exact:true});
          await review.getByRole('button',{name:'Save 1 record',exact:true}).click();
          await expect(review).not.toBeVisible();await expect(cell).toContainText('Installed source batch');
        }
        const tokens = theme[mode], radius = `${theme.config.radius}px`;
        const html = page.locator('html');
        await expect(html).toHaveClass('bld8-theme');
        await expect(html).toHaveAttribute('data-ui-theme', mode);
        const custom = await html.evaluate(element => {
          const css = getComputedStyle(element);
          return Object.fromEntries(['--bui-accent', '--bui-primary', '--bui-radius', '--bui-control-md', '--bui-shadow', '--bui-font'].map(name => [name, css.getPropertyValue(name).trim()]));
        });
        assert.equal(custom['--bui-accent'], theme.config.accent);
        assert.equal(custom['--bui-primary'], theme.config.primary);
        assert.equal(custom['--bui-radius'], radius);
        assert.equal(custom['--bui-control-md'], '40px');
        assert.equal(custom['--bui-shadow'], 'none');
        assert.match(custom['--bui-font'], /^system-ui/);
        await expect(html).toHaveCSS('color-scheme', mode);
        await expect(page.locator('body')).toHaveCSS('background-color', rgb(tokens['--bui-canvas']));
        const accent = page.getByRole('button', {name: 'Theme accent', exact: true});
        const primary = page.getByRole('button', {name: 'Theme primary', exact: true});
        const numberGroup = page.locator('.bui-number-group').first();
        await expect(accent).toHaveCSS('background-color', rgb(theme.config.accent));
        await expect(primary).toHaveCSS('background-color', rgb(theme.config.primary));
        await expect(accent).toHaveCSS('background-image', 'none');
        await expect(primary).toHaveCSS('background-image', 'none');
        for (const control of [accent, primary, input, numberGroup]) {
          await expect(control).toHaveCSS('border-top-left-radius', radius);
          await expect(control).toHaveCSS('min-height', '40px');
          await expect(control).toHaveCSS('font-family', /system-ui/);
          await expect(control).toHaveCSS('box-shadow', 'none');
          const height = (await control.boundingBox()).height;
          assert.ok(Math.abs(height - 40) < 0.1, `Compact installed control height must be 40px; got ${height}.`);
        }
        await expect(input).toHaveCSS('background-color', rgb(tokens['--bui-bg']));
        await expect(numberGroup).toHaveCSS('background-color', rgb(tokens['--bui-bg']));
        await page.keyboard.press('Tab');
        await input.focus();
        await expect(input).toBeFocused();
        await expect(input).toHaveCSS('border-top-color', rgb(tokens['--bui-focus']));
        await expect(input).toHaveCSS('box-shadow', `${rgb(tokens['--bui-focus'])} 0px 0px 0px 1px`);
        await input.fill('Independent theme consumer');
        await page.getByRole('button', {name: 'Continue', exact: true}).click();
        await expect(page.getByRole('heading', {name: 'Session preferences.', exact: true})).toBeFocused();
        const trigger = page.getByRole('button', {name: 'Open theme dialog', exact: true});
        await trigger.click();
        await page.mouse.move(0, 0);
        const dialog = page.getByRole('dialog', {name: 'Installed theme portal', exact: true});
        await expect(dialog).toBeVisible();
        assert.ok(await dialog.evaluate(element => document.body.contains(element) && !document.querySelector('[data-consumer-content]')?.contains(element)), 'The dialog must portal outside the content wrapper.');
        await expect(dialog).toHaveCSS('background-color', rgb(tokens['--bui-bg']));
        await expect(dialog).toHaveCSS('border-top-left-radius', `${theme.config.radius + 8}px`);
        await expect(dialog).toHaveCSS('box-shadow', 'none');
        await expect(dialog).toHaveCSS('font-family', /system-ui/);
        await expect(dialog.getByRole('button', {name: 'Portal accent', exact: true})).toHaveCSS('background-color', rgb(theme.config.accent));
        await expect(dialog.getByRole('button', {name: 'Portal primary', exact: true})).toHaveCSS('background-color', rgb(theme.config.primary));
        await expect(dialog.getByRole('button', {name: 'Portal accent', exact: true})).toHaveCSS('border-top-left-radius', radius);
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await expect(trigger).toBeFocused();
        await checkCoreConsumerControls(page);
        if(installedEditingExamples.length){await checkEditingExamples(page,id=>page.locator('[data-installed-editing="'+id+'"]'));await checkGridEditorRaceFixture(page);}
        if(installedCompositionExamples.length)await checkInstalledCompositionExamples(page,id=>page.locator('[data-installed-composition="'+id+'"]'));
        if(adoptionAvailable)await checkInstalledAdoptionExamples(page,id=>page.locator('[data-installed-composition="'+id+'"]'));
        if(foundationsAvailable)await checkInstalledFoundations(page,id=>page.locator('[data-installed-composition="'+id+'"]'));
        if(expansionAvailable){await checkInstalledInputVisual(page,id=>page.locator('[data-installed-composition="'+id+'"]'));await checkInstalledContentPlanning(page,id=>page.locator('[data-installed-composition="'+id+'"]'));}
        const files = page.getByRole('region', {name:'Installed file browser',exact:true});
        const tree = files.getByRole('tree',{name:'Workspace folders',exact:true});
        await expect(tree).toBeVisible();
        const archive = tree.getByRole('treeitem',{name:'Archive',exact:true});
        await archive.click();
        await expect(files.getByRole('button',{name:'Inspect archived-brief.pdf',exact:true})).toBeVisible();
        await files.getByRole('button',{name:'Inspect archived-brief.pdf',exact:true}).click();
        await expect(files.getByRole('heading',{name:'archived-brief.pdf',exact:true})).toBeVisible();
        await expect(files.getByRole('searchbox',{name:'Search this folder',exact:true})).toHaveCSS('font-family', /system-ui/);
        const analytics = page.getByRole('region', {name:'Installed analytics',exact:true});
        await expect(analytics.getByRole('button', {name:'Export report CSV',exact:true})).toBeEnabled();
        const points = analytics.getByRole('group', {name:'Request activity observations',exact:true});
        const firstPoint = points.getByRole('button').first();
        await firstPoint.focus();
        await firstPoint.press('End');
        await expect(points.getByRole('button').last()).toBeFocused();
        await analytics.getByRole('button', {name:'Show data',exact:true}).click();
        await expect(analytics.getByRole('table', {name:'Request activity data',exact:true})).toBeVisible();
        assert.ok(await analytics.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Installed analytics must fit its container.');
        const windowed = page.getByRole('region', {name:'Installed windowed table',exact:true});
        const largeTable = windowed.getByRole('table', {name:'Installed queue',exact:true});
        await expect(largeTable).toHaveAttribute('aria-rowcount','243');
        assert.ok(await largeTable.locator('tr[data-windowed-id]').count()<30,'Installed table must mount a bounded window, not all supplied records.');
        const firstRow=largeTable.locator('tr[data-windowed-id="row:C-000"]');
        await firstRow.focus();
        await firstRow.press('End');
        const lastRow=largeTable.locator('tr[data-windowed-id="row:C-239"]');
        await expect(lastRow).toBeFocused();
        await expect(lastRow).toHaveAttribute('aria-rowindex','243');
        await lastRow.press('Space');
        await expect(windowed.getByRole('status',{name:'Installed selection',exact:true})).toHaveText('1 selected');
        await lastRow.press('Home');
        const currentGroup=largeTable.locator('tr[data-windowed-id="group:Current"]');
        await expect(currentGroup).toBeFocused();
        await windowed.getByRole('checkbox',{name:'Select all Current records',exact:true}).check();
        await expect(windowed.getByRole('status',{name:'Installed selection',exact:true})).toHaveText('121 selected');
        await windowed.getByRole('button',{name:'Collapse Current group (120 records)',exact:true}).click();
        await expect(largeTable).toHaveAttribute('aria-rowcount','123');
        await expect(windowed.getByRole('status',{name:'Installed selection',exact:true})).toHaveText('121 selected');
        const issues = page.getByRole('region',{name:'Installed large issue block',exact:true});
        await expect(issues.getByText('80 of 80 issues',{exact:true})).toBeVisible();
        await issues.getByRole('checkbox',{name:'Select ISS-10001',exact:true}).check();
        await issues.getByRole('button',{name:'Open ISS-10001',exact:true}).click();
        const issueDetails=page.getByRole('dialog',{name:'Issue details',exact:true});
        await expect(issueDetails).toBeVisible();
        await issueDetails.getByRole('textbox',{name:'Issue title',exact:true}).fill('Installed source edit');
        await issueDetails.getByRole('button',{name:'Save issue',exact:true}).click();
        await expect(issueDetails).not.toBeVisible();
        await expect(issues.getByText('ISS-10001 updated.',{exact:true})).toBeVisible();
        await issues.getByRole('button',{name:'Pages',exact:true}).click();
        await expect(issues.getByRole('checkbox',{name:'Select ISS-10001',exact:true})).toBeChecked();
        await expect(issues.getByRole('button',{name:'Inspect ISS-10001',exact:true})).toHaveText('Installed source edit');
        assert.ok(await issues.getByRole('table',{name:'Large issues',exact:true}).getByRole('row').count()<25,'Paged issue view must remain bounded.');
        const outline=page.getByRole('region',{name:'Installed Outline',exact:true});
        await outline.getByRole('button',{name:'Actions for Keyboard review',exact:true}).click();
        await page.getByRole('menuitem',{name:'Edit project',exact:true}).click();
        const projectDetails=page.getByRole('dialog',{name:'Edit project',exact:true});
        await expect(projectDetails).toBeVisible();
        await expect(projectDetails).toHaveCSS('background-color',rgb(tokens['--bui-bg']));
        await projectDetails.getByRole('textbox',{name:'Notes to self',exact:true}).fill('Installed source recovery.');
        await projectDetails.getByRole('button',{name:'Cancel',exact:true}).click();
        await projectDetails.getByRole('button',{name:'Keep draft & close',exact:true}).click();
        await expect(projectDetails).not.toBeVisible();
        await outline.getByRole('button',{name:'Actions for Keyboard review',exact:true}).click();
        await page.getByRole('menuitem',{name:'Edit project',exact:true}).click();
        await expect(projectDetails.getByRole('textbox',{name:'Notes to self',exact:true})).toHaveValue('Installed source recovery.');
        await projectDetails.getByRole('button',{name:'Save project',exact:true}).click();
        await expect(projectDetails).not.toBeVisible();
        await outline.getByRole('button',{name:'Actions for Keyboard review',exact:true}).click();
        await page.getByRole('menuitem',{name:'Edit project',exact:true}).click();
        const projectActivity=projectDetails.getByRole('region',{name:'Project activity',exact:true});
        await projectActivity.getByRole('textbox',{name:'Add a comment',exact:true}).fill('Installed source activity.');
        await projectActivity.getByRole('button',{name:'Post comment',exact:true}).click();
        await expect(projectActivity.getByText('Comment added.',{exact:true})).toBeVisible();
        await expect(projectActivity.getByRole('textbox',{name:'Add a comment',exact:true})).toBeFocused();
        await projectDetails.getByRole('button',{name:'Cancel',exact:true}).click();
        await expect(projectDetails).not.toBeVisible();
        await outline.getByRole('checkbox',{name:'Select Keyboard review',exact:true}).check();
        await outline.getByRole('button',{name:'Archive',exact:true}).click();
        await expect(outline.getByRole('button',{name:'Undo status change',exact:true})).toBeVisible();
        await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='bld8-outline-projects-v1'){Storage.prototype.setItem=original;throw new DOMException('Full','QuotaExceededError');}return original.call(this,key,value);};});
        await outline.getByRole('button',{name:'Undo status change',exact:true}).click();
        await expect(outline.getByRole('alert')).toContainText('Browser storage is unavailable or full.');
        await expect(outline.getByRole('button',{name:'Undo status change',exact:true})).toBeFocused();
        await outline.getByRole('button',{name:'Undo status change',exact:true}).click();
        await expect(outline).toContainText('1 project status restored.');
        const schedule=page.getByRole('region',{name:'Installed schedule',exact:true});
        const availability=schedule.getByRole('group',{name:'Choose an available time',exact:true});
        await expect(availability.getByRole('button').first()).toBeEnabled();
        await expect(availability).toContainText('UTC+11:00');
        await availability.getByRole('button').first().click();
        const booking=page.getByRole('dialog',{name:'Book a time',exact:true});
        await expect(booking).toBeVisible();
        const appointmentTitle=booking.getByRole('textbox',{name:'Appointment title',exact:true});
        await expect(appointmentTitle).toBeFocused();
        await appointmentTitle.fill('Installed appointment');
        await booking.getByRole('button',{name:'Book appointment',exact:true}).click();
        await expect(booking).not.toBeVisible();
        await expect(schedule.getByText('Installed appointment booked.',{exact:true})).toBeVisible();
        const bookedAppointment=schedule.getByRole('button',{name:'View Installed appointment',exact:true});
        await expect(bookedAppointment).toBeVisible();await bookedAppointment.click();
        const appointmentDetails=page.getByRole('dialog',{name:'Appointment details',exact:true});
        await expect(appointmentDetails).toBeVisible();
        await expect(appointmentDetails.locator('time').first()).toHaveAttribute('datetime','2026-11-01T22:00:00.000Z');
        await expect(appointmentDetails).toContainText('UTC+11:00');
        await page.keyboard.press('Escape');await expect(appointmentDetails).not.toBeVisible();
        assert.ok(await schedule.evaluate(element=>element.scrollWidth<=element.clientWidth+1),'Installed schedule must fit its container.');
        assert.deepEqual(errors, [], framework+'/'+mode+' must have no uncaught browser errors.');
        console.log(`${framework}/${mode}: exported CSS colours, radius, compact controls, system font, flat shadows, focus, portal inheritance, windowed keyboard/group selection, shared issue editing and UTC appointment booking passed.`);
      } finally { await context.close(); }
    }
  } finally { await stopServer(child); }
}


function coreConsumerFixture(alias) {
  if(!availableCoreControls.length)return {imports:'',source:''};
  const has=name=>availableCoreControls.includes(name);
  const imports=availableCoreControls.map(name=>{
    const exported={'toggle-group':'ToggleGroup','tag-input':'TagInput','range-slider':'RangeSlider','otp-input':'OTPInput'}[name];
    return "import {"+exported+"} from '"+alias+"/"+name+"';";
  });
  if(richCoreControlsAvailable)imports.push("import {Select} from '"+alias+"/controls';","import {DropdownMenu} from '"+alias+"/overlays';");
  const names=[...(has('toggle-group')?['consumerAlignment']:[]),...(has('tag-input')?['consumerTopics']:[]),...(has('range-slider')?['consumerBudget']:[]),...(has('otp-input')?['consumerCode']:[]),...(richCoreControlsAvailable?['consumerDestination']:[])];
  const fields=[
    has('toggle-group')?'<ToggleGroup label="Installed alignment" name="consumerAlignment" defaultValue={["left"]} required options={[{value:"left",label:"Installed align left"},{value:"center",label:"Installed align center"},{value:"right",label:"Installed align right",disabled:true}]}/>':'',
    has('tag-input')?'<TagInput label="Installed topics" name="consumerTopics" defaultValue={["React"]} required maxTags={3}/>':'',
    has('range-slider')?'<RangeSlider label="Installed budget" name="consumerBudget" defaultValue={[20,80]} min={0} max={100} step={5} minGap={10} thumbLabels={["Installed minimum budget","Installed maximum budget"]}/>':'',
    has('otp-input')?'<OTPInput label="Installed code" name="consumerCode" length={4} defaultValue="12" required showSlots/>':'',
    richCoreControlsAvailable?'<Select label="Installed destination" name="consumerDestination" value={destination} onValueChange={setDestination} clearable options={[{value:"preview-node",label:"Preview node",group:"Delivery",description:"Checks before a release."},{value:"primary-node",label:"Primary node",group:"Delivery",description:"The live deployment destination."},{value:"retired-node",label:"Retired node",group:"History",disabled:true}]}/>':''
  ].filter(Boolean).join('\n');
  const menu=richCoreControlsAvailable?'<DropdownMenu trigger={<Button variant="secondary">Installed options</Button>} items={[{type:"checkbox",label:"Installed show labels",checked:showLabels,onCheckedChange:setShowLabels},{type:"radio-group",label:"Installed row spacing",value:spacing,onValueChange:setSpacing,items:[{value:"compact",label:"Installed compact rows"},{value:"comfortable",label:"Installed comfortable rows"}]},{type:"separator"},{type:"submenu",label:"Move installed record",items:[{label:"Installed inbox",onSelect:()=>setLocation("inbox")},{label:"Installed review queue",onSelect:()=>setLocation("review")}]}]}/><p role="status" aria-label="Installed menu state">{(showLabels?"labels on":"labels off")+" · "+spacing+" · "+location}</p>':'';
  return {imports:imports.join('\n'),source:
    'function InstalledCoreControls(){\n'+
    'const [values,setValues]=useState("Not read");const [destination,setDestination]=useState<string|null>("preview-node");const [showLabels,setShowLabels]=useState(true);const [spacing,setSpacing]=useState("comfortable");const [location,setLocation]=useState("inbox");\n'+
    'return <section aria-label="Installed core controls" style={{display:"grid",gap:16,marginBottom:32,maxWidth:560}}><h2>Installed core controls</h2><form style={{display:"grid",gap:16}} onReset={()=>{setValues("Not read");setDestination("preview-node");}} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setValues(JSON.stringify(Object.fromEntries('+JSON.stringify(names)+'.map(name=>[name,data.getAll(name).map(String)]))));}}>'+fields+'<div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Button type="submit">Read installed control values</Button><Button type="reset" variant="secondary">Reset installed controls</Button></div><output aria-label="Installed control values">{values}</output></form>'+menu+'</section>;\n}\n'};
}

async function checkCoreConsumerControls(page) {
  if(!availableCoreControls.length)return;
  const has=name=>availableCoreControls.includes(name),surface=page.getByRole('region',{name:'Installed core controls',exact:true}),expected={};
  await expect(surface).toBeVisible();
  if(has('toggle-group')){
    const left=surface.getByRole('button',{name:'Installed align left',exact:true}),center=surface.getByRole('button',{name:'Installed align center',exact:true});
    await left.focus();await left.press('ArrowRight');await expect(center).toBeFocused();await center.press('Space');await expect(center).toHaveAttribute('aria-pressed','true');
    await expect(surface.getByRole('button',{name:'Installed align right',exact:true})).toBeDisabled();expected.consumerAlignment=['center'];
  }
  if(has('tag-input')){
    const input=surface.getByRole('textbox',{name:'Installed topics',exact:true});await input.fill('TypeScript');await input.press('Enter');
    await expect(surface.getByRole('list',{name:'Installed topics tags',exact:true}).getByRole('listitem')).toHaveCount(2);await expect(surface.getByLabel('Installed control values')).toHaveText('Not read');
    expected.consumerTopics=['React','TypeScript'];
  }
  if(has('range-slider')){
    const lower=surface.getByRole('slider',{name:'Installed minimum budget',exact:true});await lower.focus();await lower.press('ArrowRight');await expect(lower).toHaveValue('25');
    await expect(surface.getByRole('slider',{name:'Installed maximum budget',exact:true})).toHaveValue('80');expected.consumerBudget=['25','80'];
  }
  if(has('otp-input')){
    const code=surface.getByRole('textbox',{name:'Installed code',exact:true});await expect(code).toHaveAttribute('autocomplete','one-time-code');await expect(code).toHaveAttribute('inputmode','numeric');
    await code.fill('1234');await code.evaluate(input=>input.setSelectionRange(1,3));await code.press('Backspace');await expect(code).toHaveValue('14');await code.fill('4321');expected.consumerCode=['4321'];
  }
  if(richCoreControlsAvailable){
    const destination=surface.getByRole('combobox',{name:'Installed destination',exact:true});await destination.click();
    const primary=page.getByRole('option',{name:'Primary node',exact:true});await expect(primary).toHaveAccessibleDescription('The live deployment destination.');await expect(page.getByRole('option',{name:'Retired node',exact:true})).toHaveAttribute('aria-disabled','true');
    await primary.click();await expect(destination).toBeFocused();expected.consumerDestination=['primary-node'];
    const trigger=surface.getByRole('button',{name:'Installed options',exact:true});await trigger.focus();await trigger.press('ArrowDown');
    const labels=page.getByRole('menuitemcheckbox',{name:'Installed show labels',exact:true});await expect(labels).toBeFocused();await labels.press('Space');await expect(labels).toHaveAttribute('aria-checked','false');
    const compact=page.getByRole('menuitemradio',{name:'Installed compact rows',exact:true});await compact.focus();await compact.press('Space');await expect(compact).toHaveAttribute('aria-checked','true');
    await page.getByRole('menuitem',{name:'Move installed record',exact:true}).focus();await page.keyboard.press('ArrowRight');const submenu=page.getByRole('menu',{name:'Move installed record',exact:true});
    await expect(submenu).toBeVisible();await submenu.getByRole('menuitem',{name:'Installed review queue',exact:true}).click();await expect(trigger).toBeFocused();
    await expect(surface.getByRole('status',{name:'Installed menu state',exact:true})).toHaveText('labels off · compact · review');
  }
  await surface.getByRole('button',{name:'Read installed control values',exact:true}).click();
  await expect(surface.getByLabel('Installed control values')).toHaveText(JSON.stringify(expected));
  await surface.getByRole('button',{name:'Reset installed controls',exact:true}).click();await expect(surface.getByLabel('Installed control values')).toHaveText('Not read');
  if(has('toggle-group'))await expect(surface.getByRole('button',{name:'Installed align left',exact:true})).toHaveAttribute('aria-pressed','true');
  if(has('tag-input')){await expect(surface.getByRole('button',{name:'Remove React',exact:true})).toBeVisible();await expect(surface.getByRole('button',{name:'Remove TypeScript',exact:true})).toHaveCount(0);}
  if(has('range-slider'))await expect(surface.getByRole('slider',{name:'Installed minimum budget',exact:true})).toHaveValue('20');
  if(has('otp-input'))await expect(surface.getByRole('textbox',{name:'Installed code',exact:true})).toHaveValue('12');
  if(richCoreControlsAvailable)await expect(surface.getByRole('combobox',{name:'Installed destination',exact:true})).toContainText('Preview node');
  assert.ok(await surface.evaluate(element=>element.scrollWidth<=element.clientWidth+1),'Installed core controls must fit their source consumer container.');
}

async function prepare(framework, lean=false) {
  const target = join(workspace, (lean?'lean-':'')+framework);
  const next = framework === 'next';
  const alias = next ? '@/components/ui/bld8' : '~/ui/bld8';
  const manifest = {
    name: `bld8-registry-check-${framework}`, private: true, type: 'module',
    scripts: {build: next ? 'next build' : 'tsc --noEmit && vite build'},
    dependencies: {...sharedDependencies, ...(next ? {next: installedVersion('next')} : {})},
    devDependencies: {...sharedDevDependencies, ...(!next ? {vite: tools.vite} : {})},
  };
  await write(target, 'package.json', manifest);
  await write(target, 'components.json', {
    $schema: 'https://ui.shadcn.com/schema.json', style: 'new-york', rsc: next, tsx: true,
    tailwind: {config: '', css: next ? 'app/globals.css' : 'src/style.css', baseColor: 'neutral', cssVariables: true},
    aliases: next
      ? {components: '@/components', ui: '@/components/ui', utils: '@/lib/utils', lib: '@/lib', hooks: '@/hooks'}
      : {components: '~/components', ui: '~/ui', utils: '~/lib/utils', lib: '~/lib', hooks: '~/hooks'},
  });
  await write(target, 'tsconfig.json', {
    compilerOptions: {
      target: 'ES2020', lib: ['dom', 'dom.iterable', 'esnext'], skipLibCheck: true, strict: true,
      noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler',
      resolveJsonModule: true, isolatedModules: true, jsx: 'react-jsx', baseUrl: '.',
      paths: next ? {'@/*': ['./*']} : {'~/*': ['./src/*']},
      ...(next ? {plugins: [{name: 'next'}], allowJs: true, incremental: true} : {}),
    },
    include: next ? ['**/*.ts', '**/*.tsx', '.next/types/**/*.ts', '.next/dev/types/**/*.ts'] : ['src', 'vite.config.ts'],
    exclude: ['node_modules'],
  });
  const {imports:coreImports,source:coreSource}=coreConsumerFixture(alias);
  const compositionImports=!lean?installedCompositionExamples.map((item,index)=>'import {'+item.exportName+' as InstalledComposition'+index+'} from '+JSON.stringify(alias+'/examples/'+item.id)+';').join('\n'):'';
  const compositionSource=!lean?installedCompositionExamples.map((item,index)=>'<section data-installed-composition="'+item.id+'" style={{marginBottom:32,maxWidth:680}}><h2>'+item.title+'</h2><InstalledComposition'+index+'/></section>').join(''):'';

  const editingRace=!lean&&installedEditingExamples.length?createGridEditorRaceFixture(alias):{imports:'',source:'',element:''};
  let editingImports='',editingSource='';
  if(!lean&&installedEditingExamples.length){
    for(const [index,item] of installedEditingExamples.entries()){
      const imported='./installed-editing/'+item.id;
      editingImports+='import {'+item.exportName+' as InstalledEditing'+index+'} from '+JSON.stringify(imported)+';\n';
      editingSource+='<section data-installed-editing="'+item.id+'"><InstalledEditing'+index+'/></section>';
      await write(target,(next?'app':'src')+'/installed-editing/'+item.id+'.tsx',item.registrySource.replaceAll('@/components/ui/bld8/',alias+'/'));
    }
  }
  const component = lean ? `import {SignInForm} from '${alias}/blocks/sign-in';\nexport default function Setup(){return <SignInForm/>}\n` : `import {useState} from 'react';
import {AnalyticsDashboard} from '${alias}/blocks/analytics-dashboard';
import {FileBrowser} from '${alias}/blocks/file-browser';
import {SessionSetup} from '${alias}/blocks/session-setup';
import {LargeIssueTable,createSampleLargeIssues} from '${alias}/blocks/large-issue-table';
import {WindowedTable} from '${alias}/windowed-table';
import {SchedulePlanner} from '${alias}/blocks/schedule-planner';
${dataWorkspaceAvailable?`import {DataWorkspace} from '${alias}/blocks/data-workspace';`:''}
import {OperationsTemplate} from '${alias}/blocks/operations-template';
import {Button} from '${alias}/core';
import {Dialog,UIProvider} from '${alias}/overlays';
${coreImports}
${editingImports}
${compositionImports}
${editingRace.imports}
${coreSource}
${editingRace.source}
const queue=Array.from({length:240},(_,index)=>({id:'C-'+String(index).padStart(3,'0'),title:'Queue record '+index,status:index%2?'Later':'Current'}));
const queueKey=(row:typeof queue[number])=>row.id;
const queueGrouping={key:(row:typeof queue[number])=>row.status,label:(key:string)=>key};
const queueColumns=[{key:'id',header:'ID',width:120,cell:(row:typeof queue[number])=>row.id},{key:'title',header:'Record',width:240,flex:1,cell:(row:typeof queue[number])=>row.title}];
const loadConsumerIssues=async({signal}:{signal:AbortSignal})=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return createSampleLargeIssues(80);};
export default function Setup(){const[selected,setSelected]=useState<string[]>([]);return <UIProvider><section data-consumer-content>${availableCoreControls.length?'<InstalledCoreControls/>':''}${editingSource}${editingRace.element}${compositionSource}<div className="theme-controls"><Button variant="accent">Theme accent</Button><Button>Theme primary</Button><Dialog title="Installed theme portal" description="Exported CSS inherited through a body-mounted portal." trigger={<Button variant="secondary">Open theme dialog</Button>}><Button variant="accent">Portal accent</Button><Button>Portal primary</Button></Dialog></div><div className="bblocks-root"><SessionSetup/></div><section aria-label="Installed file browser" className="bblocks-root"><FileBrowser/></section><section aria-label="Installed analytics" className="bblocks-root"><AnalyticsDashboard/></section><section aria-label="Installed windowed table"><h2>Installed queue</h2><WindowedTable caption="Installed queue" rows={queue} columns={queueColumns} rowKey={queueKey} grouping={queueGrouping} height={320} rowHeight={52} overscan={3} selectable selectedKeys={selected} onSelectedKeysChange={setSelected}/><p role="status" aria-label="Installed selection">{selected.length} selected</p></section><section aria-label="Installed large issue block" className="bblocks-root"><LargeIssueTable loadRows={loadConsumerIssues}/></section><section aria-label="Installed schedule" className="bblocks-root"><SchedulePlanner/></section>${dataWorkspaceAvailable?`<section aria-label="Installed data workspace" className="bblocks-root"><DataWorkspace/></section>`:''}<section aria-label="Installed Outline" className="bblocks-root"><OperationsTemplate/></section></section></UIProvider>}
`;
  await write(target, next ? 'app/globals.css' : 'src/style.css', '*{box-sizing:border-box}body{position:relative;margin:0;padding:32px;font-family:var(--bui-font);background:var(--bui-canvas);color:var(--bui-ink)}main{max-width:1200px;margin:auto}.theme-controls{display:flex;gap:16px;margin-bottom:24px}\n');
  if (next) {
    await write(target, 'next.config.ts', 'export default {agentRules: false};\n');
    await write(target, 'app/layout.tsx', `import '${alias}/styles.css';\nimport './globals.css';\nimport './theme.css';\nexport default function Layout({children}:{children:React.ReactNode}){return <html lang="en" className="bld8-theme" data-ui-theme="light"><body>{children}</body></html>}\n`);
    await write(target, 'app/setup.tsx', `'use client';\n${component}`);
    await write(target, 'app/page.tsx', `import Setup from './setup';\n${tableViewsAvailable?`import {createTableViewState,parseTableViewState,serializeTableViewState} from '${alias}/table-view-state';\n`:''}import {createTimeOptions} from '${alias}/time-options';\nimport {initialSessionPreferences,validateSessionPreferences} from '${alias}/blocks/session-preferences';\nimport {validateChartData,getChartDomain} from '${alias}/chart-state';\nimport {buildTableRows,getTableWindow,getTablePage} from '${alias}/table-grouping';\nimport {validateScheduleSnapshot,getScheduleDay,getScheduleStarts,formatScheduleTime,validateScheduleBooking} from '${alias}/schedule-state';\nimport {validateAnalyticsReport,analyticsReportCsv} from '${alias}/blocks/analytics-state';\nimport {DEFAULT_THEME,getThemeTokens,exportThemeCss,serializeThemeConfig,parseThemeConfig} from '${alias}/theme-config';\nexport default function Page(){\n  ${tableViewsAvailable?`const tableSchema={columns:[{key:'id',hideable:false},{key:'title'}]};const tableView=createTableViewState(tableSchema);if(parseTableViewState(serializeTableViewState(tableView,tableSchema),tableSchema)?.columnOrderKeys.join(',')!=='id,title')throw new Error('Server table view helpers failed');\n  `:''}const options=createTimeOptions({minTime:'09:00',maxTime:'17:00',interval:15});\n  const errors=validateSessionPreferences({...initialSessionPreferences(),workspace:'Server checked'});\n  if(options.length!==33||Object.keys(errors).length!==0)throw new Error('Server helper evaluation failed');\n  const observations=[{id:'a',label:'A',values:{requests:9}}],series=[{id:'requests',label:'Requests'}];\n  validateChartData(observations,series);const domain=getChartDomain(observations,series);\n  const report=validateAnalyticsReport({period:'week',records:[{id:'a',label:'A',completed:8,failed:1}]},'week');\n  if(domain[0]!==0||domain[1]!==10||!analyticsReportCsv(report).includes('8,1,9'))throw new Error('Server chart helper evaluation failed');\n  const tableRows=[{id:'a',group:'Active'},{id:'b',group:'Active'},{id:'c',group:'Done'},{id:'d',group:'Done'}];\n  const tableNodes=buildTableRows(tableRows,row=>row.id,{key:row=>row.group,label:key=>key});\n  const tableWindow=getTableWindow(10000,520,260,52,2,0);\n  const tablePage=getTablePage(tableNodes,2,2);\n  if(tableNodes.length!==6||tableWindow.start!==8||tableWindow.end!==17||tableWindow.indices.length!==10||tableWindow.indices[0]!==0||tablePage.nodes[0]?.id!=='group:Active'||tablePage.total!==6)throw new Error('Server table helper evaluation failed');\n  const schedule=validateScheduleSnapshot({revision:2,slots:[{id:'morning',start:'2026-11-02T00:00:00Z',end:'2026-11-02T02:00:00Z'}],events:[]});\n  const scheduleStarts=getScheduleStarts(schedule,'2026-11-02','Australia/Melbourne',30);\n  if(scheduleStarts.length!==7||getScheduleDay(scheduleStarts[0].start,'Australia/Melbourne')!=='2026-11-02'||formatScheduleTime(scheduleStarts[0].start,'UTC')!=='00:00 · UTC+00:00')throw new Error('Server schedule helper evaluation failed');\n  validateScheduleBooking(schedule,{...scheduleStarts[0],title:'Server checked appointment',expectedRevision:2});\n  const theme={...DEFAULT_THEME,...${JSON.stringify(themeConfig(framework))}} as const;\n  const roundTrip=parseThemeConfig(serializeThemeConfig(theme));\n  const tokens=getThemeTokens(roundTrip,'dark');\n  if(roundTrip?.radius!==9||tokens['--bui-control-md']!=='40px'||tokens['--bui-primary']!==theme.primary||!exportThemeCss(roundTrip).includes('.bld8-theme'))throw new Error('Server theme helper evaluation failed');\n  return <main><h1>server-helpers-33-0</h1><p>server-theme-9-40</p><p>server-chart-0-10</p><p>server-table-6-10</p><p>server-schedule-7-2026-11-02</p><Setup/></main>;\n}\n`);
  } else {
    await write(target, 'vite.config.ts', `import {fileURLToPath} from 'node:url';\nexport default {resolve:{alias:{'~':fileURLToPath(new URL('./src',import.meta.url))}}};\n`);
    await write(target, 'index.html', '<!doctype html><html lang="en" class="bld8-theme" data-ui-theme="light"><head><meta charset="UTF-8"><title>Registry consumer</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n');
    await write(target, 'src/vite-env.d.ts', '/// <reference types="vite/client" />\n');
    await write(target, 'src/App.tsx', component);
    await write(target, 'src/main.tsx', `import {createRoot} from 'react-dom/client';\nimport Setup from './App';\nimport '${alias}/styles.css';\nimport './style.css';\nimport './theme.css';\ncreateRoot(document.getElementById('root')!).render(<main><Setup/></main>);\n`);
  }
  if(lean){
    await write(target,next?'app/theme.css':'src/theme.css','');
    if(next)await write(target,'app/page.tsx',`'use client';\n${component}`);
  }
  return target;
}

let browser;
try {
  await writeFile(env.npm_config_userconfig, '');
  await writeFile(env.npm_config_globalconfig, '');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL || undefined});
  for (const framework of frameworks) {
    requests.clear();
    const leanTarget=await prepare(framework,true);
    await run(['install','--no-audit','--no-fund'],leanTarget);
    await run(['exec','--yes',`--package=shadcn@${tools.shadcn}`,'--','shadcn','add',`${installOrigin()}/r/sign-in.json`,'--yes','--overwrite'],leanTarget);
    const leanManifest=JSON.parse(await readFile(join(leanTarget,'package.json'),'utf8'));
    for(const dependency of ['react-day-picker','@dnd-kit/core','@dnd-kit/sortable','@base-ui/react','motion'])assert.equal(leanManifest.dependencies[dependency],undefined,'Sign-in must not install '+dependency);
    await run(['run','build'],leanTarget);
    console.log('Lean sign-in installed and built without unrelated calendar, drag or overlay dependencies.');
    requests.clear();
    const target = await prepare(framework);
    await run(['install', '--no-audit', '--no-fund'], target);
    await run(['exec', '--yes', `--package=shadcn@${tools.shadcn}`, '--', 'shadcn', 'add', `${installOrigin()}/r/session-setup.json`, `${installOrigin()}/r/theme-config.json`, `${installOrigin()}/r/file-browser.json`, `${installOrigin()}/r/chart.json`, `${installOrigin()}/r/analytics-dashboard.json`, `${installOrigin()}/r/windowed-table.json`, `${installOrigin()}/r/table-grouping.json`, `${installOrigin()}/r/large-issue-table.json`, `${installOrigin()}/r/day-agenda.json`, `${installOrigin()}/r/schedule-state.json`, `${installOrigin()}/r/schedule-planner.json`, `${installOrigin()}/r/outline.json`, ...(tableViewsAvailable?[`${installOrigin()}/r/table-view-state.json`,`${installOrigin()}/r/issue-table.json`]:[]), ...[...extendedControls,...coreControlInstallItems,...editingInstallItems,...editingModules,...compositionInstallItems].map(name=>`${installOrigin()}/r/${name}.json`), '--yes', '--overwrite'], target);
    if(!publishedVersion)for (const item of graph) assert.ok(requests.has(item), `shadcn did not request ${item}`);
    const uiDirectory = join(target, framework === 'next' ? 'components/ui/bld8' : 'src/ui/bld8');
    for (const file of ['blocks/outline-project-editor.tsx', 'blocks/outline-drafts.ts', 'drawer.tsx', 'day-agenda.tsx', 'schedule-state.ts', 'blocks/schedule-planner.tsx', 'windowed-table.tsx', 'table-grouping.ts', 'blocks/large-issue-table.tsx', 'blocks/issue-repository.ts', 'chart.tsx', 'chart-state.ts', 'blocks/analytics-dashboard.tsx', 'blocks/analytics-state.ts', 'blocks/file-browser.tsx', 'tree.tsx', 'blocks/session-setup.tsx', 'blocks/session-preferences.ts', 'time-options.ts', 'theme-config.ts', 'styles.css', 'tokens.css', 'tailwind.css', 'licenses/LICENSE', 'licenses/THIRD_PARTY_NOTICES.md']) {
      assert.ok((await readFile(join(uiDirectory, file))).length, `Missing installed source/style/notice: ${file}`);
    }
    for(const name of availableCoreControls)assert.ok((await readFile(join(uiDirectory,name+'.tsx'))).length,'Missing installed core source: '+name);
    for(const item of installedCompositionExamples){
      const installedSource=await readFile(join(uiDirectory,'examples',item.id+'.tsx'),'utf8');
      const parsed=typescript.createSourceFile(item.id+'.tsx',installedSource,typescript.ScriptTarget.Latest,true,typescript.ScriptKind.TSX);
      assert.ok(parsed.statements.some(node=>typescript.isExpressionStatement(node)&&typescript.isStringLiteral(node.expression)&&node.expression.text==='use client'),'Installed example keeps its client boundary: '+item.id);
      assert.ok(hasFullNotice(installedSource,mitNotice()),'Installed example preserves its full MIT copyright and permission notice: '+item.id);
      const registryExample=JSON.parse(originals.get(item.registryName+'.json'));
      const originalExampleFile=registryExample.files.find(file=>file.target==='@ui/bld8/examples/'+item.id+'.tsx');
      assert.equal(originalExampleFile?.type,'registry:file','Complete examples bypass CLI code transforms that discard leading notices: '+item.id);
      assert.equal(installedSource,originalExampleFile.content,'Complete example installation preserves the exact licensed module: '+item.id);

      for(const node of parsed.statements)if(typescript.isImportDeclaration(node)&&typescript.isStringLiteral(node.moduleSpecifier))assert.ok(!node.moduleSpecifier.text.startsWith('@bld8/'),'Example resolves editable installed source, not a workspace package: '+item.id);
    }

    const installed = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
    assert.equal(installed.workspaces, undefined, 'A clean consumer must not use local workspace packages.');
    assert.ok(!Object.keys(installed.dependencies).some(name => name.startsWith('@bld8/')), 'Registry installation must use editable source.');
    assert.ok(installed.dependencies['@base-ui/react'], 'shadcn must resolve the workflow runtime dependencies.');
    if (framework === 'vite') assert.equal(installed.dependencies.next, undefined);
    // Capture actual CLI output, including alias and formatter transformations,
    // before customising. A receipt is local metadata, never an overwrite plan.
    const sourceManifest=releaseManifest??validateManifest(JSON.parse(await readFile(join(root,'apps/docs/public/releases/current.json'),'utf8')));
    const readInstalled=localReader(dirname(uiDirectory));
    const receipt=createReceipt(sourceManifest,['outline'],readInstalled);
    assert.ok(planReceiptUpdate(receipt,sourceManifest,readInstalled).files.every(file=>file.status==='current'),'Clean installed Outline must not report CLI transformations as local edits.');
    await write(target,'receipts/outline.json',receipt);
    const editedPath='bld8/blocks/outline-project-editor.tsx',editedFile=join(dirname(uiDirectory),editedPath),originalText=await readFile(editedFile,'utf8');
    try {
      await writeFile(editedFile,originalText+'\n// Consumer customisation.\n');
      assert.equal(planReceiptUpdate(receipt,sourceManifest,readInstalled).files.find(file=>file.path===editedPath)?.status,'local-only');
      const next=structuredClone(sourceManifest);
      for(const item of next.items)for(const file of item.files)if(file.path===editedPath)file.sha256=sourceHash('Changed upstream source');
      next.snapshot=manifestHash(next);
      assert.equal(planReceiptUpdate(receipt,next,readInstalled).files.find(file=>file.path===editedPath)?.status,'conflict');
    } finally { await writeFile(editedFile,originalText); }
    console.log(framework+': clean-install receipt recognises CLI transformations and detects a real edit/upstream conflict.');
    const theme = await exportConsumerTheme(target, uiDirectory, framework);
    await run(['run', 'build'], target);
    if (framework === 'next') {
      const html = await readFile(join(target, '.next/server/app/index.html'), 'utf8');
      assert.match(html, /server-helpers-33-0/, 'The Server Component must evaluate the installed pure workflow helpers during prerender.');
      assert.match(html, /server-chart-0-10/, 'The Server Component must evaluate the installed pure chart and report helpers.');
      assert.match(html, /server-table-6-10/, 'The Server Component must evaluate installed grouping, paging and bounded window helpers.');
      assert.match(html, /server-schedule-7-2026-11-02/, 'The Server Component must evaluate installed UTC scheduling, timezone and booking helpers.');
      assert.match(html, /server-theme-9-40/, 'The Server Component must evaluate all installed pure theme helpers during prerender.');
    }
    else assert.match(await readFile(join(target, 'dist/index.html'), 'utf8'), /assets\//);
    await checkThemeInBrowser(browser, target, framework, theme);
    console.log(`\n${framework}: actual shadcn installation, ${graph.size}-item graph, configured alias and independent production build passed.`);
  }
} finally {
  if (browser) await browser.close();
  if (server.listening) await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
  try {
    if(registryDirectory)for (const [name, bytes] of originals) assert.ok(bytes.equals(await readFile(join(registryDirectory, name))), `Generated production registry changed during verification: ${name}`);
    if(publishedVersion)assert.equal(validateManifest(JSON.parse((await publishedBytes('manifest.json')).toString('utf8'))).snapshot,releaseManifest.snapshot,'The retained source identity must remain unchanged.');
  } finally {
    // Delete only this process's newly-created directory, after absolute-path and
    // symlink checks. No shell command or repository directory is used for cleanup.
    const resolved = await realpath(workspace);
    const inside = relative(temporaryParent, resolved);
    assert.ok(inside && !inside.startsWith(`..${sep}`) && inside !== '..' && !isAbsolute(inside));
    assert.equal(dirname(resolved), temporaryParent);
    assert.ok(basename(resolved).startsWith('bld8-registry-consumers-'));
    assert.ok(!(await lstat(workspace)).isSymbolicLink());
    await rm(resolved, {recursive: true, force: true, maxRetries: 3, retryDelay: 250});
  }
}
console.log('\nClean registry consumer verification passed. Temporary consumers removed; production registry bytes preserved.');
