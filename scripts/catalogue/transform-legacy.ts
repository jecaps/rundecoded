import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format } from 'prettier';

import type {
  LocalizedText,
  Product,
  ShoeProduct,
  VerificationStatus,
} from '../../src/domain/catalogue';
import { csvRecords } from './csv';
import { migrateRows, type MigrationResult } from './migration';

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));

const paths = {
  productsInput: resolve(projectRoot, 'docs/baseline/legacy-products.csv'),
  provenanceInput: resolve(projectRoot, 'docs/baseline/image-provenance.csv'),
  catalogue: resolve(projectRoot, 'src/content/catalogue/products.json'),
  reconciliation: resolve(projectRoot, 'reports/catalogue-reconciliation.json'),
  qualityJson: resolve(projectRoot, 'reports/catalogue-quality.json'),
  qualityMarkdown: resolve(projectRoot, 'reports/catalogue-quality.md'),
  publicRoot: resolve(projectRoot, 'public'),
};

interface AssetAuditItem {
  localPath: string | null;
  productId: string;
  present: boolean;
  status: 'verified' | 'fallback' | 'pending';
}

interface ResearchItem {
  field: string;
  issueType: string;
  productId: string;
  status: 'fallback' | 'pending';
}

async function stableJson(value: unknown): Promise<string> {
  return format(JSON.stringify(value), { parser: 'json' });
}

function countEvidence(
  products: Product[],
): Record<VerificationStatus, number> {
  const counts: Record<VerificationStatus, number> = {
    verified: 0,
    derived: 0,
    fallback: 0,
    pending: 0,
  };

  function count(status: VerificationStatus) {
    counts[status] += 1;
  }

  for (const product of products) {
    for (const source of product.sources) count(source.status);
    count(product.technologies.evidence.status);
    if (product.kind === 'shoe') {
      count(product.specifications.surfaces.evidence.status);
      count(product.specifications.stability.evidence.status);
      count(product.specifications.heelToToeDrop.evidence.status);
      count(product.specifications.stackHeight.evidence.status);
      count(product.specifications.weight.evidence.status);
      count(product.specifications.fit.evidence.status);
      count(product.specifications.construction.evidence.status);
    }
  }
  return counts;
}

function sortedCounts(values: string[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) =>
      left.localeCompare(right, 'en'),
    ),
  );
}

function localizedFields(product: Product) {
  const fields: Array<{ field: string; value: LocalizedText }> = [
    { field: 'copy.bestFor', value: product.copy.bestFor },
  ];
  for (const [index, category] of product.categories.entries())
    fields.push({ field: `categories.${index}.label`, value: category.label });
  for (const [index, image] of product.images.entries())
    fields.push({ field: `images.${index}.alt`, value: image.alt });
  return fields;
}

function evidenceFields(product: ShoeProduct) {
  return [
    { field: 'technologies', evidence: product.technologies.evidence },
    {
      field: 'specifications.surfaces',
      evidence: product.specifications.surfaces.evidence,
    },
    {
      field: 'specifications.stability',
      evidence: product.specifications.stability.evidence,
    },
    {
      field: 'specifications.maximumDistance',
      evidence: product.specifications.maximumDistance.evidence,
    },
    {
      field: 'specifications.heelToToeDrop',
      evidence: product.specifications.heelToToeDrop.evidence,
    },
    {
      field: 'specifications.stackHeight',
      evidence: product.specifications.stackHeight.evidence,
    },
    {
      field: 'specifications.weight',
      evidence: product.specifications.weight.evidence,
    },
    {
      field: 'specifications.fit',
      evidence: product.specifications.fit.evidence,
    },
    {
      field: 'specifications.construction',
      evidence: product.specifications.construction.evidence,
    },
  ];
}

function researchItems(products: ShoeProduct[]): ResearchItem[] {
  return products
    .flatMap((product) =>
      evidenceFields(product)
        .filter(
          ({ evidence }) =>
            evidence.status === 'pending' || evidence.status === 'fallback',
        )
        .map(({ field, evidence }) => ({
          productId: product.id,
          field,
          issueType: field.split('.').at(-1) ?? field,
          status: evidence.status as 'fallback' | 'pending',
        })),
    )
    .sort((left, right) =>
      `${left.productId}:${left.field}`.localeCompare(
        `${right.productId}:${right.field}`,
        'en',
      ),
    );
}

