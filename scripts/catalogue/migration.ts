import type {
  Evidence,
  LocalizedText,
  ProductSource,
  ShoeProduct,
} from '../../src/domain/catalogue';
import {
  validateCatalogue,
  type CatalogueProblem,
} from '../../src/domain/catalogue';

export interface MigrationInputs {
  legacyProductsCsv: string;
  imageProvenanceCsv: string;
}

export interface ReconciliationEntry {
  source: 'legacy-products' | 'image-provenance';
  row: number;
  sourceKey: string;
  productId: string;
  outcome: 'matched' | 'merged-alias' | 'unmatched';
}

export interface MigrationResult {
  products: ShoeProduct[];
  warnings: CatalogueProblem[];
  reconciliation: ReconciliationEntry[];
}

type Row = Record<string, string>;

const aliasKeys = new Map([
  ['new balance|propel v5', 'new balance|fuelcell propel v5'],
]);

const fallbackEvidence: Evidence = {
  status: 'fallback',
  sourceIds: ['legacy-catalogue'],
  note: 'Imported from the audited legacy catalogue; official verification is pending.',
};

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function keyFor(brand: string, model: string): string {
  const key = `${brand.trim()}|${model.trim()}`.toLocaleLowerCase('en');
  return aliasKeys.get(key) ?? key;
}

function productIdFor(brand: string, model: string): string {
  return slugify(`${brand} ${model}`);
}

function splitList(value: string, separator: RegExp): string[] {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function localized(
  en: string,
  de: string | null,
  fr: string | null,
): LocalizedText {
  return { en, de, fr };
}

function titleCase(value: string): string {
  return value
    .toLocaleLowerCase('en')
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('en'));
}

function sourceId(productId: string, suffix: string): string {
  return slugify(`${productId}-${suffix}`);
}

function makeSources(
  productId: string,
  provenanceRows: Row[],
): ProductSource[] {
  const sources: ProductSource[] = [
    {
      id: 'legacy-catalogue',
      type: 'legacy-catalogue',
      label: 'Phase 0 audited legacy catalogue',
      url: null,
      checkedAt: null,
      status: 'fallback',
      note: 'Migration evidence only; not an official technical source.',
    },
  ];

  const unique = new Set<string>();
  for (const row of provenanceRows) {
    if (row.product_page && !unique.has(`product:${row.product_page}`)) {
      unique.add(`product:${row.product_page}`);
      sources.push({
        id: sourceId(productId, `product-page-${sources.length}`),
        type: 'retailer-product',
        label: 'Recorded Decathlon product page',
        url: row.product_page,
        checkedAt: null,
        status: 'fallback',
        note: 'Preserved from legacy provenance; re-check date is pending.',
      });
    }
    if (row.source_image && !unique.has(`image:${row.source_image}`)) {
      unique.add(`image:${row.source_image}`);
      sources.push({
        id: sourceId(productId, `image-${sources.length}`),
        type: 'retailer-image',
        label: 'Recorded product image source',
        url: row.source_image,
        checkedAt: null,
        status: row.image_status === 'verified-image' ? 'verified' : 'pending',
        note: 'Preserved from the Phase 0 image provenance inventory.',
      });
    }
  }

  return sources;
}

function parseDrop(
  value: string,
  productId: string,
  warnings: CatalogueProblem[],
) {
  const match = /^(\d+(?:\.\d+)?)\s*mm$/i.exec(value.trim());
  if (!match) {
    warnings.push({
      severity: 'warning',
      recordId: productId,
      field: 'specifications.heelToToeDrop',
      message: 'drop is missing or unparseable; official research is required',
    });
    return {
      value: null,
      evidence: {
        status: 'pending' as const,
        sourceIds: [],
        note: 'No reliable drop measurement exists in the legacy source.',
      },
    };
  }

  return {
    value: { amount: Number(match[1]), unit: 'mm' as const },
    evidence: fallbackEvidence,
  };
}

function normalizeStability(
  value: string,
): 'neutral' | 'stability' | 'unknown' {
  const normalized = value.trim().toLocaleLowerCase('en');
  if (normalized === 'neutral') return 'neutral';
  if (normalized === 'stability') return 'stability';
  return 'unknown';
}

