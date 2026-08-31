import type { LocalizedText, SupportedLocale } from './schema';

export interface ResolvedLocalizedText {
  value: string;
  requestedLocale: SupportedLocale;
  resolvedLocale: SupportedLocale;
  usedFallback: boolean;
}

export function resolveLocalizedText(
  text: LocalizedText,
  locale: SupportedLocale,
): ResolvedLocalizedText {
  const localized = text[locale];

  if (localized !== null) {
    return {
      value: localized,
      requestedLocale: locale,
      resolvedLocale: locale,
      usedFallback: false,
    };
  }

  return {
    value: text.en,
    requestedLocale: locale,
    resolvedLocale: 'en',
    usedFallback: true,
  };
}
