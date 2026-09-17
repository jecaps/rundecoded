import type {
  CatalogueShoe,
  DistanceRangeKm,
  ShoeFacets,
} from '@/domain/catalogue';

import {
  getQuizFacetMappings,
  type ConsultationStepId,
  type DropRangeMm,
  type QuizFacetMapping,
} from './quiz-facet-config';

export type QuizAnswers = Partial<Record<ConsultationStepId, string[]>>;

export type RecommendationTier =
  'strong-match' | 'great-match' | 'good-alternative' | 'not-a-match';

export type FacetMatchOutcome =
  'match' | 'partial-match' | 'miss' | 'neutral' | 'unavailable';

type FacetValue =
  DistanceRangeKm | DropRangeMm | number | string | string[] | null;

export interface FacetScoreBreakdown {
  actual: FacetValue;
  expected: FacetValue;
  facet: QuizFacetMapping['facet'];
  hardConflict: boolean;
  match: number;
  optionId: string;
  outcome: FacetMatchOutcome;
  score: number;
  stepId: ConsultationStepId;
  weight: number;
}

export interface ShoeRecommendation {
  breakdown: FacetScoreBreakdown[];
  distanceSpecificity: number;
  hardExcluded: boolean;
  internalScore: number;
  maximumScore: number;
  normalizedScore: number;
  product: CatalogueShoe;
  surfaceSpecificity: number;
  tier: RecommendationTier;
}

interface ResolvedMapping {
  mapping: QuizFacetMapping;
  optionId: string;
  optionIndex: number;
  stepId: ConsultationStepId;
}

const stepIds: ConsultationStepId[] = [
  'distance',
  'surfaces',
  'priority',
  'goal',
  'stability',
  'comfort',
];

