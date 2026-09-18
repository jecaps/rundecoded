import type { QuizAnswers } from '@/domain/recommendations';
import {
  quizFacetConfig,
  type ConsultationStepId,
} from '@/domain/recommendations/quiz-facet-config';

export interface ConsultationUrlState {
  answers: QuizAnswers;
  otherGoal: string;
  otherSurface: string;
  showResults: boolean;
}

const stepIds: ConsultationStepId[] = [
  'distance',
  'surfaces',
  'priority',
  'goal',
  'stability',
  'comfort',
];

const parameterNames: Record<ConsultationStepId, string> = {
  comfort: 'comfort',
  distance: 'distance',
  goal: 'goal',
  priority: 'priority',
  stability: 'stability',
  surfaces: 'surfaces',
};

export const defaultConsultationUrlState: ConsultationUrlState = {
  answers: {},
  otherGoal: '',
  otherSurface: '',
  showResults: false,
};

function parseAnswers(
  searchParams: URLSearchParams,
  stepId: ConsultationStepId,
) {
  const validOptions = new Set(Object.keys(quizFacetConfig[stepId]));
  const values = (searchParams.get(parameterNames[stepId]) ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value, index, values) =>
      Boolean(
        value && validOptions.has(value) && values.indexOf(value) === index,
      ),
    );

  if (stepId === 'distance' || stepId === 'goal' || stepId === 'stability') {
    return values.slice(0, 1);
  }
  if (stepId === 'priority') {
    return values.includes('unknown') ? ['unknown'] : values.slice(0, 2);
  }
  if (stepId === 'comfort') {
    if (values.includes('private')) return ['private'];
    if (values.includes('none')) return ['none'];
  }
  return values;
}

export function hasCompleteConsultationAnswers(answers: QuizAnswers) {
  return stepIds.every((stepId) => Boolean(answers[stepId]?.length));
}

export function parseConsultationUrlState(
  searchParams: URLSearchParams,
): ConsultationUrlState {
  const answers = Object.fromEntries(
    stepIds.map((stepId) => [stepId, parseAnswers(searchParams, stepId)]),
  ) as QuizAnswers;
  const requestedResults = searchParams.get('results') === '1';

  return {
    answers,
    otherGoal: searchParams.get('otherGoal')?.trim() ?? '',
    otherSurface: searchParams.get('otherSurface')?.trim() ?? '',
    showResults: requestedResults && hasCompleteConsultationAnswers(answers),
  };
}

export function writeConsultationUrlState(
  url: URL,
  state: ConsultationUrlState,
) {
  const next = new URL(url);

  for (const stepId of stepIds) {
    const parameter = parameterNames[stepId];
    const values = state.answers[stepId] ?? [];
    if (values.length > 0) next.searchParams.set(parameter, values.join(','));
    else next.searchParams.delete(parameter);
  }

  if (state.otherGoal) next.searchParams.set('otherGoal', state.otherGoal);
  else next.searchParams.delete('otherGoal');
  if (state.otherSurface) {
    next.searchParams.set('otherSurface', state.otherSurface);
  } else next.searchParams.delete('otherSurface');

  if (state.showResults && hasCompleteConsultationAnswers(state.answers)) {
    next.searchParams.set('results', '1');
  } else next.searchParams.delete('results');

  return next;
}
