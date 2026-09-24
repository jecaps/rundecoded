import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ImageOff,
  SlidersHorizontal,
  Plus,
  Search,
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
  DialogClose,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  applyPhoneFilters,
  emptyPhoneFilters,
  parsePhoneFilters,
  phoneFilterCopy,
  phoneFilterCount,
  writePhoneFilters,
  type PhoneFilters,
  type PhoneSort,
  type PhoneSurface,
} from './phone-filters';
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
import { localizedRoute, localizedShoeRoute } from '@/lib/routes';

interface ProductExplorerProps {
  assetBase: string;
  initialCategoryId?: string;
  initialLocale: SupportedLocale;
  initialPage?: number;
  initialQuery?: string;
  products: ExplorerProduct[];
  view?: 'catalogue' | 'comparison';
}

// Run browser-only state updates before the first post-hydration paint when
// possible. The initial render itself must remain identical to the server.
const useViewportLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

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

const comparisonSelectionStorageKey =
  'rundecoded:catalogue-comparison-selection';

function readComparisonSelection(products: ExplorerProduct[]): string[] {
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(comparisonSelectionStorageKey) ?? '[]',
    );
    if (!Array.isArray(stored)) return [];
    const validIds = new Set(products.map(({ product }) => product.id));
    return stored
      .filter((id): id is string => typeof id === 'string' && validIds.has(id))
      .slice(0, 2);
  } catch {
    return [];
  }
}

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
      className={cn('h-full w-full max-w-full object-contain', className)}
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
  view = 'catalogue',
}: ProductExplorerProps) {
  const validCategoryIds = useMemo(
    () =>
      new Set([
        ...products.flatMap(({ product }) => product.categories),
        ...taxonomyFilterIds,
      ]),
    [products],
  );
  const validPurposes = useMemo(
    () =>
      new Set(
        products
          .map(purposeCategory)
          .filter((value): value is string => Boolean(value)),
      ),
    [products],
  );
  const [locale, setLocale] = useState(initialLocale);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [page, setPage] = useState(initialPage);
  const [phoneFilters, setPhoneFilters] =
    useState<PhoneFilters>(emptyPhoneFilters);
  const [phoneFiltersOpen, setPhoneFiltersOpen] = useState(false);
  const [pageDirection, setPageDirection] = useState<
    'backward' | 'forward' | null
  >(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonSelectionReady, setComparisonSelectionReady] =
    useState(false);
  const [activeComparisonIds, setActiveComparisonIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [tabletLayout, setTabletLayout] = useState(false);
  const [compactMobile, setCompactMobile] = useState(false);
  const pageRef = useRef(page);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const detailsOpenerRef = useRef<HTMLElement | null>(null);
  const productListRef = useRef<HTMLDivElement>(null);
  const copy = catalogueCopy[locale];
  const phoneCopy = phoneFilterCopy[locale];

  useViewportLayoutEffect(() => {
    setSelectedIds(readComparisonSelection(products));
    setComparisonSelectionReady(true);
  }, [products]);

  useViewportLayoutEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const restored = parseCatalogueUrlState(searchParams, validCategoryIds);
    setQuery(restored.query);
    setCategoryId(restored.categoryId);
    setPage(restored.page);
    pageRef.current = restored.page;
    setPhoneFilters(parsePhoneFilters(searchParams, validPurposes));
  }, [validCategoryIds, validPurposes]);

  useEffect(() => {
    if (!comparisonSelectionReady) return;
    if (selectedIds.length) {
      window.sessionStorage.setItem(
        comparisonSelectionStorageKey,
        JSON.stringify(selectedIds),
      );
    } else {
      window.sessionStorage.removeItem(comparisonSelectionStorageKey);
    }

    window.dispatchEvent(
      new CustomEvent('rundecoded:comparison-selection-change', {
        detail: { count: selectedIds.length },
      }),
    );
  }, [comparisonSelectionReady, selectedIds]);

  useViewportLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLocale(initialLocale);
      setHydrated(true);
    });
    const mobileQuery = window.matchMedia?.('(max-width: 35.99rem)');
    const updateMobileLayout = () => {
      const isPhone = mobileQuery?.matches ?? window.innerWidth < 576;
      setCompactMobile(isPhone);
      if (!isPhone) setPhoneFiltersOpen(false);
    };
    const tabletQuery = window.matchMedia?.(
      '(min-width: 36rem) and (max-width: 64rem)',
    );
    const updateTabletLayout = () =>
      setTabletLayout(
        tabletQuery?.matches ??
          (window.innerWidth >= 576 && window.innerWidth <= 1024),
      );
    updateMobileLayout();
    updateTabletLayout();
    mobileQuery?.addEventListener('change', updateMobileLayout);
    window.addEventListener('pageshow', updateMobileLayout);
    window.addEventListener('resize', updateMobileLayout);
    tabletQuery?.addEventListener('change', updateTabletLayout);
    window.addEventListener('resize', updateTabletLayout);
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
      tabletQuery?.removeEventListener('change', updateTabletLayout);
      window.removeEventListener('resize', updateTabletLayout);
      document.removeEventListener('visibilitychange', updateMobileLayout);
      window.removeEventListener('rundecoded:locale-change', onLocaleChange);
    };
  }, [initialLocale]);

  useEffect(() => {
    if (!hydrated || !compactMobile || view !== 'catalogue') return;
    const stored = window.sessionStorage.getItem(
      'rundecoded:phone-catalogue-scroll',
    );
    if (!stored) return;
    try {
      const snapshot = JSON.parse(stored) as { href: string; scrollY: number };
      if (
        snapshot.href !== `${window.location.pathname}${window.location.search}`
      )
        return;
      window.sessionStorage.removeItem('rundecoded:phone-catalogue-scroll');
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() =>
          window.scrollTo({ top: snapshot.scrollY, behavior: 'instant' }),
        );
      });
      return () => window.cancelAnimationFrame(frame);
    } catch {
      window.sessionStorage.removeItem('rundecoded:phone-catalogue-scroll');
    }
  }, [compactMobile, hydrated, view]);

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
      setPhoneFilters(
        parsePhoneFilters(
          new URL(window.location.href).searchParams,
          validPurposes,
        ),
      );
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
  }, [validCategoryIds, validPurposes]);

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
  const preferredPhonePurposes = [
    'daily-trainer',
    'fast-training',
    'max-cushion',
  ];
  const phoneQuickCategories = [...categoryOptions].sort((left, right) => {
    const leftPriority = preferredPhonePurposes.indexOf(left[0]);
    const rightPriority = preferredPhonePurposes.indexOf(right[0]);
    return (
      (leftPriority < 0 ? 100 : leftPriority) -
      (rightPriority < 0 ? 100 : rightPriority)
    );
  });
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
  const phonePurposeOptions = [
    'entry-level',
    'daily-trainer',
    'fast-training',
    'super-trainer',
    'max-cushion',
    'trail',
    'trail-race',
  ].flatMap((id) => categoryOptions.filter(([optionId]) => optionId === id));
  const phoneSurfaceOptions = (
    [
      ['road', surfaceFamilyLabel('road', locale)],
      ['easy-terrain', terrainProfileLabel('easy-terrain', locale)],
      ['mixed-terrain', terrainProfileLabel('mixed-terrain', locale)],
    ] as const
  ).filter(([surface]) =>
    products.some(({ product }) =>
      surface === 'road'
        ? surfaceFamiliesForShoe(product).includes('road')
        : terrainProfilesForShoe(product).includes(surface),
    ),
  ) as [PhoneSurface, string][];
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
  const activePhoneFilterCount = phoneFilterCount(phoneFilters);
  const filtered = useMemo(() => {
    const searched = filterProducts(
      products,
      query,
      compactMobile ? 'all' : categoryId,
      locale,
    );
    return compactMobile
      ? applyPhoneFilters(searched, phoneFilters, locale)
      : searched;
  }, [categoryId, compactMobile, locale, phoneFilters, products, query]);
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

  function updatePhoneFilters(nextFilters: PhoneFilters) {
    setPhoneFilters(nextFilters);
    pageRef.current = 1;
    setPage(1);
    setPageDirection(null);
    const nextUrl = writeCatalogueUrlState(new URL(window.location.href), {
      categoryId,
      page: 1,
      query,
    });
    window.history.pushState({}, '', writePhoneFilters(nextUrl, nextFilters));
  }

  function togglePhoneFilter(
    group: 'purposes' | 'surfaces' | 'stabilities',
    value: string,
  ) {
    const current = phoneFilters[group] as string[];
    updatePhoneFilters({
      ...phoneFilters,
      [group]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    } as PhoneFilters);
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
    if (compactMobile) {
      setPhoneFilters(emptyPhoneFilters);
      const url = writeCatalogueUrlState(new URL(window.location.href), {
        categoryId: 'all',
        page: 1,
        query: '',
      });
      window.history.pushState(
        {},
        '',
        writePhoneFilters(url, emptyPhoneFilters),
      );
    } else {
      updateUrlState({ categoryId: 'all', page: 1, query: '' }, 'push');
    }
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

  function clearComparisonSelection() {
    setSelectedIds([]);
    setActiveComparisonIds([]);
    setComparisonOpen(false);
    toast.dismiss('comparison-selection-limit');
  }

  function compareFromDetails(comparableId: string) {
    if (!detailsProduct) return;
    const comparisonIds = [detailsProduct.product.id, comparableId];
    detailsOpenerRef.current = null;
    setSelectedIds(comparisonIds);
    setActiveComparisonIds(comparisonIds);
    setDetailsId(null);
    if (tabletLayout || compactMobile) {
      window.sessionStorage.setItem(
        comparisonSelectionStorageKey,
        JSON.stringify(comparisonIds),
      );
      window.location.assign(localizedRoute(locale, 'compare'));
      return;
    }
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

  const comparisonLabels = {
    category: copy.category,
    drop: copy.drop,
    stability: copy.stability,
    surface: copy.surface,
    weight: copy.weight,
  };

  function renderComparisonTable(items: ExplorerProduct[], editable = false) {
    if (items.length !== 2) return null;
    const rows = compareProducts(items[0], items[1], locale);
    const hasWeightMismatch =
      items[0].weight !== null &&
      items[1].weight !== null &&
      items[0].weight.referenceSize !== null &&
      items[1].weight.referenceSize !== null &&
      items[0].weight.referenceSize !== items[1].weight.referenceSize;

    return (
      <div className="mt-3">
        <section className="bg-callout border-callout-border mb-4 border-l-4 p-4">
          <h2 className="m-0 text-sm font-semibold">
            {copy.differenceSummary}
          </h2>
          <p className="text-muted-foreground mt-2 mb-0 text-sm leading-6">
            {comparisonSummary(items[0], items[1], locale)}
          </p>
        </section>
        <div className="overflow-x-auto rounded-[var(--radius-control)] border">
          <div className="grid min-w-[34rem] grid-cols-[minmax(7rem,0.65fr)_repeat(2,minmax(0,1fr))] gap-px overflow-hidden">
            <div className="bg-surface-subtle p-3 text-sm font-semibold">
              {copy.characteristic}
            </div>
            {items.map((item) => (
              <div
                className="bg-surface-subtle relative p-3 pr-11"
                key={item.product.id}
              >
                <span className="block text-xs font-bold tracking-wide uppercase">
                  {item.product.brand}
                </span>
                <span className="mt-1 block font-semibold">
                  {item.product.model}
                </span>
                {editable ? (
                  <button
                    aria-label={copy.deselectProduct(item.product.model)}
                    className="text-muted-foreground hover:bg-surface hover:text-foreground focus-visible:ring-ring/35 absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent outline-none focus-visible:ring-3"
                    onClick={() => toggleComparison(item.product.id)}
                    title={copy.remove}
                    type="button"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}
            {rows.map((row) => (
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
                  data-difference={row.difference === true ? 'true' : undefined}
                >
                  {row.left}
                </div>
                <div
                  className={cn(
                    'border-border border-t p-3 text-sm',
                    row.difference ? 'bg-callout' : 'bg-surface',
                  )}
                  data-difference={row.difference === true ? 'true' : undefined}
                >
                  {row.right}
                </div>
              </div>
            ))}
          </div>
        </div>
        {hasWeightMismatch ? (
          <p className="border-callout-border bg-callout text-muted-foreground mt-4 border-l-4 p-3 text-sm">
            {copy.weightReferenceMismatch}
          </p>
        ) : null}
        {editable ? (
          <Button
            className="text-danger hover:text-danger mt-3 px-0"
            onClick={clearComparisonSelection}
            size="sm"
            variant="ghost"
          >
            {copy.clearComparison}
          </Button>
        ) : null}
      </div>
    );
  }

  if (view === 'comparison') {
    return (
      <section
        aria-labelledby="comparison-title"
        className="app-route max-[35.99rem]:py-4"
        data-comparison-ready={comparisonSelectionReady}
        data-hydrated={hydrated ? 'true' : undefined}
        data-testid="tablet-comparison-view"
        id="comparison"
      >
        <header className="app-route__header">
          <p className="app-route__eyebrow">{copy.compare}</p>
          <h1 className="app-route__title" id="comparison-title">
            {copy.comparisonTitle}
          </h1>
          <p className="app-route__description">{copy.comparisonDescription}</p>
        </header>

        <div data-comparison-state>
          {selectedProducts.length === 2 ? (
            renderComparisonTable(selectedProducts, true)
          ) : (
            <div className="border-border bg-surface mt-8 rounded-[var(--radius-panel)] border p-8 text-center shadow-sm">
              <p className="m-0 text-lg font-semibold">
                {selectedProducts.length === 0
                  ? copy.comparisonEmpty
                  : copy.comparisonNeedsAnother}
              </p>
              {selectedProducts[0] ? (
                <div className="bg-surface-subtle mx-auto mt-4 flex max-w-sm items-center justify-between gap-4 rounded-[var(--radius-control)] p-3 text-left">
                  <span>
                    <span className="text-muted-foreground block text-xs font-bold tracking-wide uppercase">
                      {selectedProducts[0].product.brand}
                    </span>
                    <span className="mt-1 block font-semibold">
                      {selectedProducts[0].product.model}
                    </span>
                  </span>
                  <Button
                    aria-label={copy.deselectProduct(
                      selectedProducts[0].product.model,
                    )}
                    onClick={() =>
                      toggleComparison(selectedProducts[0]!.product.id)
                    }
                    size="icon"
                    title={copy.remove}
                    variant="ghost"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              ) : null}
              <a
                className={cn(buttonVariants({ variant: 'outline' }), 'mt-5')}
                href={localizedRoute(locale, 'catalogue')}
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                {copy.comparisonBrowse}
              </a>
            </div>
          )}
        </div>
        <Toaster />
      </section>
    );
  }

  return (
    <section
      className="app-route [overflow-anchor:none] max-[35.99rem]:py-4"
      aria-labelledby="catalogue-title"
      data-comparison-ready={comparisonSelectionReady}
      data-hydrated={hydrated ? 'true' : undefined}
      data-testid="product-explorer"
      id="comparison"
    >
      <header className="app-route__header">
        <p className="app-route__eyebrow">Product explorer</p>
        <h1 className="app-route__title" id="catalogue-title">
          {copy.title}
        </h1>
        <p className="app-route__description tablet:block hidden">
          {copy.intro}
        </p>
      </header>

      <div className="tablet:mt-5 mt-3">
        <div className="tablet:grid-cols-[minmax(16rem,1fr)_auto] grid gap-2">
          <div className="tablet:contents flex min-w-0 items-start gap-2">
            <div className="relative min-w-0 flex-1">
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
                      setActiveSuggestion((current) =>
                        Math.max(current - 1, 0),
                      );
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
                    className="text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-1 max-[35.99rem]:flex max-[35.99rem]:size-11 max-[35.99rem]:items-center max-[35.99rem]:justify-center"
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

            <Button
              aria-label={`${phoneCopy.filters}${activePhoneFilterCount ? ` (${activePhoneFilterCount})` : ''}`}
              className="tablet:hidden relative size-11 shrink-0 rounded-[var(--radius-control)]"
              onClick={() => setPhoneFiltersOpen(true)}
              size="icon"
              variant="outline"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              {activePhoneFilterCount ? (
                <span
                  aria-hidden="true"
                  className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full text-[0.65rem] font-bold"
                >
                  {activePhoneFilterCount}
                </span>
              ) : null}
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="tablet:flex tablet:w-52 hidden h-11 w-full shrink-0 justify-between"
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
          className="tablet:hidden mt-3 flex min-w-0 gap-2 overflow-x-auto pb-1"
          data-testid="phone-quick-filters"
        >
          <button
            aria-pressed={phoneFilters.purposes.length === 0}
            className={cn(
              'border-border bg-surface text-foreground flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--radius-control)] border px-3 text-sm font-medium',
              phoneFilters.purposes.length === 0 &&
                'border-primary bg-primary text-primary-foreground',
            )}
            onClick={() =>
              updatePhoneFilters({ ...phoneFilters, purposes: [] })
            }
            type="button"
          >
            {phoneFilters.purposes.length === 0 ? (
              <Check aria-hidden="true" className="size-4" />
            ) : null}
            {phoneCopy.all}
          </button>
          {phoneQuickCategories.map(([id, label]) => {
            const selected = phoneFilters.purposes.includes(id);
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  'border-border bg-surface text-foreground flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--radius-control)] border px-3 text-sm font-medium',
                  selected &&
                    'border-primary bg-primary text-primary-foreground',
                )}
                key={id}
                onClick={() => togglePhoneFilter('purposes', id)}
                type="button"
              >
                {selected ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : null}
                {label}
              </button>
            );
          })}
        </div>

        <div
          className="tablet:mt-4 mt-2 flex min-h-8 flex-wrap items-center justify-between gap-3"
          data-testid="catalogue-results-bar"
        >
          <p aria-live="polite" className="text-muted-foreground m-0 text-sm">
            {copy.results(filtered.length, products.length)}
          </p>
          {query ||
          (compactMobile
            ? activePhoneFilterCount > 0 || phoneFilters.sort !== 'default'
            : categoryId !== 'all') ? (
            <Button onClick={clearFilters} size="sm" variant="ghost">
              {copy.clearFilters}
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={phoneFiltersOpen} onOpenChange={setPhoneFiltersOpen}>
        <DialogContent
          aria-describedby="phone-filters-description"
          className="top-auto right-0 bottom-0 left-0 m-0 grid h-[min(82dvh,48rem)] max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] w-full max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 rounded-t-[var(--radius-panel)] rounded-b-none border-x-0 border-b-0 p-0 [&>button]:hidden"
          data-testid="phone-filters-sheet"
        >
          <div className="border-border border-b px-5 pt-2 pb-4">
            <div className="bg-border mx-auto mb-3 h-1 w-10 rounded-full" />
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>{phoneCopy.filters}</DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  className="min-h-11 px-2"
                  onClick={clearFilters}
                  size="sm"
                  variant="ghost"
                >
                  {phoneCopy.clear}
                </Button>
                <DialogClose
                  aria-label={phoneCopy.close}
                  className="hover:bg-surface-subtle flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)]"
                >
                  <X aria-hidden="true" className="size-5" />
                </DialogClose>
              </div>
            </div>
            <DialogDescription
              className="sr-only"
              id="phone-filters-description"
            >
              {copy.results(filtered.length, products.length)}
            </DialogDescription>
          </div>
          <div className="min-h-0 overflow-y-auto px-5 py-5">
            {(
              [
                [phoneCopy.purpose, 'purposes', phonePurposeOptions],
                [
                  phoneCopy.guidance,
                  'stabilities',
                  [
                    ['neutral', stabilityLabel('neutral', locale)],
                    ['stability', stabilityLabel('stability', locale)],
                  ],
                ],
                [phoneCopy.surface, 'surfaces', phoneSurfaceOptions],
              ] as const
            ).map(([label, group, options]) => (
              <fieldset className="mb-5" key={group}>
                <legend className="text-muted-foreground mb-2 text-xs font-bold tracking-[0.12em] uppercase">
                  {label}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {options.map(([value, optionLabel]) => {
                    const selected = (phoneFilters[group] as string[]).includes(
                      value,
                    );
                    return (
                      <button
                        aria-pressed={selected}
                        className={cn(
                          'border-border bg-surface flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-left text-sm',
                          selected &&
                            'border-primary bg-primary text-primary-foreground',
                        )}
                        key={value}
                        onClick={() => togglePhoneFilter(group, value)}
                        type="button"
                      >
                        {selected ? (
                          <Check
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                        ) : null}
                        {optionLabel}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
            <fieldset className="mb-5">
              <legend className="text-muted-foreground mb-2 text-xs font-bold tracking-[0.12em] uppercase">
                {phoneCopy.drop}
              </legend>
              <div className="bg-surface-subtle flex gap-1 rounded-[var(--radius-control)] p-1">
                {(
                  [
                    ['low', phoneCopy.lowDrop],
                    ['mid', phoneCopy.midDrop],
                    ['high', phoneCopy.highDrop],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    aria-pressed={phoneFilters.drop === value}
                    className={cn(
                      'text-foreground min-h-12 min-w-0 flex-1 cursor-pointer rounded-[var(--radius-sm)] px-1 text-xs font-medium',
                      phoneFilters.drop === value &&
                        'bg-primary text-primary-foreground',
                    )}
                    key={value}
                    onClick={() =>
                      updatePhoneFilters({
                        ...phoneFilters,
                        drop: phoneFilters.drop === value ? 'any' : value,
                      })
                    }
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mb-5">
              <legend className="text-muted-foreground mb-2 text-xs font-bold tracking-[0.12em] uppercase">
                {phoneCopy.distance}
              </legend>
              <div className="bg-surface-subtle flex gap-1 rounded-[var(--radius-control)] p-1">
                {(
                  [
                    ['10', '10 km'],
                    ['21', '21 km'],
                    ['42', '42 km'],
                    ['any', phoneCopy.any],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    aria-pressed={phoneFilters.distance === value}
                    className={cn(
                      'text-foreground min-h-11 min-w-0 flex-1 cursor-pointer rounded-[var(--radius-sm)] px-1 text-xs font-medium',
                      phoneFilters.distance === value &&
                        'bg-primary text-primary-foreground',
                    )}
                    key={value}
                    onClick={() =>
                      updatePhoneFilters({ ...phoneFilters, distance: value })
                    }
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label
                className="text-muted-foreground mb-2 block text-xs font-bold tracking-[0.12em] uppercase"
                id="phone-sort-label"
              >
                {phoneCopy.sort}
              </label>
              <Select
                onValueChange={(value) =>
                  updatePhoneFilters({
                    ...phoneFilters,
                    sort: value as PhoneSort,
                  })
                }
                value={phoneFilters.sort}
              >
                <SelectTrigger aria-labelledby="phone-sort-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    {phoneCopy.defaultSort}
                  </SelectItem>
                  <SelectItem value="brand">{phoneCopy.brandSort}</SelectItem>
                  <SelectItem value="model">{phoneCopy.modelSort}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-border bg-surface flex border-t px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button
              className="min-h-11 flex-1"
              onClick={() => setPhoneFiltersOpen(false)}
            >
              {phoneCopy.show(filtered.length)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="tablet:overflow-x-clip" ref={productListRef}>
        {pagination.items.length ? (
          <>
            <div
              className="border-border bg-surface tablet:hidden mt-2 overflow-visible border-t"
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
                          <a
                            aria-label={copy.openDetails(product.model)}
                            className="focus-visible:ring-ring/35 grid min-w-0 cursor-pointer grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 border-0 bg-transparent px-3 py-2.5 text-left outline-none focus-visible:ring-3"
                            href={localizedShoeRoute(locale, product.id)}
                            onClick={() => {
                              const href = `${window.location.pathname}${window.location.search}`;
                              window.sessionStorage.setItem(
                                'rundecoded:phone-catalogue-return',
                                href,
                              );
                              window.sessionStorage.setItem(
                                'rundecoded:phone-shoe-return',
                                JSON.stringify({
                                  href,
                                  shoeId: product.id,
                                  source: 'catalogue',
                                }),
                              );
                              window.sessionStorage.setItem(
                                'rundecoded:phone-catalogue-scroll',
                                JSON.stringify({
                                  href,
                                  scrollY: window.scrollY,
                                }),
                              );
                            }}
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
                          </a>
                          <button
                            data-comparison-state
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
            <div
              className={cn(
                'tablet:grid tablet:grid-cols-2 desktop:grid-cols-3 mt-6 hidden grid-cols-1 gap-[clamp(0.75rem,2vw,1rem)]',
                pageDirection === 'forward' && 'catalogue-page--forward',
                pageDirection === 'backward' && 'catalogue-page--backward',
              )}
              data-page-direction={pageDirection ?? undefined}
              data-testid="product-page"
              key={`${categoryId}:${query}:${pagination.page}`}
            >
              <div className="contents">
                {pagination.items.map((item) => {
                  const { product } = item;
                  const selected = selectedIds.includes(product.id);
                  const bestFor = resolveLocalizedText(
                    product.details.bestFor,
                    locale,
                  ).value;
                  const bestForSummaryText = bestForSummary(bestFor);
                  const distance = distanceLabel(
                    item,
                    copy.distanceUnavailable,
                  );
                  const purpose = purposeCategory(item);
                  const tone = badgeTone(purpose);
                  const stability = stabilityLabel(product.stability, locale);
                  const terrain = terrainProfilesForShoe(product)[0];
                  const secondaryBadge = terrain
                    ? terrainProfileLabel(terrain, locale)
                    : stability;

                  return (
                    <Card
                      className="catalogue-card [container-type:inline-size] h-full min-w-0 overflow-hidden"
                      key={product.id}
                    >
                      <article
                        className="grid h-full w-full max-w-full min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] overflow-hidden"
                        data-testid="product-card"
                      >
                        <CardHeader className="bg-surface-subtle relative aspect-[3/2] w-full max-w-full min-w-0 overflow-hidden p-0">
                          <button
                            aria-label={copy.openDetails(product.model)}
                            className="absolute inset-0 block cursor-pointer border-0 bg-transparent p-0"
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

                        <CardContent className="flex min-h-0 flex-col p-[clamp(0.875rem,6cqi,1.25rem)] pb-3">
                          <p className="text-muted-foreground m-0 text-[clamp(0.625rem,3.5cqi,0.75rem)] font-bold tracking-[0.15em] uppercase">
                            {product.brand}
                          </p>
                          <button
                            className="catalogue-card__title text-foreground hover:text-primary mt-1 cursor-pointer overflow-hidden border-0 bg-transparent p-0 text-left text-[clamp(0.875rem,6.5cqi,1.375rem)] leading-tight font-bold tracking-[-0.025em] text-ellipsis whitespace-nowrap"
                            onClick={(event) =>
                              openDetails(product.id, event.currentTarget)
                            }
                            type="button"
                          >
                            {product.model}
                          </button>

                          <div
                            className="mt-3 flex flex-wrap content-start gap-2 overflow-hidden"
                            data-testid="card-badges"
                          >
                            {purpose ? (
                              <span
                                className={cn(
                                  'rounded-full px-[clamp(0.5rem,3cqi,0.75rem)] py-1 text-[clamp(0.5625rem,3.25cqi,0.75rem)] font-bold tracking-wide whitespace-nowrap uppercase',
                                  tone.primary,
                                )}
                                data-card-badge="purpose"
                              >
                                {localizedCategoryValue(purpose, locale)}
                              </span>
                            ) : null}
                            <span
                              className={cn(
                                'rounded-full px-[clamp(0.5rem,3cqi,0.75rem)] py-1 text-[clamp(0.5625rem,3.25cqi,0.75rem)] font-bold tracking-wide whitespace-nowrap uppercase',
                                tone.secondary,
                              )}
                              data-card-badge={
                                terrain ? 'terrain' : 'stability'
                              }
                            >
                              {secondaryBadge}
                            </span>
                          </div>

                          <div className="mt-4">
                            <p className="text-muted-foreground m-0 text-[clamp(0.625rem,3.25cqi,0.7rem)] font-bold tracking-[0.13em] uppercase">
                              {copy.bestFor}
                            </p>
                            <p
                              className="mt-1 mb-0 truncate text-[clamp(0.75rem,4cqi,0.875rem)] leading-6"
                              title={bestForSummaryText}
                              data-testid="card-best-for"
                            >
                              {bestForSummaryText}
                            </p>
                          </div>

                          <dl
                            className="border-border mt-3 grid min-h-14 grid-cols-2 border-t pt-3 text-center"
                            data-testid="card-metrics"
                          >
                            <div>
                              <dt className="text-muted-foreground text-[clamp(0.625rem,3.25cqi,0.68rem)] font-bold tracking-wide uppercase">
                                {copy.distance}
                              </dt>
                              <dd
                                className="mt-1 text-[clamp(0.75rem,4cqi,0.875rem)] font-semibold"
                                data-testid="card-distance"
                              >
                                {distance}
                              </dd>
                            </div>
                            <div className="border-border border-l px-2">
                              <dt className="text-muted-foreground text-[clamp(0.625rem,3.25cqi,0.68rem)] font-bold tracking-wide uppercase">
                                {copy.drop}
                              </dt>
                              <dd className="mt-1 text-[clamp(0.75rem,4cqi,0.875rem)] font-semibold">
                                {dropLabel(item)}
                              </dd>
                            </div>
                          </dl>
                        </CardContent>

                        <CardFooter className="p-[clamp(0.875rem,6cqi,1.25rem)] pt-0">
                          <Button
                            data-comparison-state
                            className="w-full text-[clamp(0.75rem,4cqi,0.875rem)]"
                            aria-label={selected ? copy.added : copy.compare}
                            aria-pressed={selected}
                            onClick={() => toggleComparison(product.id)}
                            variant={selected ? 'primary' : 'outline'}
                          >
                            {selected ? (
                              <Check aria-hidden="true" className="size-4" />
                            ) : (
                              <Plus aria-hidden="true" className="size-4" />
                            )}
                            {selected ? copy.added : copy.compare}
                          </Button>
                        </CardFooter>
                      </article>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
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
          className="tablet:mt-8 mt-4 flex items-center justify-center gap-4"
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
          className="border-border bg-surface/95 sticky bottom-3 z-30 mx-auto mt-8 flex w-[min(48rem,calc(100%-1rem))] items-center gap-2 rounded-[var(--radius-panel)] border p-2 shadow-[var(--shadow-panel)] backdrop-blur-sm max-[35.99rem]:bottom-[calc(4.5rem+env(safe-area-inset-bottom))]"
          data-comparison-state
          role="region"
        >
          <div
            aria-label={copy.compareSelected(selectedIds.length)}
            className="flex min-w-0 flex-1 gap-2 overflow-x-auto"
          >
            {selectedProducts.map((item) => {
              const selectedImage = imagePath(item, assetBase);
              return (
                <div
                  className="border-border bg-surface-subtle flex h-12 max-w-[17rem] min-w-[10rem] flex-1 items-center overflow-hidden rounded-[var(--radius-control)] border p-1"
                  key={item.product.id}
                >
                  <span className="bg-surface mr-3 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)]">
                    {selectedImage ? (
                      <img
                        alt=""
                        className="h-full w-full object-contain"
                        src={selectedImage}
                      />
                    ) : (
                      <ImageOff
                        aria-hidden="true"
                        className="text-muted-foreground size-4"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-normal">
                    {item.product.model}
                  </span>
                  <button
                    aria-label={copy.deselectProduct(item.product.model)}
                    className="hover:bg-surface-strong focus-visible:ring-ring/35 ml-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border-0 bg-transparent outline-none focus-visible:ring-3 max-[35.99rem]:size-11"
                    onClick={() => toggleComparison(item.product.id)}
                    title={copy.remove}
                    type="button"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
          {(tabletLayout || compactMobile) && selectedIds.length === 2 ? (
            <a
              className={cn(
                buttonVariants(),
                'h-12 w-auto shrink-0 px-4 text-xs font-bold shadow-sm',
              )}
              data-astro-prefetch="load"
              href={localizedRoute(locale, 'compare')}
              onClick={() => {
                window.sessionStorage.setItem(
                  comparisonSelectionStorageKey,
                  JSON.stringify(selectedIds),
                );
              }}
            >
              {copy.compareSelected(selectedIds.length)}
            </a>
          ) : (
            <Button
              className="h-12 w-auto shrink-0 px-4 text-xs font-bold shadow-sm"
              disabled={selectedIds.length !== 2}
              onClick={() => {
                setActiveComparisonIds(selectedIds);
                setComparisonOpen(true);
              }}
            >
              {copy.compareSelected(selectedIds.length)}
            </Button>
          )}
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

      <Dialog
        open={!tabletLayout && comparisonOpen}
        onOpenChange={handleComparisonOpenChange}
      >
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

          {renderComparisonTable(comparisonProducts)}
        </DialogContent>
      </Dialog>
    </section>
  );
}
