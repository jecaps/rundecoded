import { z } from 'zod';

import {
  shoeFacetsSchema,
  type FacetedProductData,
  type ShoeFacets,
} from './facets';
import {
  localizedTextSchema,
  surfaceTags,
  type LocalizedText,
  type SurfaceTag,
  type TerrainProfile,
} from './schema';

export interface ShoeDetails {
  bestAt: LocalizedText;
  bestFor: LocalizedText;
  construction?: {
    midsole: LocalizedText;
    outsole: LocalizedText;
    ride: LocalizedText;
    support: LocalizedText;
    upper: LocalizedText;
  };
  lessSuitableFor: LocalizedText;
  overview: LocalizedText;
}

export interface ShoeSpecifications {
  dropMm: number | null;
  fit: string[];
  maximumDistanceKm: number | null;
  stackHeightMm:
    | number
    | {
        forefoot: number;
        heel: number;
      }
    | null;
  technologies: string[];
  weightG: number | null;
  weightReferenceSize: string | null;
}

export interface CatalogueShoe extends FacetedProductData<ShoeFacets> {
  brand: string;
  categories: string[];
  details: ShoeDetails;
  id: string;
  images: string[];
  kind: 'shoe';
  model: string;
  sourceUrl: string | null;
  specifications: ShoeSpecifications;
  stability: 'neutral' | 'stability' | 'unknown';
  surfaceTags: SurfaceTag[];
}

const simpleIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase kebab-case ID');

export const catalogueShoeSchema: z.ZodType<CatalogueShoe> = z.strictObject({
  id: simpleIdSchema,
  kind: z.literal('shoe'),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1),
  categories: z.array(simpleIdSchema).min(1),
  surfaceTags: z.array(z.enum(surfaceTags)).min(1),
  stability: z.enum(['neutral', 'stability', 'unknown']),
  facets: shoeFacetsSchema,
  factsReviewed: z.boolean(),
  specifications: z.strictObject({
    maximumDistanceKm: z.number().positive().max(1000).nullable(),
    dropMm: z.number().min(0).max(100).nullable(),
    stackHeightMm: z
      .union([
        z.number().min(0).max(100),
        z.strictObject({
          heel: z.number().min(0).max(100),
          forefoot: z.number().min(0).max(100),
        }),
      ])
      .nullable(),
    weightG: z.number().positive().max(2000).nullable(),
    weightReferenceSize: z.string().trim().min(1).nullable(),
    fit: z.array(z.string().trim().min(1)),
    technologies: z.array(z.string().trim().min(1)),
  }),
  details: z.strictObject({
    bestFor: localizedTextSchema,
    overview: localizedTextSchema,
    bestAt: localizedTextSchema,
    lessSuitableFor: localizedTextSchema,
    construction: z
      .strictObject({
        ride: localizedTextSchema,
        support: localizedTextSchema,
        upper: localizedTextSchema,
        midsole: localizedTextSchema,
        outsole: localizedTextSchema,
      })
      .optional(),
  }),
  images: z.array(z.string().trim().min(1)),
  sourceUrl: z.url().nullable(),
});

export const catalogueShoesSchema = z.array(catalogueShoeSchema);

export const terrainProfileTags = [
  'gravel',
  'easy-terrain',
  'mixed-terrain',
  'technical-terrain',
  'muddy-terrain',
] as const;

export type DerivedTerrainProfile = (typeof terrainProfileTags)[number];
export type DerivedSurfaceFamily = 'road' | 'off-road' | 'track';

export function surfaceFamiliesForShoe(
  shoe: CatalogueShoe,
): DerivedSurfaceFamily[] {
  const tags = new Set(shoe.surfaceTags);
  const families: DerivedSurfaceFamily[] = [];
  if (tags.has('road') || tags.has('asphalt')) families.push('road');
  if (
    tags.has('gravel') ||
    tags.has('firm-paths') ||
    tags.has('easy-terrain') ||
    tags.has('mixed-terrain') ||
    tags.has('technical-terrain') ||
    tags.has('muddy-terrain')
  ) {
    families.push('off-road');
  }
  if (tags.has('track') || tags.has('cross-country')) families.push('track');
  return families;
}

export function terrainProfilesForShoe(shoe: CatalogueShoe): TerrainProfile[] {
  const tags = new Set(shoe.surfaceTags);
  const profiles: TerrainProfile[] = terrainProfileTags.filter((tag) =>
    tags.has(tag),
  );
  if (
    (tags.has('road') || tags.has('asphalt')) &&
    (tags.has('gravel') || tags.has('firm-paths') || tags.has('easy-terrain'))
  ) {
    profiles.unshift('road-to-trail');
  }
  return profiles;
}
