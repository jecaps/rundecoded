# Migration and rollback workflow

## Repository roles

- `jecaps/running-shoe-explorer`: public, stable reference demo; no rebuild work.
- `jecaps/rundecoded`: private, ground-up application and roadmap work.

No source file from the public prototype is copied into the new application. Product requirements, verified content, approved images, and observed behaviour may be migrated through reviewed, typed data processes.

## Delivery workflow

1. Start from a roadmap issue in [Project 8](https://github.com/users/jecaps/projects/8).
2. Create a focused branch named `codex/phase-N-description`.
3. Keep commits scoped to one deliverable where practical.
4. Open a pull request that links the issue and lists user-visible changes.
5. Run the phase quality gates.
6. Review responsive screenshots and accessibility behaviour.
7. Merge only after the acceptance criteria are satisfied.
8. Update the project item and child issues with evidence.

## Planned quality gates

- formatting, linting, and TypeScript checks;
- unit tests for schema, search, filters, localisation, and comparison logic;
- component interaction and accessibility tests;
- end-to-end tests for the journeys in `user-journeys.md`;
- responsive visual captures matching the baseline viewport matrix;
- data validation and source-provenance reconciliation.

| Change type | Checks required before merge |
| --- | --- |
| Every pull request | formatting, lint, TypeScript, unit tests, linked issue, and reviewer approval |
| UI or interaction | component tests, relevant end-to-end journey, accessibility checks, and affected baseline viewports |
| Translation | locale completeness and route-persistence tests for English, German, and French |
| Catalogue or image data | schema validation, duplicate detection, pending-value report, and provenance reconciliation |
| Deployment configuration | production build plus post-deploy smoke test |

A failing required check, an unexplained visual difference, missing source provenance, or an unresolved acceptance criterion blocks merging.

## Release and rollback

- Tag deployable milestones and retain the preceding deployment artifact.
- Promote a release only after smoke tests on phone, tablet, and desktop.
- Roll back by redeploying the previous known-good tag or commit.
- Keep the public prototype online as an independent fallback until the new application has completed final acceptance and an explicit cutover decision is made.
- Data migrations must be reversible or backed up before production execution.

## Phase 0 rollback

Phase 0 contains documentation and screenshots only. It does not modify the public prototype or create an application runtime. Reverting its single documentation commit restores the private repository to its initial state.

## Restore the captured public demo locally

The captured rollback point is commit `0d834ce10e83f576a959af058935d9119eb0eb0e` in `jecaps/running-shoe-explorer`.

```sh
git clone https://github.com/jecaps/running-shoe-explorer.git
git -C running-shoe-explorer switch --detach 0d834ce10e83f576a959af058935d9119eb0eb0e
python3 -m http.server 4173 --directory running-shoe-explorer
```

If the public deployment ever needs restoration, redeploy that commit through the normal GitHub Pages workflow or open a reviewed revert pull request. Do not force-push the public repository.
