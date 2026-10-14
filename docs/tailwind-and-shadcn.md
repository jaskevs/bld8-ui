# Tailwind and shadcn authoring

User-approved direction, 13 October 2026.

## Layers and ownership

- Base UI 1.8.0 owns complex interaction behaviour.
- Selected shadcn/ui Base UI composition patterns provide a starting structure.
- BLD8 owns its public APIs, styling, tokens, motion, examples and adaptations.
- Tailwind CSS / CLI 4.3.0 compile styles during development and builds.
- Lucide remains the shared icon family. React Aria and Radix are not added.

This is an incremental adoption. Drawer, ContextMenu and Sidebar use prefixed
Tailwind utilities; Button/Input compatibility styles are authored with @apply.
The rest of the working CSS is retained. Existing exports and consumers remain
supported. It is not a wholesale shadcn fork or a drop-in shadcn replacement.

## Editing and building

Run npm ci, then npm run dev at the repository root. The local showcase uses
http://127.0.0.1:3120. The runner watches UI/block TypeScript, regular CSS and the
Tailwind source. Saving a statically written class in packages/ui/src or
packages/blocks/src rebuilds utilities and refreshes Next.

packages/ui/src/tailwind.css explicitly scans those two directories. Classes use
the bui: prefix (for example bui:flex, bui:bg-accent). Theme aliases resolve to the
existing --bui-* tokens. No Preflight reset is included. cn merges conflicting
prefixed utilities; buttonVariants defines the existing CVA variants and sizes.
Compatibility .bui-button/.bui-input rules retain their original unlayered CSS
priority, so an app's broad element reset cannot change action colours.
Custom CSS or design tokens remain the way to override these legacy rules.

npm run build compiles UI, CSS, blocks, generated content and the Next app.
Consumers import @bld8/ui/styles.css, which imports included tokens.css and the
compiled tailwind.css. They need no Tailwind/PostCSS build.

New utility classes written in a consuming app are not magically in the
precompiled stylesheet. Use that app's own Tailwind setup or regular CSS.
Downloaded starters include the source, workspace dependencies and build script;
npm run build rebuilds both packages and the application. npm run dev in a
download runs Next only: rebuild a changed local package before refreshing.
Do not feed src/tailwind.css directly into an app expecting compiled CSS.

## Controls

SidebarProvider stores desktop and mobile state separately. Desktop open state
can be controlled; defaultOpen is the uncontrolled option. A ResizeObserver
switches containers below 640px to a left Drawer. Desktop collapse retains
accessible labels and tooltips. There are no cookies or global shortcuts.
Use one Sidebar and one SidebarTrigger per provider. Navigation and persistence
belong to the consuming app.

Drawer exposes bottom, left and right sides, a required title, an optional
description/trigger and controlled or uncontrolled state. Base UI supplies
focus containment, restoration, Escape and swipe behaviour. BLD8 supplies
lifecycle transitions and reduced-motion styles. Snap points and nested drawer
stacks are outside this first public API.

ContextMenu composes Base UI items, groups, submenus and checkbox/radio items.
ContextMenuContent accepts side, align and sideOffset for nested placement.
Base UI names nested menus from their trigger. Always provide a visible route
to the same actions; a context menu must not be the only way to perform a task.

Outline demonstrates all three. Its existing planner, resources and settings
remain mounted while changing views, retaining in-memory drafts.

## Source provenance and distribution

docs/upstream.json records the upstream revision, original paths and SHA-256
hashes. packages/ui/SHADCN_LICENSE contains the full MIT notice. Preserve it in
package archives and starters, alongside the existing third-party notices.
Upstream source changes are reviewed manually before adaptation.

The shadcn registry under /r installs source and dependencies through the real CLI.
Earlier source manifests remain under /sources. Local workspaces and runnable
ZIP starters are also supported; packages remain unpublished on npm. See registry.md.
