# RunDecoded

RunDecoded is the next-generation running-product training app. It will be rebuilt from the ground up with Astro, React, TypeScript, Tailwind CSS, shadcn/ui, and Radix primitives.

The existing [Running Shoe Explorer](https://github.com/jecaps/running-shoe-explorer) is a stable public demo and a product reference. Its source code is not the foundation of this repository.

## Current status

Phase 1 establishes the application foundation with Astro, React, and strict
TypeScript. The first placeholder routes are available at:

- `/catalogue`
- `/running-basics`

Both routes use the shared application layout. Phase 0 documentation remains
available as the migration reference:

- [Phase 0 baseline](docs/baseline/README.md)
- [User journeys](docs/baseline/user-journeys.md)
- [Visual baseline](docs/baseline/visual-baseline.md)
- [Catalogue and asset audit](docs/baseline/catalogue-and-assets.md)
- [Behaviour contract](docs/baseline/behaviour-contract.md)
- [Migration and rollback workflow](docs/baseline/migration-workflow.md)
- [Verification checklist](docs/baseline/phase-0-verification.md)

The tracked roadmap is maintained in [GitHub Project 8](https://github.com/users/jecaps/projects/8).

## Local development

RunDecoded requires Node.js 22.12 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

Before opening a pull request, verify the foundation with:

```sh
pnpm check
pnpm build
```
