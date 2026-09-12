import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Cloud,
  Gauge,
  HeartPulse,
  Map,
  Mountain,
  Pencil,
  Repeat2,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Trees,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ShoeProduct } from '@/domain/catalogue';
import {
  recommendShoes,
  type RecommendationPriority,
  type RecommendationSurface,
  type RunnerProfile,
  type RunningGoal,
  type StabilityPreference,
} from '@/domain/recommendations';
import type { Locale } from '@/i18n/config';
import { localizedRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';

import { consultationCopy } from './copy';

interface CustomerConsultationProps {
  assetBase: string;
  locale: Locale;
  products: ShoeProduct[];
}

type ChoiceIcon = LucideIcon;

const distanceChoices = [
  ['under5', Gauge],
  ['upTo10', Route],
  ['upTo21', Map],
  ['upTo42', Mountain],
  ['upTo60', Mountain],
  ['over60', Mountain],
  ['unknown', CircleHelp],
] as const;

const surfaceChoices = [
  ['road', Route],
  ['gravel', Trees],
  ['trail', Map],
  ['technicalTrail', Mountain],
  ['track', Target],
  ['crossCountry', Trees],
  ['other', Pencil],
  ['unknown', CircleHelp],
] as const;

const priorityChoices = [
  ['comfort', Cloud],
  ['versatility', Repeat2],
  ['speed', Zap],
  ['guidance', ShieldCheck],
  ['unknown', CircleHelp],
] as const;

const goalChoices = [
  ['startRunning', Sparkles],
  ['dailyFitness', Route],
  ['longRuns', Map],
  ['fasterTraining', Zap],
  ['roadRace', Target],
  ['trailRunning', Trees],
  ['trailRace', Mountain],
  ['track', Target],
  ['other', Pencil],
  ['unknown', CircleHelp],
] as const;

const stabilityChoices = [
  ['neutral', Route],
  ['stability', ShieldCheck],
  ['noPreference', Repeat2],
  ['unknown', CircleHelp],
] as const;

const comfortChoices = [
  ['none', Check],
  ['kneesHips', HeartPulse],
  ['achillesCalves', HeartPulse],
  ['other', Pencil],
  ['private', ShieldCheck],
  ['unknown', CircleHelp],
] as const;

const distanceValues: Record<string, number | undefined> = {
  under5: 5,
  upTo10: 10,
  upTo21: 21,
  upTo42: 42,
  upTo60: 60,
  over60: 80,
  unknown: undefined,
};

const surfaceValues: Partial<Record<string, RecommendationSurface>> = {
  road: 'road',
  gravel: 'gravel',
  trail: 'trail',
  technicalTrail: 'technical-trail',
  track: 'track',
  crossCountry: 'cross-country',
};

const goalValues: Partial<Record<string, RunningGoal>> = {
  startRunning: 'start-running',
  dailyFitness: 'daily-fitness',
  longRuns: 'comfortable-long-runs',
  fasterTraining: 'faster-training',
  roadRace: 'road-race',
  trailRunning: 'trail-running',
  trailRace: 'trail-race',
  track: 'track-or-cross-country',
};

const priorityValues: Partial<Record<string, RecommendationPriority>> = {
  comfort: 'comfort',
  versatility: 'versatility',
  speed: 'speed',
  guidance: 'guidance',
};

const stabilityValues: Partial<Record<string, StabilityPreference>> = {
  neutral: 'neutral',
  stability: 'stability',
  noPreference: 'no-preference',
};

function imagePath(product: ShoeProduct, assetBase: string) {
  const image = product.images[0];
  return image?.status !== 'pending' && image?.localPath
    ? `${assetBase}${image.localPath}`
    : null;
}

function AnswerButton({
  choice,
  icon: Icon,
  onClick,
  selected,
}: {
  choice: { description: string; label: string };
  icon: ChoiceIcon;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <Button
      aria-pressed={selected}
      className="h-auto min-h-16 justify-start px-4 py-3 text-left whitespace-normal"
      onClick={onClick}
      type="button"
      variant={selected ? 'primary' : 'outline'}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]',
          selected ? 'bg-white/15' : 'bg-surface-subtle text-primary',
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="grid gap-0.5">
        <span>{choice.label}</span>
        <span
          className={cn(
            'text-xs font-normal',
            selected ? 'text-primary-foreground/80' : 'text-muted-foreground',
          )}
        >
          {choice.description}
        </span>
      </span>
    </Button>
  );
}

