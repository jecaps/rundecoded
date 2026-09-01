import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import rawTopics from '@/content/running-basics/topics.json';

import { RunningBasicsGuide } from './RunningBasicsGuide';
import {
  runningBasicsTopicFileSchema,
  type RunningBasicsTopic,
} from './schema';

const topics = runningBasicsTopicFileSchema.parse(
  rawTopics,
) as RunningBasicsTopic[];

afterEach(cleanup);

describe('Running Basics content', () => {
  it('validates seven ordered topics with complete translations', () => {
    expect(topics).toHaveLength(7);
    expect(topics.map(({ slug }) => slug)).toEqual([
      'pronation',
      'foot-strike',
      'drop',
      'stack-height',
      'cushioning',
      'fit',
      'training-use',
    ]);
    expect(new Set(topics.map(({ slug }) => slug)).size).toBe(topics.length);

    for (const topic of topics) {
      expect(Object.keys(topic.translations).sort()).toEqual([
        'de',
        'en',
        'fr',
      ]);
      for (const translation of Object.values(topic.translations)) {
        expect(translation.title).not.toHaveLength(0);
        expect(translation.introduction).not.toHaveLength(0);
        expect(translation.sections.length).toBeGreaterThan(0);
      }
    }
  });

  it('renders from structured content and responds to shared locale changes', async () => {
    render(<RunningBasicsGuide initialLocale="en" topics={topics} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Running Basics' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Foot strike' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(screen.getByTestId('running-basics-guide')).toHaveAttribute(
        'data-hydrated',
        'true',
      ),
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent('rundecoded:locale-change', {
          detail: { locale: 'fr' },
        }),
      );
    });

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Les bases de la course',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Attaque du pied' }),
    ).toBeVisible();
  });
});
