# BLD8 for developers and coding agents

Use the same public source documentation whether you are building a screen by
hand or asking a coding agent to help. The catalogue describes the actual public
TypeScript APIs, installation requirements, usage snippets and service boundaries.
It is generated from the component catalogue, block metadata, TypeScript exports
and registry items during a documentation build.

## Find the right source

- [Browse components](https://ui.bld8.dev/components),
  [blocks](https://ui.bld8.dev/blocks) and
  [templates](https://ui.bld8.dev/templates) for interactive examples.
- [llms.txt](https://ui.bld8.dev/llms.txt) is the small Markdown index.
- [llms-full.txt](https://ui.bld8.dev/llms-full.txt) combines the public guides
  and API documentation. It is larger; request an individual entry when possible.
- [agent/catalog.json](https://ui.bld8.dev/agent/catalog.json) is the structured
  catalogue, with a schema version and source release identity.
- Each entry links to plain Markdown, for example
  [Data table](https://ui.bld8.dev/agent/component/table.md) and
  [Issue workspace](https://ui.bld8.dev/agent/block/issue-table.md).
- Complete named examples have their own interactive page, exact Markdown at
  `/agent/example/<id>.md` and installable `/r/example-<id>.json` composition.
  Nested structured examples carry these links alongside complete source,
  keyboard paths, states and notices.

The API tables come from the source rather than a second handwritten prop list.
Usage snippets still need imports, state, data and callbacks; they are not complete
application files. Read the behaviour notes before connecting a service.

## Install and adapt

Use React 19 and initialise shadcn in the host application before adding registry
source. For example:

```sh
npx shadcn@latest add https://ui.bld8.dev/r/table.json
```

DataTable includes controlled ordering state and keyboard position controls.
Pointer/touch dragging is an optional wrapper, so applications that do not need
it can keep the ordinary table dependency graph. For that workflow, install
SortableDataTable instead:

```sh
npx shadcn@latest add https://ui.bld8.dev/r/sortable-table.json
```

Both table APIs and their shared view-state helpers are documented under the
Data table and Advanced table entries. Read the
[table layout and saved-view guide](table-views.md) for the ownership and
ordering restrictions.

The installed source is editable and follows the application's configured UI
alias. BLD8 UI and blocks are not published npm packages. Runnable Next.js and
React + Vite starters include them as local workspaces. Keep the supplied MIT and
third-party licence notices.

The current catalogue follows the moving source version and reports its status
and snapshot. For an existing installation, read its saved manifest and installation
receipt first. Do not use current documentation as evidence that an older retained
version has a new feature. [Source updates](https://ui.bld8.dev/releases) explain
versioned registry URLs and review of local customisations.

[Versioned documentation](https://ui.bld8.dev/docs/versions/development) separates
the labelled development preview from a selected retained reference. Future
releases from 0.4.0 include a manifest-verified API catalogue and documentation
archive. Earlier immutable releases remain unchanged and report that retained
documentation is unsupported. There is no fallback to current APIs.

## Use the local MCP server

The optional read-only MCP server lets an editor or coding assistant discover
entries, search capabilities and read their APIs without loading the entire
catalogue into a conversation. It reads only the generated public catalogue.
It does not install components, change files, run application commands or read
private environment files.

Clone this repository, use Node 22, run `npm ci` and then `npm run build` to create
the catalogue and compile the server. Add this stdio server to a client that
supports MCP, replacing the placeholder with the absolute path to your checkout:

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

The tools list and search entries, read an entry's overview/API and read a public
guide. Use `search_examples` with task text or a `componentId` to discover small
summaries, then `get_example` with its exact ID to obtain the complete client
module, actual composition registry URL and full portable notices. Its optional
`source` chooses `workspace`, `registry` or `both`. The catalogue also exposes
exact resources at `bld8://example/<id>`. Component, block and template kinds
remain unchanged; examples are named compositions within their parent entries.
Native React props are omitted by default to keep responses
focused; request them when needed. No environment variables or API key are required.
Use `list_versions` before requesting an exact source version. Every discovery
tool accepts `version: "current"` or a retained version with a verified local
cache. The separate `docs:sync` command populates that cache; MCP handlers remain
read-only and do not fetch documents or install source.
Restart the MCP connection after rebuilding to load the new catalogue. No hosted
MCP service or published npm command is required for this local integration.
Read [MCP setup and boundaries](mcp.md) for client examples and response limits.

## Make a dependable change

1. Choose a component for a reusable control, a block for a composed workflow,
   or a template for a fuller application shell.
2. Read the current props and behaviour boundaries. Keep controlled state and
   stable IDs explicit. The host owns authentication, authorisation and durable
   persistence unless the entry says otherwise.
3. Preserve visible labels, keyboard interaction, focus restoration and the
   reduced-motion behaviour while adapting the design tokens.
4. Test the real host flow, including a failed save, cancellation, empty data and
   the narrowest supported screen. Automated checks do not replace testing with
   the application's own data and users.

The documentation catalogue and MCP responses are reference material. They do not
grant permission to install dependencies, overwrite customised source, publish a
release or access another repository.

## Preserve source attribution

Read [licensing and attribution](licensing.md) when copying or redistributing
source. Complete code exports carry the applicable copyright and permission
notices. SPDX labels supplement those full notices. Preserve upstream credits;
source installation does not transfer copyright ownership.

Individual catalogue entries, examples and MCP responses identify MIT, their
canonical source paths, full notices and upstream provenance. The portable
ledger maps original package paths to starter, compiled npm and registry files.
List/search summaries keep shared notices once at the response level; request
the exact entry or example before copying code. No visible BLD8 badge or footer
credit is required in a consuming application.

For repository changes, read AGENTS.md. Build, run npm run test:licenses and
npm run check:licenses, and review any inventory update instead of regenerating
an acceptance baseline automatically. Keep retained releases unchanged.
