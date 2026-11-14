# Rich text and mentions

`RichTextEditor` uses the MIT community Tiptap 3.33.1 editor and ProseMirror engine.
It provides paragraphs, headings 1–3, ordered and unordered lists, bold, italic,
strikethrough, inline code, code blocks, links, undo/redo and an optional selection
toolbar. `Mentions` is a compact composition of the same editor for comments with
an application-owned directory. Mentioning a person sends no notification.

## Document ownership

`value`, `defaultValue` and `onValueChange` use `RichTextDocument` JSON. HTML is not
an accepted input format. `parseRichTextDocument` validates and clones supported
nodes, mark attributes and stable mention identities. Limits are 2,000 nodes,
12 nested levels and 100,000 text characters. `maxLength` sets a smaller editor
character limit, defaulting to 20,000. Unsupported documents remain visible as an
error without replacing the last accepted content.

Controlled JSON echoes do not replace equivalent editor content or move its
selection. A changed external document restores the nearest valid selection.
Use `documentKey` when switching document identity to establish separate local
history, defaults, accepted content and pending directory requests. An unsupported
new document begins empty rather than displaying content from its predecessor.
If a controlled host rejects an edit by retaining its value, the editor restores
that accepted value; echo accepted edits synchronously rather than treating the
controlled prop as a debounced persistence callback. The application owns
persistence, concurrent edits and conflict recovery;
this editor does not supply collaboration or a document service.

`name` submits canonical JSON through a native form, including an external `form`
owner. A required empty editor blocks submission and focuses the real editable
surface. Read-only content remains selectable, focusable and submitted; disabled
content is excluded. Native reset restores uncontrolled defaults and clears local
history. Prevented reset preserves the draft. Controlled content remains owned by
the host through reset. `inputRef` targets the real contenteditable element.

## Formatting, links and clipboard

The toolbar uses the shared button, Select and Popover controls. Its commands
restore the editor selection before formatting. Standard editing shortcuts,
including undo/redo and bold/italic, come from the editor engine. Tab moves between
controls; toolbar arrows follow the explicit UIProvider direction. The optional
selection toolbar stays within the owning interface scope.

`isSafeRichTextLink` permits explicit `http:`, `https:` and `mailto:` destinations,
single-slash local paths and document anchors. It rejects control characters,
backslashes, protocol-relative destinations and executable protocols. Editing a
link does not navigate to it. `richTextToHtml` serializes only validated tags and
escaped text/attributes; `richTextToText` provides a plain-text representation.
Validate again on the server before storing or displaying untrusted documents.

Pasted HTML is intentionally treated as plain text. The editor reads the clipboard's
plain-text representation and ignores raw HTML; use the toolbar to add formatting.
Drag/drop insertion of files, media and arbitrary markup is disabled. Images,
embeds, tables and arbitrary custom HTML are outside this version's schema.

## Async people suggestions

Provide `mentionSource({query, signal})` returning at most 50 entries with stable
`id`, `label`, optional `description` and `disabled`. IDs must be unique nonempty
strings of at most 128 characters. Labels are presentation; submitted mention
nodes retain IDs independently. Resolve or verify those IDs in the application
before performing any authorised action.

Typing `@` opens suggestions. Arrow keys, Home and End move through available
people; Enter inserts; Escape dismisses without deleting text; Tab leaves the
editor. During an error, Enter retries the same search. Loading, empty and error
states retain editor focus and the draft. Requests receive AbortSignal, and late
responses are ignored even when the source disregards cancellation. Changing the
source, `mentionSourceKey`, query, document identity, read-only state or mounting
state invalidates the relevant request. Debounce is bounded to 0–1,000 ms.

Use UIProvider for scoped tokens, theme, locale, explicit RTL direction and reduced
motion. `rich.*` message overrides translate built-in actions; content, labels,
directory results and business errors stay application-owned. No global theme or
selection mutation is required.

Upstream references: [React integration](https://tiptap.dev/docs/editor/getting-started/install/react),
[StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit),
[Mention](https://tiptap.dev/docs/editor/extensions/nodes/mention) and
[MIT licence](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md).
