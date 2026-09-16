import { z } from 'zod';

import { surfaceTags, type SurfaceTag } from './schema';

export const useCases = [
  'daily-trainer',
  'long-run',
  'tempo',
  'interval',
  'race',
  'recovery',
] as const;

export const cushioningLevels = ['firm', 'balanced', 'max'] as const;

export const experienceTags = [
  'beginner',
  'recreational',
  'competitive',
  'elite',
] as const;

export const stabilityLevels = [
  'neutral',
  'stability',
  'motion-control',
] as const;

export const supportFeatures = [
  'wide-base',
  'medial-post',
  'rocker-geometry',
  'guidance-system',
] as const;

export const priorityTags = [
  'cushioning-comfort',
  'speed-responsiveness',
  'stability-support',
  'traction-grip',
  'durability',
  'value',
] as const;

export const fitOptions = ['narrow', 'regular', 'wide'] as const;

export type UseCase = (typeof useCases)[number];
export type CushioningLevel = (typeof cushioningLevels)[number];
export type ExperienceTag = (typeof experienceTags)[number];
export type StabilityLevel = (typeof stabilityLevels)[number];
export type SupportFeature = (typeof supportFeatures)[number];
export type PriorityTag = (typeof priorityTags)[number];
export type FitOption = (typeof fitOptions)[number];

export interface DistanceRangeKm {
  max: number;
  min: number;
}

export interface FacetedProductData<TFacets> {
  facets: TFacets;
  factsReviewed: boolean;
}

/**
 * Closed-vocabulary data used only for matching. Descriptive product content
 * remains in the existing multilingual `details` block.
 *
 * Nullable scalar fields and empty arrays represent facts that have not yet
 * been established. They must not contribute to matching until reviewed.
 */
export interface ShoeFacets {
  cushioningLevel: CushioningLevel | null;
  distanceRangeKm: DistanceRangeKm | null;
  experienceTags: ExperienceTag[];
  fit: FitOption[];
  priorityTags: PriorityTag[];
  stability: StabilityLevel | null;
  supportFeatures: SupportFeature[];
  surfaceTags: SurfaceTag[];
  useCase: UseCase[];
}

export const distanceRangeKmSchema = z
  .strictObject({
    min: z.number().min(0).max(1000),
    max: z.number().positive().max(1000),
  })
  .refine(({ max, min }) => min <= max, {
    message: 'minimum distance must not exceed maximum distance',
    path: ['min'],
  });

export const shoeFacetsSchema: z.ZodType<ShoeFacets> = z.strictObject({
  experienceTags: z.array(z.enum(experienceTags)),
  useCase: z.array(z.enum(useCases)),
  cushioningLevel: z.enum(cushioningLevels).nullable(),
  stability: z.enum(stabilityLevels).nullable(),
  supportFeatures: z.array(z.enum(supportFeatures)),
  surfaceTags: z.array(z.enum(surfaceTags)),
  distanceRangeKm: distanceRangeKmSchema.nullable(),
  priorityTags: z.array(z.enum(priorityTags)),
  fit: z.array(z.enum(fitOptions)),
});
