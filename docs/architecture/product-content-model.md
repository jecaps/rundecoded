# Product content model

Phase 2 converts the audited legacy catalogue into deterministic, validated content. The generated catalogue is a migration baseline, not a claim that every legacy fact has been officially verified.

## Product shape

All products share identity, lifecycle, brand, categories, localized editorial copy, technologies, images, sources, and comparable-product references. A discriminated `kind` keeps category-specific fields separate:

- `shoe` owns surface, stability, heel-to-toe drop, stack height, weight, fit,
  and construction specifications;
- `apparel`, `sock`, `vest`, and `accessory` use category-specific attributes and cannot accidentally receive shoe-only fields.

The Zod schemas in `src/domain/catalogue/schema.ts` are the runtime contract and the source of inferred TypeScript types. Strict objects reject unknown fields so modelling mistakes remain visible.

## Localization and fallback

Localized values always contain the supported locale keys `en`, `de`, and `fr`. English is the required canonical fallback. A missing German or French value is stored as `null`, never an empty or silently copied string. `resolveLocalizedText` returns both the resolved text and whether English fallback was used, making fallback behaviour visible and testable.

## Evidence and source precedence

Facts and sources use one of four explicit statuses:

1. `verified` — checked against a retained official or retailer source;
2. `derived` — calculated from verified inputs;
3. `fallback` — preserved from the audited legacy catalogue but not yet re-verified;
4. `pending` — intentionally unknown and awaiting research.

Manufacturer sources take precedence for technical specifications. Decathlon product pages and image URLs take precedence for retail links and imagery. The legacy catalogue and workbook are migration evidence only and must not be upgraded to verified technical facts.

Sources retain URL, type, checked date, status, and notes. A verified evidence item must reference at least one source. Missing checked dates remain `null` and are not invented.

## Deterministic migration

`pnpm catalogue:migrate` reads the two Phase 0 CSV inventories, normalizes IDs and measurements, merges the documented New Balance alias, validates the result, and writes:

- `src/content/catalogue/products.json`;
- `reports/catalogue-reconciliation.json`;
- `reports/catalogue-quality.json`;
- `reports/catalogue-quality.md`.

Output ordering and formatting are stable and contain no generated timestamp. `pnpm catalogue:check` reruns the transformation in memory and fails if committed outputs differ. Every legacy product and provenance row receives a reconciliation entry, including merged aliases.

Structural errors fail validation. Explicit research gaps remain warnings so pending images, drops, or technologies can be tracked without weakening the contract.

Phase 8 extends the report with brand, category, and language counts; a local
asset audit; issue-type totals; and a machine-readable research queue. Weight
facts require a reference size whenever a value exists. Stack height, fit, and
construction remain explicit pending facts until an approved source supports
them.
