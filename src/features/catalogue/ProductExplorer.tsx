import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ImageOff,
  Search,
  X,
} from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { resolveLocalizedText, type SupportedLocale } from '@/domain/catalogue';
import { cn } from '@/lib/utils';

import { catalogueCopy, categoryLabel, stabilityLabel } from './copy';
import { rankComparableProducts } from './comparables';
import { compareProducts, comparisonSummary } from './comparison';
import {
  buildSearchSuggestions,
  externalSearchUrl,
  searchProducts,
  searchSuggestionKindLabel,
} from './search';
import type { ExplorerProduct } from './slice';
import { filterProducts, paginateProducts } from './state';
import {
  parseCatalogueUrlState,
  writeCatalogueUrlState,
  type CatalogueUrlState,
} from './url-state';

interface ProductExplorerProps {
  assetBase: string;
  initialCategoryId?: string;
  initialLocale: SupportedLocale;
  initialPage?: number;
  initialQuery?: string;
  products: ExplorerProduct[];
}

function imagePath(item: ExplorerProduct, assetBase: string): string | null {
  const image = item.product.images[0];
  if (!image || image.status === 'pending' || !image.localPath) return null;
  return `${assetBase}${image.localPath}`;
}

function localizedCategory(
  item: ExplorerProduct,
  locale: SupportedLocale,
  index = 0,
) {
  const category = item.product.categories[index];
  if (!category) return null;
  return categoryLabel(
    category.id,
    resolveLocalizedText(category.label, locale).value,
    locale,
  );
}

function dropLabel(item: ExplorerProduct, pending: string) {
  const drop = item.product.specifications.heelToToeDrop.value;
  return drop ? `${drop.amount} ${drop.unit}` : pending;
}

function ProductPicture({
  assetBase,
  className,
  item,
  locale,
}: {
  assetBase: string;
  className?: string;
  item: ExplorerProduct;
  locale: SupportedLocale;
}) {
  const copy = catalogueCopy[locale];
  const src = imagePath(item, assetBase);
  if (!src) {
    return (
      <span
        className={cn(
          'bg-surface-subtle text-muted-foreground flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-sm',
          className,
        )}
      >
        <ImageOff aria-hidden="true" className="size-9" />
        {copy.imagePending}
      </span>
    );
  }

  return (
    <img
      alt={copy.productImage(item.product.model)}
      className={cn('h-full w-full object-contain', className)}
      loading="lazy"
      src={src}
    />
  );
}

