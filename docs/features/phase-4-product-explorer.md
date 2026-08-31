# Phase 4 product explorer

Phase 4 delivers the first complete catalogue slice through the new RunDecoded
architecture. It uses the validated Phase 2 catalogue as runtime data; the
legacy demo remains a product and visual reference and is not imported as
application code.

## Representative product slice

The first slice intentionally contains exactly 12 shoes so every important card
and dialog state can be reviewed on one page. The selection covers road, trail,
stability, racing, maximum cushioning, entry-level, and waterproof use cases.

| Product                        | Primary role       | Why it is included              | Deliberate state                             |
| ------------------------------ | ------------------ | ------------------------------- | -------------------------------------------- |
| Adidas Adistar 5               | Maximum cushioning | Long, easy road running         | Verified image and fallback weight reference |
| Adidas Terrex Agravic 4        | Trail              | General trail running           | Verified image and fallback weight reference |
| ASICS Gel-Kayano 32            | Stability          | Structured daily training       | Verified image; weight pending               |
| ASICS Gel-Sonoma 8 GTX         | Waterproof trail   | Wet-weather trail use           | Verified image; weight pending               |
| Brooks Ghost 17                | Daily trainer      | Familiar neutral road reference | Verified image; weight pending               |
| Decathlon Jogflow 100.1        | Entry level        | First runs and budget use       | Verified image and fallback weight reference |
| Decathlon Jogflow 190 Grip WP  | Waterproof trail   | Entry-level wet trail use       | Verified image and fallback weight reference |
| Kiprun Kipclimb Race           | Trail racing       | Fast technical trail use        | Image and weight pending                     |
| Kiprun Kipride Support         | Stability          | Guidance-focused road use       | Image and weight pending                     |
| Kiprun Kipstorm Elite          | Road racing        | Carbon race-day reference       | Verified image; weight pending               |
| New Balance FuelCell Propel v5 | Fast training      | Plated training reference       | Verified image; weight pending               |
| Puma Deviate Nitro 4           | Super trainer      | Fast road training              | Verified image; weight pending               |

Pending data is displayed honestly rather than inferred. Approved local images
live under `public/assets/shoes`; products without an approved image render the
designed pending-image state.

## Explorer behaviour

- Search matches localized product text, brand, model, category, and technical
  values.
- Category filters and search reset pagination to the first valid page.
- Pages contain at most 12 products and replace, rather than append to, the
  current result grid. The initial representative slice therefore has one page;
  unit tests exercise multi-page behaviour with a larger fixture.
- Cards present product facts without prices or weights. Product images, product
  titles, and Details actions open the accessible details dialog.
- Details include intended use, construction, explicit weight reference sizes,
  comparable products, and available sources.
- Comparison can start from cards or from a comparable product in the details
  dialog. The current details product is retained in that flow.
- Weight is never highlighted as a difference when reference sizes differ or
  either reference is missing.
- English, German, and French interface copy updates immediately when the shared
  footer language control changes.

## Accessibility and responsive review

Radix Dialog supplies focus trapping, Escape dismissal, and modal semantics.
RunDecoded additionally restores focus to the control that opened the details or
comparison dialog. Search, filters, selection state, result counts, pending
states, and dialog controls expose accessible labels and live status where
appropriate.

Playwright captures the catalogue content at the Phase 0 target viewports:

- phone: 390 × 844, one card column;
- tablet: 768 × 1024, two card columns;
- desktop: 1280 × 900, three card columns.

The committed screenshots are the Phase 4 review baseline. Browser tests also
cover details and focus restoration, comparison rules, search and filters,
empty-state recovery, and live locale changes.

## Validation

Use the following commands before merging:

```sh
pnpm catalogue:check
pnpm quality
pnpm test:e2e
```
