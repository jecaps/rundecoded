import { describe, expect, it } from 'vitest';

import {
  defaultConsultationUrlState,
  parseConsultationUrlState,
  writeConsultationUrlState,
} from './url-state';

const completeState = {
  answers: {
    comfort: ['none'],
    distance: ['upTo10'],
    goal: ['dailyFitness'],
    priority: ['comfort', 'versatility'],
    stability: ['noPreference'],
    surfaces: ['road', 'gravel'],
  },
  otherGoal: '',
  otherSurface: '',
  showResults: true,
};

describe('consultation URL state', () => {
  it('round-trips a complete recommendation through the URL', () => {
    const url = writeConsultationUrlState(
      new URL('https://example.com/en/consultation/'),
      completeState,
    );

    expect(url.searchParams.get('results')).toBe('1');
    expect(parseConsultationUrlState(url.searchParams)).toEqual(completeState);
  });

  it('does not open results for incomplete or invalid answers', () => {
    const state = parseConsultationUrlState(
      new URLSearchParams(
        'results=1&distance=invalid&surfaces=road&priority=comfort',
      ),
    );

    expect(state.answers.distance).toEqual([]);
    expect(state.showResults).toBe(false);
  });

  it('removes consultation parameters when reset', () => {
    const url = writeConsultationUrlState(
      new URL(
        'https://example.com/en/consultation/?results=1&distance=upTo10&utm_source=test',
      ),
      defaultConsultationUrlState,
    );

    expect(url.searchParams.get('results')).toBeNull();
    expect(url.searchParams.get('distance')).toBeNull();
    expect(url.searchParams.get('utm_source')).toBe('test');
  });
});
