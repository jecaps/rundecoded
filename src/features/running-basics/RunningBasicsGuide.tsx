import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { runningBasicsCopy } from './copy';
import type { RunningBasicsLocale, RunningBasicsTopic } from './schema';

interface RunningBasicsGuideProps {
  initialLocale: RunningBasicsLocale;
  topics: RunningBasicsTopic[];
}

function isLocale(value: unknown): value is RunningBasicsLocale {
  return value === 'de' || value === 'en' || value === 'fr';
}

export function RunningBasicsGuide({
  initialLocale,
  topics: unsortedTopics,
}: RunningBasicsGuideProps) {
  const topics = useMemo(
    () => [...unsortedTopics].sort((left, right) => left.order - right.order),
    [unsortedTopics],
  );
  const [locale, setLocale] = useState(initialLocale);
  const [hydrated, setHydrated] = useState(false);
  const [activeSlug, setActiveSlug] = useState(topics[0]?.slug ?? '');
  const [hasTopicSelection, setHasTopicSelection] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lockedSlugRef = useRef<string | null>(null);
  const navigationIdRef = useRef(0);
  const releaseTimerRef = useRef<number | undefined>(undefined);
  const copy = runningBasicsCopy[locale];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const urlLocale = new URL(window.location.href).searchParams.get('lang');
      const storedLocale =
        window.localStorage?.getItem('rundecoded-locale') ?? null;
      const nextLocale = isLocale(urlLocale)
        ? urlLocale
        : isLocale(storedLocale)
          ? storedLocale
          : initialLocale;
      setLocale(nextLocale);
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialLocale]);

  const releaseTopicLock = useCallback((slug: string, navigationId: number) => {
    if (navigationId !== navigationIdRef.current) return;
    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
    }
    lockedSlugRef.current = null;
    setActiveSlug(slug);
  }, []);

  const scrollToTopic = useCallback(
    (slug: string, updateHistory: boolean) => {
      const target = document.getElementById(slug);
      if (!target) return;

      const navigationId = ++navigationIdRef.current;
      lockedSlugRef.current = slug;
      setActiveSlug(slug);
      setHasTopicSelection(true);
      setMobileMenuOpen(false);

      if (updateHistory) {
        const url = new URL(window.location.href);
        if (url.hash !== `#${slug}`) {
          url.hash = slug;
          window.history.pushState({ runningBasicsTopic: slug }, '', url);
        }
      }

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      target.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });

      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
      }

      if ('onscrollend' in window && !reducedMotion) {
        window.addEventListener(
          'scrollend',
          () => releaseTopicLock(slug, navigationId),
          { once: true },
        );
      }

      releaseTimerRef.current = window.setTimeout(
        () => releaseTopicLock(slug, navigationId),
        reducedMotion ? 50 : 1600,
      );
    },
    [releaseTopicLock],
  );

  useEffect(() => {
    function handleLocaleChange(event: Event) {
      const nextLocale = (event as CustomEvent<{ locale?: unknown }>).detail
        ?.locale;
      if (isLocale(nextLocale)) setLocale(nextLocale);
    }

    window.addEventListener('rundecoded:locale-change', handleLocaleChange);
    return () =>
      window.removeEventListener(
        'rundecoded:locale-change',
        handleLocaleChange,
      );
  }, []);

  useEffect(() => {
    document.title = `${copy.title} | RunDecoded`;
  }, [copy.title]);

  useEffect(() => {
    const topicSlugs = new Set(topics.map(({ slug }) => slug));
    let frame = 0;

    function updateActiveTopic() {
      if (lockedSlugRef.current) return;

      const sections = topics
        .map(({ slug }) => document.getElementById(slug))
        .filter((section): section is HTMLElement => Boolean(section));
      if (!sections.length) return;

      const atPageEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 8;
      let current = sections[0];

      if (atPageEnd) {
        current = sections.at(-1) ?? current;
      } else {
        for (const section of sections) {
          if (section.getBoundingClientRect().top <= 180) current = section;
        }
      }

      setActiveSlug(current.id);
      if (current.id !== topics[0]?.slug || window.scrollY > 120) {
        setHasTopicSelection(true);
      }
    }

    function handleScroll() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveTopic);
    }

    function restoreHashTopic() {
      const slug = window.location.hash.slice(1);
      if (!topicSlugs.has(slug)) return;
      scrollToTopic(slug, false);
    }

    const initialSlug = window.location.hash.slice(1);
    frame = window.requestAnimationFrame(() => {
      if (topicSlugs.has(initialSlug)) {
        setActiveSlug(initialSlug);
        setHasTopicSelection(true);
      } else {
        updateActiveTopic();
      }
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('popstate', restoreHashTopic);
    window.addEventListener('hashchange', restoreHashTopic);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', restoreHashTopic);
      window.removeEventListener('hashchange', restoreHashTopic);
      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
      }
    };
  }, [scrollToTopic, topics]);

  const activeTopic =
    topics.find(({ slug }) => slug === activeSlug) ?? topics[0];

  return (
    <section
      className="tablet:py-14 py-10"
      data-hydrated={String(hydrated)}
      data-testid="running-basics-guide"
    >
      <header className="max-w-3xl">
        <p className="text-primary m-0 text-xs font-bold tracking-[0.16em] uppercase">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 mb-0 text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.045em]">
          {copy.title}
        </h1>
        <p className="text-muted-foreground mt-4 mb-0 max-w-2xl text-lg leading-8">
          {copy.introduction}
        </p>
      </header>

      <div className="desktop:grid-cols-[13rem_minmax(0,1fr)] desktop:gap-14 mt-10 grid items-start gap-10">
        <aside className="desktop:block hidden">
          <nav
            aria-label={copy.topics}
            className="sticky top-6"
            data-testid="desktop-topic-navigation"
          >
            <h2 className="text-muted-foreground relative m-0 px-3 pb-4 text-lg font-semibold after:absolute after:bottom-0 after:left-3 after:h-0.5 after:w-20 after:rounded-full after:bg-current after:opacity-25">
              {copy.topics}
            </h2>
            <ul className="mt-3 list-none p-0">
              {topics.map((topic) => {
                const active = topic.slug === activeSlug;
                return (
                  <li key={topic.slug}>
                    <a
                      aria-current={active ? 'location' : undefined}
                      className={cn(
                        'text-muted-foreground hover:bg-surface-subtle hover:text-primary focus-visible:bg-surface-subtle focus-visible:text-primary relative block rounded-[var(--radius-sm)] py-2 pr-3 pl-4 leading-6 no-underline transition-colors before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.75 before:rounded-full before:bg-transparent',
                        active &&
                          'bg-surface-subtle text-primary before:bg-primary',
                      )}
                      href={`#${topic.slug}`}
                      onClick={(event) => {
                        event.preventDefault();
                        scrollToTopic(topic.slug, true);
                      }}
                    >
                      {topic.translations[locale].title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          <div className="bg-background desktop:hidden sticky top-0 z-30 -mx-1 mb-8 px-1 py-2">
            <DropdownMenu
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={copy.selectTopic}
                  className="bg-surface hover:bg-surface-subtle h-12 w-full justify-between border shadow-sm"
                  variant="outline"
                >
                  <span>
                    {hasTopicSelection && activeTopic
                      ? activeTopic.translations[locale].title
                      : `— ${copy.selectTopic} —`}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'size-4 transition-transform',
                      mobileMenuOpen && 'rotate-180',
                    )}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)] p-2"
              >
                <DropdownMenuLabel>{copy.topics}</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={activeSlug}
                  onValueChange={(slug) => scrollToTopic(slug, true)}
                >
                  {topics.map((topic) => (
                    <DropdownMenuRadioItem
                      className="min-h-11 text-base"
                      key={topic.slug}
                      value={topic.slug}
                    >
                      {topic.translations[locale].title}
                      {activeSlug === topic.slug ? (
                        <Check
                          aria-hidden="true"
                          className="ml-auto size-4 opacity-0"
                        />
                      ) : null}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <article className="max-w-4xl" data-testid="running-basics-topics">
            {topics.map((topic, topicIndex) => {
              const translation = topic.translations[locale];
              return (
                <section
                  className={cn(
                    'scroll-mt-20 pb-12',
                    topicIndex > 0 && 'border-border border-t pt-12',
                  )}
                  data-topic={topic.slug}
                  id={topic.slug}
                  key={topic.slug}
                >
                  <h2 className="m-0 text-[clamp(1.8rem,3vw,2.5rem)] leading-tight font-semibold tracking-[-0.035em]">
                    {translation.title}
                  </h2>
                  <p className="text-muted-foreground mt-3 mb-0 max-w-3xl text-lg leading-8">
                    {translation.introduction}
                  </p>

                  <div className="tablet:grid-cols-2 mt-8 grid gap-x-10 gap-y-8">
                    {translation.sections.map((section) => (
                      <section key={section.heading}>
                        <h3 className="text-primary m-0 text-xs font-semibold tracking-[0.1em] uppercase">
                          {section.heading}
                        </h3>
                        {section.paragraphs.map((paragraph) => (
                          <p className="mt-3 mb-0 leading-7" key={paragraph}>
                            {paragraph}
                          </p>
                        ))}
                        {section.bullets ? (
                          <ul className="mt-3 mb-0 space-y-2 pl-5 leading-7">
                            {section.bullets.map((bullet) => (
                              <li key={bullet}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </section>
                    ))}
                  </div>

                  {translation.callout ? (
                    <aside className="bg-callout text-foreground border-callout-border mt-8 border-l-3 px-5 py-4 leading-7">
                      {translation.callout}
                    </aside>
                  ) : null}
                </section>
              );
            })}
          </article>
        </div>
      </div>
    </section>
  );
}
