import type { SupportedLocale } from '@/domain/catalogue';

import { searchProducts } from './search';
import type { ExplorerProduct } from './slice';

export { normalizeSearch } from './search';

export const PAGE_SIZE = 12;

export function filterProducts(
  products: ExplorerProduct[],
  query: string,
  categoryId: string,
  locale: SupportedLocale,
): ExplorerProduct[] {
  return searchProducts(products, query, locale).filter(({ product }) => {
    if (
      categoryId !== 'all' &&
      !product.categories.some(({ id }) => id === categoryId)
    ) {
      return false;
    }
    return true;
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
