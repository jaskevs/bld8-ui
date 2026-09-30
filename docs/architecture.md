# Architecture and foundation choice

Decision: React first, using Base UI as a dependency and original BLD8 styling.

## Options considered

- Base UI plus a styled layer: selected. Its unstyled primitives let the project retain its own CSS and visual identity, while upstream maintains complex interaction behaviour.
- Adapt shadcn/ui: a strong alternative for a larger ready-styled catalog and copy-in distribution. More of the styled source becomes ours to maintain after copying. It was reviewed but no shadcn source was copied.
- Fork an entire library: unnecessary for this initial release; it would add upstream reconciliation work unrelated to the intended visual and component API work.
- Generate every interaction from scratch: avoid reimplementing focus management, keyboard selection and popup behaviour without a need.

## Boundaries

`packages/ui` compiles to an ESM package with declarations and a separate CSS entry point. React and React DOM are peers. Base UI stays a normal runtime dependency. Native HTML handles simple fields, switches, checkboxes and radio groups. Complex selection, overlays, tabs, accordion and toast use Base UI.

`apps/docs` is a Next.js consumer of the built package. It supplies fonts, page layout, fixtures, demo actions and short usage guidance. The development runner watches package TS and CSS so the docs update after a save. Package source does not import Next.js.

Themes live in namespaced CSS variables. Set the theme on the document root so portal content inherits it. Every application still owns meaningful labels, content, errors and data handling. App composition requires its own accessibility validation.

## Next decisions

Select a public licence and package namespace before publication. Decide whether consumers prefer npm releases or copy-in distribution after using the library in a real project. An Angular implementation would share tokens and design decisions, while using Angular-native component behaviour; React wrappers cannot be reused directly.

## Sources checked 28 September 2026

- https://base-ui.com/react/overview/about
- https://base-ui.com/react/overview/quick-start
- https://ui.shadcn.com/docs
- https://www.spartan.ng/documentation/introduction

Base UI 1.8.0, React 19.3.0 and Next.js 16.3.6 are pinned in the lockfile. Review upstream release notes and run the suite before updates.