# Behaviour contract

This contract prevents “rewrite” from meaning “copy everything” or “lose useful behaviour.”

## Preserve

- English, German, and French experiences.
- Persistent light and dark themes.
- Catalogue search by brand, model, category, intended use, and benefit.
- Predictive suggestions and tolerance for reasonable misspellings.
- Category filters, active-filter feedback, result counts, and clear all.
- True 12-product pagination with Previous and Next.
- Responsive catalogue cards and consistent product-image presentation.
- Details opened from image, title, or Details button.
- Two-product quick comparison, including comparison from related products.
- Running Basics as a separate, freely browsable reference page.
- Accessible dialog and navigation semantics.
- Official-product outbound links and visible uncertainty when facts are unavailable.

## Improve

- Use typed, validated content instead of sequential runtime overrides.
- Apply a search-confidence threshold so weak matches do not masquerade as results.
- Use route-aware localisation that cannot drift between pages.
- Give specifications explicit measurement context and source provenance.
- Make loading, empty, error, and unavailable states first-class UI states.
- Test keyboard behaviour, contrast, responsive layouts, and localisation automatically.
- Make related-product reasons data-driven and explainable.

## Retire

- The single-page HTML/CSS/JavaScript architecture.
- Inline style and script blocks, global state, and function reassignment layers.
- Workbook wording exposed as a user-facing technical authority.
- Price display; the product intentionally omits price from cards and details.
- Whole-catalogue rendering or cumulative “load more” behaviour.
- Duplicate category labels when primary and secondary categories are identical.
- Unqualified “lighter is better” comparison messaging.

## Compatibility rule

The public prototype remains available as the demo throughout the rebuild. A new implementation may intentionally differ when this contract marks the old behaviour for improvement or retirement. Any other user-visible regression needs an issue and an explicit product decision.
