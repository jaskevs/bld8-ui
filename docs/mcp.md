# Local documentation MCP

The optional BLD8 UI MCP server lets a coding client discover components, inspect
their generated TypeScript APIs and read installation and workflow guidance. It
uses the same public catalog as the documentation site. It is a local stdio
process, separate from the React runtime and application bundle.

## Run from a checkout

Use Node 22. From the repository root:

```sh
npm ci
npm run build
```

Add this entry to a client that supports local stdio MCP servers, replacing the
path with the absolute path to your checkout:

```json
{
  "mcpServers": {
    "bld8-ui": {
      "command": "node",
      "args": ["/absolute/path/to/bld8-ui/packages/mcp/dist/index.js"]
    }
  }
}
```

On Windows, forward slashes in the absolute path avoid JSON backslash escaping.
If Node is not on the client's PATH, use its absolute executable path for
`command`. The client starts and stops the process; no separate terminal server,
API key, port or working-directory setting is required.

The workspace package `@bld8/mcp` is private and unpublished. This setup does not
describe an npm-installed server or a hosted HTTP endpoint. Client configuration
formats differ; the JSON above shows the common `mcpServers` structure.

## Available tools and resources

| Tool | Purpose |
| --- | --- |
| `list_versions` | Show current development source and which retained documentation versions are verified, unsupported or missing locally. |
| `list_components` | List component, block or template entries; filter by kind/category. |
| `search_components` | Search names, descriptions and behavior notes with plain text. |
| `get_component` | Read an exact entry's overview, API properties, example or all sections. |
| `search_examples` | Discover complete named examples by task text, component ID or category without loading source code. |
| `get_example` | Read one exact complete client module, its real registry composition, keyboard/states and portable notices. |
| `get_guide` | Read an allowlisted integration guide by its catalog ID. |

List/search results default to 20 entries and allow at most 50 per call. Use
`offset` and the returned `nextOffset` to continue. `get_component` accepts
`section: "api"`, `includeNative: true`, `offset` and `limit`; native HTML props
are excluded by default to keep the first response useful. API properties name
their declaring definition, so overlapping names remain distinguishable.

`search_examples` accepts an optional `query`, `componentId`, `category`, `offset`
and `limit`. Every plain-text query term must match the example's name,
description, component, keyboard or state notes. Results are lightweight
summaries with exact example IDs, interactive/Markdown links and a registry
composition URL. They omit code and share notices once at response level.
`get_example` accepts the exact `id`, an optional `componentId` guard and
`source: "workspace" | "registry" | "both"` (default `"both"`). It returns the
requested complete source, full licence notices/provenance and source identity.
Registry source uses the default local UI alias; adapt it to your application.

Read `bld8://catalog` for all entry and guide IDs and the source identity. Each
entry has a resource such as `bld8://component/button`, `bld8://block/issue-table`
or `bld8://template/outline`. Complete examples use `bld8://example/<example-id>`
and are listed separately in the catalogue; they do not add an entry kind.
Guides use `bld8://guide/<id>`. Component resources
include full APIs; tools provide a smaller paginated alternative.

A useful sequence is: search for a task, read the matching entry's notes and API,
then search its complete examples and request one exact module. The entry's
quick-reference `example` remains a fragment with `complete: false`. Nested
`examples` and exact example returns have `complete: true`: they include client
imports, state and local/sample callbacks without required props. The actual
`example-<id>.json` registry item installs that composition and its dependencies.
The example's interactive link has a matching `/agent/example/<id>.md` document.
Complete UI examples still leave authentication and production persistence to
the host; read each example's notes before connecting a service.

## Source and access boundaries

All discovery tools accept an optional `version`. `version: "current"` reads
the moving catalogue and is the default. An exact version reads only that
retained version's verified local cache. Calls do not change a global selection.
Unknown, unsupported, missing or invalid versions return an error without using
current APIs instead. Existing resource URIs describe current source; use tools
with an explicit version for retained APIs and complete examples.

Version-matched documentation is available for retained source releases from 0.4.0.
The immutable 0.2.0 and 0.3.0 releases did not ship these assets and remain
unsupported by retained-documentation selection. Their source is unchanged.
Populate the local cache for a published supporting version separately:

```sh
npm run docs:sync -- --version 0.4.0
```

The command accepts an allowlisted source version, not an origin or file path.
It downloads only the fixed manifest and catalogue, verifies byte digests, source
revision and source-graph identity, then atomically saves two files in the
checkout's ignored cache. Redirects, transfer sizes and time are bounded;
different existing bytes are never overwritten. Restart the MCP connection
afterwards. MCP handlers perform no network requests or cache writes.

[Versioned documentation](https://ui.bld8.dev/docs/versions/development) provides
a human reference with a labelled development preview. Retained pages verify
their selected source; current interactive demos are not historical runtimes.

For current source the process reads `apps/docs/public/agent/catalog.json`.
Retained versions load only their verified two-file cache at startup.
Generation takes metadata, prop tables and
allowlisted guides from the same repository build as the website. It never
accepts file paths, external URLs, project roots or shell commands from a tool
call, and it performs no network requests, writes or installations. Tool metadata
marks every operation read-only. Public registry URLs are returned as data for a
developer or client to review; the server does not execute them.

The catalog is validated and loaded once at startup. Rebuild and restart the
client connection after changing source or documentation. Every result includes
the catalog's release version, status and snapshot. Current development guidance
can differ from retained releases; consult source-version guidance before
updating copied code. No retained release is modified by generating these docs.

The MCP process has the operating-system permissions of the account running it;
the allowlisted implementation is not an operating-system sandbox. Review a
checkout before registering any local executable. No client configuration or
credentials are changed automatically.

## Verify the interface

After building:

```sh
npm run test --workspace=@bld8/mcp
```

The focused suite launches the actual built server using the official SDK client,
initializes a session, lists and calls tools, reads resources and checks malformed
inputs and unknown resources. It runs without starting the documentation website.
