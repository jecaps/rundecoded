# GitHub Pages preview builds

RunDecoded is built for the repository-hosted URL
`https://jecaps.github.io/rundecoded/`. Astro's `site` and `base` settings live
in `site.config.mjs`, and application links are generated from the shared route
definitions in `src/lib/routes.ts`.

The repository is private, so the workflow produces review artifacts without
requiring a public Pages deployment. The same `dist` directory is compatible
with GitHub Pages if Pages deployment is enabled later.

## Local development

Install dependencies and start Astro:

```sh
pnpm install
pnpm dev
```

Open the two direct routes:

- `http://localhost:4321/rundecoded/catalogue/`
- `http://localhost:4321/rundecoded/running-basics/`

## Local production preview

Build, validate, and serve the production output:

```sh
pnpm build
pnpm verify:pages
pnpm preview
```

Open the same `/rundecoded/` routes shown above. `verify:pages` fails if either
direct route is missing, the root redirect is incorrect, or a generated root
asset/link path escapes the repository subpath.

## Pull-request review

Every pull request targeting `main` runs the **Pages preview** workflow. To
review its output:

1. Open the pull request's **Checks** tab.
2. Open the **Pages preview** workflow run.
3. Confirm that **Build Pages preview** succeeded.
4. Download `rundecoded-pages-preview-<pull-request-number>` from the run's
   **Artifacts** section when the generated static files are needed.
5. For an interactive review, check out the pull-request branch and follow the
   local production-preview steps above.

The workflow also uploads the Pages-formatted `github-pages` artifact. A future
deployment workflow can pass that artifact to `actions/deploy-pages` after the
repository has GitHub Pages enabled with **GitHub Actions** as its source.
