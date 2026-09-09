import { describe, expect, it } from 'vitest';

import { rankComparableProducts } from './comparables';
import { compareProducts, comparisonSummary } from './comparison';
import {
  buildSearchSuggestions,
  externalSearchUrl,
  searchProducts,
} from './search';
import { getProductCatalogue } from './catalogue';
import { filterProducts, paginateProducts } from './state';
import { parseCatalogueUrlState, writeCatalogueUrlState } from './url-state';

const products = getProductCatalogue();
const byId = new Map(products.map((item) => [item.product.id, item]));

describe('Phase 8 product catalogue', () => {
  it('contains all 106 validated products with resolvable comparables', () => {
    expect(products).toHaveLength(106);
    for (const { product } of products) {
      expect(product.comparables.length).toBeGreaterThan(0);
      for (const comparable of product.comparables)
        expect(byId.has(comparable)).toBe(true);
    }
  });

  it('provides a surface family for every shoe and keeps uncertain terrain pending', () => {
    for (const { product } of products) {
      expect(
        product.specifications.surfaceFamilies.value?.length,
      ).toBeGreaterThan(0);
      if (product.specifications.terrainProfiles.value === null) {
        expect(product.specifications.surfaceFamilies.value).toContain(
          'off-road',
        );
      }
    }
  });

  it('includes complete and intentionally pending presentation states', () => {
    expect(
      products.some(({ product }) => product.images[0]?.status === 'pending'),
    ).toBe(true);
    expect(
      products.some(({ product }) => product.images[0]?.status === 'verified'),
    ).toBe(true);
    expect(
      products.some(
        ({ product }) =>
          product.specifications.stackHeight.evidence.status === 'pending',
      ),
    ).toBe(true);
  });

  it('uses stable unique IDs, distinct categories, and intended-use comparables', () => {
    expect(new Set(products.map(({ product }) => product.id)).size).toBe(106);

    for (const { product } of products) {
      expect(new Set(product.categories.map(({ id }) => id)).size).toBe(
        product.categories.length,
      );
      const hasCompatibleCrossBrandProduct = products.some(
        ({ product: candidate }) =>
          candidate.brand.name !== product.brand.name &&
          (candidate.categories.some(({ id }) =>
            product.categories.some((category) => category.id === id),
          ) ||
            (candidate.specifications.surfaceFamilies.value?.some((surface) =>
              product.specifications.surfaceFamilies.value?.includes(surface),
            ) ??
              false) ||
            (candidate.specifications.terrainProfiles.value?.some((terrain) =>
              product.specifications.terrainProfiles.value?.includes(terrain),
            ) ??
              false)),
      );
      if (hasCompatibleCrossBrandProduct) {
        expect(
          product.comparables.some(
            (id) => byId.get(id)?.product.brand.name !== product.brand.name,
          ),
        ).toBe(true);
      }
      for (const comparableId of product.comparables) {
        const comparable = byId.get(comparableId)?.product;
        expect(comparable).toBeDefined();
        const sharesCategory = comparable!.categories.some(({ id }) =>
          product.categories.some((category) => category.id === id),
        );
        const sharesSurface =
          comparable!.specifications.surfaceFamilies.value?.some((surface) =>
            product.specifications.surfaceFamilies.value?.includes(surface),
          ) ?? false;
        const sharesTerrain =
          comparable!.specifications.terrainProfiles.value?.some((terrain) =>
            product.specifications.terrainProfiles.value?.includes(terrain),
          ) ?? false;
        expect(sharesCategory || sharesSurface || sharesTerrain).toBe(true);
      }
    }
  });

  it('records a reference size for every available weight', () => {
    for (const { product } of products) {
      const weight = product.specifications.weight.value;
      if (weight) expect(weight.referenceSize).not.toHaveLength(0);
    }
  });
});

