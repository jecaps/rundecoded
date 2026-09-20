import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ImageOff,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import {
  resolveLocalizedText,
  surfaceFamilies,
  surfaceFamiliesForShoe,
  terrainProfiles,
  terrainProfilesForShoe,
  type SupportedLocale,
} from '@/domain/catalogue';
import { cn } from '@/lib/utils';
import { localizedRoute } from '@/lib/routes';
import { toast } from 'sonner';

import {
  catalogueCopy,
  categoryLabel,
  stabilityLabel,
  surfaceFamilyLabel,
  terrainProfileLabel,
} from './copy';
import { rankComparableProducts } from './comparables';
import { compareProducts, comparisonSummary } from './comparison';
import {
  buildSearchSuggestions,
  externalSearchUrl,
  searchSuggestionKindLabel,
} from './search';
import type { ExplorerProduct } from './catalogue';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import {
  filterProducts,
  paginateProducts,
  surfaceFilterId,
  taxonomyFilterIds,
  terrainFilterId,
} from './state';
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

// Run the viewport check before the browser paints when possible. This avoids
// briefly rendering the desktop card layout during back/forward navigation on
// a phone, while still remaining safe for server rendering.
const useViewportLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

function isCompactMobileViewport() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(max-width: 599px)').matches ??
    window.innerWidth <= 599
  );
}

function imagePath(item: ExplorerProduct, assetBase: string): string | null {
  const image = item.product.images[0];
  return image ? `${assetBase}${image}` : null;
}

const specificationCategoryIds = new Set([
  'carbon',
  'neutral',
  'stability-and-guidance',
  'support',
]);

const retiredFilterParams = [
  'brand',
  'distance',
  'drop',
  'stability',
  'surface',
] as const;

function purposeCategory(item: ExplorerProduct) {
  return (
    item.product.categories.find((id) => !specificationCategoryIds.has(id)) ??
    item.product.categories[0]
  );
}

interface BadgeTone {
  primary: string;
  secondary: string;
}

// One hue per purpose category. The primary badge is a soft filled tint; the
// secondary (terrain/stability) badge is an outline in the same hue, so a row
// reads as one colour family with a filled/outlined hierarchy and no
// saturated blocks. Primary hues run cool -> warm as effort rises; trail
// purposes are green; spikes are charcoal.
const badgeTones: Record<string, BadgeTone> = {
  'daily-trainer': {
    primary: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
    secondary:
      'text-blue-800 ring-1 ring-blue-100 ring-inset dark:text-blue-300 dark:ring-blue-800',
  },
  'entry-level': {
    primary: 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
    secondary:
      'text-sky-800 ring-1 ring-sky-100 ring-inset dark:text-sky-300 dark:ring-sky-800',
  },
  'fast-training': {
    primary:
      'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    secondary:
      'text-amber-800 ring-1 ring-amber-100 ring-inset dark:text-amber-300 dark:ring-amber-800',
  },
  'max-cushion': {
    primary:
      'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
    secondary:
      'text-violet-800 ring-1 ring-violet-100 ring-inset dark:text-violet-300 dark:ring-violet-800',
  },
  race: {
    primary: 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200',
    secondary:
      'text-red-800 ring-1 ring-red-100 ring-inset dark:text-red-300 dark:ring-red-800',
  },
  spikes: {
    primary: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700/70 dark:text-zinc-100',
    secondary:
      'text-zinc-800 ring-1 ring-zinc-300 ring-inset dark:text-zinc-200 dark:ring-zinc-600',
  },
  'super-trainer': {
    primary:
      'bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200',
    secondary:
      'text-orange-800 ring-1 ring-orange-100 ring-inset dark:text-orange-300 dark:ring-orange-800',
  },
  'track-spikes': {
    primary: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700/70 dark:text-zinc-100',
    secondary:
      'text-zinc-800 ring-1 ring-zinc-300 ring-inset dark:text-zinc-200 dark:ring-zinc-600',
  },
  trail: {
    primary:
      'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    secondary:
      'text-emerald-800 ring-1 ring-emerald-100 ring-inset dark:text-emerald-300 dark:ring-emerald-800',
  },
  'trail-race': {
    primary: 'bg-lime-50 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200',
    secondary:
      'text-lime-800 ring-1 ring-lime-100 ring-inset dark:text-lime-300 dark:ring-lime-800',
  },
};

