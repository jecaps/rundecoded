import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImageOff,
  Search,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { compareProducts } from './comparison';
import type { ExplorerProduct } from './slice';
import { filterProducts, paginateProducts } from './state';

interface ProductExplorerProps {
  assetBase: string;
  initialLocale: SupportedLocale;
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
  initialLocale,
  products,
}: ProductExplorerProps) {
  const [locale, setLocale] = useState(initialLocale);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [page, setPage] = useState(1);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);
  const explorerRef = useRef<HTMLElement>(null);
  const detailsOpenerRef = useRef<HTMLElement | null>(null);
  const comparisonOpenerRef = useRef<HTMLButtonElement | null>(null);
  const copy = catalogueCopy[locale];

  useEffect(() => {
    explorerRef.current?.setAttribute('data-hydrated', 'true');
    function onLocaleChange(event: Event) {
      const nextLocale = (event as CustomEvent<{ locale: SupportedLocale }>)
        .detail.locale;
      setLocale(nextLocale);
    }
    window.addEventListener('rundecoded:locale-change', onLocaleChange);
    return () =>
      window.removeEventListener('rundecoded:locale-change', onLocaleChange);
  }, []);

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
  const detailsProduct = detailsId
    ? (productsById.get(detailsId) ?? null)
    : null;
  const comparisonProducts = selectedIds
    .map((id) => productsById.get(id))
    .filter((item): item is ExplorerProduct => Boolean(item));

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    setPage(1);
  }

  function updateCategory(nextCategory: string) {
    setCategoryId(nextCategory);
    setPage(1);
  }

  function clearFilters() {
    setQuery('');
    setCategoryId('all');
    setPage(1);
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
      ref={explorerRef}
      className="tablet:py-14 py-10"
      aria-labelledby="catalogue-title"
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
        <label className="grid gap-2" htmlFor="catalogue-search">
          <span className="text-sm font-semibold">{copy.searchLabel}</span>
          <span className="border-border bg-background focus-within:border-primary focus-within:ring-ring/20 flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] border px-4 focus-within:ring-3">
            <Search
              aria-hidden="true"
              className="text-muted-foreground size-5 shrink-0"
            />
            <input
              className="placeholder:text-muted-foreground min-w-0 flex-1 border-0 bg-transparent outline-none"
              id="catalogue-search"
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
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
          </span>
        </label>

        <fieldset className="mt-5 border-0 p-0">
          <legend className="mb-2 text-sm font-semibold">{copy.filters}</legend>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[['all', copy.allCategories] as const, ...categoryOptions].map(
              ([id, label]) => (
                <button
                  aria-pressed={categoryId === id}
                  className={cn(
                    'border-border min-h-9 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors',
                    categoryId === id
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
                  )}
                  key={id}
                  onClick={() => updateCategory(id)}
                  type="button"
                >
                  {label}
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
            <Button className="mt-4" onClick={clearFilters} variant="outline">
              {copy.clearFilters}
            </Button>
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
                      {detailsProduct.product.comparables.map((id) => {
                        const comparable = productsById.get(id);
                        if (!comparable) return null;
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
              <div className="grid grid-cols-[minmax(7rem,0.65fr)_repeat(2,minmax(0,1fr))] gap-px overflow-hidden rounded-[var(--radius-control)] border">
                <div className="bg-surface-subtle p-3 text-sm font-semibold">
                  {copy.characteristic}
                </div>
                {comparisonProducts.map((item) => (
                  <div className="bg-surface-subtle p-3" key={item.product.id}>
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