export function CustomerConsultation({
  assetBase,
  locale,
  products,
}: CustomerConsultationProps) {
  const copy = consultationCopy[locale];
  const catalogueUrl = localizedRoute(locale, 'catalogue');
  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [distance, setDistance] = useState<string>();
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [otherSurface, setOtherSurface] = useState('');
  const [priority, setPriority] = useState<string>();
  const [goal, setGoal] = useState<string>();
  const [otherGoal, setOtherGoal] = useState('');
  const [stability, setStability] = useState<string>();
  const [comfort, setComfort] = useState<string[]>([]);
  const [otherComfort, setOtherComfort] = useState('');

  const answers = [distance, surfaces, priority, goal, stability, comfort];
  const canContinue = step === 6 || Boolean(answers[step]?.length);

  const profile = useMemo<RunnerProfile>(() => {
    const mappedSurfaces = surfaces
      .map((answer) => surfaceValues[answer])
      .filter((surface): surface is RecommendationSurface => Boolean(surface));
    return {
      primarySurface: mappedSurfaces[0],
      secondarySurfaces: mappedSurfaces.slice(1),
      typicalDistanceKm: distance ? distanceValues[distance] : undefined,
      priority: priority ? priorityValues[priority] : undefined,
      goal: goal ? goalValues[goal] : undefined,
      stabilityPreference: stability ? stabilityValues[stability] : undefined,
    };
  }, [distance, goal, priority, stability, surfaces]);

  const recommendations = useMemo(
    () => recommendShoes(profile, products, products.length),
    [profile, products],
  );
  const recommendationGroups = [
    {
      empty: copy.resultGroups.strong.empty,
      id: 'strong-matches',
      recommendations: recommendations.filter(
        ({ tier }) => tier === 'strong-match',
      ),
      title: copy.resultGroups.strong.title,
    },
    {
      empty: copy.resultGroups.great.empty,
      id: 'great-matches',
      recommendations: recommendations.filter(
        ({ tier }) => tier === 'great-match',
      ),
      title: copy.resultGroups.great.title,
    },
    {
      empty: copy.resultGroups.alternative.empty,
      id: 'good-alternatives',
      recommendations: recommendations.filter(
        ({ tier }) => tier === 'good-alternative',
      ),
      title: copy.resultGroups.alternative.title,
    },
  ];

  function toggleMultiple(
    value: string,
    selected: string[],
    update: (values: string[]) => void,
    exclusive: string[],
  ) {
    if (exclusive.includes(value)) {
      update(selected.includes(value) ? [] : [value]);
      return;
    }
    const withoutExclusive = selected.filter(
      (answer) => !exclusive.includes(answer),
    );
    update(
      withoutExclusive.includes(value)
        ? withoutExclusive.filter((answer) => answer !== value)
        : [...withoutExclusive, value],
    );
  }

  function reset() {
    setStep(0);
    setShowResults(false);
    setDistance(undefined);
    setSurfaces([]);
    setOtherSurface('');
    setPriority(undefined);
    setGoal(undefined);
    setOtherGoal('');
    setStability(undefined);
    setComfort([]);
    setOtherComfort('');
  }

  function choiceLabel(question: number, answer?: string) {
    if (!answer) return copy.reviewMissing;
    return (
      copy.questions[question].choices[answer]?.label ?? copy.reviewMissing
    );
  }

  function renderChoices(
    choices: readonly (readonly [string, ChoiceIcon])[],
    selected: string[],
    select: (value: string) => void,
  ) {
    return (
      <div className="tablet:grid-cols-2 mt-7 grid gap-3">
        {choices.map(([id, icon]) => (
          <AnswerButton
            choice={copy.questions[step].choices[id]}
            icon={icon}
            key={id}
            onClick={() => select(id)}
            selected={selected.includes(id)}
          />
        ))}
      </div>
    );
  }

  if (showResults) {
    return (
      <section className="py-10" data-testid="consultation-results">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-primary m-0 text-xs font-bold tracking-[0.16em] uppercase">
              {copy.eyebrow}
            </p>
            <h1 className="tablet:text-4xl mt-2 mb-0 text-3xl font-bold tracking-[-0.035em]">
              {copy.resultsTitle}
            </h1>
            <p className="text-muted-foreground mt-3 mb-0 leading-6">
              {copy.resultIntro}
            </p>
          </div>
          <Button
            onClick={() => setShowResults(false)}
            type="button"
            variant="outline"
          >
            <Pencil aria-hidden="true" className="size-4" />
            {copy.actions.edit}
          </Button>
        </div>

        <div className="mt-8 grid gap-10">
          {recommendationGroups.map((group) => (
            <section aria-labelledby={group.id} key={group.id}>
              <h2 className="mb-0 text-2xl font-bold" id={group.id}>
                {group.title}
              </h2>
              {group.recommendations.length > 0 ? (
                <div className="mt-4 grid gap-4">
                  {group.recommendations.map((recommendation) => {
                    const product = recommendation.product;
                    const src = imagePath(product, assetBase);
                    const reasons = recommendation.evaluations
                      .filter(
                        ({ outcome }) =>
                          outcome === 'match' || outcome === 'preference-match',
                      )
                      .map(({ rule }) => {
                        if (rule === 'primary-surface')
                          return copy.resultReasons.surface;
                        if (rule === 'distance')
                          return copy.resultReasons.distance;
                        if (rule === 'goal') return copy.resultReasons.goal;
                        if (rule === 'priority')
                          return copy.resultReasons.priority;
                        if (rule === 'stability')
                          return copy.resultReasons.stability;
                        return null;
                      })
                      .filter((reason): reason is string => Boolean(reason));
                    const href = `${catalogueUrl}?${new URLSearchParams({ q: product.model })}`;

                    return (
                      <Card key={product.id}>
                        <CardContent className="tablet:grid-cols-[8rem_minmax(0,1fr)_auto] grid items-center gap-5 p-5">
                          <div className="bg-surface-subtle flex min-h-28 items-center justify-center overflow-hidden rounded-[var(--radius-control)] p-2">
                            {src ? (
                              <img
                                alt=""
                                className="h-24 w-full object-contain"
                                src={src}
                              />
                            ) : (
                              <Sparkles
                                aria-hidden="true"
                                className="text-muted-foreground size-7"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-primary m-0 text-xs font-bold uppercase">
                              {recommendation.tier === 'strong-match'
                                ? copy.tiers.strong
                                : recommendation.tier === 'great-match'
                                  ? copy.tiers.great
                                  : copy.tiers.alternative}
                            </p>
                            <h3 className="mt-1 mb-0 text-xl font-bold">
                              {product.model}
                            </h3>
                            <p className="text-muted-foreground mt-1 mb-0 text-sm">
                              {product.brand.name}
                            </p>
                            <p className="bg-surface-subtle text-muted-foreground mt-2 mb-0 inline-flex rounded-full px-2.5 py-1 text-xs">
                              {copy.evidenceConfidence.label}:{' '}
                              {
                                copy.evidenceConfidence[
                                  recommendation.confidence
                                ]
                              }
                            </p>
                            {reasons.length > 0 ? (
                              <ul className="mt-3 mb-0 flex flex-wrap gap-x-5 gap-y-1 p-0 text-sm">
                                {reasons.slice(0, 3).map((reason) => (
                                  <li
                                    className="flex items-center gap-1.5"
                                    key={reason}
                                  >
                                    <Check
                                      aria-hidden="true"
                                      className="text-primary size-4"
                                    />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                          <a
                            className={buttonVariants({ variant: 'primary' })}
                            href={href}
                          >
                            {copy.actions.viewCatalogue}
                            <ArrowRight aria-hidden="true" className="size-4" />
                          </a>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="mt-4 border-dashed">
                  <CardContent className="text-muted-foreground p-5 text-sm leading-6">
                    {group.empty}
                  </CardContent>
                </Card>
              )}
            </section>
          ))}
        </div>

        <p className="border-border text-muted-foreground mt-6 border-t pt-5 text-sm leading-6">
          {copy.resultDisclaimer}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={reset} type="button">
            {copy.actions.restart}
          </Button>
          <a
            className={buttonVariants({ variant: 'outline' })}
            href={catalogueUrl}
          >
            {copy.actions.exit}
          </a>
        </div>
      </section>
    );
  }

  const question = copy.questions[step];

  return (
    <section className="py-10" data-testid="customer-consultation">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-primary m-0 text-xs font-bold tracking-[0.16em] uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="tablet:text-4xl mt-2 mb-0 text-3xl font-bold tracking-[-0.035em]">
            {copy.title}
          </h1>
        </div>
        <a
          className={buttonVariants({ variant: 'outline' })}
          href={catalogueUrl}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {copy.actions.exit}
        </a>
      </div>

      <div className="desktop:grid-cols-[15rem_minmax(0,1fr)] mt-8 grid gap-6">
        <Card className="h-fit">
          <CardContent className="p-4">
            <ol className="tablet:grid-cols-2 desktop:grid-cols-1 grid gap-1 p-0">
              {copy.steps.map((label, index) => (
                <li
                  className={cn(
                    'flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm',
                    index === step && 'bg-surface-subtle font-semibold',
                    index < step && 'text-primary',
                  )}
                  key={label}
                >
                  <span
                    className={cn(
                      'border-border flex size-7 shrink-0 items-center justify-center rounded-full border text-xs',
                      index <= step &&
                        'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {index < step ? (
                      <Check aria-hidden="true" className="size-3.5" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="tablet:p-8 p-5">
            <div className="flex items-center gap-4">
              <div
                aria-label={copy.progress(step + 1, copy.steps.length)}
                aria-valuemax={copy.steps.length}
                aria-valuemin={1}
                aria-valuenow={step + 1}
                className="bg-surface-subtle h-2 flex-1 overflow-hidden rounded-full"
                role="progressbar"
              >
                <div
                  className="bg-primary h-full rounded-full transition-[width]"
                  style={{
                    width: `${((step + 1) / copy.steps.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-muted-foreground shrink-0 text-sm">
                {copy.progress(step + 1, copy.steps.length)}
              </span>
            </div>

            <div className="mt-9">
              <h2 className="tablet:text-3xl m-0 max-w-3xl text-2xl font-bold tracking-[-0.025em]">
                {question.title}
              </h2>
              <p className="text-muted-foreground mt-2 mb-0 leading-6">
                {question.help}
              </p>
              {step === 1 ? (
                <p className="text-muted-foreground mt-2 mb-0 text-sm">
                  {copy.multipleHelp}
                </p>
              ) : null}

              {step === 0
                ? renderChoices(
                    distanceChoices,
                    distance ? [distance] : [],
                    setDistance,
                  )
                : null}
              {step === 1
                ? renderChoices(surfaceChoices, surfaces, (value) =>
                    toggleMultiple(value, surfaces, setSurfaces, ['unknown']),
                  )
                : null}
              {step === 2
                ? renderChoices(
                    priorityChoices,
                    priority ? [priority] : [],
                    setPriority,
                  )
                : null}
              {step === 3
                ? renderChoices(goalChoices, goal ? [goal] : [], setGoal)
                : null}
              {step === 4
                ? renderChoices(
                    stabilityChoices,
                    stability ? [stability] : [],
                    setStability,
                  )
                : null}
              {step === 5
                ? renderChoices(comfortChoices, comfort, (value) =>
                    toggleMultiple(value, comfort, setComfort, [
                      'none',
                      'private',
                      'unknown',
                    ]),
                  )
                : null}

              {step === 1 && surfaces.includes('other') ? (
                <label
                  className="mt-5 grid max-w-xl gap-2 text-sm font-semibold"
                  htmlFor="other-surface"
                >
                  {copy.otherSurfaceLabel}
                  <Input
                    id="other-surface"
                    onChange={(event) => setOtherSurface(event.target.value)}
                    placeholder={copy.otherSurfacePlaceholder}
                    value={otherSurface}
                  />
                </label>
              ) : null}
              {step === 5 && comfort.includes('other') ? (
                <label
                  className="mt-5 grid max-w-xl gap-2 text-sm font-semibold"
                  htmlFor="other-comfort"
                >
                  {copy.otherComfortLabel}
                  <Input
                    id="other-comfort"
                    onChange={(event) => setOtherComfort(event.target.value)}
                    placeholder={copy.otherComfortPlaceholder}
                    value={otherComfort}
                  />
                </label>
              ) : null}
              {step === 3 && goal === 'other' ? (
                <label
                  className="mt-5 grid max-w-xl gap-2 text-sm font-semibold"
                  htmlFor="other-goal"
                >
                  {copy.otherGoalLabel}
                  <Input
                    id="other-goal"
                    onChange={(event) => setOtherGoal(event.target.value)}
                    placeholder={copy.otherGoalPlaceholder}
                    value={otherGoal}
                  />
                </label>
              ) : null}

              {step < 6 &&
              (answers[step] === 'unknown' ||
                (Array.isArray(answers[step]) &&
                  answers[step].includes('unknown'))) ? (
                <p className="border-callout-border bg-callout mt-5 rounded-[var(--radius-control)] border px-4 py-3 text-sm leading-6">
                  {copy.notSureNotice}
                </p>
              ) : null}
              {step === 5 ? (
                <p className="border-callout-border bg-callout mt-5 rounded-[var(--radius-control)] border px-4 py-3 text-sm leading-6">
                  {copy.comfortNotice}
                </p>
              ) : null}

              {step === 6 ? (
                <div className="mt-7 grid gap-3">
                  <p className="text-muted-foreground m-0 text-sm">
                    {copy.reviewIntro}
                  </p>
                  {[0, 1, 2, 3, 4, 5].map((questionIndex) => {
                    const value = answers[questionIndex];
                    const labels = Array.isArray(value)
                      ? value
                          .map((answer) => choiceLabel(questionIndex, answer))
                          .join(', ')
                      : choiceLabel(questionIndex, value);
                    const note =
                      questionIndex === 1 && surfaces.includes('other')
                        ? otherSurface.trim()
                        : questionIndex === 3 && goal === 'other'
                          ? otherGoal.trim()
                          : questionIndex === 5 && comfort.includes('other')
                            ? otherComfort.trim()
                            : '';
                    return (
                      <div
                        className="border-border flex flex-wrap items-center justify-between gap-3 border-b py-3"
                        key={copy.steps[questionIndex]}
                      >
                        <div>
                          <p className="m-0 text-sm font-semibold">
                            {copy.steps[questionIndex]}
                          </p>
                          <p className="text-muted-foreground mt-1 mb-0 text-sm">
                            {labels}
                            {note ? ` · ${note}` : ''}
                          </p>
                        </div>
                        <Button
                          onClick={() => setStep(questionIndex)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          {copy.actions.edit}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="border-border mt-9 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <p
                className="text-muted-foreground m-0 text-sm"
                aria-live="polite"
              >
                {!canContinue ? copy.answerRequired : ''}
              </p>
              <div className="ml-auto flex gap-2">
                <Button
                  disabled={step === 0}
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  type="button"
                  variant="outline"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  {copy.actions.back}
                </Button>
                <Button
                  disabled={!canContinue}
                  onClick={() => {
                    if (step === 6) setShowResults(true);
                    else setStep((current) => Math.min(6, current + 1));
                  }}
                  type="button"
                >
                  {step === 6 ? copy.actions.results : copy.actions.next}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
