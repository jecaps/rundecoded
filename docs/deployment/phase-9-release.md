# Phase 9 release and rollback runbook

Phase 9 verifies the application against the approved journeys and gives the
repository a deliberate, reversible GitHub Pages release path. The public
prototype in [`jecaps/running-shoe-explorer`](https://github.com/jecaps/running-shoe-explorer)
remains available as the reference and fallback while this repository is
released.

## Release gates

Run the full checks locally before opening a release pull request:

```sh
pnpm quality
pnpm test:e2e:production
```

The production audit builds `dist`, validates the localized route and metadata
contract, enforces the static asset budgets, then runs the existing Playwright
journeys against `astro preview` rather than the development server. The suite
covers English, German, and French content, keyboard and pointer flows, reduced
motion, accessibility checks, and the phone, tablet, and desktop viewport
assertions already documented by the feature guides.

The initial budgets are intentionally simple release guardrails:

| Asset family | Uncompressed budget | Why                                            |
| ------------ | ------------------: | ---------------------------------------------- |
| JavaScript   |             600 KiB | Keep the interactive explorer payload bounded. |
| CSS          |             100 KiB | Keep the shared design system lightweight.     |

If a feature needs to exceed a budget, update this table and
`scripts/verify-production-budget.mjs` in the same reviewed pull request with
the reason and a before/after measurement.

## GitHub Pages deployment

The production workflow should run only for `main` and manual dispatches. It
builds and verifies the output, checks the budgets, uploads the Pages artifact,
deploys through the `github-pages` environment, and smoke-tests the English
catalogue plus German and French Running Basics routes.

Repository settings required once by an administrator:

- **Settings → Pages → Build and deployment:** choose **GitHub Actions**;
- keep the `github-pages` environment protected if approval is required before
  production deployment;
- use the generated URL `https://jecaps.github.io/rundecoded/` as the launch
  URL and test all three localized route families after the first deployment.

Astro's `site.config.mjs` is the single source for the origin and `/rundecoded`
base path. A future custom domain should be introduced by changing that config,
adding a reviewed `public/CNAME`, and re-running the canonical and `hreflang`
checks; it is not enabled by this phase.

GitHub Pages serves hashed `_astro` assets with long-lived cache keys while
HTML documents remain revalidated by the platform. Do not add cache-busting
query strings to localized routes; deploy a new build when content changes.

## Rollback

Every deployment is tied to the exact `main` commit that produced its artifact.
To roll back safely:

1. identify the last known-good commit from the Pages workflow history;
2. if the bad commit is already on `main`, create a small revert pull request
   and let the normal quality and production-audit checks run;
3. merge the revert only after the checks pass, allowing the protected Pages
   workflow to redeploy the known-good state; and
4. smoke-test the localized routes and keep the public prototype available
   until the incident is closed.

For an urgent incident, the release owner can dispatch the deployment workflow
from the known-good branch or commit after recording the incident and follow up
with the revert pull request. Never delete the previous artifact or rewrite the
public prototype as part of rollback.

## Release notes and evidence

The Phase 9 pull request should link issues [#10](https://github.com/jecaps/rundecoded/issues/10),
[#46](https://github.com/jecaps/rundecoded/issues/46), and
[#47](https://github.com/jecaps/rundecoded/issues/47), and include:

- the `quality` and `test:e2e:production` results;
- the production-audit artifact or screenshots for phone, tablet, and desktop;
- the Pages workflow run and deployed URL; and
- any changed threshold, domain, or rollback decision.
