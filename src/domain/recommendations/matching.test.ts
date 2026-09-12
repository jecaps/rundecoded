import { describe, expect, it } from 'vitest';

import type {
  Evidence,
  ShoeProduct,
  SurfaceFamily,
  SurfaceTag,
  TerrainProfile,
  VerificationStatus,
} from '@/domain/catalogue';

import {
  evaluateShoeRecommendation,
  rankShoeRecommendations,
  recommendShoes,
  type RunnerProfile,
} from './matching';

function evidence(status: VerificationStatus): Evidence {
  return status === 'pending'
    ? { status, sourceIds: [], note: 'Research is pending.' }
    : {
        status,
        sourceIds: ['product-source'],
        ...(status === 'derived'
          ? { note: 'Derived from the published distance range.' }
          : {}),
      };
}

function shoe(
  overrides: {
    categories?: string[];
    distance?: number | null;
    distanceStatus?: VerificationStatus;
    id?: string;
    model?: string;
    stability?: 'neutral' | 'stability' | 'unknown';
    surfaceFamilies?: SurfaceFamily[];
    surfaces?: string[];
    surfaceStatus?: VerificationStatus;
    surfaceTags?: SurfaceTag[];
    terrainProfiles?: TerrainProfile[] | null;
  } = {},
): ShoeProduct {
  const distanceStatus = overrides.distanceStatus ?? 'verified';
  const maximumDistance =
    overrides.distance === null ? null : (overrides.distance ?? 42);
  const surfaces = overrides.surfaces ?? ['Road', 'Gravel'];
  const surfaceFamilies = overrides.surfaceFamilies ?? [
    ...(surfaces.includes('Road') ? (['road'] as const) : []),
    ...(surfaces.some((surface) =>
      ['Gravel', 'Trail', 'Cross-country'].includes(surface),
    )
      ? (['off-road'] as const)
      : []),
    ...(surfaces.some((surface) => ['Track', 'Cross-country'].includes(surface))
      ? (['track'] as const)
      : []),
  ];
  const terrainProfiles =
    overrides.terrainProfiles === undefined
      ? surfaces.includes('Gravel')
        ? (['gravel'] as TerrainProfile[])
        : []
      : overrides.terrainProfiles;
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
    schemaVersion: 1,
    id: overrides.id ?? 'example-daily-shoe',
    kind: 'shoe',
    lifecycle: 'active',
    brand: { id: 'example', name: 'Example' },
    model: overrides.model ?? 'Daily Shoe',
    categories: (overrides.categories ?? ['daily-trainer']).map((id) => ({
      id,
      label: { en: id, de: null, fr: null },
    })),
    copy: {
      bestFor: { en: 'Daily running', de: null, fr: null },
    },
    technologies: {
      value: null,
      evidence: evidence('pending'),
    },
    images: [],
    sources: [
      {
        id: 'product-source',
        type: 'retailer-product',
        label: 'Product source',
        url: 'https://example.com/product',
        checkedAt: '2026-09-08',
        status: 'verified',
      },
    ],
    comparables: [],
    specifications: {
      surfaces: {
        value: surfaces,
        evidence: evidence(overrides.surfaceStatus ?? 'verified'),
      },
      surfaceFamilies: {
        value: surfaceFamilies,
        evidence: evidence(overrides.surfaceStatus ?? 'verified'),
      },
      terrainProfiles: {
        value: terrainProfiles,
        evidence: evidence(
          terrainProfiles === null
            ? 'pending'
            : (overrides.surfaceStatus ?? 'verified'),
        ),
      },
      surfaceTags: {
        value: surfaceTags,
        evidence: evidence(overrides.surfaceStatus ?? 'verified'),
      },
      stability: {
        value: overrides.stability ?? 'neutral',
        evidence: evidence('verified'),
      },
      maximumDistance: {
        value:
          maximumDistance === null
            ? null
            : { amount: maximumDistance, unit: 'km' },
        evidence: evidence(distanceStatus),
      },
      heelToToeDrop: {
        value: null,
        evidence: evidence('pending'),
      },
      stackHeight: {
        value: null,
        evidence: evidence('pending'),
      },
      weight: { value: null, evidence: evidence('pending') },
      fit: { value: null, evidence: evidence('pending') },
      construction: { value: null, evidence: evidence('pending') },
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
  it('creates a strong match only when essential evidence is verified', () => {
    const result = evaluateShoeRecommendation(roadProfile, shoe());

    expect(result.tier).toBe('strong-match');
    expect(result.confidence).toBe('high');
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
          points: 5,
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
        points: 10,
      }),
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

  it('reports evidence confidence separately from suitability', () => {
    const fallback = evaluateShoeRecommendation(
      roadProfile,
      shoe({ distanceStatus: 'fallback' }),
    );
    const pending = evaluateShoeRecommendation(
      roadProfile,
      shoe({ distance: null, distanceStatus: 'pending' }),
    );

    expect(fallback).toEqual(
      expect.objectContaining({
        tier: 'strong-match',
        confidence: 'low',
      }),
    );
    expect(pending).toEqual(
      expect.objectContaining({
        tier: 'good-alternative',
        confidence: 'unknown',
      }),
    );
    expect(pending.evaluations).toContainEqual(
      expect.objectContaining({
        rule: 'distance',
        outcome: 'unavailable',
      }),
    );
  });

  it('allows a complete derived-data match into the strong-match tier', () => {
    const result = evaluateShoeRecommendation(
      roadProfile,
      shoe({ distanceStatus: 'derived', surfaceStatus: 'derived' }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        tier: 'strong-match',
        confidence: 'medium',
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
    expect(result.confidence).toBe('unknown');
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

  it('ranks matches deterministically and omits exclusions from recommendations', () => {
    const candidates = [
      shoe({ id: 'trail-only', model: 'Trail Only', surfaces: ['Trail'] }),
      shoe({
        id: 'fallback-road',
        model: 'Fallback Road',
        distanceStatus: 'fallback',
      }),
      shoe({ id: 'verified-road', model: 'Verified Road' }),
    ];

    expect(
      rankShoeRecommendations(roadProfile, candidates).map(
        ({ product, tier }) => [product.id, tier],
      ),
    ).toEqual([
      ['verified-road', 'strong-match'],
      ['fallback-road', 'strong-match'],
      ['trail-only', 'not-a-match'],
    ]);
    expect(
      recommendShoes(roadProfile, candidates).map(({ product }) => product.id),
    ).toEqual(['verified-road', 'fallback-road']);
  });
});
