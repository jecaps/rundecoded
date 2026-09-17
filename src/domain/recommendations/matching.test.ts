import { describe, expect, it } from 'vitest';

import type {
  CatalogueShoe,
  CushioningLevel,
  ExperienceTag,
  PriorityTag,
  StabilityLevel,
  SurfaceTag,
  UseCase,
} from '@/domain/catalogue';

import {
  evaluateShoeRecommendation,
  rankShoeRecommendations,
  recommendShoes,
  type QuizAnswers,
} from './matching';

function shoe(
  overrides: {
    brand?: string;
    cushioning?: CushioningLevel | null;
    distance?: { max: number; min: number } | null;
    dropMm?: number | null;
    experience?: ExperienceTag[];
    id?: string;
    model?: string;
    priorities?: PriorityTag[];
    stability?: StabilityLevel | null;
    surfaces?: SurfaceTag[];
    useCase?: UseCase[];
  } = {},
): CatalogueShoe {
  const surfaceTags = overrides.surfaces ?? ['road', 'asphalt'];
  const stability = overrides.stability ?? 'neutral';
  const distanceRangeKm =
    overrides.distance === undefined ? { min: 1, max: 42 } : overrides.distance;
  return {
    id: overrides.id ?? 'example-shoe',
    kind: 'shoe',
    brand: overrides.brand ?? 'Example',
    model: overrides.model ?? 'Example Shoe',
    categories: ['daily-trainer'],
    surfaceTags,
    stability:
      stability === 'motion-control' ? 'stability' : (stability ?? 'unknown'),
    factsReviewed: true,
    facets: {
      experienceTags: overrides.experience ?? ['recreational'],
      useCase: overrides.useCase ?? ['daily-trainer'],
      cushioningLevel: overrides.cushioning ?? 'balanced',
      stability,
      supportFeatures: [],
      surfaceTags,
      distanceRangeKm,
      priorityTags: overrides.priorities ?? ['cushioning-comfort'],
      fit: ['regular'],
    },
    details: {
      bestFor: { en: 'Daily running', de: null, fr: null },
      overview: { en: 'Daily running', de: null, fr: null },
      bestAt: { en: 'Daily running', de: null, fr: null },
      lessSuitableFor: { en: 'Technical terrain', de: null, fr: null },
    },
    images: [],
    sourceUrl: 'https://example.com/product',
    specifications: {
      maximumDistanceKm: distanceRangeKm?.max ?? null,
      dropMm: overrides.dropMm ?? 8,
      stackHeightMm: null,
      weightG: null,
      weightReferenceSize: null,
      fit: ['regular'],
      technologies: [],
    },
  };
}

