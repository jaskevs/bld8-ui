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
| `list_components` | List component, block or template entries; filter by kind/category. |
| `search_components` | Search names, descriptions and behavior notes with plain text. |
| `get_component` | Read an exact entry's overview, API properties, example or all sections. |
| `get_guide` | Read an allowlisted integration guide by its catalog ID. |

List/search results default to 20 entries and allow at most 50 per call. Use
`offset` and the returned `nextOffset` to continue. `get_component` accepts
`section: "api"`, `includeNative: true`, `offset` and `limit`; native HTML props
are excluded by default to keep the first response useful. API properties name
their declaring definition, so overlapping names remain distinguishable.

Read `bld8://catalog` for all entry and guide IDs and the source identity. Each
entry has a resource such as `bld8://component/button`, `bld8://block/issue-table`
or `bld8://template/outline`. Guides use `bld8://guide/<id>`. Component resources
include full APIs; tools provide a smaller paginated alternative.

A useful sequence is: search for a task, read the matching entry's notes and API,
then inspect its example and registry requirements. Examples are fragments and
are explicitly marked `complete: false`; they may need imports, state, data or
host callbacks. The server does not claim they are standalone applications.

## Source and access boundaries

The process reads one generated file:
`apps/docs/public/agent/catalog.json`. Generation takes metadata, prop tables and
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
