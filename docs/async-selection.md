# Remote choices and selected labels

AsyncCombobox and AsyncMultiSelect add remote search to the existing choice
family. Ordinary Combobox and MultiSelect keep their local APIs and dependencies.
The new controls use stable string IDs for selection and native form submission;
loaded option objects supply display labels and optional rich rows.

## Connect a source

```tsx
import {AsyncCombobox, AsyncMultiSelect} from '@bld8/ui';

const loadOptions = async ({query, cursor, signal}) => {
  const params = new URLSearchParams({query});
  if (cursor !== null) params.set('cursor', cursor);
  const response = await fetch('/api/people?' + params, {signal});
  if (!response.ok) throw new Error('Directory unavailable');
  return response.json(); // Validate service payloads in your transport adapter too.
};

<AsyncCombobox label="Assignee" value={assignee}
  onValueChange={setAssignee} loadOptions={loadOptions}
  resolveOptions={resolveOptions} name="assignee" />

<AsyncMultiSelect label="Reviewers" value={reviewers}
  onValueChange={setReviewers} loadOptions={loadOptions}
  resolveOptions={resolveOptions} name="reviewers" />
```

A page is `{items, nextCursor}`. Every item has a unique nonempty `value` and
`label`, with optional `description` and `disabled`. Extend AsyncOption for more
presentational data; `renderOption(item)` can show an avatar or supporting text.
Keep interactive buttons and links out of an option row. IDs, not labels or custom
markup, are submitted by native forms. `inputRef`, `onBlur`, `required`, `disabled`,
`hint`, `error`, label visibility and control density support existing form flows.

Keep loadOptions and resolveOptions identities stable with module functions,
useMemo or useCallback. A new loader/resolver identity resets the source and
cancels requests. Change `sourceKey` when a tenant, authorisation scope or parent
branch changes without changing the loader function. Never reuse cached options
across account or tenant scopes. The host owns authorisation and service policy.

Empty queries load the first page by default. `minQueryLength` accepts 0–10;
`debounceMs` accepts 0–1000 and defaults to 200. Native typing remains immediate.
The remote response is not filtered again in the browser. Loading a new query
removes stale result options while preserving selected IDs and labels.

## Restore selected values

An initial ID may not occur on the current search page. Pass known records through
`selectedOptions`, or supply `resolveOptions({values, signal})` to load them.
Resolver responses must contain unique requested IDs; missing records remain
selected with an explicit message instead of being silently removed. Failure
keeps IDs and offers Retry selected labels. Seed records are initial labels;
source responses can update them. New source identities discard old labels.

Query and label requests have separate abort controllers and generations. Late
responses cannot replace a newer query, source or selection. A query that supplies
all selected records supersedes outstanding label resolution; a slower resolver
cannot overwrite newer query labels or display a stale failure. Background label
updates preserve typed text and never move focus. A retry initiated by the user
returns focus to its field or retry action when that action changes.

## Paging and limits

Load more is an explicit action outside the listbox. A pagination failure keeps
loaded rows and its cursor; Retry requests that same page. Successful queries
retain stable IDs, selected labels and the active search. Repeated or nonadvancing
cursors are rejected. The list is bounded paging, not virtualisation.

The current limits are 100 items per response, 500 loaded options and 100 selected
IDs. IDs are at most 128 characters, labels 200, descriptions 500, query text 1000
and cursor tokens 512. Malformed, duplicate, sparse and reserved-key payloads are
rejected. When the loaded limit is reached, narrow the search instead of rendering
an unbounded list. Results and currently selected labels are cached; historical
unselected searches are not retained indefinitely.

## Reuse the request boundary

The Base UI-independent `useAsyncOptions` hook accepts query, enabled, sourceKey,
loadOptions, optional resolveOptions, selectedValues and selectedOptions. It
returns items, status (`idle`, `waiting`, `loading`, `ready`, `error`), loading,
loadingMore, error, hasMore, limitReached, canSearch, resolving, resolutionError,
optionForValue, loadMore, retry and retryResolution. A hierarchical picker can key
this same boundary by its current parent while owning path navigation separately.

The pure async-options module exports the request/page/loader/resolver types and
payload validators for service adapters. Invalid caller configuration throws;
service failures are recoverable UI state. Raw service errors are not rendered.

The sample directory at /examples/async-selection uses real HTTP requests to a
bounded illustrative 60-person directory. It includes initial-ID restoration,
source changes, paging, a failed-search control and native form inspection. It is
not an account directory, an authentication service or durable storage. React and
Vite hosts supply their own service endpoint. Keep MIT and third-party notices.

## Accessibility review scope

The installed headless popup focus manager intentionally hides outside content
from assistive technology while an input-outside-popup combobox is open. Its
dismiss-on-Tab behaviour is implemented in JavaScript, so a whole-document static
scan can report outside aria-hidden focus candidates without modelling that
transition. Coverage therefore scans the complete page while closed, then the
active input and open popup without disabling any accessibility rule. Keyboard
checks verify that Tab dismisses the popup and never leaves focus inside an
aria-hidden ancestor. These checks are not accessibility certification; physical
device and assistive-technology review remain necessary.

## Native form ownership and reset

Both remote controls accept form for an external owning form and readOnly for
focusable, submitted canonical values that cannot be edited. A read-only field
does not open its search popup or expose clear/remove actions. Disabled controls
are excluded from native submission. Selected-label resolution can still provide
readable labels without opening search.

An uncancelled native reset restores uncontrolled initial IDs, clears transient
search text, closes the popup and cancels stale queries. Controlled values remain
application-owned. A prevented reset keeps values and query intact. Reset does
not report a user onValueChange. Exact examples cover external forms, controlled
ownership, retained labels, read-only transitions and held-request cancellation.
