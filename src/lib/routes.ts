import { defaultLocale, isLocale, type Locale } from '@/i18n/config';

const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

function withBase(path: string) {
  return `${baseUrl}${path.replace(/^\/+/, '')}`;
}

function normalizePath(path: string) {
  return path === '/' ? path : path.replace(/\/+$/, '');
}

export const routes = {
  home: baseUrl,
  catalogue: withBase('catalogue/'),
  runningBasics: withBase('running-basics/'),
  designSystem: withBase('design-system/'),
} as const;

export type LocalizedRouteKey = 'catalogue' | 'designSystem' | 'runningBasics';

const routeSegments = {
  catalogue: 'catalogue',
  designSystem: 'design-system',
  runningBasics: 'running-basics',
} satisfies Record<LocalizedRouteKey, string>;

export function localizedRoute(locale: Locale, route: LocalizedRouteKey) {
  return withBase(`${locale}/${routeSegments[route]}/`);
}

export function localizedHome(locale: Locale) {
  return withBase(`${locale}/`);
}

export function localeFromPathname(pathname: string): Locale | null {
  const locale = pathname.split('/').find((segment) => isLocale(segment));
  return isLocale(locale) ? locale : null;
}

export function localizedRouteFromPathname(
  pathname: string,
): LocalizedRouteKey | null {
  const normalized = normalizePath(pathname);
  for (const locale of ['en', 'de', 'fr'] as const) {
    for (const [key, segment] of Object.entries(routeSegments)) {
      if (normalized === normalizePath(withBase(`${locale}/${segment}/`))) {
        return key as LocalizedRouteKey;
      }
    }
  }
  return null;
}

export function switchLocaleUrl(url: URL, nextLocale: Locale): URL {
  const next = new URL(url);
  const currentLocale = localeFromPathname(next.pathname);

  if (currentLocale) {
    next.pathname = next.pathname.replace(
      new RegExp(`/${currentLocale}(?=/|$)`),
      `/${nextLocale}`,
    );
  } else {
    const route = localizedRouteFromPathname(next.pathname) ?? 'catalogue';
    next.pathname = localizedRoute(nextLocale, route);
  }

  next.searchParams.delete('lang');
  return next;
}

export function legacyLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function isCurrentRoute(pathname: string, route: LocalizedRouteKey) {
  return localizedRouteFromPathname(pathname) === route;
}