describe('catalogue state', () => {
  it('searches brand, model, category, benefit, and technology text', () => {
    expect(filterProducts(products, 'kayano', 'all', 'en')).toHaveLength(2);
    expect(
      filterProducts(products, 'waterproof', 'all', 'en').length,
    ).toBeGreaterThan(0);
    expect(
      filterProducts(products, 'stabilität', 'all', 'de').length,
    ).toBeGreaterThan(0);
  });

  it('handles useful misspellings without returning distant nonsense', () => {
    expect(searchProducts(products, 'kayno', 'en')[0]?.product.model).toBe(
      'Gel Kayano 32',
    );
    expect(
      searchProducts(products, 'jogflow 100.1', 'en')[0]?.product.model,
    ).toBe('Jogflow 100.1');
    expect(searchProducts(products, 'zzqxvnotashoe', 'en')).toHaveLength(0);
  });

  it('suggests models, brands, categories, and attributes', () => {
    expect(buildSearchSuggestions(products, 'kayno', 'en')[0]).toMatchObject({
      kind: 'model',
      label: 'Gel Kayano 32',
    });
    expect(buildSearchSuggestions(products, 'adid', 'en')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'brand', label: 'Adidas' }),
      ]),
    );
    expect(buildSearchSuggestions(products, 'trail', 'en')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'category', label: 'Trail' }),
      ]),
    );
    expect(
      buildSearchSuggestions(products, 'water', 'en').length,
    ).toBeGreaterThan(0);
    expect(
      buildSearchSuggestions(products, 'zzqxvnotashoe', 'en'),
    ).toHaveLength(0);
  });

  it('serializes, restores, and sanitizes shareable catalogue state', () => {
    const url = writeCatalogueUrlState(
      new URL('https://example.com/de/catalogue/'),
      {
        categoryId: 'trail',
        page: 2,
        query: 'grip',
      },
    );
    expect(url.pathname).toBe('/de/catalogue/');
    expect(url.searchParams.has('lang')).toBe(false);
    expect(url.searchParams.get('q')).toBe('grip');
    expect(url.searchParams.get('category')).toBe('trail');
    expect(url.searchParams.get('page')).toBe('2');
    expect(
      parseCatalogueUrlState(url.searchParams, new Set(['trail'])),
    ).toEqual({
      categoryId: 'trail',
      page: 2,
      query: 'grip',
    });
    expect(
      parseCatalogueUrlState(
        new URLSearchParams('category=unknown&page=-2'),
        new Set(['trail']),
      ),
    ).toEqual({
      categoryId: 'all',
      page: 1,
      query: '',
    });
    expect(externalSearchUrl('unknown shoe', 'fr')).toContain(
      'decathlon.fr/search',
    );
  });

  it('filters categories and clamps invalid pages after filtering', () => {
    const trail = filterProducts(products, '', 'trail', 'en');
    expect(trail.length).toBeGreaterThan(0);
    expect(
      trail.every(({ product }) =>
        product.categories.some(({ id }) => id === 'trail'),
      ),
    ).toBe(true);
    expect(paginateProducts(trail, 99).page).toBe(Math.ceil(trail.length / 12));
  });

  it('filters independently by broad surface and specific terrain', () => {
    const offRoad = filterProducts(products, '', 'surface:off-road', 'en');
    const gravel = filterProducts(products, '', 'terrain:gravel', 'en');

    expect(offRoad.length).toBeGreaterThan(gravel.length);
    expect(
      offRoad.every(({ product }) =>
        product.specifications.surfaceFamilies.value?.includes('off-road'),
      ),
    ).toBe(true);
    expect(
      gravel.every(({ product }) =>
        product.specifications.terrainProfiles.value?.includes('gravel'),
      ),
    ).toBe(true);
  });

  it('returns replacing 12-item pages instead of cumulative results', () => {
    const values = Array.from({ length: 25 }, (_, index) => index + 1);
    expect(paginateProducts(values, 1).items).toEqual(values.slice(0, 12));
    expect(paginateProducts(values, 2).items).toEqual(values.slice(12, 24));
    expect(paginateProducts(values, 3).items).toEqual([25]);
  });
});

describe('comparison', () => {
  it('highlights weight only when reference sizes match', () => {
    const adistar = byId.get('adidas-adistar-5');
    const terrex = byId.get('adidas-terrex-agravic-4');
    const jogflow = byId.get('decathlon-jogflow-100-1');
    expect(adistar && terrex && jogflow).toBeTruthy();

    const comparableWeight = compareProducts(adistar!, terrex!, 'en').find(
      ({ key }) => key === 'weight',
    );
    const mismatchedWeight = compareProducts(adistar!, jogflow!, 'en').find(
      ({ key }) => key === 'weight',
    );

    expect(comparableWeight?.difference).toBe(true);
    expect(mismatchedWeight?.difference).toBeNull();
  });

  it('never introduces price into the comparison model', () => {
    const left = products[0];
    const right = products[1];
    expect(left && right).toBeTruthy();
    expect(
      JSON.stringify(compareProducts(left!, right!, 'en')).toLocaleLowerCase(
        'en',
      ),
    ).not.toContain('price');
  });

  it('creates a useful localized summary beyond weight', () => {
    const left = byId.get('adidas-adistar-5');
    const right = byId.get('adidas-terrex-agravic-4');
    expect(left && right).toBeTruthy();
    expect(comparisonSummary(left!, right!, 'en')).toContain('Adistar 5');
    expect(comparisonSummary(left!, right!, 'en')).toContain(
      'Terrex Agravic 4',
    );
    expect(comparisonSummary(left!, right!, 'de')).toContain('Sprengung');
  });

  it('ranks intended-use comparables across brands', () => {
    const current = byId.get('asics-gel-sonoma-8-gtx');
    expect(current).toBeTruthy();
    const ranked = rankComparableProducts(current!, products, 'en');
    expect(ranked).toHaveLength(3);
    expect(ranked.some(({ product }) => product.brand.name !== 'Asics')).toBe(
      true,
    );
    expect(ranked[0]?.product.categories.some(({ id }) => id === 'trail')).toBe(
      true,
    );
  });
});
