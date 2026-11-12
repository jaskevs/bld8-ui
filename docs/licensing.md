# Licensing and attribution

Original BLD8 UI code, blocks, examples and documentation use the
[MIT licence](../LICENSE), copyright 2026 Jaison. MIT permits commercial and
non-commercial use, copying, modification, distribution, sublicensing and sale.
Keep the copyright and permission notices with copies or substantial portions
of the software. The full licence, including its warranty disclaimer, remains
unchanged.

There is no requirement to show a BLD8 logo, footer credit, badge or link in an
application that uses this code. Source comments and distributed licence files
carry attribution without adding visible product branding. [BRAND.md](../BRAND.md)
explains factual project naming and avoiding an implication of official status
or endorsement. It asserts no registered-trademark status and adds no conditions
to MIT.

## Original and adapted source

Substantial source files under packages/ui/src and packages/blocks/src, plus the
canonical TypeScript examples, carry SPDX copyright and MIT identifiers. These
short identifiers accompany the full licence; they do not replace its notice.
Copyright labels identify original work and modifications, not ownership of
third-party dependencies imported by that code.

Four UI files adapt MIT composition patterns from shadcn/ui: sidebar.tsx,
drawer.tsx, context-menu.tsx and variants.ts. They retain copyright 2023 shadcn
alongside copyright 2026 Jaison for BLD8 modifications and their existing
adaptation comments. Their original upstream revision, paths and SHA-256 hashes
are recorded in [the repository ledger](upstream.json). Those hashes identify
the upstream source, not the modified BLD8 files.

The UI package includes a portable [UPSTREAM.json](../packages/ui/UPSTREAM.json)
with the same revision and hashes. Its adaptedIn entries identify canonical
source authorities relative to packages/ui in this repository. Distribution
mappings separately locate included modules relative to the ledger: starter
source and compiled files, npm dist files, and registry source one directory
above licenses/UPSTREAM.json. A lean starter or registry installation includes
only modules in its selected dependency graph; the full provenance ledger does
not imply that every adaptation is installed. Its
[SHADCN_LICENSE](../packages/ui/SHADCN_LICENSE) preserves the full upstream MIT
notice. Keep the original upstream attribution when adapting or redistributing
these files, together with notices for your own changes where appropriate.

## Distribution notices

The UI package carries [LICENSE](../packages/ui/LICENSE),
[THIRD_PARTY_NOTICES.md](../packages/ui/THIRD_PARTY_NOTICES.md), UPSTREAM.json and
the full included notices for shadcn/ui, Lucide, React DayPicker, Motion and
dnd-kit. The third-party notices also describe Base UI and other installed
dependencies. Preserve each applicable upstream licence; an original-code MIT
header does not replace an upstream notice or change an asset's licence.

The blocks package carries its own [LICENSE](../packages/blocks/LICENSE) and
uses the UI package and its notices. The optional read-only MCP package has a
local [LICENSE](../packages/mcp/LICENSE). Installed npm dependencies retain their
own licences. Font assets and external icon artwork retain their original
licences and notices; they are not relicensed by BLD8 headers.

Registry source and runnable starter downloads must carry the applicable full
notices and provenance alongside editable code. The generation pipeline owns
these outputs; update its source authorities rather than editing generated
files. Retained releases keep their original bytes and notices. Development
attribution improvements do not rewrite a retained release.

## Verify distribution integrity

Use Node 22 and build first, then run:

```sh
npm run test:licenses
npm run check:licenses
```

The policy inventory in licenses/inventory.json pins reviewed dependency versions,
licence metadata, workspace identities, complete notice digests and provenance.
Review a dependency or notice change and its applicable terms before updating
that inventory. A new workspace pattern or linked package also requires review.
For source-only edits before generation, node scripts/check-licenses.mjs
--source-only checks the authorities; it does not verify generated downloads.

The full guard checks actual registry dependency closures and file contents,
every starter ZIP and theme transformation, font notices, SVG exports, complete
copied examples, individual agent payloads and source-manifest notice hashes.
Negative fixtures cover missing, truncated and mismatched notices, unreviewed
dependencies/workspaces and incorrect installed provenance paths. CI runs the
guard after generation and before publication; release preparation also checks
the portable artifacts before hashing them.

These checks prevent omissions in BLD8 outputs. They do not decide copyright
ownership or legal compatibility automatically, require visible product credit,
or prohibit reuse that MIT permits. The recorded dependency metadata and notice
inventory are review aids, not a certification of every consuming application.
