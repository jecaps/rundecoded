# Phase 6 Running Basics reference guide

Phase 6 replaces the Running Basics placeholder with a freely browsable,
multilingual educational reference. The guide preserves the approved prototype
content while moving its data and behavior into the new Astro, React,
TypeScript, Tailwind CSS, and Radix architecture.

## Structured content

The `runningBasics` Astro content collection loads
`src/content/running-basics/topics.json` through the built-in file loader. Its
Zod schema validates:

- positive topic order;
- anchor-safe slugs;
- introductions and one or more editorial sections;
- optional bullet lists and callouts;
- complete English, German, and French translations.

The collection contains the seven approved topics in order: pronation, foot
strike, drop, stack height, cushioning, fit and sizing, and training use. Page
components only arrange structured fields, so a valid new topic can be added
without modifying the guide layout.

## Editorial layout

The guide favors open reading space and typography over nested cards. Topic
sections use a restrained two-column editorial flow at wider viewports and a
single readable column on phones. Only topic boundaries and the pronation
advisory callout receive visual separation.

Desktop viewports use a sticky Topics rail with one location marked active.
Phone and tablet viewports use a full-width Radix dropdown. Its portal-based
menu overlays the document instead of pushing topic content down the page, and
the trigger shows the chosen or currently tracked topic.

## Anchor and language behavior

Topic selection updates the URL hash and scrolls to the matching section. A
navigation lock keeps the requested topic active throughout long smooth jumps,
including rapid consecutive selections. Browser Back and Forward restore the
hash, scroll position, and active state. No destination highlight is added.

When `prefers-reduced-motion` is active, topic navigation uses instant scrolling.
The guide reads the locale query on hydration and responds to the shared footer
locale event, so all headings and content update immediately in English,
German, or French without a traditional page reload.

## Verification

Unit tests validate all topic records and translations and verify live locale
updates. Playwright covers:

- all seven topics;
- rapid long jumps and browser history;
- reduced-motion scrolling;
- mobile overlay geometry and selected labels;
- direct English, German, and French hashes;
- live footer language changes;
- axe-core accessibility checks;
- phone and desktop reading widths and local visual baselines.

Pixel baselines remain local because operating systems render fonts differently;
CI still runs the corresponding content, layout, interaction, and accessibility
assertions.
