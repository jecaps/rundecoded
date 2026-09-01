# Localized routing

Phase 7 makes the locale part of every canonical page URL. The URL is the
source of truth for rendered language; a stored preference can never override
an explicit localized route.

## Canonical routes

Each public page is generated for all supported locales:

| Page           | English               | German                | French                |
| -------------- | --------------------- | --------------------- | --------------------- |
| Catalogue      | `/en/catalogue/`      | `/de/catalogue/`      | `/fr/catalogue/`      |
| Running Basics | `/en/running-basics/` | `/de/running-basics/` | `/fr/running-basics/` |
| Design system  | `/en/design-system/`  | `/de/design-system/`  | `/fr/design-system/`  |

The table shows paths relative to the configured Astro base path. Locale home
routes such as `/de/` redirect to the matching catalogue. Legacy unlocalized
routes remain temporary compatibility redirects: they read the former `lang`
query parameter or stored preference, remove `lang`, and preserve other query
parameters and the hash. English is the fallback. Unsupported route locales,
such as `/es/catalogue/`, intentionally return a 404 instead of silently
rendering another language.

## Translation contract

`src/i18n/config.ts` owns the supported locale union and static route list.
`src/i18n/messages.ts` defines one shared, typed message contract for shell and
metadata copy. Each locale dictionary must satisfy that complete contract, so a
missing key fails TypeScript validation in development and CI instead of
quietly falling back to another language.

Feature content remains in its feature-owned typed data source. Both the
Catalogue and Running Basics receive their locale from the route and use the
same shell dictionary.

## Language switching and state

The footer language control replaces only the locale segment and uses Astro's
client-side navigation. It pushes a browser-history entry and preserves
shareable state:

- Catalogue search, category, and page query parameters
- Running Basics topic anchors
- any unrelated safe query parameters

Transient product-detail and comparison dialogs are intentionally closed by a
route transition. Their state is not shareable in the URL, and resetting them
avoids restoring stale focus into a dialog rendered in another language.

Back and forward navigation therefore return to the prior localized URL and its
shareable state. A direct load or refresh produces the same language and state.

## Metadata

`AppLayout.astro` emits a localized title and description, one absolute
canonical URL, Open Graph metadata, `hreflang` links for English, German, and
French, and an `x-default` link to English. Canonical URLs include the configured
production site and base path, so preview and GitHub Pages builds use the same
route construction rules.

## Adding a locale or localized page

1. Add the locale to `supportedLocales` and provide a complete shared dictionary.
2. Add feature-owned content for that locale.
3. Add the route segment to `LocalizedRouteKey` and `localizedRouteSegments`.
4. Generate the page with `getLocaleStaticPaths` and pass the route locale into
   the page component.
5. Extend unit, build-verification, and Playwright route coverage.

Run `pnpm quality`, `pnpm verify:pages`, and `pnpm test:e2e` before merging.
