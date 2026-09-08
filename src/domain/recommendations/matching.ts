import {
  confidenceForEvidence,
  type ConfidenceLevel,
  type ShoeProduct,
} from '@/domain/catalogue';

export const recommendationSurfaces = [
  'road',
  'gravel',
  'trail',
  'technical-trail',
  'muddy-trail',
  'track',
  'cross-country',
] as const;

export const runningGoals = [
  'start-running',
  'daily-fitness',
  'comfortable-long-runs',
  'faster-training',
  'road-race',
  'trail-running',
  'trail-race',
  'track-or-cross-country',
] as const;

export type RecommendationSurface = (typeof recommendationSurfaces)[number];
export type RunningGoal = (typeof runningGoals)[number];
export type StabilityPreference = 'neutral' | 'stability' | 'no-preference';
export type RecommendationTier =
  'strong-match' | 'good-alternative' | 'not-a-match';

export interface RunnerProfile {
  goal?: RunningGoal;
  primarySurface: RecommendationSurface;
  secondarySurfaces?: RecommendationSurface[];
  stabilityPreference?: StabilityPreference;
  typicalDistanceKm: number;
}

export type RecommendationRule =
  | 'availability'
  | 'primary-surface'
  | 'secondary-surface'
  | 'distance'
  | 'goal'
  | 'stability';

export interface RuleEvaluation {
  actual: string | number | null;
  expected: string | number | null;
  outcome:
    'match' | 'preference-match' | 'trade-off' | 'unavailable' | 'exclude';
  points: number;
  rule: RecommendationRule;
}

export interface ShoeRecommendation {
  confidence: ConfidenceLevel;
  evaluations: RuleEvaluation[];
  internalScore: number;
  product: ShoeProduct;
  tier: RecommendationTier;
}

const categoryIdsByGoal: Record<RunningGoal, readonly string[]> = {
  'start-running': ['entry-level', 'daily-trainer'],
  'daily-fitness': ['daily-trainer'],
  'comfortable-long-runs': ['max-cushion', 'daily-trainer'],
  'faster-training': ['fast-training', 'super-trainer'],
  'road-race': ['race', 'carbon'],
  'trail-running': ['trail', 'road-to-trail', 'technical-trail'],
  'trail-race': ['trail-race', 'technical-trail'],
  'track-or-cross-country': ['track-spikes', 'spikes'],
};

const confidenceRank: Record<ConfidenceLevel, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function weakestConfidence(values: ConfidenceLevel[]): ConfidenceLevel {
  return values.reduce((weakest, value) =>
    confidenceRank[value] < confidenceRank[weakest] ? value : weakest,
  );
}

function normalizedProductSurfaces(product: ShoeProduct): Set<string> {
  return new Set(
    (product.specifications.surfaces.value ?? []).map((surface) =>
      surface.trim().toLocaleLowerCase('en'),
    ),
  );
}

function supportsSurface(
  product: ShoeProduct,
  requested: RecommendationSurface,
): boolean {
  const surfaces = normalizedProductSurfaces(product);
  const categories = new Set(product.categories.map(({ id }) => id));

  switch (requested) {
    case 'road':
      return surfaces.has('road');
    case 'gravel':
      return (
        surfaces.has('gravel') ||
        surfaces.has('firm paths') ||
        categories.has('road-to-trail')
      );
    case 'trail':
      return surfaces.has('trail') || surfaces.has('muddy trail');
    case 'technical-trail':
      return surfaces.has('trail') && categories.has('technical-trail');
    case 'muddy-trail':
      return surfaces.has('muddy trail');
    case 'track':
      return surfaces.has('track');
    case 'cross-country':
      return surfaces.has('cross-country');
  }
}

function goalMatches(product: ShoeProduct, goal: RunningGoal): boolean {
  const accepted = new Set(categoryIdsByGoal[goal]);
  return product.categories.some(({ id }) => accepted.has(id));
}

