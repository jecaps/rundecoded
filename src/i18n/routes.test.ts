import { describe, expect, it } from 'vitest';

import { defaultLocale, isLocale, supportedLocales } from './config';
import { sharedMessages } from './messages';
import {
  legacyLocale,
  localeFromPathname,
  localizedRoute,
  localizedRouteFromPathname,
  switchLocaleUrl,
} from '@/lib/routes';

describe('localized routes', () => {
  it('builds canonical paths for all locales and route areas', () => {
    for (const locale of supportedLocales) {
      expect(localizedRoute(locale, 'catalogue')).toMatch(
        new RegExp(`/${locale}/catalogue/$`),
      );
      expect(localizedRoute(locale, 'runningBasics')).toMatch(
        new RegExp(`/${locale}/running-basics/$`),
      );
    }
  });

  it('reads locales and route areas without confusing the repository base', () => {
    expect(localeFromPathname('/rundecoded/fr/catalogue/')).toBe('fr');
    expect(localeFromPathname('/rundecoded/es/catalogue/')).toBeNull();
    expect(
      localizedRouteFromPathname(localizedRoute('de', 'runningBasics')),
    ).toBe('runningBasics');
  });

  it('switches only the locale while preserving page state and anchors', () => {
    const current = new URL(
      'https://example.com/rundecoded/en/catalogue/?q=Kayano&category=trail&page=2#results',
    );
    const next = switchLocaleUrl(current, 'fr');

    expect(next.pathname).toBe('/rundecoded/fr/catalogue/');
    expect(next.search).toBe('?q=Kayano&category=trail&page=2');
    expect(next.hash).toBe('#results');
  });

  it('uses an explicit English fallback for missing or unknown locales', () => {
    expect(defaultLocale).toBe('en');
    expect(legacyLocale('es')).toBe('en');
    expect(legacyLocale(null)).toBe('en');
    expect(isLocale('en')).toBe(true);
  });
});

describe('typed shared messages', () => {
  it('contains visible shared interface and metadata copy in every locale', () => {
    for (const locale of supportedLocales) {
      const messages = sharedMessages[locale];
      expect(messages.skipLink).not.toHaveLength(0);
      expect(messages.navigation.catalogue).not.toHaveLength(0);
      expect(messages.navigation.runningBasics).not.toHaveLength(0);
      expect(messages.pages.catalogue.title).not.toHaveLength(0);
      expect(messages.pages.runningBasics.description).not.toHaveLength(0);
    }
  });
});
