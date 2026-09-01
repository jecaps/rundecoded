# Phase 5 complete catalogue explorer

Phase 5 completes the catalogue interaction model introduced in Phase 4. It
adds predictable search, shareable explorer state, more useful comparisons,
and automated accessibility coverage without introducing a backend.

## Search and suggestions

- Fuse.js searches model, brand, categories, intended use, technologies,
  stability, and surfaces with field-specific weights.
- Model names receive the strongest weight, so an exact model match ranks above
  a broader category match.
- Search tolerates useful misspellings while its threshold prevents unrelated
  results and suggestions for nonsense input.
- Suggestions cover brands, models, categories, and product attributes. The
  combobox supports arrow keys, Enter, and Escape as well as touch and pointer
  input.
- A genuine empty state links to a locale-appropriate Decathlon search instead
  of pretending a distant catalogue result is relevant.

## Filters, URLs, and pagination

The query string is the durable source of shareable explorer state:

- `q` stores the search query;
- `category` stores a valid category identifier;
- `page` stores a positive page number.

Invalid values fall back safely. Search typing replaces the current history
entry, while deliberate filter, suggestion, and pagination actions create a new
entry. Browser Back and Forward restore the matching interface state. Reloading
the URL produces the same search, filter, and page.

Every page contains at most 12 products and replaces the current grid rather
than appending to it. The repository still intentionally contains the 12-product
representative slice from Phase 4, so it currently has one page. Migrating the
complete validated catalogue remains Phase 8 work.

## Details and comparison

- Comparable products are ranked from shared intended use, category, surface,
  stability, drop, and curated relationships. The ranking also rewards a useful
  cross-brand alternative.
- Comparison includes a localized summary of meaningful category, surface, and
  drop differences rather than relying on a dense table alone.
- Missing facts remain visibly pending and are never inferred.
- Weight is not presented as a difference when reference sizes differ or a
  reference is missing.
- Price is outside the current product contract and does not appear in cards,
  details, or comparison.

## Accessibility and responsive behaviour

The search field follows the ARIA combobox pattern, suggestions expose listbox
semantics, filter state is announced, and interactive targets have keyboard and
touch support. Radix dialogs retain focus management, Escape dismissal, and
focus restoration. Comparison remains horizontally scrollable on narrow
screens.

Playwright and axe-core cover the base explorer, open suggestions in light and
dark themes, and product details. Browser tests also cover URL restoration,
keyboard suggestions, the external fallback, comparison summaries, and phone,
tablet, and desktop screenshots. Additional screenshots record the suggestion
panel and comparison dialog for focused visual review. Pixel baselines are
reviewed locally on the platform that generated them; CI continues to verify
the corresponding content, interaction, accessibility, and layout assertions
without comparing operating-system-specific font rendering.

## Validation

Run the complete Phase 5 verification with:

```sh
pnpm catalogue:check
pnpm quality
pnpm test:e2e
```
