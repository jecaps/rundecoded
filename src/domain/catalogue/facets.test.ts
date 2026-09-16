import { describe, expect, it } from 'vitest';

import { shoeFacetsSchema } from './facets';

const unreviewedFacets = {
  experienceTags: [],
  useCase: [],
  cushioningLevel: null,
  stability: null,
  supportFeatures: [],
  surfaceTags: [],
  distanceRangeKm: null,
  priorityTags: [],
  fit: [],
};

describe('shoe matching facets', () => {
  it('accepts multiple customer experience levels', () => {
    expect(
      shoeFacetsSchema.parse({
        ...unreviewedFacets,
        experienceTags: ['beginner', 'recreational'],
      }),
    ).toMatchObject({ experienceTags: ['beginner', 'recreational'] });
  });

  it('accepts interval as a shoe use case', () => {
    expect(
      shoeFacetsSchema.parse({
        ...unreviewedFacets,
        cushioningLevel: 'firm',
        distanceRangeKm: { min: 0, max: 10 },
        fit: ['regular'],
        priorityTags: ['speed-responsiveness'],
        stability: 'neutral',
        surfaceTags: ['track'],
        useCase: ['interval'],
      }),
    ).toMatchObject({ useCase: ['interval'] });
  });

  it('allows unreviewed facts without inventing matching values', () => {
    expect(shoeFacetsSchema.parse(unreviewedFacets)).toEqual(unreviewedFacets);
  });

  it('rejects an inverted distance range', () => {
    expect(() =>
      shoeFacetsSchema.parse({
        ...unreviewedFacets,
        distanceRangeKm: { min: 42, max: 10 },
      }),
    ).toThrow(/minimum distance must not exceed maximum distance/);
  });
});
