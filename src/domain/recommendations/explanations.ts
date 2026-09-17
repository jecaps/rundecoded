import type { ShoeRecommendation } from './matching';

export interface RecommendationExplanation {
  showWhy: boolean;
}

/**
 * Decide when existing editorial copy should be shown as a recommendation
 * explanation. Scoring remains entirely in matching.ts. Product limitations
 * stay in the catalogue details modal rather than the recommendation list.
 */
export function explainRecommendation(
  recommendation: Pick<
    ShoeRecommendation,
    'breakdown' | 'internalScore' | 'maximumScore'
  >,
): RecommendationExplanation {
  if (recommendation.maximumScore === 0 || recommendation.internalScore === 0) {
    return { showWhy: false };
  }

  return { showWhy: true };
}
