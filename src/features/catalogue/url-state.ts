export interface CatalogueUrlState {
  categoryId: string;
  page: number;
  query: string;
  stability: 'all' | 'neutral' | 'stability';
  surface: string;
}

export const defaultCatalogueUrlState: CatalogueUrlState = {
  categoryId: 'all',
  page: 1,
  query: '',
  stability: 'all',
  surface: '',
};

export function parseCatalogueUrlState(
  searchParams: URLSearchParams,
  validCategoryIds?: ReadonlySet<string>,
  validSurfaces?: ReadonlySet<string>,
): CatalogueUrlState {
  const query = searchParams.get('q')?.trim() ?? '';
  const requestedCategory = searchParams.get('category')?.trim() ?? 'all';
  const categoryId =
    requestedCategory === 'all' ||
    !validCategoryIds ||
    validCategoryIds.has(requestedCategory)
      ? requestedCategory
      : 'all';
  const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedSurface = searchParams.get('surface')?.trim() ?? '';
  const surface =
    !requestedSurface || !validSurfaces || validSurfaces.has(requestedSurface)
      ? requestedSurface
      : '';
  const requestedStability = searchParams.get('stability');
  const stability =
    requestedStability === 'neutral' || requestedStability === 'stability'
      ? requestedStability
      : 'all';

  return { categoryId, page, query, stability, surface };
}

export function writeCatalogueUrlState(
  url: URL,
  state: CatalogueUrlState,
): URL {
  const next = new URL(url);
  if (state.query) next.searchParams.set('q', state.query);
  else next.searchParams.delete('q');
  if (state.categoryId !== 'all') {
    next.searchParams.set('category', state.categoryId);
  } else {
    next.searchParams.delete('category');
  }
  if (state.page > 1) next.searchParams.set('page', String(state.page));
  else next.searchParams.delete('page');
  if (state.surface) next.searchParams.set('surface', state.surface);
  else next.searchParams.delete('surface');
  if (state.stability !== 'all') {
    next.searchParams.set('stability', state.stability);
  } else {
    next.searchParams.delete('stability');
  }
  return next;
}
