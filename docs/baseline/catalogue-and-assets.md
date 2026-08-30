# Catalogue and asset audit

## Inventory

| Area | Current state |
| --- | --- |
| Catalogue displayed | 106 products |
| Image provenance records | 107 |
| Local shoe image files | 110 |
| Verified-image records | 98 |
| Official-image-pending records | 9 |
| Product pages in provenance file | 90 Decathlon Germany, 5 Decathlon UK, 2 Decathlon Italy, 10 missing |
| Source-image hosts | 97 Decathlon media, 1 external CDN, 9 missing |
| Core catalogue | inline data and overrides in `index.html` |
| Workbook fallback | `catalogue-workbook-data.js` |
| KIPRUN supplements | `kiprun-details.js` |
| Image mapping | `catalogue-images.js` |
| Image provenance | `catalogue-image-sources.json` |
| Normalised images | `assets/shoes/` |

The count differences are a reconciliation task, not an invitation to silently delete records. The new typed catalogue must make active, replaced, unavailable, and pending products explicit.

The complete inventories are available as reviewable CSV files:

- [`legacy-products.csv`](legacy-products.csv) contains all 106 rendered products, their categories, card specifications, technologies, three translated best-for values, and display image.
- [`image-provenance.csv`](image-provenance.csv) contains all 107 image-provenance records, source status, product page, source image, and workbook matching phrase.

## Field-level findings

- 106 of 106 rendered brand/model pairs are unique.
- Surface and stability are present on all 106 cards.
- Drop is pending on 7 products.
- Card-level technologies are pending on 9 products.
- Best-for guidance is present in English, German, and French for all 106 products.
- Five products render the same translated text for primary and secondary category: KIPRUN Kipstorm Tempo, KIPRUN Kipstorm Interval, Adidas Adizero Evo SL, Brooks Hyperion 3, and Mizuno Neo Zen 2. The rebuild should prevent this at schema or presentation level.

## Source policy for the rebuild

1. Identify a product by brand, exact model, variant, and gender/size context where relevant.
2. Prefer the manufacturer for technical facts such as drop, stack, weight, construction, and intended use.
3. Use Decathlon for the outbound product destination and Decathlon-hosted product imagery.
4. Record the reference shoe size next to weight when the source supplies it.
5. Store source URL, source type, checked date, and verification status per fact or fact group.
6. Do not invent a value when an official source does not provide one.
7. Treat the legacy workbook as matching evidence only, never as the final technical source of truth.

## Image rules

- Use Decathlon-hosted photos for products offered by Decathlon.
- Store a local normalised derivative for reliable display while retaining its provenance URL.
- Preserve the complete shoe silhouette, centre it consistently, and use containment rather than aggressive cropping.
- Keep original attribution/provenance metadata separate from the display asset.
- Render an honest pending state when an approved image is unavailable.

## Known gaps and risks

- Nine products intentionally have official images pending.
- Ten provenance entries lack a product page.
- One recorded image uses a non-Decathlon CDN and requires review before migration.
- The UI has 106 products while provenance contains 107 records and the asset directory contains 110 files.
- The extra provenance record is an alias/obsolete duplicate: `New Balance | Propel v5` alongside the rendered `New Balance | FuelCell Propel v5`. Reconciliation must retain the preferred name and merge its German Decathlon link without creating a second product.
- Product facts are assembled through sequential JavaScript overrides, so the final displayed source is difficult to audit mechanically.
- Some legacy KIPRUN model names have no current official listing and require product-owner clarification rather than guesswork.

## Migration output expected in later phases

A validated TypeScript schema should separate:

- product identity and lifecycle status;
- translated editorial content;
- technical specifications and measurement context;
- categories and use cases;
- image assets and provenance;
- official and Decathlon product links;
- related-product relationships;
- per-field verification state.

The migration importer should produce a reconciliation report for every legacy product, image, and source record.
