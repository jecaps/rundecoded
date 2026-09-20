# RunDecoded responsive redesign reference

## Status and authority

This folder records the approved structural direction for RunDecoded on phones
and tablets. It is a design and interaction guide, not a pixel-perfect
specification.

The linked GitHub issues and their acceptance criteria are authoritative for
implementation scope. If this mockup and an issue disagree, follow the issue.
For exact typography, spacing, colors, icon treatment, and component behavior,
use the existing RunDecoded design system, Tailwind tokens, shadcn components,
and current application patterns.

## Interactive mockup

Download or open [`mockup.html`](./mockup.html) locally to explore the phone
and tablet states. GitHub displays HTML source rather than running the mockup,
so use the **Download raw file** action and open the downloaded file in a
browser.

The mockup demonstrates layout structure, information hierarchy, responsive
behavior, and interaction intent. Its literal measurements and standalone CSS
are not production implementation instructions.

## Approved application structure

### Primary navigation

- Phone: compact bottom navigation with Catalogue, Find, Compare, and Basics.
- Tablet: compact left rail with the same destinations in the same order.
- Settings is opened from the header gear and is not duplicated as a primary
  navigation destination.
- The selected destination uses a filled background and remains identifiable
  without relying on color alone.

### Catalogue

- Phone uses compact one-column product rows, grouped by sticky brand headers.
- Tablet portrait uses the available width for a compact multi-column grid.
- Tablet landscape supports a catalogue-and-details master-detail layout.
- Search, quick filters, and full filters remain easy to reach.
- Full filters use a bottom sheet on phone and a right-side panel on tablet.
- Results form one continuous collection without a manual “Show more” step.
- Images reserve their dimensions and load below the fold lazily.

### Product details

- Phone uses a dedicated pushed detail screen and restores the exact catalogue
  state when the user returns.
- Tablet portrait uses a side panel.
- Tablet landscape uses the detail pane in the master-detail layout.
- “Best for” appears before detailed specifications, followed by shared visual
  scales, technical content, similar shoes, and accessible actions.

### Comparison

- Comparison selection is available directly from catalogue rows and cards.
- A compact selection tray appears after the first selection.
- Phone supports up to three shoes; tablet supports up to four.
- Selection persists for the browser session and is reflected in the Compare
  navigation badge.
- The comparison view emphasizes differences and reuses the same measurement
  scales as product details.

### Find and consultation

- Find is a primary destination on phone and tablet.
- Existing questionnaire content, recommendation logic, and result content are
  preserved unless a separate product decision changes them.
- The redesign board does not define every questionnaire or result detail; use
  the implementation issues and existing product behavior for those areas.

### Running Basics

- Phone uses compact topic chips or another space-efficient topic selector.
- Tablet uses a compact topic list beside the selected article.
- Article content links naturally to relevant catalogue views and the next
  topic.

### Settings

- Settings contains language and appearance controls.
- It is reached from the header gear.
- Appearance supports System, Light, and Dark behavior using established
  accessible shadcn/Radix patterns.

## Responsive and accessibility expectations

- Validate representative 320 px and 390 px phone widths.
- Validate approximately 744/768 px tablet portrait widths.
- Validate the 900 px transition and 1024/1133 px tablet landscape widths.
- Respect device safe areas and preserve at least 44×44 px interactive targets.
- Prevent horizontal overflow and content hidden behind sticky surfaces.
- Support light and dark themes with accessible contrast and no startup flash.
- Preserve URL state, browser history, scroll restoration, keyboard behavior,
  screen-reader semantics, and reduced-motion preferences.

## Implementation guidance

- Reuse Tailwind semantic tokens and existing shadcn components.
- Reuse the current RunDecoded typefaces, colors, icons, and compact selected
  states.
- Do not copy standalone mockup CSS into production.
- Prefer `rem`, `em`, responsive utilities, and existing breakpoints or focused
  component-level breakpoints over fixed mockup pixels.
- Avoid decorative shadows; use spacing, separators, and background changes
  for hierarchy.

## Related implementation issues

- [#82 — Create compact mobile catalogue rows](https://github.com/jecaps/rundecoded/issues/82)
- [#83 — Add responsive tablet catalogue layouts](https://github.com/jecaps/rundecoded/issues/83)
- [#84 — Improve responsive catalogue search, filters, and navigation](https://github.com/jecaps/rundecoded/issues/84)
- [#85 — Implement performant continuous catalogue rendering](https://github.com/jecaps/rundecoded/issues/85)
- [#86 — Create responsive product-details presentation](https://github.com/jecaps/rundecoded/issues/86)
- [#87 — Create responsive comparison selection and view](https://github.com/jecaps/rundecoded/issues/87)
- [#88 — Improve the consultation questionnaire on phones](https://github.com/jecaps/rundecoded/issues/88)
- [#89 — Improve consultation results on phones and tablets](https://github.com/jecaps/rundecoded/issues/89)
- [#90 — Add responsive visual and interaction coverage](https://github.com/jecaps/rundecoded/issues/90)

## Revision

Approved structural reference added on 2026-09-20.
