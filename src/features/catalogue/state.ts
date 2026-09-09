import {
  surfaceFamilies,
  terrainProfiles,
  type SupportedLocale,
  type SurfaceFamily,
  type TerrainProfile,
} from '@/domain/catalogue';

import { searchProducts } from './search';
import type { ExplorerProduct } from './catalogue';

export { normalizeSearch } from './search';

export const PAGE_SIZE = 12;
export const SURFACE_FILTER_PREFIX = 'surface:';
export const TERRAIN_FILTER_PREFIX = 'terrain:';

export function surfaceFilterId(value: SurfaceFamily): string {
  return `${SURFACE_FILTER_PREFIX}${value}`;
}

export function terrainFilterId(value: TerrainProfile): string {
  return `${TERRAIN_FILTER_PREFIX}${value}`;
}

export const taxonomyFilterIds = [
  ...surfaceFamilies.map(surfaceFilterId),
  ...terrainProfiles.map(terrainFilterId),
] as const;

export function filterProducts(
  products: ExplorerProduct[],
  query: string,
  categoryId: string,
  locale: SupportedLocale,
): ExplorerProduct[] {
  return searchProducts(products, query, locale).filter(({ product }) => {
    if (categoryId.startsWith(SURFACE_FILTER_PREFIX)) {
      const family = categoryId.slice(SURFACE_FILTER_PREFIX.length);
      return product.specifications.surfaceFamilies.value?.includes(
        family as SurfaceFamily,
      );
    }
    if (categoryId.startsWith(TERRAIN_FILTER_PREFIX)) {
      const terrain = categoryId.slice(TERRAIN_FILTER_PREFIX.length);
      return product.specifications.terrainProfiles.value?.includes(
        terrain as TerrainProfile,
      );
    }
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
