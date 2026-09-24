import { useEffect, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { navigate } from 'astro:transitions/client';

import type { Locale } from '@/i18n/config';
import { switchLocaleUrl } from '@/lib/routes';

type ThemeChoice = 'system' | 'light' | 'dark';

const labels = {
  en: {
    settings: 'Settings',
    appearance: 'Appearance',
    dark: 'Dark',
    language: 'Language',
    languageHint: 'Used for all text in the app',
    light: 'Light',
    system: 'System',
    systemHint: 'Following your device',
  },
  de: {
    settings: 'Einstellungen',
    appearance: 'Darstellung',
    dark: 'Dunkel',
    language: 'Sprache',
    languageHint: 'Für alle Texte in der App',
    light: 'Hell',
    system: 'System',
    systemHint: 'Geräteeinstellung verwenden',
  },
  fr: {
    settings: 'Réglages',
    appearance: 'Apparence',
    dark: 'Sombre',
    language: 'Langue',
    languageHint: 'Utilisée pour tous les textes de l’application',
    light: 'Clair',
    system: 'Système',
    systemHint: 'Selon les réglages de votre appareil',
  },
} as const;

const languageNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
};

function readThemeChoice(): ThemeChoice {
  const stored = window.localStorage.getItem('rundecoded-theme');
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function PhoneSettings({ locale }: { locale: Locale }) {
  const copy = labels[locale];
  const [theme, setTheme] = useState<ThemeChoice>('system');
  const [ready, setReady] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTheme(readThemeChoice());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      if (readThemeChoice() === 'system') {
        document.documentElement.dataset.theme = media.matches
          ? 'dark'
          : 'light';
      }
    };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [theme]);

  function changeTheme(next: ThemeChoice) {
    setTheme(next);
    if (next === 'system') {
      window.localStorage.removeItem('rundecoded-theme');
      document.documentElement.setAttribute(
        'data-theme',
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
      );
    } else {
      window.localStorage.setItem('rundecoded-theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
  }

  function changeLocale(next: Locale) {
    if (next === locale) return;
    const storedReturn = window.sessionStorage.getItem(
      'rundecoded:phone-settings-return',
    );
    if (storedReturn) {
      const localizedReturn = switchLocaleUrl(
        new URL(storedReturn, window.location.origin),
        next,
      );
      window.sessionStorage.setItem(
        'rundecoded:phone-settings-return',
        `${localizedReturn.pathname}${localizedReturn.search}${localizedReturn.hash}`,
      );
    }
    window.localStorage.setItem('rundecoded-locale', next);
    document.documentElement.setAttribute('lang', next);
    const nextUrl = switchLocaleUrl(new URL(window.location.href), next);
    void navigate(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      history: 'push',
    });
  }

  return (
    <div className="bg-surface tablet:mx-auto tablet:my-5 tablet:min-h-0 tablet:max-w-2xl tablet:rounded-[var(--radius-panel)] tablet:border tablet:border-border min-h-[calc(100dvh-3.75rem)]">
      <h1 className="sr-only">{copy.settings}</h1>
      <section className="border-border border-b px-5 py-5">
        <button
          aria-expanded={languageOpen}
          aria-label={`${copy.language}: ${languageNames[locale]}`}
          className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent p-0 text-left"
          onClick={() => setLanguageOpen((open) => !open)}
          type="button"
        >
          <span>
            <span className="block text-lg font-semibold">{copy.language}</span>
            <span className="text-muted-foreground mt-1 block text-sm">
              {copy.languageHint}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-sm">
            {languageNames[locale]}
            <ChevronRight
              aria-hidden="true"
              className="text-muted-foreground size-4"
            />
          </span>
        </button>
        {languageOpen ? (
          <div className="mt-4 grid gap-2">
            {(['en', 'de', 'fr'] as const).map((option) => (
              <button
                aria-current={locale === option ? 'true' : undefined}
                className="border-border bg-surface flex min-h-11 cursor-pointer items-center justify-between rounded-[var(--radius-control)] border px-4 text-left text-sm"
                key={option}
                onClick={() => changeLocale(option)}
                type="button"
              >
                {languageNames[option]}
                {locale === option ? (
                  <Check aria-hidden="true" className="text-primary size-4" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </section>
      <section className="px-5 py-5">
        <h2 className="m-0 text-lg font-semibold">{copy.appearance}</h2>
        <p className="text-muted-foreground mt-1 mb-3 text-sm">
          {theme === 'system'
            ? copy.systemHint
            : theme === 'dark'
              ? copy.dark
              : copy.light}
        </p>
        <div
          className={`bg-surface-subtle flex gap-1 rounded-[var(--radius-control)] p-1 ${ready ? '' : 'invisible'}`}
          role="group"
          aria-label={copy.appearance}
        >
          {(['system', 'light', 'dark'] as const).map((option) => (
            <button
              aria-pressed={theme === option}
              className={`min-h-11 flex-1 cursor-pointer rounded-[var(--radius-sm)] px-2 text-sm font-semibold ${theme === option ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
              key={option}
              onClick={() => changeTheme(option)}
              type="button"
            >
              {copy[option]}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
