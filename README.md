# RunDecoded

RunDecoded is the next-generation running-product training app. It will be rebuilt from the ground up with Astro, React, TypeScript, Tailwind CSS, shadcn/ui, and Radix primitives.

The existing [Running Shoe Explorer](https://github.com/jecaps/running-shoe-explorer) is a stable public demo and a product reference. Its source code is not the foundation of this repository.

## Current status

Phase 7 introduces durable localized routes and metadata across the Phase 5
product explorer and Phase 6 Running Basics guide. The URL is now the language
source of truth, language switching preserves shareable page state, and every
supported page publishes localized canonical and `hreflang` metadata. The
primary routes are available below the repository base path:

- `/rundecoded/en/catalogue/`
- `/rundecoded/de/catalogue/`
- `/rundecoded/fr/catalogue/`
- `/rundecoded/en/running-basics/`
- `/rundecoded/de/running-basics/`
- `/rundecoded/fr/running-basics/`

Both routes use the same responsive banner, navigation, footer, theme, and
language controls. A small component preview is available at each locale's
`design-system/` route. See the [localized-routing guide](docs/architecture/localized-routing.md)
for route behavior, state preservation, fallback policy, and metadata. The
[design-system guide](docs/architecture/design-system.md) documents tokens,
breakpoints, and component-adoption rules.

See the [Phase 6 Running Basics guide](docs/features/phase-6-running-basics.md)
for the topic model, multilingual content, navigation behavior, and test
coverage. The [Phase 5 complete explorer guide](docs/features/phase-5-complete-explorer.md)
documents search ranking, URL state, comparison, and explorer accessibility.
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