export function migrateRows(
  productRows: Row[],
  provenanceRows: Row[],
): MigrationResult {
  const warnings: CatalogueProblem[] = [];
  const reconciliation: ReconciliationEntry[] = [];
  const provenanceByKey = new Map<string, Row[]>();
  const productKeys = new Set(
    productRows.map((row) => keyFor(row.brand, row.model)),
  );

  for (const [index, row] of provenanceRows.entries()) {
    const originalKey = `${row.brand}|${row.model}`;
    const normalizedKey = keyFor(row.brand, row.model);
    const rows = provenanceByKey.get(normalizedKey) ?? [];
    rows.push(row);
    provenanceByKey.set(normalizedKey, rows);
    const isAlias = normalizedKey !== originalKey.toLocaleLowerCase('en');
    const matchesProduct = productKeys.has(normalizedKey);
    reconciliation.push({
      source: 'image-provenance',
      row: index + 2,
      sourceKey: originalKey,
      productId: productIdFor(
        ...(normalizedKey.split('|') as [string, string]),
      ),
      outcome: !matchesProduct
        ? 'unmatched'
        : isAlias
          ? 'merged-alias'
          : 'matched',
    });
    if (!matchesProduct) {
      warnings.push({
        severity: 'warning',
        recordId: productIdFor(
          ...(normalizedKey.split('|') as [string, string]),
        ),
        field: 'provenance',
        message: `provenance row ${index + 2} has no matching legacy product`,
      });
    }
  }

  const products = productRows.map((row, index): ShoeProduct => {
    const normalizedKey = keyFor(row.brand, row.model);
    const productId = productIdFor(row.brand, row.model);
    const matchingProvenance = provenanceByKey.get(normalizedKey) ?? [];
    reconciliation.push({
      source: 'legacy-products',
      row: index + 2,
      sourceKey: `${row.brand}|${row.model}`,
      productId,
      outcome: 'matched',
    });

    if (matchingProvenance.length === 0) {
      warnings.push({
        severity: 'warning',
        recordId: productId,
        field: 'images',
        message: 'no matching provenance row was found',
      });
    }

    const rawCategories = [row.primary_category, row.secondary_category].filter(
      Boolean,
    );
    const categoryLabels = [
      ...new Set(rawCategories.map((value) => titleCase(value))),
    ];
    if (categoryLabels.length < rawCategories.length) {
      warnings.push({
        severity: 'warning',
        recordId: productId,
        field: 'categories',
        message: 'duplicate legacy category label was removed',
      });
    }

    const technologies = splitList(row.technologies, /\s*\|\s*/);
    const primaryProvenance = matchingProvenance[0];
    const sources = makeSources(productId, matchingProvenance);
    const imageSource = sources.find(
      (source) => source.type === 'retailer-image',
    );
    const imageVerified =
      primaryProvenance?.image_status === 'verified-image' && imageSource;

    if (technologies.length === 0) {
      warnings.push({
        severity: 'warning',
        recordId: productId,
        field: 'technologies',
        message: 'technology research is pending',
      });
    }

    return {
      schemaVersion: 1,
      id: productId,
      kind: 'shoe',
      lifecycle: 'active',
      brand: { id: slugify(row.brand), name: titleCase(row.brand) },
      model: row.model.trim(),
      categories: categoryLabels.map((label) => ({
        id: slugify(label),
        label: localized(label, null, null),
      })),
      copy: {
        bestFor: localized(
          row.best_for_en.trim(),
          row.best_for_de.trim(),
          row.best_for_fr.trim(),
        ),
      },
      technologies:
        technologies.length > 0
          ? { value: technologies, evidence: fallbackEvidence }
          : {
              value: null,
              evidence: {
                status: 'pending',
                sourceIds: [],
                note: 'No technology list exists in the audited legacy catalogue.',
              },
            },
      images: [
        {
          id: sourceId(productId, 'primary-image'),
          role: 'primary',
          localPath: row.display_image.trim() || null,
          sourceUrl: primaryProvenance?.source_image || null,
          sourceId: imageSource?.id ?? null,
          status: imageVerified ? 'verified' : 'pending',
          alt: localized(`${titleCase(row.brand)} ${row.model}`, null, null),
        },
      ],
      sources,
      comparables: [],
      specifications: {
        surfaces: {
          value: splitList(row.surface, /\s*[·|]\s*/),
          evidence: fallbackEvidence,
        },
        stability: {
          value: normalizeStability(row.stability),
          evidence: fallbackEvidence,
        },
        heelToToeDrop: parseDrop(row.drop, productId, warnings),
      },
    };
  });

  products.sort((left, right) => left.id.localeCompare(right.id, 'en'));
  reconciliation.sort((left, right) =>
    `${left.source}:${left.row}`.localeCompare(
      `${right.source}:${right.row}`,
      'en',
    ),
  );

  const validated = validateCatalogue(products);
  return {
    products: validated.products as ShoeProduct[],
    warnings: [...warnings, ...validated.warnings].sort((left, right) =>
      `${left.recordId}:${left.field}:${left.message}`.localeCompare(
        `${right.recordId}:${right.field}:${right.message}`,
        'en',
      ),
    ),
    reconciliation,
  };
}