export function ProductExplorer({
  assetBase,
  initialCategoryId = 'all',
  initialLocale,
  initialPage = 1,
  initialQuery = '',
  products,
}: ProductExplorerProps) {
  const validCategoryIds = useMemo(
    () =>
      new Set(
        products.flatMap(({ product }) =>
          product.categories.map(({ id }) => id),
        ),
      ),
    [products],
  );
  const initialBrowserState = () =>
    typeof window === 'undefined'
      ? null
      : parseCatalogueUrlState(
          new URL(window.location.href).searchParams,
          validCategoryIds,
        );
  const [locale, setLocale] = useState(initialLocale);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState(
    () => initialBrowserState()?.query ?? initialQuery,
  );
  const [categoryId, setCategoryId] = useState(
    () => initialBrowserState()?.categoryId ?? initialCategoryId,
  );
  const [page, setPage] = useState(
    () => initialBrowserState()?.page ?? initialPage,
  );
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const detailsOpenerRef = useRef<HTMLElement | null>(null);
  const comparisonOpenerRef = useRef<HTMLButtonElement | null>(null);
  const copy = catalogueCopy[locale];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLocale(initialLocale);
      setHydrated(true);
    });

    function onLocaleChange(event: Event) {
      const nextLocale = (event as CustomEvent<{ locale?: unknown }>).detail
        ?.locale;
      if (nextLocale === 'de' || nextLocale === 'en' || nextLocale === 'fr') {
        setLocale(nextLocale);
      }
    }

    window.addEventListener('rundecoded:locale-change', onLocaleChange);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('rundecoded:locale-change', onLocaleChange);
    };
  }, [initialLocale]);

  useEffect(() => {
    function onPopState() {
      const restored = parseCatalogueUrlState(
        new URL(window.location.href).searchParams,
        validCategoryIds,
      );
      setQuery(restored.query);
      setCategoryId(restored.categoryId);
      setPage(restored.page);
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [validCategoryIds]);

  const productsById = useMemo(
    () => new Map(products.map((item) => [item.product.id, item])),
    [products],
  );
  const categoryOptions = useMemo(() => {
    const categories = new Map<string, string>();
    for (const item of products) {
      const category = item.product.categories[0];
      if (category)
        categories.set(
          category.id,
          localizedCategory(item, locale) ?? category.label.en,
        );
    }
    return [...categories.entries()].sort((left, right) =>
      left[1].localeCompare(right[1], locale),
    );
  }, [locale, products]);
  const filtered = useMemo(
    () => filterProducts(products, query, categoryId, locale),
    [categoryId, locale, products, query],
  );
  const pagination = paginateProducts(filtered, page);
  const queryMatches = useMemo(
    () => searchProducts(products, query, locale),
    [locale, products, query],
  );
  const suggestions = useMemo(
    () => buildSearchSuggestions(products, query, locale),
    [locale, products, query],
  );
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { product } of queryMatches) {
      for (const { id } of product.categories) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  }, [queryMatches]);
  const detailsProduct = detailsId
    ? (productsById.get(detailsId) ?? null)
    : null;
  const comparisonProducts = selectedIds
    .map((id) => productsById.get(id))
    .filter((item): item is ExplorerProduct => Boolean(item));

  const comparableProducts = detailsProduct
    ? rankComparableProducts(detailsProduct, products, locale)
    : [];

  function updateUrlState(state: CatalogueUrlState, mode: 'push' | 'replace') {
    const nextUrl = writeCatalogueUrlState(
      new URL(window.location.href),
      state,
    );
    window.history[mode === 'push' ? 'pushState' : 'replaceState'](
      {},
      '',
      nextUrl,
    );
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    setPage(1);
    setSuggestionsOpen(nextQuery.trim().length >= 2);
    setActiveSuggestion(-1);
    updateUrlState({ categoryId, page: 1, query: nextQuery }, 'replace');
  }

  function updateCategory(nextCategory: string) {
    setCategoryId(nextCategory);
    setPage(1);
    setSuggestionsOpen(false);
    updateUrlState({ categoryId: nextCategory, page: 1, query }, 'push');
  }

  function clearFilters() {
    setQuery('');
    setCategoryId('all');
    setPage(1);
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    updateUrlState({ categoryId: 'all', page: 1, query: '' }, 'push');
  }

  function chooseSuggestion(value: string) {
    setQuery(value);
    setPage(1);
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    updateUrlState({ categoryId, page: 1, query: value }, 'push');
    searchInputRef.current?.focus();
  }

  function openDetails(id: string, opener: HTMLElement) {
    detailsOpenerRef.current = opener;
    setDetailsId(id);
  }

  function toggleComparison(id: string) {
    setSelectionNotice('');
    setSelectedIds((current) => {
      if (current.includes(id))
        return current.filter((selectedId) => selectedId !== id);
      if (current.length >= 2) {
        setSelectionNotice(copy.selectionLimit);
        return current;
      }
      return [...current, id];
    });
  }

  function compareFromDetails(comparableId: string) {
    if (!detailsProduct) return;
    detailsOpenerRef.current = null;
    setSelectedIds([detailsProduct.product.id, comparableId]);
    setDetailsId(null);
    setComparisonOpen(true);
  }

  function changePage(nextPage: number) {
    setPage(nextPage);
    updateUrlState({ categoryId, page: nextPage, query }, 'push');
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const comparisonRows =
    comparisonProducts.length === 2
      ? compareProducts(comparisonProducts[0], comparisonProducts[1], locale)
      : [];
  const weightMismatch =
    comparisonProducts.length === 2 &&
    comparisonProducts[0].weight !== null &&
    comparisonProducts[1].weight !== null &&
    comparisonProducts[0].weight.referenceSize !==
      comparisonProducts[1].weight.referenceSize;
  const comparisonLabels = {
    category: copy.category,
    drop: copy.drop,
    stability: copy.stability,
    surface: copy.surface,
    weight: copy.weight,
  };

  return (
    <section
      className="tablet:py-14 py-10"
      aria-labelledby="catalogue-title"
      data-hydrated={hydrated ? 'true' : undefined}
      data-testid="product-explorer"
    >
      <header className="max-w-3xl">
        <p className="text-primary m-0 text-xs font-bold tracking-[0.16em] uppercase">
          Product explorer
        </p>
        <h1
          className="tablet:text-5xl mt-2 mb-0 text-3xl font-bold tracking-[-0.035em]"
          id="catalogue-title"
        >
          {copy.title}
        </h1>
        <p className="text-muted-foreground tablet:text-lg mt-3 text-base leading-7">
          {copy.intro}
        </p>
      </header>

      <div className="border-border bg-surface tablet:p-6 mt-8 rounded-[var(--radius-panel)] border p-4 shadow-[var(--shadow-sm)]">
        <div className="relative grid gap-2">
          <label className="text-sm font-semibold" htmlFor="catalogue-search">
            {copy.searchLabel}
          </label>
          <div className="border-border bg-background focus-within:border-primary focus-within:ring-ring/20 flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] border px-4 focus-within:ring-3">
            <Search
              aria-hidden="true"
              className="text-muted-foreground size-5 shrink-0"
            />
            <input
              ref={searchInputRef}
              aria-activedescendant={
                activeSuggestion >= 0
                  ? `catalogue-suggestion-${activeSuggestion}`
                  : undefined
              }
              aria-autocomplete="list"
              aria-controls="catalogue-suggestions"
              aria-expanded={suggestionsOpen && suggestions.length > 0}
              className="placeholder:text-muted-foreground min-w-0 flex-1 border-0 bg-transparent outline-none"
              id="catalogue-search"
              onChange={(event) => updateQuery(event.target.value)}
              onBlur={() => {
                setSuggestionsOpen(false);
                setActiveSuggestion(-1);
              }}
              onFocus={() => setSuggestionsOpen(query.trim().length >= 2)}
              onKeyDown={(event) => {
                if (!suggestions.length) return;
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setSuggestionsOpen(true);
                  setActiveSuggestion((current) =>
                    Math.min(current + 1, suggestions.length - 1),
                  );
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveSuggestion((current) => Math.max(current - 1, 0));
                } else if (event.key === 'Enter' && activeSuggestion >= 0) {
                  event.preventDefault();
                  const suggestion = suggestions[activeSuggestion];
                  if (suggestion) chooseSuggestion(suggestion.value);
                } else if (event.key === 'Escape') {
                  setSuggestionsOpen(false);
                  setActiveSuggestion(-1);
                }
              }}
              placeholder={copy.searchPlaceholder}
              role="combobox"
              type="search"
              value={query}
            />
            {query ? (
              <button
                aria-label={copy.clearFilters}
                className="text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-1"
                onClick={() => updateQuery('')}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
          {suggestionsOpen && suggestions.length ? (
            <ul
              aria-label={copy.suggestions}
              className="border-border bg-surface absolute top-full right-0 left-0 z-40 mt-2 max-h-80 list-none overflow-y-auto rounded-[var(--radius-control)] border p-1 shadow-xl"
              id="catalogue-suggestions"
              role="listbox"
            >
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id} role="presentation">
                  <button
                    aria-selected={activeSuggestion === index}
                    className={cn(
                      'hover:bg-surface-subtle focus-visible:bg-surface-subtle flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 rounded-[calc(var(--radius-control)-0.2rem)] border-0 bg-transparent px-3 py-2 text-left outline-none',
                      activeSuggestion === index && 'bg-surface-subtle',
                    )}
                    id={`catalogue-suggestion-${index}`}
                    onClick={() => chooseSuggestion(suggestion.value)}
                    onMouseDown={(event) => event.preventDefault()}
                    role="option"
                    type="button"
                  >
                    <span className="font-medium">{suggestion.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {searchSuggestionKindLabel(suggestion.kind, locale)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <fieldset className="mt-5 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">{copy.filters}</legend>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[['all', copy.allCategories] as const, ...categoryOptions].map(
              ([id, label]) => (
                <button
                  aria-pressed={categoryId === id}
                  className={cn(
                    'border-border min-h-11 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors',
                    categoryId === id
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
                  )}
                  key={id}
                  onClick={() => updateCategory(id)}
                  type="button"
                >
                  {label}{' '}
                  <span aria-hidden="true">
                    {id === 'all'
                      ? queryMatches.length
                      : (categoryCounts.get(id) ?? 0)}
                  </span>
                </button>
              ),
            )}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-muted-foreground m-0 text-sm">
            {copy.results(filtered.length, products.length)}
          </p>
          {query || categoryId !== 'all' ? (
            <Button onClick={clearFilters} size="sm" variant="ghost">
              {copy.clearFilters}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="scroll-mt-6" ref={resultsRef}>
        {pagination.items.length ? (
          <div className="tablet:grid-cols-2 desktop:grid-cols-3 mt-6 grid grid-cols-1 gap-5">
            {pagination.items.map((item) => {
              const { product } = item;
              const selected = selectedIds.includes(product.id);
              const bestFor = resolveLocalizedText(
                product.copy.bestFor,
                locale,
              ).value;

              return (
                <article
                  className="border-border bg-surface flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border shadow-[var(--shadow-sm)]"
                  data-testid="product-card"
                  key={product.id}
                >
                  <button
                    aria-label={copy.openDetails(product.model)}
                    className="bg-surface-subtle block h-56 w-full cursor-pointer border-0 p-3"
                    onClick={(event) =>
                      openDetails(product.id, event.currentTarget)
                    }
                    type="button"
                  >
                    <ProductPicture
                      assetBase={assetBase}
                      item={item}
                      locale={locale}
                    />
                  </button>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-muted-foreground m-0 text-xs font-bold tracking-[0.15em] uppercase">
                      {product.brand.name}
                    </p>
                    <button
                      className="text-foreground hover:text-primary mt-1 cursor-pointer border-0 bg-transparent p-0 text-left text-2xl font-bold tracking-[-0.025em]"
                      onClick={(event) =>
                        openDetails(product.id, event.currentTarget)
                      }
                      type="button"
                    >
                      {product.model}
                    </button>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {product.categories.slice(0, 2).map((category, index) => (
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
                            index === 0
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-surface-subtle text-muted-foreground',
                          )}
                          key={category.id}
                        >
                          {localizedCategory(item, locale, index)}
                        </span>
                      ))}
                    </div>

                    <div className="bg-surface-subtle mt-4 rounded-[var(--radius-control)] p-4">
                      <p className="text-muted-foreground m-0 text-[0.7rem] font-bold tracking-[0.13em] uppercase">
                        {copy.bestFor}
                      </p>
                      <p className="mt-1 mb-0 text-sm leading-6">{bestFor}</p>
                    </div>

                    <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <dt className="text-muted-foreground text-[0.68rem] font-bold tracking-wide uppercase">
                          {copy.surface}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold">
                          {product.specifications.surfaces.value?.join(', ') ??
                            copy.pending}
                        </dd>
                      </div>
                      <div className="border-border border-x px-2">
                        <dt className="text-muted-foreground text-[0.68rem] font-bold tracking-wide uppercase">
                          {copy.stability}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold">
                          {stabilityLabel(
                            product.specifications.stability.value ?? 'unknown',
                            locale,
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-[0.68rem] font-bold tracking-wide uppercase">
                          {copy.drop}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold">
                          {dropLabel(item, copy.pending)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                      <Button
                        aria-pressed={selected}
                        onClick={() => toggleComparison(product.id)}
                        variant={selected ? 'primary' : 'secondary'}
                      >
                        {selected ? (
                          <Check aria-hidden="true" className="size-4" />
                        ) : null}
                        {selected ? copy.remove : copy.compare}
                      </Button>
                      <Button
                        onClick={(event) =>
                          openDetails(product.id, event.currentTarget)
                        }
                        variant="outline"
                      >
                        {copy.details}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border-border bg-surface mt-6 rounded-[var(--radius-panel)] border p-10 text-center">
            <p className="m-0 text-lg font-semibold">{copy.noResults}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button onClick={clearFilters} variant="outline">
                {copy.clearFilters}
              </Button>
              {query.trim().length >= 2 ? (
                <a
                  className={buttonVariants({ variant: 'secondary' })}
                  href={externalSearchUrl(query, locale)}
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.searchDecathlon(query)}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {pagination.pageCount > 1 ? (
        <nav
          className="mt-8 flex items-center justify-center gap-4"
          aria-label="Pagination"
        >
          <Button
            disabled={pagination.page === 1}
            onClick={() => changePage(pagination.page - 1)}
            variant="outline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {copy.previous}
          </Button>
          <span className="text-muted-foreground text-sm">
            {copy.page(pagination.page, pagination.pageCount)}
          </span>
          <Button
            disabled={pagination.page === pagination.pageCount}
            onClick={() => changePage(pagination.page + 1)}
            variant="outline"
          >
            {copy.next}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </nav>
      ) : null}

      {selectedIds.length ? (
        <div className="border-border bg-surface sticky bottom-3 z-30 mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border p-3 shadow-xl">
          <div>
            <p className="m-0 text-sm font-semibold">{copy.comparisonReady}</p>
            {selectionNotice ? (
              <p
                aria-live="polite"
                className="text-muted-foreground mt-1 mb-0 text-xs"
              >
                {selectionNotice}
              </p>
            ) : null}
          </div>
          <Button
            disabled={selectedIds.length !== 2}
            onClick={(event) => {
              comparisonOpenerRef.current = event.currentTarget;
              setComparisonOpen(true);
            }}
          >
            {copy.compareSelected(selectedIds.length)}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={detailsProduct !== null}
        onOpenChange={(open) => !open && setDetailsId(null)}
      >
        {detailsProduct ? (
          <DialogContent
            className="max-h-[calc(100vh-2rem)] w-[min(calc(100%-2rem),64rem)] overflow-y-auto p-0"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              detailsOpenerRef.current?.focus();
            }}
          >
            <div className="desktop:grid-cols-[0.85fr_1.15fr] grid">
              <div className="bg-surface-subtle min-h-64 p-6">
                <ProductPicture
                  assetBase={assetBase}
                  className="max-h-80"
                  item={detailsProduct}
                  locale={locale}
                />
              </div>
              <div className="tablet:p-8 p-6">
                <DialogHeader>
                  <p className="text-muted-foreground m-0 text-xs font-bold tracking-[0.15em] uppercase">
                    {detailsProduct.product.brand.name}
                  </p>
                  <DialogTitle className="text-3xl">
                    {detailsProduct.product.model}
                  </DialogTitle>
                  <DialogDescription>
                    {
                      resolveLocalizedText(
                        detailsProduct.product.copy.bestFor,
                        locale,
                      ).value
                    }
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-7 grid gap-7">
                  <section>
                    <h3 className="m-0 text-base font-semibold">{copy.ride}</h3>
                    <p className="text-muted-foreground mt-2 mb-0 leading-7">
                      {
                        resolveLocalizedText(
                          detailsProduct.product.copy.bestFor,
                          locale,
                        ).value
                      }
                    </p>
                  </section>

                  <section>
                    <h3 className="m-0 text-base font-semibold">
                      {copy.technologies}
                    </h3>
                    {detailsProduct.product.technologies.value ? (
                      <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                        {detailsProduct.product.technologies.value.map(
                          (technology) => (
                            <li
                              className="bg-surface-subtle rounded-full px-3 py-1.5 text-sm"
                              key={technology}
                            >
                              {technology}
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground mt-2">
                        {copy.pending}
                      </p>
                    )}
                  </section>

                  <section>
                    <h3 className="m-0 text-base font-semibold">
                      {copy.weight}
                    </h3>
                    {detailsProduct.weight ? (
                      <p className="text-muted-foreground mt-2 mb-0">
                        {detailsProduct.weight.amount}{' '}
                        {detailsProduct.weight.unit} ·{' '}
                        {detailsProduct.weight.referenceSize} ·{' '}
                        {detailsProduct.weight.status}
                      </p>
                    ) : (
                      <p className="text-muted-foreground mt-2 mb-0">
                        {copy.pending}
                      </p>
                    )}
                  </section>

                  <section>
                    <h3 className="m-0 text-base font-semibold">
                      {copy.comparableProducts}
                    </h3>
                    <div className="mt-3 grid gap-2">
                      {comparableProducts.map((comparable) => {
                        const id = comparable.product.id;
                        return (
                          <button
                            className="border-border hover:bg-surface-subtle flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-control)] border bg-transparent px-4 py-3 text-left"
                            key={id}
                            onClick={() => compareFromDetails(id)}
                            type="button"
                          >
                            <span>
                              <span className="block text-xs font-bold tracking-wide uppercase">
                                {comparable.product.brand.name}
                              </span>
                              <span className="text-muted-foreground mt-1 block text-sm">
                                {comparable.product.model}
                              </span>
                            </span>
                            <span className="text-primary text-sm font-semibold">
                              {copy.compareWith(comparable.product.model)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <h3 className="m-0 text-base font-semibold">
                      {copy.sources}
                    </h3>
                    <ul className="mt-2 grid gap-2 pl-5 text-sm">
                      {detailsProduct.product.sources
                        .filter(
                          (source) =>
                            source.url && source.type !== 'retailer-image',
                        )
                        .map((source) => (
                          <li key={source.id}>
                            <a
                              className="text-primary hover:underline"
                              href={source.url ?? undefined}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {source.label}
                            </a>{' '}
                            <span className="text-muted-foreground">
                              ({source.status})
                            </span>
                          </li>
                        ))}
                      {detailsProduct.weight ? (
                        <li>
                          <a
                            className="text-primary hover:underline"
                            href={detailsProduct.weight.sourceUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {copy.weight}
                          </a>{' '}
                          <span className="text-muted-foreground">
                            ({detailsProduct.weight.status})
                          </span>
                        </li>
                      ) : null}
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={comparisonOpen} onOpenChange={setComparisonOpen}>
        <DialogContent
          className="max-h-[calc(100vh-2rem)] w-[min(calc(100%-2rem),58rem)] overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            comparisonOpenerRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{copy.comparisonTitle}</DialogTitle>
            <DialogDescription>{copy.comparisonDescription}</DialogDescription>
          </DialogHeader>

          {comparisonProducts.length === 2 ? (
            <div className="mt-3">
              <section className="bg-callout border-callout-border mb-4 border-l-4 p-4">
                <h3 className="m-0 text-sm font-semibold">
                  {copy.differenceSummary}
                </h3>
                <p className="text-muted-foreground mt-2 mb-0 text-sm leading-6">
                  {comparisonSummary(
                    comparisonProducts[0],
                    comparisonProducts[1],
                    locale,
                  )}
                </p>
              </section>
              <div className="overflow-x-auto rounded-[var(--radius-control)] border">
                <div className="grid min-w-[34rem] grid-cols-[minmax(7rem,0.65fr)_repeat(2,minmax(0,1fr))] gap-px overflow-hidden">
                  <div className="bg-surface-subtle p-3 text-sm font-semibold">
                    {copy.characteristic}
                  </div>
                  {comparisonProducts.map((item) => (
                    <div
                      className="bg-surface-subtle p-3"
                      key={item.product.id}
                    >
                      <span className="block text-xs font-bold tracking-wide uppercase">
                        {item.product.brand.name}
                      </span>
                      <span className="mt-1 block font-semibold">
                        {item.product.model}
                      </span>
                    </div>
                  ))}
                  {comparisonRows.map((row) => (
                    <div className="contents" key={row.key}>
                      <div
                        className="border-border border-t p-3 text-sm font-semibold"
                        data-comparison-row={row.key}
                        data-difference={
                          row.difference === null
                            ? 'not-compared'
                            : row.difference
                              ? 'true'
                              : 'false'
                        }
                      >
                        {comparisonLabels[row.key]}
                        <span className="text-muted-foreground mt-1 block text-xs font-normal">
                          {row.difference === null
                            ? copy.notCompared
                            : row.difference
                              ? copy.different
                              : copy.same}
                        </span>
                      </div>
                      <div
                        className={cn(
                          'border-border border-t p-3 text-sm',
                          row.difference ? 'bg-callout' : 'bg-surface',
                        )}
                        data-difference={
                          row.difference === true ? 'true' : undefined
                        }
                      >
                        {row.left}
                      </div>
                      <div
                        className={cn(
                          'border-border border-t p-3 text-sm',
                          row.difference ? 'bg-callout' : 'bg-surface',
                        )}
                        data-difference={
                          row.difference === true ? 'true' : undefined
                        }
                      >
                        {row.right}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {weightMismatch ? (
                <p className="border-callout-border bg-callout text-muted-foreground mt-4 border-l-4 p-3 text-sm">
                  {copy.weightReferenceMismatch}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
