import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  type FacetedProductData,
  type FitOption,
  type ShoeFacets,
  type SupportFeature,
  type UseCase,
} from '../../src/domain/catalogue';
import { getProductCatalogue } from '../../src/features/catalogue/catalogue';

const projectRoot = resolve(import.meta.dirname, '../..');
const output = resolve(projectRoot, 'src/content/catalogue/products.json');

const categoryUseCases: Readonly<Record<string, UseCase>> = {
  'daily-trainer': 'daily-trainer',
  'fast-training': 'tempo',
  race: 'race',
  recovery: 'recovery',
  'super-trainer': 'tempo',
  'trail-race': 'race',
};

const exactFitMappings: Readonly<Record<string, FitOption>> = {
  'medium width': 'regular',
  regular: 'regular',
  'standard width': 'regular',
  wide: 'wide',
};

const exactSupportFeatureMappings: Readonly<Record<string, SupportFeature>> = {
  'medial post': 'medial-post',
  'rocker geometry': 'rocker-geometry',
  'wide base': 'wide-base',
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function deriveFacets(
  product: ReturnType<typeof getProductCatalogue>[number]['product'],
): ShoeFacets {
  const maximumDistanceKm = product.specifications.maximumDistanceKm;
  return {
    experienceTags: [],
    useCase: unique(
      product.categories.flatMap((category) =>
        categoryUseCases[category] ? [categoryUseCases[category]] : [],
      ),
    ),
    cushioningLevel: product.categories.includes('max-cushion') ? 'max' : null,
    stability: product.stability === 'unknown' ? null : product.stability,
    supportFeatures: unique(
      product.specifications.technologies.flatMap((technology) => {
        const feature = exactSupportFeatureMappings[technology.toLowerCase()];
        return feature ? [feature] : [];
      }),
    ),
    surfaceTags: [...product.surfaceTags],
    distanceRangeKm:
      maximumDistanceKm === null ? null : { min: 0, max: maximumDistanceKm },
    priorityTags: [],
    fit: unique(
      product.specifications.fit.flatMap((fit) => {
        const option = exactFitMappings[fit.toLowerCase()];
        return option ? [option] : [];
      }),
    ),
  };
}

function missingFacets(facets: ShoeFacets): (keyof ShoeFacets)[] {
  const missing: (keyof ShoeFacets)[] = [];
  if (facets.experienceTags.length === 0) missing.push('experienceTags');
  if (facets.useCase.length === 0) missing.push('useCase');
  if (facets.cushioningLevel === null) missing.push('cushioningLevel');
  if (facets.stability === null) missing.push('stability');
  if (facets.supportFeatures.length === 0) missing.push('supportFeatures');
  if (facets.surfaceTags.length === 0) missing.push('surfaceTags');
  if (facets.distanceRangeKm === null) missing.push('distanceRangeKm');
  if (facets.priorityTags.length === 0) missing.push('priorityTags');
  if (facets.fit.length === 0) missing.push('fit');
  return missing;
}

type MigrationProduct = ReturnType<
  typeof getProductCatalogue
>[number]['product'] &
  Partial<FacetedProductData<ShoeFacets>>;

const products = getProductCatalogue().map(({ product }) => {
  const migrationProduct: MigrationProduct = product;
  if (migrationProduct.facets && migrationProduct.factsReviewed !== undefined) {
    return migrationProduct;
  }
  return {
    ...product,
    facets: deriveFacets(product),
    factsReviewed: false,
  };
});

const missingCounts = Object.fromEntries(
  [
    'experienceTags',
    'useCase',
    'cushioningLevel',
    'stability',
    'supportFeatures',
    'surfaceTags',
    'distanceRangeKm',
    'priorityTags',
    'fit',
  ].map((facet) => [
    facet,
    products.filter(({ facets }) =>
      missingFacets(facets).includes(facet as keyof ShoeFacets),
    ).length,
  ]),
);

const fullyMigrated = products.filter(
  ({ factsReviewed }) => factsReviewed,
).length;

writeFileSync(output, `${JSON.stringify(products, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      total: products.length,
      fullyMigrated,
      flaggedForManualReview: products.length - fullyMigrated,
      missingByFacet: missingCounts,
    },
    null,
    2,
  ),
);
