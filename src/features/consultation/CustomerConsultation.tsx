import { useEffect, useMemo, useRef, useState } from 'react';
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
import { resolveLocalizedText, type CatalogueShoe } from '@/domain/catalogue';
import {
  explainRecommendation,
  recommendShoes,
  type QuizAnswers,
} from '@/domain/recommendations';
import type { Locale } from '@/i18n/config';
import { localizedRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';

import type { ExplorerProduct } from '../catalogue/catalogue';
import { ProductDetailsDialog } from '../catalogue/ProductDetailsDialog';
import { consultationCopy } from './copy';
import {
  defaultConsultationUrlState,
  parseConsultationUrlState,
  writeConsultationUrlState,
} from './url-state';

interface CustomerConsultationProps {
  assetBase: string;
  locale: Locale;
  products: CatalogueShoe[];
}

type ChoiceIcon = LucideIcon;

const distanceChoices = [
  ['under5', Gauge],
  ['upTo10', Route],
  ['upTo21', Map],
  ['upTo42', Mountain],
  ['over42', Mountain],
  ['unknown', CircleHelp],
] as const;

const surfaceChoices = [
  ['road', Route],
  ['gravel', Trees],
  ['trail', Map],
  ['trackCrossCountry', Target],
  ['other', Pencil],
] as const;

const trailSurfaceChoices = [
  ['easyTerrain', Trees],
  ['mixedTerrain', Map],
  ['technicalTerrain', Mountain],
] as const;

const trackSurfaceChoices = [
  ['track', Target],
  ['crossCountry', Trees],
] as const;

const trailSurfaceIds = [
  'trail',
  ...trailSurfaceChoices.map(([id]) => id),
] as const;
const trackSurfaceIds = [
  'trackCrossCountry',
  ...trackSurfaceChoices.map(([id]) => id),
] as const;

const priorityChoices = [
  ['value', Sparkles],
  ['comfort', Cloud],
  ['versatility', Repeat2],
  ['speed', Zap],
  ['unknown', CircleHelp],
] as const;

const goalChoices = [
  ['startRunning', Sparkles],
  ['dailyFitness', Route],
  ['longRuns', Map],
  ['fasterTraining', Zap],
  ['race', Target],
  ['other', Pencil],
] as const;

const stabilityChoices = [
  ['neutral', Route],
  ['stability', ShieldCheck],
  ['noPreference', Repeat2],
] as const;

const comfortChoices = [
  ['none', Check],
  ['knees', HeartPulse],
  ['hips', HeartPulse],
  ['achillesCalves', HeartPulse],
  ['private', ShieldCheck],
] as const;

const initialRecommendationCount = 5;
const maximumRecommendationsPerTier = 10;
const recommendationCountIncrement = 5;

function imagePath(product: CatalogueShoe, assetBase: string) {
  const image = product.images[0];
  return image ? `${assetBase}${image}` : null;
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
  const initialBrowserState = () =>
    typeof window === 'undefined'
      ? null
      : parseConsultationUrlState(new URL(window.location.href).searchParams);
  const [step, setStep] = useState(() =>
    initialBrowserState()?.showResults ? 6 : 0,
  );
  const [showResults, setShowResults] = useState(
    () => initialBrowserState()?.showResults ?? false,
  );
  const [visibleRecommendationCount, setVisibleRecommendationCount] = useState(
    initialRecommendationCount,
  );
  const [distance, setDistance] = useState<string | undefined>(
    () => initialBrowserState()?.answers.distance?.[0],
  );
  const [surfaces, setSurfaces] = useState<string[]>(
    () => initialBrowserState()?.answers.surfaces ?? [],
  );
  const [otherSurface, setOtherSurface] = useState(
    () => initialBrowserState()?.otherSurface ?? '',
  );
  const [priorities, setPriorities] = useState<string[]>(
    () => initialBrowserState()?.answers.priority ?? [],
  );
  const [goal, setGoal] = useState<string | undefined>(
    () => initialBrowserState()?.answers.goal?.[0],
  );
  const [otherGoal, setOtherGoal] = useState(
    () => initialBrowserState()?.otherGoal ?? '',
  );
  const [stability, setStability] = useState<string | undefined>(
    () => initialBrowserState()?.answers.stability?.[0],
  );
  const [comfort, setComfort] = useState<string[]>(
    () => initialBrowserState()?.answers.comfort ?? [],
  );
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const detailsOpenerRef = useRef<HTMLButtonElement | null>(null);

  const answers = [distance, surfaces, priorities, goal, stability, comfort];
  const canContinue = step === 6 || Boolean(answers[step]?.length);

  const quizAnswers = useMemo<QuizAnswers>(() => {
    return {
      comfort,
      distance: distance ? [distance] : [],
      goal: goal ? [goal] : [],
      priority: priorities,
      stability: stability ? [stability] : [],
      surfaces,
    };
  }, [comfort, distance, goal, priorities, stability, surfaces]);

  const recommendations = useMemo(
    () => recommendShoes(quizAnswers, products, products.length),
    [products, quizAnswers],
  );
  const recommendationPool = useMemo(() => {
    const tierCounts: Record<string, number> = {};
    return recommendations.filter(({ tier }) => {
      const count = tierCounts[tier] ?? 0;
      if (count >= maximumRecommendationsPerTier) return false;
      tierCounts[tier] = count + 1;
      return true;
    });
  }, [recommendations]);
  const visibleRecommendations = recommendationPool.slice(
    0,
    visibleRecommendationCount,
  );
  const detailsItem = useMemo<ExplorerProduct | null>(() => {
    if (!detailsId) return null;
    const product = products.find((candidate) => candidate.id === detailsId);
    if (!product) return null;
    const amount = product.specifications.weightG;
    return {
      product,
      weight:
        amount === null
          ? null
          : {
              amount,
              referenceSize: product.specifications.weightReferenceSize,
              unit: 'g',
            },
    };
  }, [detailsId, products]);

  useEffect(() => {
    function onPopState() {
      const restored = parseConsultationUrlState(
        new URL(window.location.href).searchParams,
      );
      setDistance(restored.answers.distance?.[0]);
      setSurfaces(restored.answers.surfaces ?? []);
      setOtherSurface(restored.otherSurface);
      setPriorities(restored.answers.priority ?? []);
      setGoal(restored.answers.goal?.[0]);
      setOtherGoal(restored.otherGoal);
      setStability(restored.answers.stability?.[0]);
      setComfort(restored.answers.comfort ?? []);
      setShowResults(restored.showResults);
      setStep(restored.showResults ? 6 : 0);
      setVisibleRecommendationCount(initialRecommendationCount);
      setDetailsId(null);
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function updateUrlState(nextShowResults: boolean, mode: 'push' | 'replace') {
    const nextUrl = writeConsultationUrlState(new URL(window.location.href), {
      answers: quizAnswers,
      otherGoal: otherGoal.trim(),
      otherSurface: otherSurface.trim(),
      showResults: nextShowResults,
    });
    window.history[mode === 'push' ? 'pushState' : 'replaceState'](
      {},
      '',
      nextUrl,
    );
  }

  function toggleMultiple(
    value: string,
    selected: string[],
    update: (values: string[]) => void,
    exclusive: string[],
    maxSelections?: number,
  ) {
    if (exclusive.includes(value)) {
      update(selected.includes(value) ? [] : [value]);
      return;
    }
    const withoutExclusive = selected.filter(
      (answer) => !exclusive.includes(answer),
    );
    if (withoutExclusive.includes(value)) {
      update(withoutExclusive.filter((answer) => answer !== value));
      return;
    }
    if (maxSelections && withoutExclusive.length >= maxSelections) return;
    update([...withoutExclusive, value]);
  }

  function reset() {
    setDetailsId(null);
    setStep(0);
    setShowResults(false);
    setVisibleRecommendationCount(initialRecommendationCount);
    setDistance(undefined);
    setSurfaces([]);
    setOtherSurface('');
    setPriorities([]);
    setGoal(undefined);
    setOtherGoal('');
    setStability(undefined);
    setComfort([]);
    const nextUrl = writeConsultationUrlState(
      new URL(window.location.href),
      defaultConsultationUrlState,
    );
    window.history.pushState({}, '', nextUrl);
  }

  function hasSurfaceFromGroup(group: readonly string[]) {
    return surfaces.some((surface) => group.includes(surface));
  }

  function toggleSurfaceGroup(parent: string, group: readonly string[]) {
    setSurfaces((current) => {
      const selected = current.some((surface) => group.includes(surface));
      const withoutGroup = current.filter(
        (surface) => !group.includes(surface),
      );
      return selected ? withoutGroup : [...withoutGroup, parent];
    });
  }

  function togglePrimarySurface(value: string) {
    if (value === 'trail') {
      toggleSurfaceGroup(value, trailSurfaceIds);
      return;
    }
    if (value === 'trackCrossCountry') {
      toggleSurfaceGroup(value, trackSurfaceIds);
      return;
    }
    toggleMultiple(value, surfaces, setSurfaces, []);
  }

  function toggleSurfaceDetail(parent: string, value: string) {
    setSurfaces((current) => {
      const withoutParent = current.filter((surface) => surface !== parent);
      return withoutParent.includes(value)
        ? withoutParent.filter((surface) => surface !== value)
        : [...withoutParent, value];
    });
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
          </div>
          <Button
            onClick={() => {
              setShowResults(false);
              setVisibleRecommendationCount(initialRecommendationCount);
              updateUrlState(false, 'replace');
            }}
            type="button"
            variant="outline"
          >
            <Pencil aria-hidden="true" className="size-4" />
            {copy.actions.edit}
          </Button>
        </div>

        <div className="mt-8 grid gap-4">
          {visibleRecommendations.map((recommendation) => {
            const product = recommendation.product;
            const src = imagePath(product, assetBase);
            const explanation = explainRecommendation(recommendation);
            const why = resolveLocalizedText(
              product.details.bestAt,
              locale,
            ).value;

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
                    <p
                      className={cn(
                        'm-0 inline-flex rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase',
                        recommendation.tier === 'strong-match'
                          ? 'bg-emerald-100 text-emerald-800'
                          : recommendation.tier === 'great-match'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700',
                      )}
                    >
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
                      {product.brand}
                    </p>
                    {explanation.showWhy ? (
                      <dl className="mt-3 grid gap-2 text-sm">
                        <div>
                          <dt className="font-semibold">
                            {copy.explanation.why}
                          </dt>
                          <dd className="text-muted-foreground mt-0.5 leading-6">
                            {why}
                          </dd>
                        </div>
                      </dl>
                    ) : null}
                  </div>
                  <Button
                    onClick={(event) => {
                      detailsOpenerRef.current = event.currentTarget;
                      setDetailsId(product.id);
                    }}
                    type="button"
                  >
                    {copy.actions.viewDetails}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {visibleRecommendationCount < recommendationPool.length ? (
            <div className="flex justify-center pt-2">
              <Button
                onClick={() =>
                  setVisibleRecommendationCount((count) =>
                    Math.min(
                      count + recommendationCountIncrement,
                      recommendationPool.length,
                    ),
                  )
                }
                type="button"
                variant="outline"
              >
                {copy.actions.showMore}
              </Button>
            </div>
          ) : null}
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

        <ProductDetailsDialog
          assetBase={assetBase}
          item={detailsItem}
          locale={locale}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            detailsOpenerRef.current?.focus();
          }}
          onOpenChange={(open) => !open && setDetailsId(null)}
        />
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
              {step === 2 ? (
                <p className="text-muted-foreground mt-2 mb-0 text-sm">
                  {copy.priorityMultipleHelp}
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
                ? renderChoices(
                    surfaceChoices,
                    [
                      ...(surfaces.includes('road') ? ['road'] : []),
                      ...(surfaces.includes('gravel') ? ['gravel'] : []),
                      ...(hasSurfaceFromGroup(trailSurfaceIds)
                        ? ['trail']
                        : []),
                      ...(hasSurfaceFromGroup(trackSurfaceIds)
                        ? ['trackCrossCountry']
                        : []),
                      ...(surfaces.includes('other') ? ['other'] : []),
                    ],
                    togglePrimarySurface,
                  )
                : null}
              {step === 1 && hasSurfaceFromGroup(trailSurfaceIds) ? (
                <div className="mt-6">
                  <p className="m-0 text-sm font-semibold">
                    {copy.trailSurfaceFollowUp}
                  </p>
                  {renderChoices(trailSurfaceChoices, surfaces, (value) =>
                    toggleSurfaceDetail('trail', value),
                  )}
                </div>
              ) : null}
              {step === 1 && hasSurfaceFromGroup(trackSurfaceIds) ? (
                <div className="mt-6">
                  <p className="m-0 text-sm font-semibold">
                    {copy.trackSurfaceFollowUp}
                  </p>
                  {renderChoices(trackSurfaceChoices, surfaces, (value) =>
                    toggleSurfaceDetail('trackCrossCountry', value),
                  )}
                </div>
              ) : null}
              {step === 2
                ? renderChoices(priorityChoices, priorities, (value) =>
                    toggleMultiple(
                      value,
                      priorities,
                      setPriorities,
                      ['unknown'],
                      2,
                    ),
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
                    if (step === 6) {
                      setVisibleRecommendationCount(initialRecommendationCount);
                      setShowResults(true);
                      updateUrlState(true, 'push');
                    } else setStep((current) => Math.min(6, current + 1));
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
