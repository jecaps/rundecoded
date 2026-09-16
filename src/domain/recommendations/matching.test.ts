import { describe, expect, it } from 'vitest';

import type { CatalogueShoe, SurfaceTag } from '@/domain/catalogue';

import {
  evaluateShoeRecommendation,
  rankShoeRecommendations,
  recommendShoes,
  type RunnerProfile,
} from './matching';

function shoe(
  overrides: {
    categories?: string[];
    distance?: number | null;
    id?: string;
    model?: string;
    stability?: 'neutral' | 'stability' | 'unknown';
    surfaces?: string[];
    surfaceTags?: SurfaceTag[];
  } = {},
): CatalogueShoe {
  const surfaces = overrides.surfaces ?? ['Road', 'Gravel'];
  const surfaceTags =
    overrides.surfaceTags ??
    ([
      ...(surfaces.includes('Road') ? ['road', 'asphalt'] : []),
      ...(surfaces.includes('Gravel') ? ['gravel'] : []),
      ...(surfaces.includes('Trail') ? ['mixed-terrain'] : []),
      ...(surfaces.includes('Track') ? ['track'] : []),
      ...(surfaces.includes('Cross-country') ? ['cross-country'] : []),
    ] as SurfaceTag[]);
  return {
    id: overrides.id ?? 'example-daily-shoe',
    kind: 'shoe',
    brand: 'Example',
    model: overrides.model ?? 'Daily Shoe',
    categories: overrides.categories ?? ['daily-trainer'],
    surfaceTags,
    stability: overrides.stability ?? 'neutral',
    factsReviewed: false,
    facets: {
      experienceTags: [],
      useCase: ['daily-trainer'],
      cushioningLevel: null,
      stability:
        overrides.stability === 'unknown'
          ? null
          : (overrides.stability ?? 'neutral'),
      supportFeatures: [],
      surfaceTags,
      distanceRangeKm:
        overrides.distance === null
          ? null
          : { min: 0, max: overrides.distance ?? 42 },
      priorityTags: [],
      fit: [],
    },
    details: {
      bestFor: { en: 'Daily running', de: null, fr: null },
      overview: { en: 'Daily running', de: null, fr: null },
      bestAt: { en: 'Daily running', de: null, fr: null },
      lessSuitableFor: { en: 'Technical trails', de: null, fr: null },
    },
    images: [],
    sourceUrl: 'https://example.com/product',
    specifications: {
      maximumDistanceKm:
        overrides.distance === null ? null : (overrides.distance ?? 42),
      dropMm: null,
      stackHeightMm: null,
      weightG: null,
      weightReferenceSize: null,
      fit: [],
      technologies: [],
    },
  };
}

const roadProfile: RunnerProfile = {
  typicalDistanceKm: 10,
  primarySurface: 'road',
  secondarySurfaces: ['gravel'],
  goal: 'daily-fitness',
  stabilityPreference: 'neutral',
};

