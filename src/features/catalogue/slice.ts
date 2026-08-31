import { z } from 'zod';

import productsJson from '@/content/catalogue/products.json';
import {
  validateCatalogue,
  type ShoeProduct,
  type VerificationStatus,
} from '@/domain/catalogue';

const sliceProductIds = [
  'adidas-adistar-5',
  'adidas-terrex-agravic-4',
  'asics-gel-kayano-32',
  'asics-gel-sonoma-8-gtx',
  'brooks-ghost-17',
  'decathlon-jogflow-100-1',
  'decathlon-jogflow-190-grip-wp',
  'kiprun-kipclimb-race',
  'kiprun-kipride-support',
  'kiprun-kipstorm-elite',
  'new-balance-fuelcell-propel-v5',
  'puma-deviate-nitro-4',
] as const;

const weightSchema = z.strictObject({
  amount: z.number().positive(),
  unit: z.literal('g'),
  referenceSize: z.string().trim().min(1),
  sourceUrl: z.url(),
  status: z.enum(['verified', 'derived', 'fallback', 'pending']),
});

const sliceMetadataSchema = z.record(
  z.enum(sliceProductIds),
  z.strictObject({
    comparables: z.array(z.enum(sliceProductIds)).min(1),
    weight: weightSchema.nullable(),
  }),
);

const sliceMetadata = sliceMetadataSchema.parse({
  'adidas-adistar-5': {
    comparables: ['brooks-ghost-17', 'adidas-terrex-agravic-4'],
    weight: {
      amount: 264,
      unit: 'g',
      referenceSize: 'EU 42⅔',
      sourceUrl: 'https://www.adidas.de/en/adistar-5-running-shoes/KI4355.html',
      status: 'fallback',
    },
  },
  'adidas-terrex-agravic-4': {
    comparables: ['asics-gel-sonoma-8-gtx', 'kiprun-kipclimb-race'],
    weight: {
      amount: 276.8,
      unit: 'g',
      referenceSize: 'EU 42⅔',
      sourceUrl:
        'https://www.adidas.de/en/terrex-agravic-4-trail-running-shoes/KJ1291.html',
      status: 'fallback',
    },
  },
  'asics-gel-kayano-32': {
    comparables: ['kiprun-kipride-support', 'brooks-ghost-17'],
    weight: null,
  },
  'asics-gel-sonoma-8-gtx': {
    comparables: ['decathlon-jogflow-190-grip-wp', 'adidas-terrex-agravic-4'],
    weight: null,
  },
  'brooks-ghost-17': {
    comparables: ['adidas-adistar-5', 'decathlon-jogflow-100-1'],
    weight: null,
  },
  'decathlon-jogflow-100-1': {
    comparables: ['brooks-ghost-17', 'decathlon-jogflow-190-grip-wp'],
    weight: {
      amount: 250,
      unit: 'g',
      referenceSize: 'EU 43',
      sourceUrl:
        'https://www.decathlon.de/p/laufschuhe-herren-jogflow-100-1-schwarz-grau/337693/c382c227m8733464',
      status: 'fallback',
    },
  },
  'decathlon-jogflow-190-grip-wp': {
    comparables: ['asics-gel-sonoma-8-gtx', 'decathlon-jogflow-100-1'],
    weight: {
      amount: 364,
      unit: 'g',
      referenceSize: 'EU 42',
      sourceUrl:
        'https://www.decathlon.de/p/laufschuhe-strasse-trailrunning-herren-wasserdicht-jogflow-190-grip-schwarz/365616/c382c208m8958646',
      status: 'fallback',
    },
  },
  'kiprun-kipclimb-race': {
    comparables: ['adidas-terrex-agravic-4', 'kiprun-kipstorm-elite'],
    weight: null,
  },
  'kiprun-kipride-support': {
    comparables: ['asics-gel-kayano-32', 'brooks-ghost-17'],
    weight: null,
  },
  'kiprun-kipstorm-elite': {
    comparables: ['puma-deviate-nitro-4', 'kiprun-kipclimb-race'],
    weight: null,
  },
  'new-balance-fuelcell-propel-v5': {
    comparables: ['puma-deviate-nitro-4', 'brooks-ghost-17'],
    weight: null,
  },
  'puma-deviate-nitro-4': {
    comparables: ['kiprun-kipstorm-elite', 'new-balance-fuelcell-propel-v5'],
    weight: null,
  },
});

export interface ExplorerWeight {
  amount: number;
  referenceSize: string;
  sourceUrl: string;
  status: VerificationStatus;
  unit: 'g';
}

export interface ExplorerProduct {
  product: ShoeProduct;
  weight: ExplorerWeight | null;
}

export function getProductSlice(): ExplorerProduct[] {
  const validated = validateCatalogue(productsJson).products;
  const shoesById = new Map(
    validated
      .filter((product): product is ShoeProduct => product.kind === 'shoe')
      .map((product) => [product.id, product]),
  );

  const selected = sliceProductIds.map((id) => {
    const product = shoesById.get(id);
    if (!product) throw new Error(`Phase 4 product slice is missing ${id}`);
    return { ...product, comparables: sliceMetadata[id].comparables };
  });

  const revalidated = validateCatalogue(selected).products;
  if (revalidated.length !== 12) {
    throw new Error(
      `Phase 4 requires exactly 12 products; received ${revalidated.length}`,
    );
  }

  return revalidated.map((product) => {
    if (product.kind !== 'shoe') throw new Error(`${product.id} is not a shoe`);
    return {
      product,
      weight: sliceMetadata[product.id as keyof typeof sliceMetadata].weight,
    };
  });
}
