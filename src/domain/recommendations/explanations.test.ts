import { describe, expect, it } from 'vitest';

import type { FacetScoreBreakdown } from './matching';
import { explainRecommendation } from './explanations';

function evaluation(
  overrides: Partial<FacetScoreBreakdown> = {},
): FacetScoreBreakdown {
  return {
    actual: ['daily-trainer'],
    expected: ['daily-trainer'],
    facet: 'useCase',
    hardConflict: false,
    match: 1,
    optionId: 'dailyFitness',
    outcome: 'match',
    score: 0.7,
    stepId: 'goal',
    weight: 0.7,
    ...overrides,
  };
}

describe('recommendation explanations', () => {
  it('does not present editorial copy as scored evidence for neutral answers', () => {
    expect(
      explainRecommendation({
        breakdown: [],
        internalScore: 0,
        maximumScore: 0,
      }),
    ).toEqual({ showWhy: false });
  });

  it('shows best-at copy for a scored recommendation', () => {
    expect(
      explainRecommendation({
        breakdown: [evaluation()],
        internalScore: 0.7,
        maximumScore: 0.7,
      }),
    ).toEqual({ showWhy: true });
  });
});
