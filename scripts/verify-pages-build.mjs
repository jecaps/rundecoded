import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { site } from '../site.config.mjs';

const base = `${site.base.replace(/\/+$/, '')}/`;
const locales = ['en', 'de', 'fr'];
const routeSegments = [
  'catalogue',
  'consultation',
  'design-system',
  'running-basics',
];
const linkedRouteSegments = ['catalogue', 'design-system', 'running-basics'];
const localizedRoute = (locale, segment) => `${base}${locale}/${segment}/`;
const routeFiles = locales.flatMap((locale) =>
  routeSegments.map((segment) => [
    `${locale}/${segment}`,
    `${locale}/${segment}/index.html`,
    locale,
    segment,
  ]),
);

for (const [routeName, relativePath, locale, segment] of routeFiles) {
  const html = await readFile(join('dist', relativePath), 'utf8');
  const absoluteAssetOrLink = /\b(?:href|src)="(\/[^"#?]*)/g;

  for (const match of html.matchAll(absoluteAssetOrLink)) {
    const path = match[1];

    if (!path.startsWith(base)) {
      throw new Error(`${routeName} contains a path outside ${base}: ${path}`);
    }
  }

  const expectedLinkedRoutes =
    segment === 'consultation'
      ? ['catalogue', 'design-system']
      : linkedRouteSegments;

  for (const expectedRoute of expectedLinkedRoutes.map((routeSegment) =>
    localizedRoute(locale, routeSegment),
  )) {
    if (!html.includes(`href="${expectedRoute}`)) {
      throw new Error(`${routeName} does not link to ${expectedRoute}`);
    }
  }

  const canonical = `${site.origin}${localizedRoute(locale, segment)}`;
  if (!html.includes(`rel="canonical" href="${canonical}"`)) {
    throw new Error(`${routeName} does not use canonical URL ${canonical}`);
  }

  for (const alternateLocale of locales) {
    const alternate = `${site.origin}${localizedRoute(alternateLocale, segment)}`;
    if (
      !html.includes(
        `rel="alternate" hreflang="${alternateLocale}" href="${alternate}"`,
      )
    ) {
      throw new Error(`${routeName} is missing hreflang ${alternateLocale}`);
    }
  }

  if (html.includes('?lang=')) {
    throw new Error(`${routeName} still contains query-based locale links`);
  }
}

const rootHtml = await readFile(join('dist', 'index.html'), 'utf8');

const defaultCatalogue = localizedRoute('en', 'catalogue');
if (!rootHtml.includes(defaultCatalogue)) {
  throw new Error(`The root redirect does not target ${defaultCatalogue}`);
}

console.log(`Pages build verified for ${base}`);
