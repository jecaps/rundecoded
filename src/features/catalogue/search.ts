import Fuse from 'fuse.js';

import { resolveLocalizedText, type SupportedLocale } from '@/domain/catalogue';

import {
  categoryLabel,
  stabilityLabel,
  surfaceFamilyLabel,
  terrainProfileLabel,
} from './copy';
import type { ExplorerProduct } from './catalogue';

interface ProductSearchDocument {
  bestFor: string;
  brand: string;
  categories: string[];
  item: ExplorerProduct;
  model: string;
  stability: string;
  surfaces: string[];
  terrain: string[];
  technologies: string[];
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export type SuggestionKind = 'attribute' | 'brand' | 'category' | 'model';

export interface SearchSuggestion {
  id: string;
  kind: SuggestionKind;
  label: string;
  value: string;
}

function productDocument(
  item: ExplorerProduct,
  locale: SupportedLocale,
): ProductSearchDocument {
  const { product } = item;
  return {
    item,
    brand: product.brand.name,
    model: product.model,
    bestFor: resolveLocalizedText(product.copy.bestFor, locale).value,
    categories: product.categories.map(({ id, label }) =>
      categoryLabel(id, resolveLocalizedText(label, locale).value, locale),
    ),
    stability: stabilityLabel(
      product.specifications.stability.value ?? 'unknown',
      locale,
    ),
    surfaces: product.specifications.surfaces.value ?? [],
    terrain: [
      ...(product.specifications.surfaceFamilies.value ?? []).map((family) =>
        surfaceFamilyLabel(family, locale),
      ),
      ...(product.specifications.terrainProfiles.value ?? []).map((terrain) =>
        terrainProfileLabel(terrain, locale),
      ),
    ],
    technologies: product.technologies.value ?? [],
  };
}

function productSearch(products: ExplorerProduct[], locale: SupportedLocale) {
  return new Fuse(
    products.map((item) => productDocument(item, locale)),
    {
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      shouldSort: true,
      threshold: 0.42,
      keys: [
        { name: 'model', weight: 0.45 },
        { name: 'brand', weight: 0.22 },
        { name: 'categories', weight: 0.14 },
        { name: 'bestFor', weight: 0.08 },
        { name: 'technologies', weight: 0.06 },
        { name: 'stability', weight: 0.03 },
        { name: 'surfaces', weight: 0.02 },
        { name: 'terrain', weight: 0.04 },
      ],
    },
  );
}

export function searchProducts(
  products: ExplorerProduct[],
  query: string,
  locale: SupportedLocale,
): ExplorerProduct[] {
  const normalized = normalizeSearch(query);
  if (!normalized) return products;
  if (normalized.length < 2) return products;
  const documents = products.map((item) => productDocument(item, locale));
  const exactModelMatches = documents
    .filter(({ model }) => normalizeSearch(model) === normalized)
    .map(({ item }) => item);
  if (exactModelMatches.length > 0) return exactModelMatches;

  return productSearch(products, locale)
    .search(query)
    .map(({ item }) => item.item);
}

function suggestionKindLabel(
  kind: SearchSuggestion['kind'],
  locale: SupportedLocale,
): string {
  const labels = {
    en: {
      attribute: 'Attribute',
      brand: 'Brand',
      category: 'Category',
      model: 'Model',
    },
    de: {
      attribute: 'Merkmal',
      brand: 'Marke',
      category: 'Kategorie',
      model: 'Modell',
    },
    fr: {
      attribute: 'Attribut',
      brand: 'Marque',
      category: 'Catégorie',
      model: 'Modèle',
    },
  } as const;
  return labels[locale][kind];
}

export function searchSuggestionKindLabel(
  kind: SearchSuggestion['kind'],
  locale: SupportedLocale,
): string {
  return suggestionKindLabel(kind, locale);
}

export function buildSearchSuggestions(
  products: ExplorerProduct[],
  query: string,
  locale: SupportedLocale,
  limit = 6,
): SearchSuggestion[] {
  const normalized = normalizeSearch(query);
  if (normalized.length < 2) return [];

  const entries = new Map<string, SearchSuggestion>();
  const add = (kind: SearchSuggestion['kind'], value: string) => {
    const normalizedValue = normalizeSearch(value);
    const id = `${kind}:${normalizedValue}`;
    if (!normalizedValue || entries.has(id)) return;
    entries.set(id, { id, kind, label: value, value });
  };

  for (const { product } of products) {
    add('brand', product.brand.name);
    add('model', product.model);
    for (const { id, label } of product.categories) {
      add(
        'category',
        categoryLabel(id, resolveLocalizedText(label, locale).value, locale),
      );
    }
    for (const technology of product.technologies.value ?? []) {
      add('attribute', technology);
    }
    for (const surface of product.specifications.surfaces.value ?? []) {
      add('attribute', surface);
    }
    for (const family of product.specifications.surfaceFamilies.value ?? []) {
      add('attribute', surfaceFamilyLabel(family, locale));
    }
    for (const surfaceTag of product.specifications.surfaceTags.value ?? []) {
      add('attribute', surfaceTag.replaceAll('-', ' '));
    }
    for (const terrain of product.specifications.terrainProfiles.value ?? []) {
      add('attribute', terrainProfileLabel(terrain, locale));
    }
  }

  const kindPriority: Record<SearchSuggestion['kind'], number> = {
    model: 0,
    brand: 1,
    category: 2,
    attribute: 3,
  };
  const fuse = new Fuse([...entries.values()], {
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
    threshold: 0.42,
    keys: [{ name: 'label', weight: 1 }],
  });

  return fuse
    .search(query)
    .sort((left, right) => {
      const leftExact =
        normalizeSearch(left.item.label) === normalized ? -1 : 0;
      const rightExact =
        normalizeSearch(right.item.label) === normalized ? -1 : 0;
      return (
        leftExact - rightExact ||
        (left.score ?? 1) - (right.score ?? 1) ||
        kindPriority[left.item.kind] - kindPriority[right.item.kind] ||
        left.item.label.localeCompare(right.item.label, locale)
      );
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

export function externalSearchUrl(
  query: string,
  locale: SupportedLocale,
): string {
  const origins = {
    de: 'https://www.decathlon.de/search',
    en: 'https://www.decathlon.co.uk/search',
    fr: 'https://www.decathlon.fr/search',
  } as const;
  const url = new URL(origins[locale]);
  url.searchParams.set('Ntt', query);
  return url.toString();
}
