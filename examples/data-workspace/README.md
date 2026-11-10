# Persistent issue API reference

The showcase uses an in-memory `DataSource<Issue>`. These files supply a separate,
durable local filesystem adapter and the same Web Request/Response handler for
Next.js and a standalone Node server used by Vite. Use Node 22 and the supplied
local workspace packages; no database account or API key is needed.

`createPersistentIssueDataSource(filePath)` creates a validated seed snapshot once.
Each batch checks all fields and revisions before applying any changes. A successful
transaction writes records and its retry receipt to one temporary file, syncs it,
then atomically renames it over the previous snapshot. A rejected batch changes
nothing. Replaying the same request ID and body returns its original saved rows;
reusing an ID for another body is rejected. The most recent 100 successful receipts
are retained, so retry within that window and reload to reconcile older requests.

The adapter serializes writes and uses an exclusive `.lock` file across local
writers. A held lock fails safely; it is never removed automatically. If a process
crashes, stop every writer, inspect the data and lock before removing the stale lock.
A corrupt or oversized snapshot is preserved and rejected, never replaced with seeds.
The file is limited to 8 MiB and 10,000 records. Keep regular backups.

`createIssueDataHandler(source, {allowedOrigins})` exposes GET queries and atomic
PATCH batches at `/api/issues`, with bounded JSON bodies, no-store responses and
explicit 409 conflicts / 422 validation errors. It accepts existing flat or nested
filter queries and up to five ordered sort keys. A record ID breaks ties before
server pagination. Numeric values must be JSON numbers; dates are civil YYYY-MM-DD.

Run `node examples/data-workspace/server.mjs` from the repository root. The server
binds only to 127.0.0.1:4174. Configure `API_PORT` and `DATA_FILE` for another local file.
If Vite runs on another port, set `APP_ORIGIN` to that exact local HTTP origin.
Vite proxies `/api/issues` to this server with `changeOrigin: true`; Next.js calls
the handler from a Node route using a stable source instance. The runnable starter
downloads contain those complete integrations.

This is a single-host reference, without sign-in, tenant permissions, audit history,
distributed coordination, attachment storage or a hosted database. Add authenticated
ownership checks before exposing it beyond a trusted local environment. On Vercel,
use a transactional database adapter; ephemeral function filesystems are unsuitable
for durable application data. Cancellation ignores a response but cannot undo a
transaction which already committed. Reload before retrying ambiguous failures.
