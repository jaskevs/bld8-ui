import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { loadCatalog } from './catalog.js';
import { createDocumentationServer } from './server.js';
import {loadDocumentationVersions} from './versions.js';

// stdout belongs to MCP. Startup diagnostics intentionally use stderr only.
try {
  const catalog = await loadCatalog();
  const versions=loadDocumentationVersions();
  await serveStdio(() => createDocumentationServer(catalog,versions));
} catch {
  console.error('BLD8 UI documentation could not start. Run npm ci and npm run build in the checkout, then retry.');
  process.exitCode = 1;
}
