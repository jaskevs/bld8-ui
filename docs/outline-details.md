# Outline project details

Use a project's row menu → Edit project to open its detail drawer. Plan project
uses the same layout for creation. The scrollable form and persistent action
footer keep saving and cancellation reachable on narrow and short screens.
Opening focuses the project heading for an existing record, or the name field
for creation. Dismissal returns focus without scrolling the underlying list.
The drawer finishes its exit transition before unmounting and respects live
reduced-motion preferences.

Saving an existing record retains the list's query, page, selection and column
configuration. A record that no longer matches its filter may leave the view;
focus then falls back to the table. Creation returns to the first page.

## Draft recovery

Changed values are kept separately from saved projects. Closing a dirty drawer
offers Keep draft & close, Discard changes and Keep editing. Reopening the same
record recovers its draft; successful project saves remove it. Creation has its
own draft. Invalid field values can be recovered and corrected before submission.

The browser repository enables sessionStorage recovery, scoped by its data key.
Drafts survive reloads in the current tab, not closure of that tab. They are not
uploaded to the project service. Blocked or full storage keeps an in-memory copy
and explains the recovery limit instead of claiming the draft was persisted.
An unreadable draft never replaces a saved project. A failed removal is reported
before allowing a discard that would appear to succeed.

Custom OutlineRepository implementations can supply an optional draftKey to opt
in. Use a stable namespace that distinguishes the current owner and workspace;
do not put credentials or authentication tokens in it. Recreate the repository
when that connection changes. Omitting draftKey uses memory-only drafts. Drafts
belong to the browser's origin and are not a security boundary against other code
running on that origin. A host can omit persistent recovery for sensitive data.

## Latest versions and conflicts

The optional repository.get(id, signal) reads a single current project, or null
when it no longer exists. Browser and HTTP adapters implement it. The HTTP
endpoint is GET /projects/:id; it uses the same host-provided session headers as
other requests. The sample HTTP workspace scopes draftKey to its separate demo
session. That sample header isolates temporary data and does not authenticate a
person.

The drawer keeps the version captured when editing began. A rejected save keeps
all field values. On a conflict, Load latest project retrieves a comparison;
saving stays blocked until the user reviews it. Keep my edits on latest changes
the baseline to the retrieved version and reapplies only fields edited in the
draft. Unedited fields keep the newer service values. Use saved project explicitly
discards the draft. The user must save again; review never writes automatically.
The server still performs its version check in case another update arrives.

Failed refreshes can retry, deleted records keep the draft available to read or
copy, and connection changes abort the old editor's requests. Hosts that omit
get can retain editing and recovery, but must supply their own record refresh
experience after a conflict. Production services own authenticated access,
atomic writes and durable persistence.

## Activity and comments

Existing projects show Activity below their details when the repository supplies
the optional `history` capability. The browser adapter and sample HTTP workspace
implement it. Adapters that only supply project CRUD remain compatible and do
not show unsupported activity or undo actions.

The feed records actual creation, saves, status changes and status restoration;
untouched sample projects have no invented history. Comments are plain text,
limited to 1,000 characters. Retrying the same recent request ID returns its saved
comment rather than adding another. Comments do not change the project's version.
Refresh retries failed reads; failed posts keep their text, and pending posts
prevent drawer dismissal. Focus returns to the enabled composer after completion.

Unsent comments remain in memory while the page is open, including closing and
reopening the drawer. Unlike the project form draft, they do not survive reloads.
The composer states this limit. Saved comments survive browser reloads; the HTTP
sample retains them only for its temporary session. The browser store retains
the newest 100 entries per project, up to 1,000 overall. The UI initially shows
ten with Show earlier activity. This is a bounded workspace feed, not an immutable
or authenticated audit log. No author identity or collaboration service is implied.

## Undo status changes

Mark ready and Archive offer Undo status change for the latest successful bulk
action. Projects already in that status are skipped. A service receipt identifies
the actual changes and their resulting versions; undo restores only their earlier
statuses. Every affected record must still have that version. Any later edit or
deletion rejects the whole undo without partially changing other records.

Undo keeps the current query, page, columns and selection. Restored projects can
reappear in a filtered view. Transient failures retain the receipt for an explicit
retry; a version conflict removes the unusable action and offers Refresh projects.
Successful undo returns focus to the table. Repeating an already applied receipt
does not repeat the write. The browser adapter retains 50 recent receipts; the UI
only offers its latest action while this page remains open. Creation, detail edits
and permanent deletion do not offer undo in this slice.

## Persistence and service extension

The browser adapter reads existing project-array storage and migrates on the next
successful write to a version 2 envelope containing projects, activity and receipts.
They are written together under the existing storage key; a failed storage write
does not commit only part of an action. Browser storage is still a reference
adapter, without cross-process transaction guarantees.

Set `history:true` in `createOutlineHttpRepository` only when the service supports
the additional contract:

| Method | Path | Request / response |
| --- | --- | --- |
| GET | `/projects/:id/activity` | `{entries: OutlineActivity[]}`, newest first, at most 100 |
| POST | `/projects/:id/comments` | `{text, clientId}` → saved comment, 201 |
| POST | `/projects/status` | `{ids, status, reversible:true}` → `{changed, undo:{id,count}\|null}` |
| POST | `/projects/status/undo` | `{id}` → 204, or 409 when unavailable/stale |

Without the opt-in, the HTTP adapter retains its original project contract,
including the 204 status-change response. All extension requests use the same
transport, owner-scoped headers and abort signal. The host must scope receipts
and activity to authenticated owners, derive authors on the server if needed,
and use an atomic transaction for version checks, writes and activity. The sample
demonstrates session isolation, validation, bounded retention and retry behavior;
its process-local storage and session header are not production authentication.
