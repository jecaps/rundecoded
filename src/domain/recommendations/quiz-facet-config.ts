import type { ShoeFacets } from '@/domain/catalogue/facets';

export type ConsultationStepId =
  'distance' | 'surfaces' | 'priority' | 'goal' | 'stability' | 'comfort';

type ShoeFacetMapping<TFacet extends keyof ShoeFacets = keyof ShoeFacets> =
  TFacet extends keyof ShoeFacets
    ? {
        facet: TFacet;
        /** Array values are alternatives; `any` means one overlap is enough. */
        matchMode?: 'any';
        value: ShoeFacets[TFacet];
        weight: number;
      }
    : never;

export interface DropRangeMm {
  max: number;
  min: number;
  minInclusive?: boolean;
}

export type QuizFacetMapping =
  | ShoeFacetMapping
  | {
      facet: 'dropMm';
      matchMode?: never;
      value: DropRangeMm | null;
      weight: number;
    };

export interface QuizOptionFacetConfig {
  mapsTo: QuizFacetMapping | QuizFacetMapping[];
}

export type QuizFacetConfig = Record<
  ConsultationStepId,
  Record<string, QuizOptionFacetConfig>
>;

/**
 * Recommendation meaning for each consultation answer.
 *
 * Labels remain in the localized UI copy. This file is deliberately limited
 * to closed-vocabulary product facets, the structured heel-to-toe drop
 * specification, and tunable weights. A weight of zero keeps an answer as
 * conversation context without affecting ranking.
 */
