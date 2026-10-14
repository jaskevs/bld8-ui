# Third-party notices

React DayPicker 10.0.2 provides calendar selection and keyboard navigation.
Source: https://github.com/gpbl/react-day-picker . Its full MIT notice is included
in `DAY_PICKER_LICENSE`. date-fns and @date-fns/tz are transitive dependencies;
their MIT notices accompany their installed npm distributions. BLD8 supplies its
own token-based styling rather than copying another library's styled calendar.

Lucide React 1.55.0 supplies the standard icon family. Source:
https://github.com/lucide-icons/lucide . Its ISC licence and the MIT notice for
Feather-derived icons are reproduced in the included `LUCIDE_LICENSE` file.
The original BLD8 dotted arrow is separate artwork. Named Lucide components are
ordinary package dependencies; the icon directory's generated SVG downloads
retain the full upstream licence notices.

Base UI is used as an installed dependency for accessible interaction primitives. Source: https://github.com/mui/base-ui . Its licence is reproduced below. Base UI remains an installed dependency. Selected shadcn/ui Base UI composition patterns are adapted as described below.

MIT License

Copyright (c) 2019 Material-UI SAS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Selected composition patterns are adapted from shadcn/ui (MIT, copyright 2023 shadcn). Pinned upstream revision: 30a58d4498f270af1c1e981a7d78a15cf5740841. The full notice is in SHADCN_LICENSE. Drawer, context-menu and sidebar compositions and the button variant pattern retain BLD8 styling and focused APIs. Provenance and source hashes: docs/upstream.json in the repository.

Tailwind CSS 4.3.0 and its CLI are build dependencies (MIT). clsx, class-variance-authority and tailwind-merge are runtime dependencies (MIT). Their notices accompany installed npm distributions. Compiled utilities are included; consuming applications do not need Tailwind.

## React Hook Form

React Hook Form 7.90.0 is an optional MIT dependency for the adapter and examples. Its package includes the original licence. No upstream source is vendored. https://github.com/react-hook-form/react-hook-form
