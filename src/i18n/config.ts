export const supportedLocales = ['en', 'de', 'fr'] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function getLocaleStaticPaths() {
  return supportedLocales.map((locale) => ({ params: { lang: locale } }));
}
