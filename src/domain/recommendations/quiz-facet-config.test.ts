import { describe, expect, it } from 'vitest';

import {
  getQuizFacetMappings,
  getQuizStepFacetMappings,
  quizFacetConfig,
  type ConsultationStepId,
} from './quiz-facet-config';

const neutralOptions: Array<[ConsultationStepId, string]> = [
  ['distance', 'unknown'],
  ['surfaces', 'other'],
  ['surfaces', 'unknown'],
  ['priority', 'unknown'],
  ['goal', 'other'],
  ['goal', 'unknown'],
  ['stability', 'noPreference'],
  ['stability', 'unknown'],
  ['comfort', 'none'],
  ['comfort', 'other'],
  ['comfort', 'private'],
  ['comfort', 'unknown'],
];

describe('quiz facet config', () => {
  it('keeps unknown, preference-free, and context-only answers neutral', () => {
    for (const [stepId, optionId] of neutralOptions) {
      expect(
        getQuizFacetMappings(stepId, optionId).every(
          ({ weight }) => weight === 0,
        ),
      ).toBe(true);
    }
  });

  it('uses high weights for distance, surface, and requested stability', () => {
    expect(quizFacetConfig.distance.upTo21.mapsTo.weight).toBe(1);
    expect(quizFacetConfig.surfaces.technicalTrail.mapsTo.weight).toBe(1);
    expect(quizFacetConfig.stability.stability.mapsTo.weight).toBe(1);
  });

  it('uses medium weights for goals and customer priorities', () => {
    expect(quizFacetConfig.goal.fasterTraining.mapsTo.weight).toBe(0.7);
    expect(quizFacetConfig.priority.speed.mapsTo.weight).toBe(0.7);
    expect(quizFacetConfig.priority.value.mapsTo).toEqual({
      facet: 'priorityTags',
      matchMode: 'any',
      value: ['value'],
      weight: 0.7,
    });
  });

  it('shares priority influence when two priorities are selected', () => {
    expect(getQuizStepFacetMappings('priority', ['value', 'comfort'])).toEqual([
      {
        facet: 'priorityTags',
        matchMode: 'any',
        value: ['value'],
        weight: 0.35,
      },
      {
        facet: 'priorityTags',
        matchMode: 'any',
        value: ['cushioning-comfort'],
        weight: 0.35,
      },
    ]);
  });

  it('keeps comfort-history signals as low-weight preferences', () => {
    expect(quizFacetConfig.comfort.knees.mapsTo).toEqual([
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
    ]);
    expect(quizFacetConfig.comfort.hips.mapsTo).toEqual({
      facet: 'dropMm',
      value: { min: 0, max: 6 },
      weight: 0.25,
    });
    expect(quizFacetConfig.comfort.achillesCalves.mapsTo).toEqual({
      facet: 'dropMm',
      value: { min: 6, max: 20, minInclusive: false },
      weight: 0.25,
    });
  });

  it('marks active array values as OR alternatives', () => {
    for (const step of Object.values(quizFacetConfig)) {
      for (const option of Object.values(step)) {
        const mappings = Array.isArray(option.mapsTo)
          ? option.mapsTo
          : [option.mapsTo];
        for (const mapping of mappings) {
          if (mapping.weight > 0 && Array.isArray(mapping.value)) {
            expect(mapping.matchMode).toBe('any');
          }
        }
      }
    }
  });

  it('maps every configured option to a valid weight', () => {
    for (const step of Object.values(quizFacetConfig)) {
      for (const option of Object.values(step)) {
        const mappings = Array.isArray(option.mapsTo)
          ? option.mapsTo
          : [option.mapsTo];
        for (const mapping of mappings) {
          expect(mapping.weight).toBeGreaterThanOrEqual(0);
          expect(mapping.weight).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
