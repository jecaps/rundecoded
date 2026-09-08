import { describe, expect, it } from 'vitest';

import type {
  Evidence,
  ShoeProduct,
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
    surfaces?: string[];
    surfaceStatus?: VerificationStatus;
  } = {},
): ShoeProduct {
  const distanceStatus = overrides.distanceStatus ?? 'verified';
  const maximumDistance =
    overrides.distance === null ? null : (overrides.distance ?? 42);
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
        value: overrides.surfaces ?? ['Road', 'Gravel'],
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

  it('keeps missing or fallback essentials out of the strong-match tier', () => {
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
        tier: 'good-alternative',
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
      ['fallback-road', 'good-alternative'],
      ['trail-only', 'not-a-match'],
    ]);
    expect(
      recommendShoes(roadProfile, candidates).map(({ product }) => product.id),
    ).toEqual(['verified-road', 'fallback-road']);
  });
});