export function evaluateShoeRecommendation(
  profile: RunnerProfile,
  product: ShoeProduct,
): ShoeRecommendation {
  const evaluations: RuleEvaluation[] = [];
  let internalScore = 0;
  let excluded = false;

  const active = product.lifecycle === 'active';
  evaluations.push({
    rule: 'availability',
    outcome: active ? 'match' : 'exclude',
    points: 0,
    expected: 'active',
    actual: product.lifecycle,
  });
  excluded ||= !active;

  const primarySurfaceMatch = supportsSurface(product, profile.primarySurface);
  evaluations.push({
    rule: 'primary-surface',
    outcome: primarySurfaceMatch ? 'match' : 'exclude',
    points: primarySurfaceMatch ? 40 : 0,
    expected: profile.primarySurface,
    actual: (product.specifications.surfaces.value ?? []).join(', ') || null,
  });
  internalScore += primarySurfaceMatch ? 40 : 0;
  excluded ||= !primarySurfaceMatch;

  const secondarySurfaces = [
    ...new Set(
      (profile.secondarySurfaces ?? []).filter(
        (surface) => surface !== profile.primarySurface,
      ),
    ),
  ];
  const matchingSecondarySurfaces = secondarySurfaces.filter((surface) =>
    supportsSurface(product, surface),
  );
  const secondaryPoints = Math.min(matchingSecondarySurfaces.length * 5, 10);
  evaluations.push({
    rule: 'secondary-surface',
    outcome:
      secondarySurfaces.length === 0
        ? 'unavailable'
        : matchingSecondarySurfaces.length > 0
          ? 'preference-match'
          : 'trade-off',
    points: secondaryPoints,
    expected: secondarySurfaces.join(', ') || null,
    actual: matchingSecondarySurfaces.join(', ') || null,
  });
  internalScore += secondaryPoints;

  const maximumDistance = product.specifications.maximumDistance.value?.amount;
  const distanceKnown = maximumDistance !== undefined;
  const distanceMatch =
    distanceKnown && maximumDistance >= profile.typicalDistanceKm;
  evaluations.push({
    rule: 'distance',
    outcome: !distanceKnown
      ? 'unavailable'
      : distanceMatch
        ? 'match'
        : 'exclude',
    points: distanceMatch ? 30 : 0,
    expected: profile.typicalDistanceKm,
    actual: maximumDistance ?? null,
  });
  internalScore += distanceMatch ? 30 : 0;
  excluded ||= distanceKnown && !distanceMatch;

  const matchedGoal = profile.goal ? goalMatches(product, profile.goal) : null;
  evaluations.push({
    rule: 'goal',
    outcome:
      matchedGoal === null
        ? 'unavailable'
        : matchedGoal
          ? 'preference-match'
          : 'trade-off',
    points: matchedGoal ? 15 : 0,
    expected: profile.goal ?? null,
    actual: product.categories.map(({ id }) => id).join(', '),
  });
  internalScore += matchedGoal ? 15 : 0;

  const requestedStability = profile.stabilityPreference;
  const actualStability = product.specifications.stability.value;
  const stabilityApplies =
    requestedStability !== undefined && requestedStability !== 'no-preference';
  const stabilityMatch =
    stabilityApplies && actualStability === requestedStability;
  evaluations.push({
    rule: 'stability',
    outcome: !stabilityApplies
      ? 'unavailable'
      : actualStability === 'unknown'
        ? 'unavailable'
        : stabilityMatch
          ? 'preference-match'
          : 'trade-off',
    points: stabilityMatch ? 5 : 0,
    expected: stabilityApplies ? requestedStability : null,
    actual: actualStability,
  });
  internalScore += stabilityMatch ? 5 : 0;

  const confidence = weakestConfidence([
    confidenceForEvidence(product.specifications.surfaces.evidence),
    confidenceForEvidence(product.specifications.maximumDistance.evidence),
  ]);
  const hasPreferenceTradeOff = evaluations.some(
    ({ outcome }) => outcome === 'trade-off',
  );

  return {
    product,
    evaluations,
    internalScore,
    confidence,
    tier: excluded
      ? 'not-a-match'
      : confidence === 'high' && !hasPreferenceTradeOff
        ? 'strong-match'
        : 'good-alternative',
  };
}

export function rankShoeRecommendations(
  profile: RunnerProfile,
  products: ShoeProduct[],
): ShoeRecommendation[] {
  const tierRank: Record<RecommendationTier, number> = {
    'strong-match': 2,
    'good-alternative': 1,
    'not-a-match': 0,
  };

  return products
    .map((product) => evaluateShoeRecommendation(profile, product))
    .sort(
      (left, right) =>
        tierRank[right.tier] - tierRank[left.tier] ||
        right.internalScore - left.internalScore ||
        confidenceRank[right.confidence] - confidenceRank[left.confidence] ||
        left.product.model.localeCompare(right.product.model, 'en'),
    );
}

export function recommendShoes(
  profile: RunnerProfile,
  products: ShoeProduct[],
  limit = 5,
): ShoeRecommendation[] {
  return rankShoeRecommendations(profile, products)
    .filter(({ tier }) => tier !== 'not-a-match')
    .slice(0, limit);
}