describe('facet-based shoe recommendation scoring', () => {
  it('uses OR semantics for array-valued facet mappings', () => {
    const result = evaluateShoeRecommendation(
      { surfaces: ['road'], goal: ['fasterTraining'] },
      shoe({ surfaces: ['asphalt'], useCase: ['tempo'] }),
    );

    expect(result.tier).toBe('strong-match');
    expect(result.breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          facet: 'surfaceTags',
          match: 1,
          outcome: 'match',
        }),
        expect.objectContaining({
          facet: 'useCase',
          match: 1,
          outcome: 'match',
        }),
      ]),
    );
  });

  it('gives partial distance credit below the requested upper bound', () => {
    const result = evaluateShoeRecommendation(
      { distance: ['upTo21'] },
      shoe({ distance: { min: 1, max: 15 } }),
    );
    const distance = result.breakdown.find(
      ({ facet }) => facet === 'distanceRangeKm',
    );

    expect(distance).toEqual(
      expect.objectContaining({
        match: expect.closeTo(5 / 11),
        outcome: 'partial-match',
      }),
    );
    expect(result.tier).toBe('good-alternative');
  });

  it('lets an ultra-capable shoe fully satisfy a shorter long-distance answer', () => {
    const result = evaluateShoeRecommendation(
      {
        distance: ['upTo42'],
        surfaces: ['trail'],
        priority: ['comfort'],
        goal: ['trailRunning'],
        comfort: ['knees'],
      },
      shoe({
        cushioning: 'max',
        distance: { min: 42, max: 170 },
        dropMm: 6,
        priorities: ['cushioning-comfort'],
        surfaces: ['mixed-terrain'],
        useCase: ['long-run'],
      }),
    );

    expect(result.internalScore).toBeCloseTo(3.65);
    expect(result.normalizedScore).toBe(1);
    expect(result.tier).toBe('strong-match');
  });

  it('hard-excludes only a conflicting primary surface, not a secondary one', () => {
    const answers: QuizAnswers = { surfaces: ['road', 'gravel'] };
    const roadOnly = evaluateShoeRecommendation(
      answers,
      shoe({ surfaces: ['road', 'asphalt'] }),
    );
    const gravelOnly = evaluateShoeRecommendation(
      answers,
      shoe({ surfaces: ['gravel'] }),
    );

    expect(roadOnly.hardExcluded).toBe(false);
    expect(roadOnly.tier).toBe('good-alternative');
    expect(gravelOnly.hardExcluded).toBe(true);
    expect(gravelOnly.tier).toBe('not-a-match');
  });

  it('hard-excludes a neutral shoe when additional stability is requested', () => {
    const result = evaluateShoeRecommendation(
      { stability: ['stability'] },
      shoe({ stability: 'neutral' }),
    );

    expect(result.hardExcluded).toBe(true);
    expect(result.tier).toBe('not-a-match');
  });

  it('shares the priority weight when two priorities are selected', () => {
    const result = evaluateShoeRecommendation(
      { priority: ['value', 'comfort'] },
      shoe({ cushioning: 'firm', priorities: ['value'] }),
    );

    expect(result.maximumScore).toBeCloseTo(0.7);
    expect(result.internalScore).toBeCloseTo(0.35);
  });

  it('matches the comfort priority to balanced and maximum cushioning', () => {
    const balanced = evaluateShoeRecommendation(
      { priority: ['comfort'] },
      shoe({ cushioning: 'balanced' }),
    );
    const maximum = evaluateShoeRecommendation(
      { priority: ['comfort'] },
      shoe({ cushioning: 'max' }),
    );
    const firm = evaluateShoeRecommendation(
      { priority: ['comfort'] },
      shoe({ cushioning: 'firm' }),
    );

    expect(balanced.internalScore).toBeCloseTo(0.7);
    expect(maximum.internalScore).toBeCloseTo(0.7);
    expect(firm.internalScore).toBe(0);
  });

  it('returns a broad brand-diverse spread for all not-sure answers', () => {
    const products = [
      shoe({ brand: 'Alpha', id: 'alpha-one', model: 'Alpha One' }),
      shoe({ brand: 'Alpha', id: 'alpha-two', model: 'Alpha Two' }),
      shoe({ brand: 'Beta', id: 'beta-one', model: 'Beta One' }),
      shoe({ brand: 'Gamma', id: 'gamma-one', model: 'Gamma One' }),
    ];
    const answers: QuizAnswers = {
      distance: ['unknown'],
      surfaces: ['unknown'],
      priority: ['unknown'],
      goal: ['unknown'],
      stability: ['unknown'],
      comfort: ['unknown'],
    };
    const results = recommendShoes(answers, products, products.length);

    expect(results).toHaveLength(4);
    expect(results.slice(0, 3).map(({ product }) => product.brand)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ]);
    expect(results.every(({ tier }) => tier === 'good-alternative')).toBe(true);
  });

  it('ranks responsive long-distance shoes above pure max-cushion shoes', () => {
    const answers: QuizAnswers = {
      distance: ['upTo42'],
      surfaces: ['road'],
      priority: ['speed'],
    };
    const responsive = shoe({
      id: 'responsive-long-run',
      model: 'Responsive Long Run',
      priorities: ['speed-responsiveness'],
    });
    const maxCushion = shoe({
      cushioning: 'max',
      id: 'pure-max-cushion',
      model: 'Pure Max Cushion',
      priorities: ['cushioning-comfort'],
    });
    const results = recommendShoes(answers, [maxCushion, responsive], 10);

    expect(results.map(({ product }) => product.id)).toEqual([
      'responsive-long-run',
      'pure-max-cushion',
    ]);
  });

  it('returns several ranked alternatives when no product is a perfect match', () => {
    const answers: QuizAnswers = {
      distance: ['upTo42'],
      surfaces: ['road'],
      priority: ['speed'],
      goal: ['fasterTraining'],
    };
    const results = rankShoeRecommendations(answers, [
      shoe({
        id: 'distance-only',
        model: 'Distance Only',
        priorities: ['cushioning-comfort'],
      }),
      shoe({
        distance: { min: 1, max: 30 },
        id: 'partial-distance',
        model: 'Partial Distance',
        priorities: ['speed-responsiveness'],
      }),
      shoe({
        id: 'tempo-only',
        model: 'Tempo Only',
        priorities: ['cushioning-comfort'],
        useCase: ['tempo'],
      }),
    ]).filter(({ tier }) => tier !== 'not-a-match');

    expect(results).toHaveLength(3);
    expect(results.every(({ tier }) => tier !== 'strong-match')).toBe(true);
  });
});
