# Reviewed CSV imports

`ImportWizard` turns supplied CSV into one explicitly reviewed request. It does
not upload the source file, infer permissions, create a database or assume that a
resolved HTTP request committed a batch. Applications supply `fields` and an
`onApply(request,{signal})` callback. Keep the schema and service stable; change
`sourceKey` when the account or destination changes.

## Read, map, validate, review

Choose a UTF-8 file or paste CSV. Comma, semicolon and tab delimiters support
quoted delimiters, doubled quotes and embedded newlines. Original source line
numbers survive parsing. Headerless files are explicit. Empty/duplicate headings
remain distinct numbered columns; ambiguous headings are never auto-mapped.

The parser bounds input to 512 KiB, 1,000 data rows, 30 columns and 4,096 characters
per cell. Malformed quotes, ragged rows and excess limits fail explicitly. Preview
pages show ten rows. Up to 3,000 field issues are accepted; the first 100 links
are presented together and reveal their original row in the preview. Browser
memory is temporary; source content is not placed in URLs or storage.

Fields accept text, decimal numbers, booleans, civil dates or canonical choice
IDs. Dates must be real YYYY-MM-DD values. Boolean entry accepts true/false,
yes/no or 1/0. Numeric conversion rejects a decimal that would change when
round-tripped through a JavaScript number; preserve exact identifiers and larger
precision as text. Optional unmapped fields are omitted. Empty mapped values are
empty text or null. A pure custom validator can enforce domain rules.

Each source column maps to at most one field. Required fields and an explicit
identity field must be mapped. Duplicate identities are rejected by default;
keeping the first or last occurrence is an explicit policy affecting this file
only. This does not detect existing records in the destination. Values beginning
with spreadsheet formula characters remain ordinary text and are never executed.

## One host-owned operation

Create and update modes are distinct. Updates require an identity field; include
an expected revision field when the service uses optimistic concurrency. Review
the typed values and confirm the batch before Apply. The host must validate
permissions, schema, identities and revisions again, and apply all rows atomically.

A successful acknowledgement must contain the same request ID and complete row
count. A known rejection returns `ok:false` with a message and optional bounded
row/field issues. A thrown, cancelled or malformed acknowledgement leaves the
outcome uncertain: the original immutable payload and request ID are retained.
Retry sends that same identity. Optional `onReconcile` checks a receipt without
issuing another write. Cancellation stops waiting; it cannot undo a server write.
The service owns durable receipt storage, idempotency and recovery after reload.

Changing the schema/destination resets local source state and aborts pending
work before paint; old responses cannot update the new destination. A bounded
notice retains only the five most recent unresolved operation IDs, without old
rows or callbacks. Record those IDs and reconcile them with the original service
before repeating a prior import; they are not retried through the new source.
Reconcile an uncertain
operation through its original service before switching accounts. Read-only and
disabled modes do not start writes. No cross-tab or persistent import queue is
included. Examples use labelled in-memory fixtures, not an import service.