async function auditAssets(products: Product[]): Promise<AssetAuditItem[]> {
  return Promise.all(
    products.flatMap((product) =>
      product.images.map(async (image) => ({
        productId: product.id,
        localPath: image.localPath,
        status: image.status,
        present:
          image.localPath !== null &&
          (await access(resolve(paths.publicRoot, image.localPath))
            .then(() => true)
            .catch(() => false)),
      })),
    ),
  );
}

function makeReport(
  result: MigrationResult,
  sourceCounts: { products: number; provenance: number },
  assets: AssetAuditItem[],
) {
  const pendingImages = result.products.filter((product) =>
    product.images.some((image) => image.status === 'pending'),
  ).length;
  const pendingDrops = result.products.filter(
    (product) =>
      product.specifications.heelToToeDrop.evidence.status === 'pending',
  ).length;
  const pendingTechnologies = result.products.filter(
    (product) => product.technologies.evidence.status === 'pending',
  ).length;
  const aliasMerges = result.reconciliation.filter(
    (entry) => entry.outcome === 'merged-alias',
  ).length;
  const unmatchedRows = result.reconciliation.filter(
    (entry) => entry.outcome === 'unmatched',
  ).length;
  const research = researchItems(result.products);
  const missingTranslations = { en: 0, de: 0, fr: 0 };
  const translationValues = { en: 0, de: 0, fr: 0 };
  for (const product of result.products) {
    for (const { value } of localizedFields(product)) {
      for (const locale of ['en', 'de', 'fr'] as const) {
        translationValues[locale] += 1;
        if (value[locale] === null) missingTranslations[locale] += 1;
      }
    }
  }
  const missingLocalAssets = assets.filter(
    (asset) => asset.status === 'verified' && !asset.present,
  );

  return {
    schemaVersion: 2,
    status: missingLocalAssets.length === 0 ? 'valid' : 'invalid',
    counts: {
      products: result.products.length,
      inputProductRows: sourceCounts.products,
      inputProvenanceRows: sourceCounts.provenance,
      reconciledRows: result.reconciliation.length,
      aliasMerges,
      unmatchedRows,
      pendingImages,
      pendingDrops,
      pendingTechnologies,
      warnings: result.warnings.length,
      verifiedImages: assets.filter((asset) => asset.status === 'verified')
        .length,
      missingLocalAssets: missingLocalAssets.length,
      comparableLinks: result.products.reduce(
        (total, product) => total + product.comparables.length,
        0,
      ),
    },
    evidence: countEvidence(result.products),
    brands: sortedCounts(result.products.map((product) => product.brand.name)),
    categories: sortedCounts(
      result.products.flatMap((product) =>
        product.categories.map((category) => category.id),
      ),
    ),
    languages: Object.fromEntries(
      (['en', 'de', 'fr'] as const).map((locale) => [
        locale,
        {
          values: translationValues[locale],
          complete: translationValues[locale] - missingTranslations[locale],
          missing: missingTranslations[locale],
        },
      ]),
    ),
    issueTypes: Object.fromEntries(
      ['pending', 'fallback'].map((status) => [
        status,
        sortedCounts(
          research
            .filter((item) => item.status === status)
            .map((item) => item.issueType),
        ),
      ]),
    ),
    assets,
    research,
    warnings: result.warnings,
  };
}