const tierRank: Record<RecommendationTier, number> = {
  'strong-match': 3,
  'great-match': 2,
  'good-alternative': 1,
  'not-a-match': 0,
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function resolveMappings(answers: QuizAnswers): ResolvedMapping[] {
  return stepIds.flatMap((stepId) => {
    const optionIds = answers[stepId] ?? [];
    const activePriorityCount =
      stepId === 'priority'
        ? optionIds.filter((optionId) =>
            getQuizFacetMappings(stepId, optionId).some(
              ({ weight }) => weight > 0,
            ),
          ).length
        : 1;

    return optionIds.flatMap((optionId, optionIndex) =>
      getQuizFacetMappings(stepId, optionId).map((mapping) => ({
        mapping:
          stepId === 'priority' && activePriorityCount > 1
            ? { ...mapping, weight: mapping.weight / activePriorityCount }
            : mapping,
        optionId,
        optionIndex,
        stepId,
      })),
    );
  });
}

function productFacetValue(
  product: CatalogueShoe,
  facet: QuizFacetMapping['facet'],
): FacetValue {
  if (facet === 'dropMm') return product.specifications.dropMm;
  return product.facets[facet] as ShoeFacets[typeof facet];
}

function distanceMatch(actual: DistanceRangeKm, expected: DistanceRangeKm) {
  if (actual.max >= expected.max) return 1;
  if (actual.max < expected.min) return 0;

  const requestedSpan = Math.max(1, expected.max - expected.min);
  const coveredSpan = Math.max(0, actual.max - expected.min);
  return Math.max(0.2, clamp(coveredSpan / requestedSpan));
}

function dropMatch(actual: number, expected: DropRangeMm) {
  const aboveMinimum =
    expected.minInclusive === false
      ? actual > expected.min
      : actual >= expected.min;
  return aboveMinimum && actual <= expected.max ? 1 : 0;
}

function arrayMatch(actual: string[], expected: string[]) {
  if (expected.length === 0) return 0;
  const actualValues = new Set(actual);
  return expected.some((value) => actualValues.has(value)) ? 1 : 0;
}

function facetMatch(
  actual: FacetValue,
  expected: FacetValue,
  facet: QuizFacetMapping['facet'],
  acceptedValues?: readonly string[],
) {
  if (actual === null || expected === null) return 0;
  if (acceptedValues && typeof actual === 'string') {
    return acceptedValues.includes(actual) ? 1 : 0;
  }
  if (facet === 'distanceRangeKm') {
    return distanceMatch(
      actual as DistanceRangeKm,
      expected as DistanceRangeKm,
    );
  }
  if (facet === 'dropMm') {
    return dropMatch(actual as number, expected as DropRangeMm);
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return arrayMatch(actual, expected);
  }
  if (
    facet === 'stability' &&
    expected === 'stability' &&
    actual === 'motion-control'
  ) {
    return 1;
  }
  return actual === expected ? 1 : 0;
}

function isUnavailable(actual: FacetValue) {
  return actual === null || (Array.isArray(actual) && actual.length === 0);
}

function isHardConflict(
  resolved: ResolvedMapping,
  actual: FacetValue,
  match: number,
) {
  if (resolved.mapping.weight < 1 || match > 0 || isUnavailable(actual)) {
    return false;
  }

  if (resolved.mapping.facet === 'surfaceTags') {
    return resolved.optionIndex === 0;
  }

  return (
    resolved.mapping.facet === 'stability' &&
    resolved.mapping.value === 'stability' &&
    actual === 'neutral'
  );
}

function evaluateMapping(
  product: CatalogueShoe,
  resolved: ResolvedMapping,
): FacetScoreBreakdown {
  const { mapping, optionId, stepId } = resolved;
  const actual = productFacetValue(product, mapping.facet);
  const expected = (mapping.acceptedValues ?? mapping.value) as FacetValue;

  if (mapping.weight === 0) {
    return {
      actual,
      expected,
      facet: mapping.facet,
      hardConflict: false,
      match: 0,
      optionId,
      outcome: 'neutral',
      score: 0,
      stepId,
      weight: 0,
    };
  }

  const match = facetMatch(
    actual,
    mapping.value as FacetValue,
    mapping.facet,
    mapping.acceptedValues,
  );
  const unavailable = isUnavailable(actual);
  return {
    actual,
    expected,
    facet: mapping.facet,
    hardConflict: isHardConflict(resolved, actual, match),
    match,
    optionId,
    outcome: unavailable
      ? 'unavailable'
      : match === 1
        ? 'match'
        : match > 0
          ? 'partial-match'
          : 'miss',
    score: mapping.weight * match,
    stepId,
    weight: mapping.weight,
  };
}

function activeDistanceRange(mappings: ResolvedMapping[]) {
  const distance = mappings.find(
    ({ mapping }) => mapping.facet === 'distanceRangeKm' && mapping.weight > 0,
  );
  return (distance?.mapping.value as DistanceRangeKm | null) ?? null;
}

function distanceSpecificity(
  product: CatalogueShoe,
  requested: DistanceRangeKm | null,
) {
  const actual = product.facets.distanceRangeKm;
  if (!requested || !actual || actual.max < requested.max) return 0;
  const overshoot = Math.max(0, actual.max - requested.max);
  return 1 / (1 + overshoot / Math.max(1, requested.max));
}

function requestedSurfaceTags(mappings: ResolvedMapping[]) {
  return new Set(
    mappings.flatMap(({ mapping }) =>
      mapping.facet === 'surfaceTags' && mapping.weight > 0
        ? (mapping.value as string[])
        : [],
    ),
  );
}

function surfaceSpecificity(product: CatalogueShoe, requested: Set<string>) {
  if (requested.size === 0 || product.facets.surfaceTags.length === 0) return 0;
  const relevant = product.facets.surfaceTags.filter((tag) =>
    requested.has(tag),
  ).length;
  return relevant / product.facets.surfaceTags.length;
}

function tierForScore(
  normalizedScore: number,
  hardExcluded: boolean,
  maximumScore: number,
): RecommendationTier {
  if (hardExcluded) return 'not-a-match';
  if (maximumScore === 0) return 'good-alternative';
  if (normalizedScore >= 0.9) return 'strong-match';
  if (normalizedScore >= 0.75) return 'great-match';
  return 'good-alternative';
}

export function evaluateShoeRecommendation(
  answers: QuizAnswers,
  product: CatalogueShoe,
): ShoeRecommendation {
  const mappings = resolveMappings(answers);
  const breakdown = mappings.map((resolved) =>
    evaluateMapping(product, resolved),
  );
  const internalScore = breakdown.reduce(
    (total, evaluation) => total + evaluation.score,
    0,
  );
  const maximumScore = breakdown.reduce(
    (total, evaluation) => total + evaluation.weight,
    0,
  );
  const normalizedScore = maximumScore > 0 ? internalScore / maximumScore : 0;
  const hardExcluded = breakdown.some(({ hardConflict }) => hardConflict);

  return {
    breakdown,
    distanceSpecificity: distanceSpecificity(
      product,
      activeDistanceRange(mappings),
    ),
    hardExcluded,
    internalScore,
    maximumScore,
    normalizedScore,
    product,
    surfaceSpecificity: surfaceSpecificity(
      product,
      requestedSurfaceTags(mappings),
    ),
    tier: tierForScore(normalizedScore, hardExcluded, maximumScore),
  };
}

function diversifyByBrand(recommendations: ShoeRecommendation[]) {
  const byBrand = new Map<string, ShoeRecommendation[]>();
  for (const recommendation of recommendations) {
    const brand = recommendation.product.brand;
    byBrand.set(brand, [...(byBrand.get(brand) ?? []), recommendation]);
  }

  const diversified: ShoeRecommendation[] = [];
  while (byBrand.size > 0) {
    for (const [brand, products] of byBrand) {
      const next = products.shift();
      if (next) diversified.push(next);
      if (products.length === 0) byBrand.delete(brand);
    }
  }
  return diversified;
}

export function rankShoeRecommendations(
  answers: QuizAnswers,
  products: CatalogueShoe[],
): ShoeRecommendation[] {
  const recommendations = products
    .map((product) => evaluateShoeRecommendation(answers, product))
    .sort(
      (left, right) =>
        tierRank[right.tier] - tierRank[left.tier] ||
        right.normalizedScore - left.normalizedScore ||
        right.distanceSpecificity - left.distanceSpecificity ||
        right.surfaceSpecificity - left.surfaceSpecificity ||
        left.product.model.localeCompare(right.product.model, 'en'),
    );

  const hasActiveAnswer = recommendations.some(
    ({ maximumScore }) => maximumScore > 0,
  );
  return hasActiveAnswer ? recommendations : diversifyByBrand(recommendations);
}

export function recommendShoes(
  answers: QuizAnswers,
  products: CatalogueShoe[],
  limit = 5,
): ShoeRecommendation[] {
  return rankShoeRecommendations(answers, products)
    .filter(({ tier }) => tier !== 'not-a-match')
    .slice(0, limit);
}
