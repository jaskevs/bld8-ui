# Next work

Updated 11 November 2026. The owner authorised the complete core-component plan
in one pass. Implementation and combined acceptance are complete locally.
Development remains 0.3.0/unreleased. See handoff.md and verification.md for the
exact checked revision and publication state.

## Core pass

The catalogue now has 63 component families, eighteen blocks and three templates.
Four new families extend the original 59. Named examples, icon assets and registry
dependency items are separate counting units.

Implemented in this pass:

- A stable icon gallery with scoped size/stroke previews, common buttons,
  semantic/alias search, keyboard browsing, saved icons and licensed exports.
- Select, Combobox and MultiSelect rich stable-ID options, grouping, descriptions,
  icons and grouped rows. Combobox/MultiSelect match search terms; Select typeahead
  uses labels. Existing string conveniences and typed values remain available.
- Dropdown action composition with groups, separators, nested, checked and radio
  items. The existing MenuItem interface and simple action callers remain valid.
- Explicit native field states, mixed checkboxes, hint/error/ref/blur conventions,
  and new ToggleGroup, TagInput, RangeSlider and OTPInput controls.
- Complete literal source examples that compile as real client modules. Website
  previews run that same source; human docs, agent docs and read-only MCP expose
  matching source, keyboard guidance, supported states and TypeScript-derived APIs.
- URL-backed category/capability/text filters and related-control navigation.
  Existing catalogue previews remain available; no performance claim is inferred.
- Optional DataGrid column order, visibility, width, logical pinning and density,
  reusing the existing table view-state model. Touch/keyboard multi-sort and stable
  row/column selection, draft and focus identity accompany the layout controls.
- Human block/template API tables, alongside the existing integration sources,
  complete starters and explicit host service contracts.
- Registry aliases, compiled CSS, source graphs and lean starter packaging for
  the new APIs. Retained 0.2.0 assets are unchanged.

The private Workbench project and its fixed dates, exam window and 135-hour
baseline are separate. This pass makes no effort-hour or adoption claim.

## Verified acceptance

- Existing consumers compile with their existing APIs and native form values.
- Complete examples typecheck and remain self-contained outside the docs app.
- New controls pass meaningful keyboard, form, reset, validation, ref and focus
  checks; rich choices keep IDs independent of display labels.
- Grid layout changes preserve canonical cell identity and do not steal focus
  from an outside control or silently expand an invalid range.
- Narrow layouts and both themes stay contained. Shared easing follows live
  reduced-motion preferences; approved visual baselines are compared unchanged.
- Clean Next.js and Vite registry consumers compile and exercise the new controls;
  lean sign-in stays free of unrelated dependencies. Themed starter ZIPs build
  independently. Human/agent API and example identities agree.

Exact results and the distinction between the full core run and corrected-query
reruns are recorded in verification.md. Browser-quality acceptance passed all 398
cases without changing approved screenshots.

## After the verified core pass

1. Prepare a separately requested 0.3.0 retained release from the verified source.
   Preserve every immutable 0.2.0 byte, generate manifests/receipts, run release
   acceptance and explain the included APIs without implying an old install has
   acquired new behaviour. Commit, push and publication require owner instruction.
2. Review real touch hardware, particularly iPhone native keyboard/autofill/zoom,
   larger text, screen readers and long translated labels. Desktop WebKit is
   useful coverage, not a physical-device certification.
3. Use actual developer feedback to choose additional component examples and
   missing contracts. Do not inflate the family count with visual variants.
   External outreach occurs only when the owner chooses to invite people.
4. Profile catalogue mounting under representative hardware before changing its
   loading behaviour or making performance claims. Keep normal table, editable
   grid, scrolling supplied-data view and service ownership boundaries distinct.

Calendar writes/resource views/recurrence and storage/resumable upload services
remain possible later workflow work, outside this core pass. No paid tier,
hosted MCP endpoint, npm publication or automatic commit is included.
