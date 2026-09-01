# Phase 8: full catalogue migration

Phase 8 replaces the 12-product presentation slice with the complete approved
Phase 0 catalogue. All 106 products now pass the Phase 2 runtime schema and are
available to search, filter, paginate, compare, and open in the detail dialog.

## Coverage and evidence

- 106 stable, unique product IDs are migrated from 106 catalogue rows and 107
  provenance rows.
- The documented New Balance alias is merged without dropping its source row.
- 97 verified Decathlon images are committed locally; nine unresolved images
  remain explicit `pending` entries with no misleading local path.
- All category labels and image alternative text contain English, German, and
  French values.
- Legacy specification values remain `fallback` unless an approved source has
  verified them. Missing values remain `pending` rather than being guessed.
- Four previously recorded weights retain their reference sizes and fallback
  provenance. Stack height, fit, and construction are pending for the complete
  catalogue because the audited inputs do not contain those facts.

## Categories and comparables

Duplicate primary and secondary categories are collapsed during migration and
reported as warnings. The legacy `Stability shoe` value is normalized to the
schema's `stability` value, so the eight stability-and-guidance products are no
longer classified as unknown.

Each product receives three deterministic comparable IDs. Ranking rewards
shared categories, surfaces, stability, and drop, with a small cross-brand
preference. Every generated comparable resolves to a current product, shares an
intended-use signal, and each product has at least one cross-brand option.

## Assets

Verified images can be copied from the audited legacy repository with:

```sh
pnpm catalogue:assets -- --source-root "/absolute/path/to/Running Shoe Explorer"
```

The copy step only accepts safe local paths that are currently marked
`verified`. It does not copy pending images or obsolete alias assets. The normal
catalogue migration fails when a verified image is absent from `public/`.

## Reproducible quality reports

Run the migration when audited inputs change:

```sh
pnpm catalogue:migrate
```

It writes the validated catalogue, reconciliation report, machine-readable
quality report, and human-readable quality report. The reports include:

- product, source-row, image, warning, and comparable-link totals;
- counts by brand and category;
- translation coverage by language;
- pending and fallback counts by field;
- a product-level research queue suitable for future GitHub issues;
- an asset inventory that records whether every expected local file exists.

Use `pnpm catalogue:check` in CI and before committing. It regenerates the same
outputs in memory and fails if the checked-in artefacts drift. The current
reports are [catalogue-quality.json](../../reports/catalogue-quality.json) and
[catalogue-quality.md](../../reports/catalogue-quality.md).
