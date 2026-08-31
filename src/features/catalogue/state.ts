import { resolveLocalizedText, type SupportedLocale } from '@/domain/catalogue';

import { categoryLabel } from './copy';
import type { ExplorerProduct } from './slice';

export const PAGE_SIZE = 12;

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function filterProducts(
  products: ExplorerProduct[],
  query: string,
  categoryId: string,
  locale: SupportedLocale,
): ExplorerProduct[] {
  const normalizedQuery = normalizeSearch(query);

  return products.filter(({ product }) => {
    if (
      categoryId !== 'all' &&
      !product.categories.some(({ id }) => id === categoryId)
    ) {
      return false;
    }
    if (!normalizedQuery) return true;

    const searchable = [
      product.brand.name,
      product.model,
      resolveLocalizedText(product.copy.bestFor, locale).value,
      ...product.categories.map(({ id, label }) =>
        categoryLabel(id, resolveLocalizedText(label, locale).value, locale),
      ),
      ...(product.technologies.value ?? []),
    ];

    return normalizeSearch(searchable.join(' ')).includes(normalizedQuery);
  });
}

export function paginateProducts<T>(
  items: T[],
  requestedPage: number,
  pageSize = PAGE_SIZE,
) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageCount,
    total: items.length,
  };
}
