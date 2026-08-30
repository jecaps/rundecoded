# Current user journeys

These journeys describe the current product behaviour, not its internal implementation.

## 1. Browse the catalogue

1. Open the catalogue in English, German, or French.
2. Review the RunDecoded introduction and switch between Catalogue and Running Basics.
3. Scan a responsive grid of product cards.
4. Read brand, model, two category labels, best-for guidance, surface, stability, drop, and key technologies.
5. Move through results in pages of 12. Next replaces the current 12 products; Previous returns to the preceding page and the view returns to the start of the list.

Acceptance checkpoint: product cards remain readable at phone, tablet, and desktop sizes without horizontal page scrolling.

## 2. Search and filter

1. Type a brand, model, category, use, or benefit.
2. Receive autocomplete suggestions while typing.
3. Use tolerant matching for minor misspellings.
4. Optionally apply a primary-category chip.
5. See active filters, result counts, and a clear-all action.

Observed strengths:

- `kipride max` prioritises Kipride Max and Kipride Max Wide.
- short partial terms such as `addi` produce Adidas suggestions.

Observed weakness:

- long nonsense or unavailable-shoe queries can still return weak, unrelated matches instead of the intended “not found in the current range” recovery. The rebuild should use an explicit confidence threshold and a Decathlon search hand-off when confidence is too low.

## 3. Inspect a product

1. Open details from the product image, product title, or Details button.
2. Review the overview, best-for statement, technical specifications, official product link, construction and ride explanation, strengths and limitations, and comparable products.
3. Close with the close control, Escape, or the backdrop.
4. Return focus to the control that opened the dialog.

The product image and title are intentionally interactive; the entire card is not.

## 4. Compare products

1. Select a product with Compare.
2. Select a second product from the catalogue or a comparable-product row in the details dialog.
3. Open Quick comparison.
4. Review meaningful differences across best for, surface, stability, ride character, drop, weight, and primary category.

Weight should not be highlighted as better when the stated weights use different reference sizes.

## 5. Learn through Running Basics

1. Open the Running Basics tab without losing the selected language or theme.
2. On desktop, use the sticky topic navigation.
3. On mobile, open the topic selector and choose a topic.
4. Smooth-scroll to Pronation, Foot strike, Drop, Stack height, Cushioning, Fit and sizing, or Training use.
5. Read the page as a freely browsable reference rather than a mandatory lesson sequence.

The content must remain educational rather than diagnostic and should use catalogue products only as examples.

## 6. Change presentation preferences

1. Change English, German, or French from the compact footer language control.
2. Toggle light or dark mode.
3. Navigate between pages and retain both preferences.

## Accessibility expectations

- interactive controls have accessible names and visible keyboard focus;
- dialogs trap focus, close with Escape, and restore focus;
- selected tabs, filters, languages, and comparison states are programmatically exposed;
- text and controls meet WCAG AA contrast in both themes;
- reduced-motion preferences disable nonessential smooth movement.
