import { z } from 'zod';

import { catalogueSchema, productSchema, type Product } from './schema';

export interface CatalogueProblem {
  severity: 'error' | 'warning';
  recordId: string;
  field: string;
  message: string;
}

export class CatalogueValidationError extends Error {
  constructor(public readonly problems: CatalogueProblem[]) {
    super(problems.map(formatProblem).join('\n'));
    this.name = 'CatalogueValidationError';
  }
}

function formatPath(path: PropertyKey[]): string {
  return path.length === 0 ? '<record>' : path.map(String).join('.');
}

function formatProblem(problem: CatalogueProblem): string {
  return `${problem.recordId}: ${problem.field} — ${problem.message}`;
}

function zodProblems(error: z.ZodError, recordId: string): CatalogueProblem[] {
  return error.issues.map((issue) => ({
    severity: 'error',
    recordId,
    field: formatPath(issue.path),
    message: issue.message,
  }));
}

export function parseProduct(
  input: unknown,
  recordName = 'unknown record',
): Product {
  const result = productSchema.safeParse(input);
  if (!result.success) {
    throw new CatalogueValidationError(zodProblems(result.error, recordName));
  }
  return result.data;
}

export function validateCatalogue(input: unknown): {
  products: Product[];
  warnings: CatalogueProblem[];
} {
  const parsed = catalogueSchema.safeParse(input);
  if (!parsed.success) {
    throw new CatalogueValidationError(zodProblems(parsed.error, 'catalogue'));
  }

  const products = parsed.data;
  const problems: CatalogueProblem[] = [];
  const productIds = new Set<string>();

  for (const product of products) {
    if (productIds.has(product.id)) {
      problems.push({
        severity: 'error',
        recordId: product.id,
        field: 'id',
        message: 'duplicate product ID',
      });
    }
    productIds.add(product.id);

    const categoryIds = new Set<string>();
    const englishLabels = new Set<string>();
    for (const [index, category] of product.categories.entries()) {
      const normalizedLabel = category.label.en.toLocaleLowerCase('en');
      if (categoryIds.has(category.id) || englishLabels.has(normalizedLabel)) {
        problems.push({
          severity: 'error',
          recordId: product.id,
          field: `categories.${index}`,
          message: 'duplicate category ID or English label',
        });
      }
      categoryIds.add(category.id);
      englishLabels.add(normalizedLabel);
    }

    const sourceIds = new Set<string>();
    for (const [index, source] of product.sources.entries()) {
      if (sourceIds.has(source.id)) {
        problems.push({
          severity: 'error',
          recordId: product.id,
          field: `sources.${index}.id`,
          message: 'duplicate source ID within product',
        });
      }
      sourceIds.add(source.id);
      if (source.status === 'pending') {
        problems.push({
          severity: 'warning',
          recordId: product.id,
          field: `sources.${index}`,
          message: 'source research is pending',
        });
      }
    }

    for (const [index, image] of product.images.entries()) {
      if (image.sourceId !== null && !sourceIds.has(image.sourceId)) {
        problems.push({
          severity: 'error',
          recordId: product.id,
          field: `images.${index}.sourceId`,
          message: `unknown source reference ${image.sourceId}`,
        });
      }
      if (image.status === 'pending') {
        problems.push({
          severity: 'warning',
          recordId: product.id,
          field: `images.${index}`,
          message: 'approved product image is pending',
        });
      }
    }

    const evidenceReferences = [
      {
        field: 'technologies.evidence.sourceIds',
        ids: product.technologies.evidence.sourceIds,
      },
      ...(product.kind === 'shoe'
        ? [
            {
              field: 'specifications.surfaces.evidence.sourceIds',
              ids: product.specifications.surfaces.evidence.sourceIds,
            },
            {
              field: 'specifications.stability.evidence.sourceIds',
              ids: product.specifications.stability.evidence.sourceIds,
            },
            {
              field: 'specifications.heelToToeDrop.evidence.sourceIds',
              ids: product.specifications.heelToToeDrop.evidence.sourceIds,
            },
          ]
        : Object.entries(product.attributes).map(([attribute, fact]) => ({
            field: `attributes.${attribute}.evidence.sourceIds`,
            ids: fact.evidence.sourceIds,
          }))),
    ];

    for (const reference of evidenceReferences) {
      for (const id of reference.ids) {
        if (!sourceIds.has(id)) {
          problems.push({
            severity: 'error',
            recordId: product.id,
            field: reference.field,
            message: `unknown source reference ${id}`,
          });
        }
      }
    }
  }

  for (const product of products) {
    for (const [index, comparableId] of product.comparables.entries()) {
      if (comparableId === product.id) {
        problems.push({
          severity: 'error',
          recordId: product.id,
          field: `comparables.${index}`,
          message: 'a product cannot compare to itself',
        });
      } else if (!productIds.has(comparableId)) {
        problems.push({
          severity: 'error',
          recordId: product.id,
          field: `comparables.${index}`,
          message: `unknown comparable product ${comparableId}`,
        });
      }
    }
  }

  const errors = problems.filter((problem) => problem.severity === 'error');
  if (errors.length > 0) {
    throw new CatalogueValidationError(errors);
  }

  return { products, warnings: problems };
}
