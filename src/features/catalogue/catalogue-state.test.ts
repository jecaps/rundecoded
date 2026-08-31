import { describe, expect, it } from 'vitest';

import { compareProducts } from './comparison';
import { getProductSlice } from './slice';
import { filterProducts, paginateProducts } from './state';

const products = getProductSlice();
const byId = new Map(products.map((item) => [item.product.id, item]));

describe('Phase 4 product slice', () => {
  it('contains exactly 12 validated products with resolvable comparables', () => {
    expect(products).toHaveLength(12);
    for (const { product } of products) {
      expect(product.comparables.length).toBeGreaterThan(0);
      for (const comparable of product.comparables)
        expect(byId.has(comparable)).toBe(true);
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
        ({ product }) => product.specifications.stability.value === 'unknown',
      ),
    ).toBe(true);
  });
});

describe('catalogue state', () => {
  it('searches brand, model, category, benefit, and technology text', () => {
    expect(filterProducts(products, 'kayano', 'all', 'en')).toHaveLength(1);
    expect(
      filterProducts(products, 'waterproof', 'all', 'en').length,
    ).toBeGreaterThan(0);
    expect(
      filterProducts(products, 'stabilität', 'all', 'de').length,
    ).toBeGreaterThan(0);
  });

  it('filters categories and clamps invalid pages after filtering', () => {
    const trail = filterProducts(products, '', 'trail', 'en');
    expect(trail.length).toBeGreaterThan(0);
    expect(
      trail.every(({ product }) =>
        product.categories.some(({ id }) => id === 'trail'),
      ),
    ).toBe(true);
    expect(paginateProducts(trail, 99).page).toBe(1);
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
});