const fallbackBadgeTone: BadgeTone = {
  primary:
    'bg-slate-50 text-slate-800 dark:bg-slate-950/40 dark:text-slate-200',
  secondary:
    'text-slate-800 ring-1 ring-slate-100 ring-inset dark:text-slate-300 dark:ring-slate-800',
};

function badgeTone(purpose: string | undefined): BadgeTone {
  return (purpose && badgeTones[purpose]) || fallbackBadgeTone;
}

function localizedCategoryValue(
  category: ExplorerProduct['product']['categories'][number],
  locale: SupportedLocale,
) {
  return categoryLabel(category, category, locale);
}

function dropLabel(item: ExplorerProduct) {
  const drop = item.product.specifications.dropMm;
  return drop === null ? '—' : `${drop} mm`;
}

function distanceLabel(item: ExplorerProduct, unavailable: string) {
  const distance = item.product.specifications.maximumDistanceKm;
  return distance === null ? unavailable : `${distance} km`;
}

function bestForSummary(bestFor: string) {
  // The first editorial segment is the audience; keep the card focused on use.
  const segments = bestFor.split('·').map((segment) => segment.trim());
  return (segments.length > 1 ? segments.slice(1) : segments).join(' · ');
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
      new Set([
        ...products.flatMap(({ product }) => product.categories),
        ...taxonomyFilterIds,
      ]),
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
  const [pageDirection, setPageDirection] = useState<
    'backward' | 'forward' | null
  >(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeComparisonIds, setActiveComparisonIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [compactMobile, setCompactMobile] = useState(isCompactMobileViewport);
  const pageRef = useRef(page);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const detailsOpenerRef = useRef<HTMLElement | null>(null);
  const productListRef = useRef<HTMLDivElement>(null);
  const copy = catalogueCopy[locale];

  useViewportLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLocale(initialLocale);
      setHydrated(true);
    });
    const mobileQuery = window.matchMedia?.('(max-width: 599px)');
    const updateMobileLayout = () =>
      setCompactMobile(mobileQuery?.matches ?? window.innerWidth <= 599);
    updateMobileLayout();
    mobileQuery?.addEventListener('change', updateMobileLayout);
    window.addEventListener('pageshow', updateMobileLayout);
    window.addEventListener('resize', updateMobileLayout);
    document.addEventListener('visibilitychange', updateMobileLayout);

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
      mobileQuery?.removeEventListener('change', updateMobileLayout);
      window.removeEventListener('pageshow', updateMobileLayout);
      window.removeEventListener('resize', updateMobileLayout);
      document.removeEventListener('visibilitychange', updateMobileLayout);
      window.removeEventListener('rundecoded:locale-change', onLocaleChange);
    };
  }, [initialLocale]);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const hadRetiredFilters = retiredFilterParams.some((parameter) =>
      currentUrl.searchParams.has(parameter),
    );
    if (!hadRetiredFilters) return;
    for (const parameter of retiredFilterParams) {
      currentUrl.searchParams.delete(parameter);
    }
    window.history.replaceState({}, '', currentUrl);
  }, []);

  useEffect(() => {
    function onPopState() {
      const restored = parseCatalogueUrlState(
        new URL(window.location.href).searchParams,
        validCategoryIds,
      );
      setQuery(restored.query);
      setCategoryId(restored.categoryId);
      setPageDirection(
        restored.page === pageRef.current
          ? null
          : restored.page > pageRef.current
            ? 'forward'
            : 'backward',
      );
      pageRef.current = restored.page;
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
      const category = purposeCategory(item);
      if (category)
        categories.set(category, localizedCategoryValue(category, locale));
    }
    return [...categories.entries()].sort((left, right) =>
      left[1].localeCompare(right[1], locale),
    );
  }, [locale, products]);
  const surfaceOptions = surfaceFamilies
    .filter((family) =>
      products.some(({ product }) =>
        surfaceFamiliesForShoe(product).includes(family),
      ),
    )
    .map(
      (family) =>
        [surfaceFilterId(family), surfaceFamilyLabel(family, locale)] as const,
    );
  const terrainOptions = terrainProfiles
    .filter((terrain) =>
      products.some(({ product }) =>
        terrainProfilesForShoe(product).includes(terrain),
      ),
    )
    .map(
      (terrain) =>
        [
          terrainFilterId(terrain),
          terrainProfileLabel(terrain, locale),
        ] as const,
    );
  const taxonomyOptions = [...surfaceOptions, ...terrainOptions];
  const selectedCategoryLabel =
    categoryId === 'all'
      ? copy.allCategories
      : (categoryOptions.find(([id]) => id === categoryId)?.[1] ??
        taxonomyOptions.find(([id]) => id === categoryId)?.[1] ??
        copy.allCategories);
  const filtered = useMemo(
    () => filterProducts(products, query, categoryId, locale),
    [categoryId, locale, products, query],
  );
  const pagination = paginateProducts(filtered, page);
  const mobileProductGroups = useMemo(() => {
    const groups = new Map<string, ExplorerProduct[]>();
    for (const item of pagination.items) {
      const brandProducts = groups.get(item.product.brand) ?? [];
      brandProducts.push(item);
      groups.set(item.product.brand, brandProducts);
    }
    return [...groups.entries()];
  }, [pagination.items]);
  const suggestions = useMemo(
    () => buildSearchSuggestions(products, query, locale),
    [locale, products, query],
  );
  const detailsProduct = detailsId
    ? (productsById.get(detailsId) ?? null)
    : null;
  const selectedProducts = selectedIds
    .map((id) => productsById.get(id))
    .filter((item): item is ExplorerProduct => Boolean(item));
  const comparisonProducts = activeComparisonIds
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
    pageRef.current = 1;
    setPage(1);
    setPageDirection(null);
    setSuggestionsOpen(nextQuery.trim().length >= 2);
    setActiveSuggestion(-1);
    updateUrlState({ categoryId, page: 1, query: nextQuery }, 'replace');
  }

  function updateCategory(nextCategory: string) {
    setCategoryId(nextCategory);
    pageRef.current = 1;
    setPage(1);
    setPageDirection(null);
    setSuggestionsOpen(false);
    updateUrlState(
      {
        categoryId: nextCategory,
        page: 1,
        query,
      },
      'push',
    );
  }

  function clearFilters() {
    setQuery('');
    setCategoryId('all');
    pageRef.current = 1;
    setPage(1);
    setPageDirection(null);
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    updateUrlState(
      {
        categoryId: 'all',
        page: 1,
        query: '',
      },
      'push',
    );
  }

  function chooseSuggestion(value: string) {
    setQuery(value);
    pageRef.current = 1;
    setPage(1);
    setPageDirection(null);
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
    toast.dismiss('comparison-selection-limit');
    setSelectedIds((current) => {
      if (current.includes(id))
        return current.filter((selectedId) => selectedId !== id);
      if (current.length >= 2) {
        toast.error(copy.selectionLimit, {
          id: 'comparison-selection-limit',
        });
        return current;
      }
      return [...current, id];
    });
  }

  function compareFromDetails(comparableId: string) {
    if (!detailsProduct) return;
    const comparisonIds = [detailsProduct.product.id, comparableId];
    detailsOpenerRef.current = null;
    setSelectedIds(comparisonIds);
    setActiveComparisonIds(comparisonIds);
    setDetailsId(null);
    setComparisonOpen(true);
  }

  function handleComparisonOpenChange(open: boolean) {
    setComparisonOpen(open);
    if (!open) {
      setSelectedIds([]);
      toast.dismiss('comparison-selection-limit');
    }
  }

  function changePage(nextPage: number) {
    setPageDirection(nextPage > pageRef.current ? 'forward' : 'backward');
    pageRef.current = nextPage;
    setPage(nextPage);
    updateUrlState({ categoryId, page: nextPage, query }, 'push');
    if (compactMobile) {
      // Jump straight to the top of the new page; no smooth-scroll animation.
      productListRef.current?.scrollIntoView({
        behavior: 'instant',
        block: 'start',
      });
    }
  }

  const comparisonRows =
    comparisonProducts.length === 2
      ? compareProducts(comparisonProducts[0], comparisonProducts[1], locale)
      : [];
  const weightMismatch =
    comparisonProducts.length === 2 &&
    comparisonProducts[0].weight !== null &&
    comparisonProducts[1].weight !== null &&
    comparisonProducts[0].weight.referenceSize !== null &&
    comparisonProducts[1].weight.referenceSize !== null &&
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
      className="tablet:py-14 py-6 [overflow-anchor:none] min-[600px]:py-10"
      aria-labelledby="catalogue-title"
      data-hydrated={hydrated ? 'true' : undefined}
      data-testid="product-explorer"
    >
      <header className="max-w-3xl">
        <p className="text-primary m-0 hidden text-xs font-bold tracking-[0.16em] uppercase min-[600px]:block">
          Product explorer
        </p>
        <h1
          className="tablet:text-5xl m-0 text-2xl font-bold tracking-[-0.035em] min-[600px]:mt-2 min-[600px]:text-3xl"
          id="catalogue-title"
        >
          {copy.title}
        </h1>
        <p className="text-muted-foreground tablet:text-lg mt-3 hidden text-base leading-7 min-[600px]:block">
          {copy.intro}
        </p>
      </header>

      <div className="border-border bg-surface tablet:grid-cols-[auto_minmax(0,1fr)_auto] mt-8 hidden items-center gap-4 rounded-[var(--radius-panel)] border p-4 shadow-[var(--shadow-sm)] min-[600px]:grid">
        <span className="bg-surface-subtle text-primary flex size-11 items-center justify-center rounded-[var(--radius-control)]">
          <Sparkles aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="m-0 text-base font-semibold">
            {copy.consultationTitle}
          </h2>
          <p className="text-muted-foreground mt-1 mb-0 text-sm leading-5">
            {copy.consultationDescription}
          </p>
        </div>
        <a
          className={buttonVariants({ variant: 'primary' })}
          href={localizedRoute(initialLocale, 'consultation')}
        >
          {copy.consultationAction}
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </div>

      <div className="mt-4 min-[600px]:mt-5">
        <div className="tablet:grid-cols-[minmax(16rem,1fr)_auto] grid gap-2">
          <div className="relative min-w-0">
            <label className="sr-only" htmlFor="catalogue-search">
              {copy.searchLabel}
            </label>
            <div className="border-border bg-background focus-within:border-primary focus-within:ring-ring/20 flex h-11 items-center gap-3 rounded-[var(--radius-control)] border px-4 focus-within:ring-3">
              <Search
                aria-hidden="true"
                className="text-muted-foreground size-4 shrink-0"
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
                className="placeholder:text-muted-foreground min-w-0 flex-1 border-0 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="tablet:w-52 h-11 w-full shrink-0 justify-between"
                variant="outline"
              >
                {selectedCategoryLabel}
                <ChevronDown aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-80 overflow-y-auto"
            >
              <DropdownMenuRadioGroup
                onValueChange={updateCategory}
                value={categoryId}
              >
                <DropdownMenuRadioItem value="all">
                  {copy.allCategories}
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{copy.purposeCategories}</DropdownMenuLabel>
                {categoryOptions.map(([id, label]) => (
                  <DropdownMenuRadioItem key={id} value={id}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{copy.surfaceAndTerrain}</DropdownMenuLabel>
                {surfaceOptions.map(([id, label]) => (
                  <DropdownMenuRadioItem key={id} value={id}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
                {terrainOptions.map(([id, label]) => (
                  <DropdownMenuRadioItem className="pl-10" key={id} value={id}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className="mt-4 flex min-h-8 flex-wrap items-center justify-between gap-3"
          data-testid="catalogue-results-bar"
        >
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

      <div className="min-[600px]:overflow-x-clip" ref={productListRef}>
        {pagination.items.length ? (
          compactMobile ? (
            <div
              className="border-border bg-surface mt-4 overflow-visible border-t"
              data-testid="mobile-product-page"
              key={`mobile:${categoryId}:${query}:${pagination.page}`}
              style={{
                marginLeft: 'calc(50% - 50vw)',
                width: '100vw',
              }}
            >
              {mobileProductGroups.map(([brand, brandProducts]) => (
                <section key={brand}>
                  <div>
                    {brandProducts.map((item) => {
                      const { product } = item;
                      const selected = selectedIds.includes(product.id);
                      const bestFor = resolveLocalizedText(
                        product.details.bestFor,
                        locale,
                      ).value;
                      const summary = bestForSummary(bestFor);
                      const distance = distanceLabel(
                        item,
                        copy.distanceUnavailable,
                      );
                      const purpose = purposeCategory(item);
                      const tone = badgeTone(purpose);
                      const terrain = terrainProfilesForShoe(product)[0];
                      const secondaryBadge = terrain
                        ? terrainProfileLabel(terrain, locale)
                        : stabilityLabel(product.stability, locale);

                      return (
                        <article
                          className={cn(
                            'border-border bg-surface relative grid min-w-0 grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-1 border-b pr-2',
                            selected &&
                              'border-l-primary bg-primary/5 border-l-4',
                          )}
                          data-selected={selected ? 'true' : undefined}
                          data-testid="mobile-product-row"
                          key={product.id}
                        >
                          <button
                            aria-label={copy.openDetails(product.model)}
                            className="focus-visible:ring-ring/35 grid min-w-0 cursor-pointer grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 border-0 bg-transparent px-3 py-2.5 text-left outline-none focus-visible:ring-3"
                            onClick={(event) =>
                              openDetails(product.id, event.currentTarget)
                            }
                            type="button"
                          >
                            <span className="border-border flex size-[5.5rem] items-center justify-center overflow-hidden rounded-[var(--radius-control)] border bg-white">
                              <ProductPicture
                                assetBase={assetBase}
                                className="h-[5.5rem] min-h-0 p-0.5"
                                item={item}
                                locale={locale}
                              />
                            </span>
                            <span className="min-w-0 py-0.5">
                              <span className="text-foreground block text-base leading-5 font-bold break-words">
                                {product.model}
                              </span>
                              <span className="mt-1.5 flex min-w-0 flex-wrap gap-1.5">
                                {purpose ? (
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-0.5 text-[0.65rem] font-bold tracking-wide uppercase',
                                      tone.primary,
                                    )}
                                    data-mobile-tag="purpose"
                                  >
                                    {localizedCategoryValue(purpose, locale)}
                                  </span>
                                ) : null}
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-[0.65rem] font-bold tracking-wide uppercase',
                                    tone.secondary,
                                  )}
                                  data-mobile-tag={
                                    terrain ? 'terrain' : 'stability'
                                  }
                                >
                                  {secondaryBadge}
                                </span>
                              </span>
                              <span className="text-muted-foreground mt-1.5 block truncate text-xs leading-4">
                                <span className="font-semibold">
                                  {copy.bestFor}:
                                </span>{' '}
                                {summary}
                              </span>
                              <span className="text-muted-foreground mt-0.5 block truncate text-xs leading-4">
                                {copy.distance}: {distance} · {copy.drop}:{' '}
                                {dropLabel(item)}
                              </span>
                            </span>
                          </button>
                          <button
                            aria-label={
                              selected
                                ? copy.deselectProduct(product.model)
                                : copy.selectProduct(product.model)
                            }
                            aria-pressed={selected}
                            className={cn(
                              'border-border bg-surface text-muted-foreground hover:border-primary hover:text-primary focus-visible:ring-ring/35 flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border outline-none focus-visible:ring-3',
                              selected &&
                                'border-primary bg-primary/10 text-primary',
                            )}
                            onClick={() => toggleComparison(product.id)}
                            type="button"
                          >
                            {selected ? (
                              <Check aria-hidden="true" className="size-4" />
                            ) : (
                              <Plus aria-hidden="true" className="size-4" />
                            )}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'tablet:grid-cols-2 desktop:grid-cols-3 mt-6 grid grid-cols-1 gap-5',
                pageDirection === 'forward' && 'catalogue-page--forward',
                pageDirection === 'backward' && 'catalogue-page--backward',
              )}
              data-page-direction={pageDirection ?? undefined}
              data-testid="product-page"
              key={`${categoryId}:${query}:${pagination.page}`}
            >
              {pagination.items.map((item) => {
                const { product } = item;
                const selected = selectedIds.includes(product.id);
                const bestFor = resolveLocalizedText(
                  product.details.bestFor,
                  locale,
                ).value;
                const bestForSummaryText = bestForSummary(bestFor);
                const distance = distanceLabel(item, copy.distanceUnavailable);
                const purpose = purposeCategory(item);
                const tone = badgeTone(purpose);
                const stability = stabilityLabel(product.stability, locale);
                const terrain = terrainProfilesForShoe(product)[0];
                const secondaryBadge = terrain
                  ? terrainProfileLabel(terrain, locale)
                  : stability;

                return (
                  <Card
                    className="desktop:h-[37rem] min-w-0 overflow-hidden"
                    key={product.id}
                  >
                    <article
                      className="flex h-full min-w-0 flex-col"
                      data-testid="product-card"
                    >
                      <CardHeader className="bg-surface-subtle h-56 p-3">
                        <button
                          aria-label={copy.openDetails(product.model)}
                          className="block h-full w-full cursor-pointer border-0 bg-transparent p-0"
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
                      </CardHeader>

                      <CardContent className="flex flex-1 flex-col p-5 pb-0">
                        <p className="text-muted-foreground m-0 text-xs font-bold tracking-[0.15em] uppercase">
                          {product.brand}
                        </p>
                        <button
                          className="text-foreground hover:text-primary mt-1 line-clamp-2 min-h-14 cursor-pointer border-0 bg-transparent p-0 text-left text-2xl font-bold tracking-[-0.025em]"
                          onClick={(event) =>
                            openDetails(product.id, event.currentTarget)
                          }
                          type="button"
                        >
                          {product.model}
                        </button>

                        <div className="mt-3 flex min-h-7 flex-wrap content-start gap-2">
                          {purpose ? (
                            <span
                              className={cn(
                                'rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
                                tone.primary,
                              )}
                              data-card-badge="purpose"
                            >
                              {localizedCategoryValue(purpose, locale)}
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
                              tone.secondary,
                            )}
                            data-card-badge={terrain ? 'terrain' : 'stability'}
                          >
                            {secondaryBadge}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-muted-foreground m-0 text-[0.7rem] font-bold tracking-[0.13em] uppercase">
                            {copy.bestFor}
                          </p>
                          <p
                            className="mt-1 mb-0 line-clamp-2 text-sm leading-6"
                            data-testid="card-best-for"
                          >
                            {bestForSummaryText}
                          </p>
                        </div>

                        <dl className="border-border mt-3 grid min-h-14 grid-cols-2 border-t pt-3 text-center">
                          <div>
                            <dt className="text-muted-foreground text-[0.68rem] font-bold tracking-wide uppercase">
                              {copy.distance}
                            </dt>
                            <dd
                              className="mt-1 text-sm font-semibold"
                              data-testid="card-distance"
                            >
                              {distance}
                            </dd>
                          </div>
                          <div className="border-border border-l px-2">
                            <dt className="text-muted-foreground text-[0.68rem] font-bold tracking-wide uppercase">
                              {copy.drop}
                            </dt>
                            <dd className="mt-1 text-sm font-semibold">
                              {dropLabel(item)}
                            </dd>
                          </div>
                        </dl>
                      </CardContent>

                      <CardFooter className="grid grid-cols-2 gap-3 p-5 pt-0">
                        <Button
                          aria-pressed={selected}
                          onClick={() => toggleComparison(product.id)}
                          variant={selected ? 'primary' : 'secondary'}
                        >
                          {selected ? (
                            <Check aria-hidden="true" className="size-4" />
                          ) : null}
                          {selected ? copy.selected : copy.compare}
                        </Button>
                        <Button
                          onClick={(event) =>
                            openDetails(product.id, event.currentTarget)
                          }
                          variant="outline"
                        >
                          {copy.details}
                        </Button>
                      </CardFooter>
                    </article>
                  </Card>
                );
              })}
            </div>
          )
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
          <span aria-live="polite" className="text-muted-foreground text-sm">
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

      {selectedIds.length && !comparisonOpen ? (
        <div
          aria-label={copy.comparisonSelection}
          className="border-border bg-surface/95 sticky bottom-3 z-30 mx-auto mt-8 flex w-[min(32rem,calc(100%-1rem))] flex-col items-center gap-2.5 rounded-[var(--radius-panel)] border p-3 shadow-[var(--shadow-panel)] backdrop-blur-sm"
          role="region"
        >
          <div className="flex w-full min-w-0 justify-center">
            <div
              aria-label={copy.compareSelected(selectedIds.length)}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              {selectedProducts.map((item) => (
                <button
                  aria-label={copy.deselectProduct(item.product.model)}
                  className="border-primary/20 bg-primary/8 hover:border-primary/35 hover:bg-primary/12 focus-visible:ring-ring/35 inline-flex h-9 max-w-full cursor-pointer items-center gap-2 rounded-full border py-1 pr-1.5 pl-3 text-xs font-semibold outline-none focus-visible:ring-3"
                  key={item.product.id}
                  onClick={() => toggleComparison(item.product.id)}
                  type="button"
                >
                  <span className="truncate">{item.product.model}</span>
                  <span className="bg-surface/70 inline-flex size-6 shrink-0 items-center justify-center rounded-full">
                    <X aria-hidden="true" className="size-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Button
            className="h-10 w-full max-w-xs px-4 shadow-sm"
            disabled={selectedIds.length !== 2}
            onClick={() => {
              setActiveComparisonIds(selectedIds);
              setComparisonOpen(true);
            }}
          >
            {copy.compareSelected(selectedIds.length)}
          </Button>
        </div>
      ) : null}

      <Toaster />

      <ProductDetailsDialog
        assetBase={assetBase}
        comparableProducts={comparableProducts}
        item={detailsProduct}
        locale={locale}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          detailsOpenerRef.current?.focus();
        }}
        onCompare={compareFromDetails}
        onOpenChange={(open) => !open && setDetailsId(null)}
      />

      <Dialog open={comparisonOpen} onOpenChange={handleComparisonOpenChange}>
        <DialogContent
          className="max-h-[calc(100vh-2rem)] w-[min(calc(100%-2rem),58rem)] overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            setActiveComparisonIds([]);
            searchInputRef.current?.focus();
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
                        {item.product.brand}
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