function reportMarkdown(report: ReturnType<typeof makeReport>): string {
  const countRows = (values: Record<string, number>) =>
    Object.entries(values)
      .map(([label, count]) => `| ${label} | ${count} |`)
      .join('\n');
  const researchByProduct = new Map<string, string[]>();
  for (const item of report.research.filter(
    (candidate) => candidate.status === 'pending',
  )) {
    const fields = researchByProduct.get(item.productId) ?? [];
    fields.push(item.field);
    researchByProduct.set(item.productId, fields);
  }
  const researchRows = [...researchByProduct.entries()]
    .map(([productId, fields]) => `| ${productId} | ${fields.join(', ')} |`)
    .join('\n');
  const warningRows = report.warnings
    .map(
      (warning) =>
        `| ${warning.recordId} | ${warning.field} | ${warning.message.replaceAll('|', '\\|')} |`,
    )
    .join('\n');

  return `# Catalogue quality report

The generated catalogue is structurally valid. Pending research is reported rather than treated as a structural failure.

## Summary

| Measure | Count |
| --- | ---: |
| Products | ${report.counts.products} |
| Legacy product rows reconciled | ${report.counts.inputProductRows} |
| Provenance rows reconciled | ${report.counts.inputProvenanceRows} |
| Alias records merged | ${report.counts.aliasMerges} |
| Unmatched source rows | ${report.counts.unmatchedRows} |
| Images pending | ${report.counts.pendingImages} |
| Drop measurements pending | ${report.counts.pendingDrops} |
| Technology lists pending | ${report.counts.pendingTechnologies} |
| Verified local images | ${report.counts.verifiedImages} |
| Missing verified image files | ${report.counts.missingLocalAssets} |
| Comparable links | ${report.counts.comparableLinks} |
| Actionable warnings | ${report.counts.warnings} |

## Products by brand

| Brand | Count |
| --- | ---: |
${countRows(report.brands)}

## Products by category

| Category | Count |
| --- | ---: |
${countRows(report.categories)}

## Translation coverage

| Language | Values | Complete | Missing |
| --- | ---: | ---: | ---: |
${Object.entries(report.languages)
  .map(
    ([locale, counts]) =>
      `| ${locale.toUpperCase()} | ${counts.values} | ${counts.complete} | ${counts.missing} |`,
  )
  .join('\n')}

## Evidence status

| Status | Count |
| --- | ---: |
| Verified | ${report.evidence.verified} |
| Derived | ${report.evidence.derived} |
| Fallback | ${report.evidence.fallback} |
| Pending | ${report.evidence.pending} |

## Research issue types

### Pending

| Field | Count |
| --- | ---: |
${countRows(report.issueTypes.pending)}

### Fallback verification

| Field | Count |
| --- | ---: |
${countRows(report.issueTypes.fallback)}

## Product research queue

These fields are intentionally pending and can be converted into focused future research issues.

| Product | Pending fields |
| --- | --- |
${researchRows}

## Warnings

| Product | Field | Action |
| --- | --- | --- |
${warningRows}
`;
}

async function loadMigration(): Promise<
  MigrationResult & { sourceCounts: { products: number; provenance: number } }
> {
  const [productsCsv, provenanceCsv] = await Promise.all([
    readFile(paths.productsInput, 'utf8'),
    readFile(paths.provenanceInput, 'utf8'),
  ]);
  const productRows = csvRecords(productsCsv);
  const provenanceRows = csvRecords(provenanceCsv);
  return {
    ...migrateRows(productRows, provenanceRows),
    sourceCounts: {
      products: productRows.length,
      provenance: provenanceRows.length,
    },
  };
}

async function outputFiles(result: Awaited<ReturnType<typeof loadMigration>>) {
  const assets = await auditAssets(result.products);
  const report = makeReport(result, result.sourceCounts, assets);
  if (report.status === 'invalid') {
    const missing = report.assets
      .filter((asset) => asset.status === 'verified' && !asset.present)
      .map((asset) => `${asset.productId}:${asset.localPath}`);
    throw new Error(
      `Verified catalogue assets are missing: ${missing.join(', ')}`,
    );
  }
  const [catalogue, reconciliation, qualityJson, qualityMarkdown] =
    await Promise.all([
      stableJson(result.products),
      stableJson(result.reconciliation),
      stableJson(report),
      format(reportMarkdown(report), { parser: 'markdown' }),
    ]);
  return new Map([
    [paths.catalogue, catalogue],
    [paths.reconciliation, reconciliation],
    [paths.qualityJson, qualityJson],
    [paths.qualityMarkdown, qualityMarkdown],
  ]);
}

async function writeOutputs(outputs: Map<string, string>) {
  for (const [path, contents] of outputs)
    await writeFile(path, contents, 'utf8');
}

async function checkOutputs(outputs: Map<string, string>) {
  const stale: string[] = [];
  for (const [path, expected] of outputs) {
    const actual = await readFile(path, 'utf8').catch(() => null);
    if (actual !== expected) stale.push(path.replace(`${projectRoot}/`, ''));
  }
  if (stale.length > 0) {
    throw new Error(
      `Generated catalogue files are missing or stale: ${stale.join(', ')}. Run pnpm catalogue:migrate.`,
    );
  }
}

const check = process.argv.includes('--check');
const result = await loadMigration();
const outputs = await outputFiles(result);
if (check) await checkOutputs(outputs);
else await writeOutputs(outputs);

console.log(
  `${check ? 'Checked' : 'Migrated'} ${result.products.length} products and reconciled ${result.reconciliation.length} source rows with ${result.warnings.length} warnings.`,
);