export const quizFacetConfig = {
  distance: {
    under5: {
      mapsTo: {
        facet: 'distanceRangeKm',
        value: { min: 0, max: 5 },
        weight: 1,
      },
    },
    upTo10: {
      mapsTo: {
        facet: 'distanceRangeKm',
        value: { min: 5, max: 10 },
        weight: 1,
      },
    },
    upTo21: {
      mapsTo: {
        facet: 'distanceRangeKm',
        value: { min: 10, max: 21 },
        weight: 1,
      },
    },
    upTo42: {
      mapsTo: {
        facet: 'distanceRangeKm',
        value: { min: 21, max: 42 },
        weight: 1,
      },
    },
    upTo60: {
      mapsTo: {
        facet: 'distanceRangeKm',
        value: { min: 42, max: 60 },
        weight: 1,
      },
    },
    over60: {
      mapsTo: {
        facet: 'distanceRangeKm',
        value: { min: 60, max: 170 },
        weight: 1,
      },
    },
    unknown: {
      mapsTo: {
        facet: 'distanceRangeKm',
        value: null,
        weight: 0,
      },
    },
  },
  surfaces: {
    road: {
      mapsTo: {
        facet: 'surfaceTags',
        matchMode: 'any',
        value: ['road', 'asphalt'],
        weight: 1,
      },
    },
    gravel: {
      mapsTo: {
        facet: 'surfaceTags',
        matchMode: 'any',
        value: ['gravel', 'firm-paths', 'easy-terrain'],
        weight: 1,
      },
    },
    trail: {
      mapsTo: {
        facet: 'surfaceTags',
        matchMode: 'any',
        value: ['mixed-terrain'],
        weight: 1,
      },
    },
    technicalTrail: {
      mapsTo: {
        facet: 'surfaceTags',
        matchMode: 'any',
        value: ['technical-terrain', 'muddy-terrain'],
        weight: 1,
      },
    },
    track: {
      mapsTo: {
        facet: 'surfaceTags',
        matchMode: 'any',
        value: ['track'],
        weight: 1,
      },
    },
    crossCountry: {
      mapsTo: {
        facet: 'surfaceTags',
        matchMode: 'any',
        value: ['cross-country'],
        weight: 1,
      },
    },
    other: {
      mapsTo: {
        facet: 'surfaceTags',
        value: [],
        weight: 0,
      },
    },
    unknown: {
      mapsTo: {
        facet: 'surfaceTags',
        value: [],
        weight: 0,
      },
    },
  },
  priority: {
    value: {
      mapsTo: {
        facet: 'priorityTags',
        matchMode: 'any',
        value: ['value'],
        weight: 0.7,
      },
    },
    comfort: {
      mapsTo: {
        facet: 'priorityTags',
        matchMode: 'any',
        value: ['cushioning-comfort'],
        weight: 0.7,
      },
    },
    versatility: {
      mapsTo: {
        facet: 'useCase',
        matchMode: 'any',
        value: ['daily-trainer'],
        weight: 0.7,
      },
    },
    speed: {
      mapsTo: {
        facet: 'priorityTags',
        matchMode: 'any',
        value: ['speed-responsiveness'],
        weight: 0.7,
      },
    },
    guidance: {
      mapsTo: {
        facet: 'priorityTags',
        matchMode: 'any',
        value: ['stability-support'],
        weight: 0.7,
      },
    },
    unknown: {
      mapsTo: {
        facet: 'priorityTags',
        value: [],
        weight: 0,
      },
    },
  },
  goal: {
    startRunning: {
      mapsTo: {
        facet: 'experienceTags',
        matchMode: 'any',
        value: ['beginner'],
        weight: 0.7,
      },
    },
    dailyFitness: {
      mapsTo: {
        facet: 'useCase',
        matchMode: 'any',
        value: ['daily-trainer'],
        weight: 0.7,
      },
    },
    longRuns: {
      mapsTo: {
        facet: 'useCase',
        matchMode: 'any',
        value: ['long-run'],
        weight: 0.7,
      },
    },
    fasterTraining: {
      mapsTo: {
        facet: 'useCase',
        matchMode: 'any',
        value: ['tempo', 'interval'],
        weight: 0.7,
      },
    },
    roadRace: {
      mapsTo: {
        facet: 'useCase',
        matchMode: 'any',
        value: ['race'],
        weight: 0.7,
      },
    },
    trailRunning: {
      mapsTo: {
        facet: 'useCase',
        matchMode: 'any',
        value: ['daily-trainer', 'long-run'],
        weight: 0.7,
      },
    },
    trailRace: {
      mapsTo: {
        facet: 'useCase',
        matchMode: 'any',
        value: ['race'],
        weight: 0.7,
      },
    },
    track: {
      mapsTo: {
        facet: 'useCase',
        matchMode: 'any',
        value: ['race'],
        weight: 0.7,
      },
    },
    other: {
      mapsTo: {
        facet: 'useCase',
        value: [],
        weight: 0,
      },
    },
    unknown: {
      mapsTo: {
        facet: 'useCase',
        value: [],
        weight: 0,
      },
    },
  },
  stability: {
    neutral: {
      mapsTo: {
        facet: 'stability',
        value: 'neutral',
        weight: 1,
      },
    },
    stability: {
      mapsTo: {
        facet: 'stability',
        value: 'stability',
        weight: 1,
      },
    },
    noPreference: {
      mapsTo: {
        facet: 'stability',
        value: null,
        weight: 0,
      },
    },
    unknown: {
      mapsTo: {
        facet: 'stability',
        value: null,
        weight: 0,
      },
    },
  },
  comfort: {
    none: {
      mapsTo: {
        facet: 'cushioningLevel',
        value: null,
        weight: 0,
      },
    },
    knees: {
      mapsTo: [
        {
          facet: 'cushioningLevel',
          value: 'max',
          weight: 0.125,
        },
        {
          facet: 'dropMm',
          value: { min: 0, max: 6 },
          weight: 0.125,
        },
      ],
    },
    hips: {
      mapsTo: {
        facet: 'dropMm',
        value: { min: 0, max: 6 },
        weight: 0.25,
      },
    },
    achillesCalves: {
      mapsTo: {
        facet: 'dropMm',
        value: { min: 6, max: 20, minInclusive: false },
        weight: 0.25,
      },
    },
    other: {
      mapsTo: {
        facet: 'fit',
        value: [],
        weight: 0,
      },
    },
    private: {
      mapsTo: {
        facet: 'fit',
        value: [],
        weight: 0,
      },
    },
    unknown: {
      mapsTo: {
        facet: 'fit',
        value: [],
        weight: 0,
      },
    },
  },
} satisfies QuizFacetConfig;

export function getQuizFacetMappings(
  stepId: ConsultationStepId,
  optionId: string,
): QuizFacetMapping[] {
  const stepConfig: Record<string, QuizOptionFacetConfig> =
    quizFacetConfig[stepId];
  const mapping = stepConfig[optionId]?.mapsTo;
  if (!mapping) return [];
  return Array.isArray(mapping) ? mapping : [mapping];
}

/**
 * Resolves all selected answers for a step. Priority answers share the
 * step's 0.7 influence so choosing two preferences does not make the priority
 * step more important than it is when only one is selected.
 */
export function getQuizStepFacetMappings(
  stepId: ConsultationStepId,
  optionIds: string[],
): QuizFacetMapping[] {
  const mappings = optionIds.flatMap((optionId) =>
    getQuizFacetMappings(stepId, optionId),
  );
  if (stepId !== 'priority') return mappings;

  const activeOptionCount = optionIds.filter((optionId) =>
    getQuizFacetMappings(stepId, optionId).some(({ weight }) => weight > 0),
  ).length;
  if (activeOptionCount < 2) return mappings;

  return mappings.map((mapping) => ({
    ...mapping,
    weight: mapping.weight / activeOptionCount,
  }));
}
