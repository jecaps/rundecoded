import type { CatalogueShoe } from '@/domain/catalogue';

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
export type RecommendationPriority =
  'value' | 'comfort' | 'versatility' | 'speed' | 'guidance';
export type StabilityPreference = 'neutral' | 'stability' | 'no-preference';
export type RecommendationTier =
  'strong-match' | 'great-match' | 'good-alternative' | 'not-a-match';

export interface RunnerProfile {
  goal?: RunningGoal;
  primarySurface?: RecommendationSurface;
  priorities?: RecommendationPriority[];
  priority?: RecommendationPriority;
  secondarySurfaces?: RecommendationSurface[];
  stabilityPreference?: StabilityPreference;
  typicalDistanceKm?: number;
}

export type RecommendationRule =
  | 'primary-surface'
  | 'secondary-surface'
  | 'distance'
  | 'goal'
  | 'priority'
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
  evaluations: RuleEvaluation[];
  internalScore: number;
  product: CatalogueShoe;
  tier: RecommendationTier;
}

const categoryIdsByGoal: Record<RunningGoal, readonly string[]> = {
  'start-running': ['entry-level', 'daily-trainer'],
  'daily-fitness': ['daily-trainer'],
  'comfortable-long-runs': ['max-cushion', 'daily-trainer'],
  'faster-training': ['fast-training', 'super-trainer'],
  'road-race': ['race', 'carbon'],
  'trail-running': ['trail'],
  'trail-race': ['trail-race'],
  'track-or-cross-country': ['track-spikes', 'spikes'],
};

const categoryIdsByPriority: Record<RecommendationPriority, readonly string[]> =
  {
    value: ['entry-level'],
    comfort: ['max-cushion', 'daily-trainer'],
    versatility: ['daily-trainer', 'entry-level'],
    speed: ['fast-training', 'super-trainer', 'race', 'carbon'],
    guidance: ['stability-and-guidance', 'support'],
  };

type SurfaceMatchQuality = 'exact' | 'compatible' | 'none';

function surfaceMatchQuality(
  product: CatalogueShoe,
  requested: RecommendationSurface,
): SurfaceMatchQuality {
  const tags = new Set(product.surfaceTags);
  const categories = new Set(product.categories);

  switch (requested) {
    case 'road':
      return tags.has('road') || tags.has('asphalt') ? 'exact' : 'none';
    case 'gravel':
      if (
        tags.has('gravel') ||
        (tags.has('firm-paths') &&
          (categories.has('trail') || categories.has('trail-race')))
      ) {
        return 'exact';
      }
      return tags.has('firm-paths') ? 'compatible' : 'none';
    case 'trail':
      return tags.has('easy-terrain') ||
        tags.has('mixed-terrain') ||
        tags.has('technical-terrain') ||
        tags.has('muddy-terrain')
        ? 'exact'
        : 'none';
    case 'technical-trail':
      return tags.has('technical-terrain')
        ? 'exact'
        : tags.has('mixed-terrain')
          ? 'compatible'
          : 'none';
    case 'muddy-trail':
      return tags.has('muddy-terrain') ? 'exact' : 'none';
    case 'track':
      return tags.has('track') ? 'exact' : 'none';
    case 'cross-country':
      return tags.has('cross-country') ? 'exact' : 'none';
  }
}

function goalMatches(product: CatalogueShoe, goal: RunningGoal): boolean {
  const accepted = new Set(categoryIdsByGoal[goal]);
  return product.categories.some((id) => accepted.has(id));
}

