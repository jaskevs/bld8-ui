# Tree and file browser

/components/tree demonstrates the single-selection Tree. /blocks/file-browser
composes it with folder breadcrumbs, current-folder search/sort, file metadata and
an inspector. /integrations/file-browser explains the service connection. Both
Next.js and React/Vite starters carry the same original MIT source. This increment
is local until separately released; the public registry still serves its previous
release.

## Tree contract

TreeNode has a stable globally unique id, string label, optional description,
decorative Lucide icon, disabled state, children and hasChildren. Unloaded parents
set hasChildren with children undefined; an empty array is loaded and empty.
Duplicate IDs and cycles are rejected. Visible nodes expose truthful hierarchy
levels and sibling positions. There is one roving tab stop; focus and selection
are separate.

- Up/Down and Home/End move focus among visible enabled nodes. Typeahead matches
  names and wraps; repeated letters cycle matches.
- Right opens a parent or enters its first enabled child; Left closes or returns
  to the parent. Collapsing or removing a focused descendant repairs focus.
- Space selects. Enter selects, activates and toggles folders. Pointer row clicks
  select; the disclosure toggles. Disabled subtrees cannot be selected.
- expandedIds/onExpandedChange and selectedId/onSelectedChange are controlled
  options; defaultExpandedIds/defaultSelectedId support local state. onActivate
  receives the node. Do not change stable IDs to express a visual update.

onLoadChildren requests a parent ID. The host supplies new nodes, loadingIds and
errors; it owns promises, cancellation, stale-response protection and caching.
Right Arrow or Enter retries an expanded failed unloaded parent. The primitive
keeps recovery descriptions on the parent; it does not put extra tab stops or
interactive buttons inside tree items.

Expansion uses eased height/opacity while row geometry stays steady. Exiting
groups become inert and hidden from assistive technologies immediately. Live
reduced motion removes travel; forced colours retain focus and selection. This
is a bounded, rendered tree, not a virtualised thousands-of-items explorer.

## FileBrowser contract

FileBrowserEntry adds kind (folder or file), optional size in bytes, deterministic
modified display text and mediaType. Its children use the same entry type. File
contents, filesystem access, transfers and production storage are not supplied.

FileBrowser accepts entries, loadChildren, loading, error, onRetry,
defaultFolderId, defaultExpandedIds, onSelectionChange and className. Keep entries
and loadChildren references stable while browsing; replacing either starts a new
request/cache session. File inspection reports metadata through onSelectionChange.

loadChildren(parentId, {signal}) returns a Promise of child entries. Forward the
signal to fetch. The block tracks request identity and source identity, caches
successful children, aborts on unmount/source change or collapsed ancestors, and
ignores cancelled/stale responses even if a loader does not cooperate. A failed
folder retains other data and has a visible Retry folder action. Authentication,
authorised ownership, pagination and durable storage belong to your service.

Lazy responses and their complete merged candidate are validated before applying:
IDs must remain globally unique, required text/kinds/metadata must be valid,
files cannot have children, and the whole loaded tree stays within 2,000 entries
and 32 nesting levels. Cycles, oversized structures and duplicate ancestor IDs
become a recoverable error. These bounds are not a virtualisation performance
claim. Do not treat client validation as server authorisation.

Folders stay first when sorting by name or size; unknown sizes remain explicit.
Search only covers already-loaded entries in the current folder. Modified labels
are supplied by the host and are not parsed as dates. Changing folders clears
the local search and file selection. Breadcrumbs and Up navigate the same state.

Activating a focused table folder, breadcrumb, Up, Load folder or Retry folder
hands focus to the persistent folder heading. Clear file search returns it to
the search field. Tree selection and sorting keep their own focus. Initial and
replacement data do not autofocus; async results never reclaim focus after the
user moves elsewhere. If onRetry remounts the entire block, the host owns focus
continuity across that workspace replacement.

Results and recovery states enter with a short eased opacity and position change.
Replaced content unmounts immediately; interactive exiting content is not retained.
Reduced motion removes the animated travel, while the heading and toolbar remain
steady through loading, errors and recovery.

## Examples and installation

The default Workspace sample includes Projects, an empty Ideas folder, README.md
and an Archive folder loaded through an abortable 650ms timer. The showcase adds
Loading, Empty, Connection error, Rejected folder load, Slow folder load and
Invalid folder data preview states. The rejected load succeeds on retry;
malformed metadata is rejected without adding duplicate tree identities.

After publication, install /r/tree.json or /r/file-browser.json using the shadcn
CLI, or download file-browser.zip / file-browser-vite.zip. Source starters import
Tree from @bld8/ui and FileBrowser from @bld8/blocks. Registry consumers import
their installed bld8/tree and bld8/blocks/file-browser modules using their UI
alias. The existing stylesheets include all Tree and browser styles; no separate
CSS file or new runtime dependency is required. Retain included licences.

Automated keyboard, geometry, failure, mobile and axe checks complement manual
review. They do not certify accessibility, all browsers or physical devices.
See verification.md, registry-consumer-checks.md and visual-quality.md for actual
evidence and the release boundary.
