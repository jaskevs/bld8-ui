# Cascader

A current-level hierarchy picker for React, Next.js and Vite. Browse branches without changing the submitted value; choosing a leaf commits the complete path. The component uses a popover with native buttons, a search field and breadcrumbs.

## Start with an explicit data contract

```tsx
import { Cascader, type CascaderNode, type CascaderOptionsLoader,
  type CascaderPathResolver } from '@bld8/ui';

const loadOptions: CascaderOptionsLoader = async ({ parentValue, path, query, cursor, signal }) => {
  const params = new URLSearchParams({ path: JSON.stringify(path), query });
  if (parentValue !== null) params.set('parentValue', parentValue);
  if (cursor !== null) params.set('cursor', cursor);
  const response = await fetch(`/api/locations?${params}`, { signal });
  if (!response.ok) throw new Error('Locations are unavailable.');
  return response.json(); // Validate the response at your HTTP boundary too.
};
const resolvePath: CascaderPathResolver = async ({ values, signal }) => {
  const response = await fetch(`/api/locations?values=${encodeURIComponent(JSON.stringify(values))}`, { signal });
  if (!response.ok) throw new Error('The selected location is unavailable.');
  return response.json();
};

<Cascader label="Project area" name="area" sourceKey="studio"
  loadOptions={loadOptions} resolvePath={resolvePath}
  defaultValue={['engineering', 'frontend', 'react']} />
```

Keep loader and resolver identities stable with module-level functions or `useCallback`. Change `sourceKey` when the tenant or dataset changes. Aborted and outdated responses cannot replace a newer request. Credentials, permissions and tenant boundaries remain the host application's responsibility.

## Nodes, pages and restored paths

A `CascaderNode` contains `value`, `label`, `parentValue`, `hasChildren`, optional `description` and optional `disabled`. IDs must be globally unique across the hierarchy. Roots use `parentValue: null`; children identify their immediate parent. A page returns `{ items, nextCursor }` for the requested level. Search applies to that level only; it does not claim to find unloaded descendants.

The resolver receives the full committed ID path and must return exactly that path, in order, ending at a leaf. Intermediate nodes must have `hasChildren: true`. Supply `selectedPath` for an already-known complete initial path; it is a display seed rather than a substitute for server validation. Later fetched labels replace seeds. An unavailable or disabled restored path retains its IDs with a visible warning. The user can choose another path or clear it.

`validateCascaderPage(raw, path, parentValue)` checks branch membership, ancestor cycles and page bounds. `validateCascaderResolvedPath(raw, values)` checks ordered parents and the final leaf. `validateCascaderValues(values)` checks stable unique IDs. All three accept an optional maximum depth where documented by their TypeScript signatures. Default maximum depth is eight nodes including the root; configure `maxDepth` from one through eight. A branch that cannot lead to a leaf within that limit cannot be opened.

Shared async limits apply: 128 characters per ID, 200 per label, 500 per description, 100 records per page, 512 characters per cursor or source key, 1,000 search characters and 500 loaded records per level. Narrow the search when the loaded-record limit is reached. Debounce defaults to 200 ms and can be set from 0 through 1,000 ms; `minQueryLength` accepts 0 through 10.

## Keyboard, forms and motion

Arrow Up/Down and Home/End move between enabled choices. Arrow Right opens a branch; Arrow Left returns to its parent. Enter or Space activates a native button. Escape closes the popover and returns focus to its trigger without committing a browsed branch. Breadcrumbs and Back are keyboard accessible. Retry restores focus when its action removes the focused button, while deliberate focus changes are preserved.

The hidden field named by `name` submits a JSON ID array, for example `["engineering","frontend","react"]`. Empty selection submits `[]`; disabling the control omits the hidden field. This is not native `required` validation. Parse and validate the path on the server before accepting a form. `value` and `onValueChange` support controlled forms; `inputRef`, `onBlur`, `hint` and `error` support external form libraries.

Rows and navigation have a minimum height of 44 px. Level changes use the shared easing and a small fade/translation; reduced motion removes the animation. Loading, pagination and errors stay in the popup. There is no virtualization or global hierarchy-search claim.

## Try the complete example

The [Cascader example](/examples/cascader) uses a real HTTP adapter with per-level loading, ordered path resolution, failure recovery and native JSON form submission. It keeps the committed Engineering / Frontend / React path while other branches are explored.
