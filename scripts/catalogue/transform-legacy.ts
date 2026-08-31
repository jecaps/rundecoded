import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format } from 'prettier';

import type { Product, VerificationStatus } from '../../src/domain/catalogue';
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
};

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
    }
  }
  return counts;
}

function makeReport(
  result: MigrationResult,
  sourceCounts: { products: number; provenance: number },
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

  return {
    schemaVersion: 1,
    status: 'valid',
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
    },
    evidence: countEvidence(result.products),
    warnings: result.warnings,
  };
}

function reportMarkdown(report: ReturnType<typeof makeReport>): string {
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
| Actionable warnings | ${report.counts.warnings} |

## Evidence status

| Status | Count |
| --- | ---: |
| Verified | ${report.evidence.verified} |
| Derived | ${report.evidence.derived} |
| Fallback | ${report.evidence.fallback} |
| Pending | ${report.evidence.pending} |

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
  const report = makeReport(result, result.sourceCounts);
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
