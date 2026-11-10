# Per-file upload workflows

`UploadQueue` adds a bounded per-file workflow alongside the existing `FileUpload`
selection control. It supplies queue state and actions; the application supplies
the receiving service, authorisation, storage policy and any later download URL.
The library does not persist `File` objects or resume a page that has closed.

## Connect a receiver

```tsx
const upload = useMemo(() => createUploadHttpAdapter({
  endpoint: '/api/uploads',
  headers: () => ({ 'X-Application-Session': currentSession() }),
}), []);

<UploadQueue
  label="Review material"
  onUploadFile={upload}
  maxFiles={5}
  maxSize={2 * 1024 * 1024}
  concurrency={2}
/>
```

The adapter makes a raw-body POST with `application/octet-stream`,
`X-BLD8-Request-Id` and an `encodeURIComponent`-encoded `X-BLD8-File-Name`.
`headers` accepts a record or callback, so a stable adapter can read current host
credentials without recreating itself. The host owns CORS and authentication;
`withCredentials` defaults to false. The default timeout is 45 seconds and the
allowed range is 1–300000 milliseconds. There is no implicit retry.

Return a 2xx JSON acknowledgement:

```ts
interface UploadReceipt {
  id: string;        // bounded service receipt identifier
  requestId: string; // echo this request's correlation identifier
  bytes: number;    // exactly the selected File.size
  sha256?: string;  // optional 64-character hexadecimal SHA-256
}
```

The receipt is validated again by the queue, including request correlation and
the exact file size. Error bodies are not rendered. An invalid, oversized or
non-2xx acknowledgement remains a recoverable error, never a completed upload.
XHR download progress, declared content length and the final encoded text enforce
a 16 KiB response bound. A receipt acknowledges the service's contract; its
identifier and checksum alone do not establish durable storage or ownership.

## Honest progress and lifecycle

`onUploadFile(file, {signal, requestId, onProgress})` can connect another transport.
`onProgress({loaded, total?})` reports actual file-byte delivery. Values must be
nonnegative integers, monotonic, and no greater than `file.size`; when supplied,
`total` must equal `file.size`. A multipart adapter must remove framing overhead
before reporting file-byte progress. Unknown totals stay indeterminate. Invalid
or regressing events are ignored.

The states are `queued`, `uploading`, `processing`, `complete`, `error` and
`cancelled`. Native `xhr.upload` progress reports bytes sent; its `load` event
reports the full file delivery, including a zero-byte file. Delivery at 100% moves
to **Sent · awaiting acknowledgement**. Only a valid receipt resolves the request
as **Acknowledged**. No timer or estimated percentage simulates upload progress.

The same queue item and request IDs survive manual retry; each attempt has its own
abort controller and generation. This supports a host's idempotency contract after
an acknowledgement is lost. Cancellation cannot undo bytes already accepted by a
service. Retrying after cancellation asks the same service to reconcile that ID.
The host decides how long to retain idempotency records and how to reject a reused
ID with different content. Do not reuse one ID for another file or receiver.

## Queue bounds and interaction

Manual start is the default. **Start queued** authorises the files currently in
the queue; files added later wait for another explicit start. `autoStart` opts into
immediate scheduling. Per-file Cancel, Retry and Remove remain independent.
Cancel releases a concurrency slot; Remove aborts an active attempt and ignores
late progress or receipts. Disabling new uploads pauses queued dispatch and blocks
adding/start/retry, while active Cancel remains available.

The concurrency limit counts attempts still owned by this queue. A custom handler
must honour `signal` to stop physical work; an implementation that ignores abort
can continue in the background after its local slot is released. The supplied XHR
adapter aborts its request. Neither path promises to undo work already received
by the remote service.

Defaults are five files, 10 MiB per file and two concurrent requests. Limits are
1–20 files, 1 byte–100 MiB per file and concurrency 1–3. Empty files are supported.
Validation occurs before enqueueing. Each selected file gets its own stable ID;
matching names or metadata do not claim content-level deduplication. Completed
items continue to count toward the bound until removed. Rejection feedback is
bounded to 20 named messages and one summary for additional rejected files.

Keep `onUploadFile` stable with `useMemo` or `useCallback`. Replacing its identity
cancels active requests and invalidates their callbacks; it does not silently send
those files to the new receiver. Remove and re-add files when switching receiver
namespaces. `onItemsChange` is an observational snapshot callback, not a controlled
file list. Inline observer callbacks do not restart requests or create a loop.

Native buttons and the file input support keyboard use. After a user's action,
focus follows the remaining row action or Browse; completion repairs focus only
when the affected Cancel still owns it. Progress never pulls focus back from a
different control. One polite lifecycle announcement avoids reading every byte
event. The queue height, displaced rows, errors and progress use shared easing;
live reduced-motion changes stop animation. Native form file submission is not
implied: use the completed receipt IDs explicitly in the application's form.

## Working HTTP example

`/examples/upload-http` uses `/api/examples/uploads`, a real bounded raw-body
receiver. It reads up to 2 MiB, computes SHA-256, returns a receipt and discards the
bytes. Its example session UUID scopes request-ID records for up to five minutes
in the current server process. A repeated ID and matching content/name returns
the same receipt; different content/name returns a conflict. These temporary
records provide neither authentication nor file hosting. Restarting the server
can forget them. The failure toggle rejects one attempt so the same file can be
retried through the full HTTP path.

Next.js starter downloads include that receiver. A React/Vite host must supply its
own endpoint and deployment configuration. The reusable queue and adapter do not
depend on Next.js. Production services still own access checks, content inspection,
durable metadata/storage, idempotency retention and any resumable upload protocol.
Keep the MIT and third-party licence notices when reusing the source.
