import {
  surfaceFamiliesForShoe,
  terrainProfilesForShoe,
  type SupportedLocale,
} from '@/domain/catalogue';

import type { ExplorerProduct } from './catalogue';

export type PhoneSort = 'default' | 'brand' | 'model';
export type PhoneStability = 'neutral' | 'stability';
export type PhoneSurface = 'road' | 'easy-terrain' | 'mixed-terrain';
export type PhoneDrop = 'any' | 'low' | 'mid' | 'high';
export type PhoneDistance = 'any' | '10' | '21' | '42';

export interface PhoneFilters {
  purposes: string[];
  surfaces: PhoneSurface[];
  stabilities: PhoneStability[];
  drop: PhoneDrop;
  distance: PhoneDistance;
  sort: PhoneSort;
}

export const emptyPhoneFilters: PhoneFilters = {
  purposes: [],
  surfaces: [],
  stabilities: [],
  drop: 'any',
  distance: 'any',
  sort: 'default',
};

export const phoneFilterCopy = {
  en: {
    all: 'All',
    filters: 'Filters',
    purpose: 'Purpose',
    guidance: 'Guidance',
    surface: 'Surface',
    drop: 'Drop',
    lowDrop: 'Low · 6 mm or less',
    midDrop: 'Mid · 7–8 mm',
    highDrop: 'High · 10+ mm',
    distance: 'Distance up to',
    any: 'Any',
    sort: 'Sort',
    defaultSort: 'Catalogue order',
    brandSort: 'Brand A–Z',
    modelSort: 'Model A–Z',
    show: (count: number) => `Show ${count} shoes`,
    clear: 'Clear all',
    close: 'Close filters',
  },
  de: {
    all: 'Alle',
    filters: 'Filter',
    purpose: 'Zweck',
    guidance: 'Unterstützung',
    surface: 'Untergrund',
    drop: 'Sprengung',
    lowDrop: 'Niedrig · bis 6 mm',
    midDrop: 'Mittel · 7–8 mm',
    highDrop: 'Hoch · ab 10 mm',
    distance: 'Distanz bis',
    any: 'Beliebig',
    sort: 'Sortieren',
    defaultSort: 'Katalogreihenfolge',
    brandSort: 'Marke A–Z',
    modelSort: 'Modell A–Z',
    show: (count: number) => `${count} Schuhe anzeigen`,
    clear: 'Alle löschen',
    close: 'Filter schließen',
  },
  fr: {
    all: 'Tout',
    filters: 'Filtres',
    purpose: 'Usage',
    guidance: 'Maintien',
    surface: 'Surface',
    drop: 'Drop',
    lowDrop: 'Faible · 6 mm ou moins',
    midDrop: 'Moyen · 7–8 mm',
    highDrop: 'Élevé · 10+ mm',
    distance: 'Distance jusqu’à',
    any: 'Toutes',
    sort: 'Trier',
    defaultSort: 'Ordre du catalogue',
    brandSort: 'Marque A–Z',
    modelSort: 'Modèle A–Z',
    show: (count: number) => `Afficher ${count} chaussures`,
    clear: 'Tout effacer',
    close: 'Fermer les filtres',
  },
} satisfies Record<
  SupportedLocale,
  {
    all: string;
    filters: string;
    purpose: string;
    guidance: string;
    surface: string;
    drop: string;
    lowDrop: string;
    midDrop: string;
    highDrop: string;
    distance: string;
    any: string;
    sort: string;
    defaultSort: string;
    brandSort: string;
    modelSort: string;
    show: (count: number) => string;
    clear: string;
    close: string;
  }
>;

const params = {
  purposes: 'f_purpose',
  surfaces: 'f_surface',
  stabilities: 'f_stability',
  drop: 'f_drop',
  distance: 'f_distance',
  sort: 'f_sort',
} as const;

function selectedValues<T extends string>(
  value: string | null,
  validValues: ReadonlySet<T>,
): T[] {
  return [
    ...new Set(
      (value ?? '')
        .split(',')
        .filter((item): item is T => validValues.has(item as T)),
    ),
  ];
}

