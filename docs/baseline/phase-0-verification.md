# Phase 0 verification

## Issue mapping

| Issue | Deliverable | Status |
| --- | --- | --- |
| [#12](https://github.com/jecaps/rundecoded/issues/12) | Current journeys and visual baseline | Complete locally |
| [#13](https://github.com/jecaps/rundecoded/issues/13) | Catalogue, image, and source audit | Complete locally |
| [#14](https://github.com/jecaps/rundecoded/issues/14) | Migration and rollback workflow | Complete locally |
| [#1](https://github.com/jecaps/rundecoded/issues/1) | Phase 0 parent acceptance | Ready for review after branch push |

## Checks performed

- Captured the public prototype at commit `0d834ce10e83f576a959af058935d9119eb0eb0e`.
- Verified catalogue page 1 shows products 1–12 of 106.
- Verified Next shows 13–24 and Previous returns to 1–12.
- Verified exact-model search for `kipride max` returns the two intended variants.
- Verified predictive suggestions for partial brand/model input.
- Recorded the weak-match no-result defect for improvement.
- Opened and reviewed a product details dialog.
- Compared two products and reviewed the comparison rows.
- Opened Running Basics in English on desktop and phone.
- Captured desktop, tablet, and phone evidence in light and dark themes.
- Confirmed the inspected browser session reported no console errors.
- Counted provenance statuses, product-page hosts, source-image hosts, and local image files.
- Produced a 106-row rendered-product audit and a 107-row image-provenance audit.
- Confirmed the public worktree had no tracked changes during capture.

## Tooling note

The legacy workbook verification helper currently requires `@oai/artifact-tool` and a source workbook path. It is not self-contained in a fresh checkout, so it was inspected but could not be rerun as part of this baseline. The new migration tooling must install and lock all dependencies and produce a reproducible report.

## Before closing Phase 0

- [ ] Review this baseline in a pull request.
- [ ] Attach or link the pull request to issues #1, #12, #13, and #14.
- [ ] Confirm the source count discrepancies are accepted as migration inputs.
- [ ] Merge the documentation without adding application code.
- [ ] Close the child issues and then the parent issue.