describe('transparent shoe recommendation rules', () => {
  it('creates a strong match when the essential requirements match', () => {
    const result = evaluateShoeRecommendation(roadProfile, shoe());

    expect(result.tier).toBe('strong-match');
    expect(result.evaluations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'primary-surface',
          outcome: 'match',
          points: 40,
        }),
        expect.objectContaining({
          rule: 'secondary-surface',
          outcome: 'preference-match',
          points: 20,
        }),
        expect.objectContaining({
          rule: 'distance',
          outcome: 'match',
          points: 30,
        }),
      ]),
    );
  });

  it('supports multiple secondary surfaces without weakening the primary one', () => {
    const result = evaluateShoeRecommendation(
      {
        ...roadProfile,
        secondarySurfaces: ['gravel', 'trail', 'gravel'],
      },
      shoe({ surfaces: ['Road', 'Gravel', 'Trail'] }),
    );
    const secondary = result.evaluations.find(
      ({ rule }) => rule === 'secondary-surface',
    );

    expect(secondary).toEqual(
      expect.objectContaining({
        actual: 'gravel, trail',
        outcome: 'preference-match',
        points: 40,
      }),
    );
  });

  it('prioritizes true gravel shoes over road shoes that only tolerate firm paths', () => {
    const exactGravel = evaluateShoeRecommendation(
      roadProfile,
      shoe({
        categories: ['trail'],
        surfaceTags: ['road', 'firm-paths'],
      }),
    );
    const compatibleRoad = evaluateShoeRecommendation(
      roadProfile,
      shoe({
        categories: ['daily-trainer'],
        surfaceTags: ['road', 'firm-paths'],
      }),
    );

    expect(exactGravel.tier).toBe('great-match');
    expect(exactGravel.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'secondary-surface',
        outcome: 'preference-match',
        points: 20,
      }),
    );
    expect(compatibleRoad.tier).toBe('great-match');
    expect(compatibleRoad.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'secondary-surface',
        outcome: 'trade-off',
        points: 3,
      }),
    );
    expect(exactGravel.internalScore).toBeGreaterThan(
      compatibleRoad.internalScore,
    );
  });

  it('excludes a shoe that does not support the primary surface', () => {
    const result = evaluateShoeRecommendation(
      roadProfile,
      shoe({ surfaces: ['Trail'] }),
    );

    expect(result.tier).toBe('not-a-match');
    expect(result.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'primary-surface',
        outcome: 'exclude',
      }),
    );
  });

  it('excludes a shoe whose published distance is too short', () => {
    const result = evaluateShoeRecommendation(
      roadProfile,
      shoe({ distance: 5 }),
    );

    expect(result.tier).toBe('not-a-match');
    expect(result.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'distance',
        expected: 10,
        actual: 5,
        outcome: 'exclude',
      }),
    );
  });

  it('keeps missing distance information neutral instead of excluding a shoe', () => {
    const pending = evaluateShoeRecommendation(
      roadProfile,
      shoe({ distance: null }),
    );

    expect(pending.tier).toBe('good-alternative');
    expect(pending.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'distance',
        outcome: 'unavailable',
      }),
    );
  });

  it('uses the great-match tier when essentials match but a preference differs', () => {
    const result = evaluateShoeRecommendation(
      roadProfile,
      shoe({ surfaces: ['Road'] }),
    );

    expect(result.tier).toBe('great-match');
    expect(result.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'secondary-surface',
        outcome: 'trade-off',
      }),
    );
  });

  it('keeps unanswered essential questions neutral instead of excluding shoes', () => {
    const result = evaluateShoeRecommendation(
      {
        goal: 'daily-fitness',
        stabilityPreference: 'no-preference',
      },
      shoe({ surfaces: ['Trail'], distance: 5 }),
    );

    expect(result.tier).toBe('good-alternative');
    expect(result.evaluations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'primary-surface',
          outcome: 'unavailable',
        }),
        expect.objectContaining({
          rule: 'distance',
          outcome: 'unavailable',
        }),
      ]),
    );
  });

  it('uses the customer priority as a ranking bonus rather than an unsupported penalty', () => {
    const comfort = evaluateShoeRecommendation(
      { ...roadProfile, priority: 'comfort' },
      shoe({ categories: ['max-cushion'] }),
    );
    const speed = evaluateShoeRecommendation(
      { ...roadProfile, priority: 'speed' },
      shoe({ categories: ['max-cushion'] }),
    );

    expect(comfort.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'priority',
        outcome: 'preference-match',
        points: 10,
      }),
    );
    expect(speed.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'priority',
        outcome: 'unavailable',
      }),
    );
    expect(speed.tier).toBe(comfort.tier);
  });

  it('shares the legacy preview priority bonus across two selections', () => {
    const result = evaluateShoeRecommendation(
      { ...roadProfile, priorities: ['value', 'comfort'] },
      shoe({ categories: ['entry-level'] }),
    );

    expect(result.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'priority',
        expected: 'value, comfort',
        outcome: 'preference-match',
        points: 5,
      }),
    );
  });

  it('ranks matches deterministically and omits exclusions from recommendations', () => {
    const candidates = [
      shoe({ id: 'trail-only', model: 'Trail Only', surfaces: ['Trail'] }),
      shoe({
        id: 'fallback-road',
        model: 'Fallback Road',
      }),
      shoe({ id: 'verified-road', model: 'Verified Road' }),
    ];

    expect(
      rankShoeRecommendations(roadProfile, candidates).map(
        ({ product, tier }) => [product.id, tier],
      ),
    ).toEqual([
      ['fallback-road', 'strong-match'],
      ['verified-road', 'strong-match'],
      ['trail-only', 'not-a-match'],
    ]);
    expect(
      recommendShoes(roadProfile, candidates).map(({ product }) => product.id),
    ).toEqual(['fallback-road', 'verified-road']);
  });
});
