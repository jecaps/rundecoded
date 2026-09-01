# RunDecoded

RunDecoded is the next-generation running-product training app. It will be rebuilt from the ground up with Astro, React, TypeScript, Tailwind CSS, shadcn/ui, and Radix primitives.

The existing [Running Shoe Explorer](https://github.com/jecaps/running-shoe-explorer) is a stable public demo and a product reference. Its source code is not the foundation of this repository.

## Current status

Phase 5 completes the interactive product explorer experience on top of the
RunDecoded design system and shared application shell. Twelve representative
shoes now flow from the validated catalogue into typo-tolerant search,
predictive suggestions, URL-backed filters and pagination, responsive cards,
accessible details, and comparison. The primary routes are available below the
repository base path:

- `/rundecoded/catalogue/`
- `/rundecoded/running-basics/`

Both routes use the same responsive banner, navigation, footer, theme, and
language controls. A small component preview is available at
`/rundecoded/design-system/`. See the [design-system guide](docs/architecture/design-system.md)
for tokens, breakpoints, and component-adoption rules.

See the [Phase 5 complete explorer guide](docs/features/phase-5-complete-explorer.md)
for search ranking, URL state, comparison, accessibility, and review coverage.
The [Phase 4 product explorer guide](docs/features/phase-4-product-explorer.md)
retains the product-selection rationale and pending-data policy.

Phase 0 documentation remains available as the migration reference:

- [Phase 0 baseline](docs/baseline/README.md)
- [User journeys](docs/baseline/user-journeys.md)
- [Visual baseline](docs/baseline/visual-baseline.md)
- [Catalogue and asset audit](docs/baseline/catalogue-and-assets.md)
- [Behaviour contract](docs/baseline/behaviour-contract.md)
- [Migration and rollback workflow](docs/baseline/migration-workflow.md)
- [Verification checklist](docs/baseline/phase-0-verification.md)

The tracked roadmap is maintained in [GitHub Project 8](https://github.com/users/jecaps/projects/8).
See [GitHub Pages preview builds](docs/deployment/github-pages-preview.md) for
local production-preview and pull-request review instructions.

## Local development

RunDecoded requires Node.js 22.12 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

Install Chromium once before running browser tests locally:

```sh
pnpm exec playwright install chromium
```

The available quality commands are:

```sh
pnpm quality       # type-check, lint, format check, unit test, and build
pnpm test:unit     # Vitest component tests
pnpm test:e2e      # Playwright browser tests
pnpm verify:pages  # validate repository-subpath output
pnpm format        # apply Prettier formatting
```
