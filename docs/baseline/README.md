# Phase 0: prototype baseline

Phase 0 preserves the product knowledge of the public prototype without carrying its implementation into the new application.

## Source baseline

| Item | Value |
| --- | --- |
| Public reference | [jecaps/running-shoe-explorer](https://github.com/jecaps/running-shoe-explorer) |
| Captured commit | `0d834ce10e83f576a959af058935d9119eb0eb0e` |
| Commit date | 2026-08-26 |
| Commit subject | `Open product details from card images and titles` |
| Capture date | 2026-08-30 |
| Catalogue shown in UI | 106 products |
| Languages | English, German, French |

The reference worktree had no tracked modifications when captured. An unrelated untracked roadmap file was present and was not included.

## Phase 0 boundaries

Included:

- document current journeys and responsive behaviour;
- capture representative screenshots;
- inventory catalogue data, image provenance, and source limitations;
- classify behaviour as preserve, improve, or retire;
- define the migration, review, and rollback process.

Excluded:

- Astro or React scaffolding;
- copying HTML, CSS, JavaScript, or catalogue modules from the prototype;
- changing or deploying the public demo;
- selecting the future production database or API implementation beyond the approved roadmap.

## How this baseline is used

During later phases, every replacement journey should be checked against the [behaviour contract](behaviour-contract.md) and [screenshots](visual-baseline.md). Matching the old implementation line-for-line is not a goal. Preserving the useful user outcome is.

This documentation completes the deliverables of issues [#1](https://github.com/jecaps/rundecoded/issues/1), [#12](https://github.com/jecaps/rundecoded/issues/12), [#13](https://github.com/jecaps/rundecoded/issues/13), and [#14](https://github.com/jecaps/rundecoded/issues/14).