export function evaluateShoeRecommendation(
  profile: RunnerProfile,
  product: CatalogueShoe,
): ShoeRecommendation {
  const evaluations: RuleEvaluation[] = [];
  let internalScore = 0;
  let excluded = false;

  const primarySurfaceQuality = profile.primarySurface
    ? surfaceMatchQuality(product, profile.primarySurface)
    : null;
  evaluations.push({
    rule: 'primary-surface',
    outcome:
      primarySurfaceQuality === null
        ? 'unavailable'
        : primarySurfaceQuality === 'exact'
          ? 'match'
          : primarySurfaceQuality === 'compatible'
            ? 'trade-off'
            : 'exclude',
    points:
      primarySurfaceQuality === 'exact'
        ? 40
        : primarySurfaceQuality === 'compatible'
          ? 30
          : 0,
    expected: profile.primarySurface ?? null,
    actual: product.surfaceTags.join(', ') || null,
  });
  internalScore +=
    primarySurfaceQuality === 'exact'
      ? 40
      : primarySurfaceQuality === 'compatible'
        ? 30
        : 0;
  excluded ||= primarySurfaceQuality === 'none';

  const secondarySurfaces = [
    ...new Set(
      (profile.secondarySurfaces ?? []).filter(
        (surface) => surface !== profile.primarySurface,
      ),
    ),
  ];
  const secondarySurfaceMatches = secondarySurfaces.map((surface) => ({
    quality: surfaceMatchQuality(product, surface),
    surface,
  }));
  const matchingSecondarySurfaces = secondarySurfaceMatches.filter(
    ({ quality }) => quality !== 'none',
  );
  const allSecondarySurfacesMatchExactly = secondarySurfaceMatches.every(
    ({ quality }) => quality === 'exact',
  );
  const secondaryPoints = Math.min(
    secondarySurfaceMatches.reduce(
      (points, { quality }) =>
        points + (quality === 'exact' ? 20 : quality === 'compatible' ? 3 : 0),
      0,
    ),
    40,
  );
  evaluations.push({
    rule: 'secondary-surface',
    outcome:
      secondarySurfaces.length === 0
        ? 'unavailable'
        : allSecondarySurfacesMatchExactly
          ? 'preference-match'
          : 'trade-off',
    points: secondaryPoints,
    expected: secondarySurfaces.join(', ') || null,
    actual:
      matchingSecondarySurfaces.map(({ surface }) => surface).join(', ') ||
      null,
  });
  internalScore += secondaryPoints;

  const maximumDistance = product.specifications.maximumDistanceKm;
  const distanceKnown = maximumDistance !== null;
  const requestedDistance = profile.typicalDistanceKm;
  const distanceRequested = requestedDistance !== undefined;
  const distanceMatch =
    requestedDistance !== undefined &&
    maximumDistance !== null &&
    maximumDistance >= requestedDistance;
  evaluations.push({
    rule: 'distance',
    outcome:
      !distanceRequested || !distanceKnown
        ? 'unavailable'
        : distanceMatch
          ? 'match'
          : 'exclude',
    points: distanceMatch ? 30 : 0,
    expected: profile.typicalDistanceKm ?? null,
    actual: maximumDistance,
  });
  internalScore += distanceMatch ? 30 : 0;
  excluded ||= distanceRequested && distanceKnown && !distanceMatch;

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
    actual: product.categories.join(', '),
  });
  internalScore += matchedGoal ? 15 : 0;

  const requestedPriorities = [
    ...new Set([
      ...(profile.priorities ?? []),
      ...(profile.priority ? [profile.priority] : []),
    ]),
  ];
  const matchingPriorities = requestedPriorities.filter((priority) => {
    const acceptedCategories = new Set(categoryIdsByPriority[priority]);
    return product.categories.some((id) => acceptedCategories.has(id));
  });
  const matchedPriority =
    requestedPriorities.length === 0
      ? null
      : matchingPriorities.length / requestedPriorities.length;
  evaluations.push({
    rule: 'priority',
    outcome:
      matchedPriority === null
        ? 'unavailable'
        : matchedPriority > 0
          ? 'preference-match'
          : 'unavailable',
    points: matchedPriority === null ? 0 : matchedPriority * 10,
    expected: requestedPriorities.join(', ') || null,
    actual: product.categories.join(', '),
  });
  internalScore += matchedPriority === null ? 0 : matchedPriority * 10;

  const requestedStability = profile.stabilityPreference;
  const actualStability = product.stability;
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

  const hasPreferenceTradeOff = evaluations.some(
    ({ outcome }) => outcome === 'trade-off',
  );
  const hasEssentialUncertainty = evaluations.some(
    ({ outcome, rule }) =>
      (rule === 'primary-surface' || rule === 'distance') &&
      outcome === 'unavailable',
  );

  return {
    product,
    evaluations,
    internalScore,
    tier: excluded
      ? 'not-a-match'
      : hasEssentialUncertainty
        ? 'good-alternative'
        : hasPreferenceTradeOff
          ? 'great-match'
          : 'strong-match',
  };
}

export function rankShoeRecommendations(
  profile: RunnerProfile,
  products: CatalogueShoe[],
): ShoeRecommendation[] {
  const tierRank: Record<RecommendationTier, number> = {
    'strong-match': 3,
    'great-match': 2,
    'good-alternative': 1,
    'not-a-match': 0,
  };

  return products
    .map((product) => evaluateShoeRecommendation(profile, product))
    .sort(
      (left, right) =>
        tierRank[right.tier] - tierRank[left.tier] ||
        right.internalScore - left.internalScore ||
        left.product.model.localeCompare(right.product.model, 'en'),
    );
}

export function recommendShoes(
  profile: RunnerProfile,
  products: CatalogueShoe[],
  limit = 5,
): ShoeRecommendation[] {
  return rankShoeRecommendations(profile, products)
    .filter(({ tier }) => tier !== 'not-a-match')
    .slice(0, limit);
}