export function parsePhoneFilters(
  searchParams: URLSearchParams,
  validPurposes: ReadonlySet<string>,
): PhoneFilters {
  const sort = searchParams.get(params.sort);
  return {
    purposes: selectedValues(searchParams.get(params.purposes), validPurposes),
    surfaces: selectedValues(
      searchParams.get(params.surfaces),
      new Set<PhoneSurface>(['road', 'easy-terrain', 'mixed-terrain']),
    ),
    stabilities: selectedValues(
      searchParams.get(params.stabilities),
      new Set<PhoneStability>(['neutral', 'stability']),
    ),
    drop: selectedValue(
      searchParams.get(params.drop),
      new Set<PhoneDrop>(['low', 'mid', 'high']),
      'any',
    ),
    distance: selectedValue(
      searchParams.get(params.distance),
      new Set<PhoneDistance>(['10', '21', '42']),
      'any',
    ),
    sort: sort === 'brand' || sort === 'model' ? sort : 'default',
  };
}

function selectedValue<T extends string>(
  value: string | null,
  validValues: ReadonlySet<T>,
  fallback: T,
): T {
  return value && validValues.has(value as T) ? (value as T) : fallback;
}

export function writePhoneFilters(url: URL, filters: PhoneFilters): URL {
  const next = new URL(url);
  for (const [key, values] of [
    [params.purposes, filters.purposes],
    [params.surfaces, filters.surfaces],
    [params.stabilities, filters.stabilities],
  ] as const) {
    if (values.length) next.searchParams.set(key, values.join(','));
    else next.searchParams.delete(key);
  }
  for (const [key, value] of [
    [params.drop, filters.drop],
    [params.distance, filters.distance],
  ] as const) {
    if (value !== 'any') next.searchParams.set(key, value);
    else next.searchParams.delete(key);
  }
  if (filters.sort !== 'default')
    next.searchParams.set(params.sort, filters.sort);
  else next.searchParams.delete(params.sort);
  return next;
}

export function phoneFilterCount(filters: PhoneFilters): number {
  return (
    filters.purposes.length +
    filters.surfaces.length +
    filters.stabilities.length +
    (filters.drop === 'any' ? 0 : 1) +
    (filters.distance === 'any' ? 0 : 1)
  );
}

function matchesSurface(
  product: ExplorerProduct['product'],
  surface: PhoneSurface,
): boolean {
  return surface === 'road'
    ? surfaceFamiliesForShoe(product).includes('road')
    : terrainProfilesForShoe(product).includes(surface);
}

function matchesDrop(dropMm: number | null, selected: PhoneDrop): boolean {
  if (selected === 'any') return true;
  if (dropMm === null) return false;
  if (selected === 'low') return dropMm <= 6;
  if (selected === 'mid') return dropMm >= 7 && dropMm <= 8;
  return dropMm >= 10;
}

export function applyPhoneFilters(
  products: ExplorerProduct[],
  filters: PhoneFilters,
  locale: string,
): ExplorerProduct[] {
  const matching = products.filter(
    ({ product }) =>
      (!filters.purposes.length ||
        filters.purposes.some((purpose) =>
          product.categories.includes(purpose),
        )) &&
      (!filters.surfaces.length ||
        filters.surfaces.some((surface) => matchesSurface(product, surface))) &&
      (!filters.stabilities.length ||
        filters.stabilities.includes(product.stability as PhoneStability)) &&
      matchesDrop(product.specifications.dropMm, filters.drop) &&
      (filters.distance === 'any' ||
        (product.specifications.maximumDistanceKm !== null &&
          product.specifications.maximumDistanceKm >=
            Number(filters.distance))),
  );
  if (filters.sort === 'default') return matching;
  return matching.sort((left, right) => {
    const first =
      filters.sort === 'brand' ? left.product.brand : left.product.model;
    const second =
      filters.sort === 'brand' ? right.product.brand : right.product.model;
    return (
      first.localeCompare(second, locale) ||
      left.product.model.localeCompare(right.product.model, locale)
    );
  });
}
