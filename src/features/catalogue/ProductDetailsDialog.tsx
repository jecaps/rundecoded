import type { ComponentProps } from 'react';
import { ArrowUpRight, ImageOff } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  resolveLocalizedText,
  surfaceFamiliesForShoe,
  terrainProfilesForShoe,
  type SupportedLocale,
} from '@/domain/catalogue';
import { cn } from '@/lib/utils';

import type { ExplorerProduct } from './catalogue';
import {
  catalogueCopy,
  categoryLabel,
  stabilityLabel,
  surfaceFamilyLabel,
  terrainProfileLabel,
} from './copy';

interface ProductDetailsDialogProps {
  assetBase: string;
  comparableProducts?: ExplorerProduct[];
  item: ExplorerProduct | null;
  locale: SupportedLocale;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>['onCloseAutoFocus'];
  onCompare?: (id: string) => void;
  onOpenChange: (open: boolean) => void;
}

function imagePath(item: ExplorerProduct, assetBase: string): string | null {
  const image = item.product.images[0];
  return image ? `${assetBase}${image}` : null;
}

function ProductPicture({
  assetBase,
  item,
  locale,
}: {
  assetBase: string;
  item: ExplorerProduct;
  locale: SupportedLocale;
}) {
  const copy = catalogueCopy[locale];
  const src = imagePath(item, assetBase);
  if (!src) {
    return (
      <span className="bg-surface-subtle text-muted-foreground flex max-h-80 min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-sm">
        <ImageOff aria-hidden="true" className="size-9" />
        {copy.imagePending}
      </span>
    );
  }

  return (
    <img
      alt={copy.productImage(item.product.model)}
      className="h-full max-h-80 w-full object-contain"
      loading="lazy"
      src={src}
    />
  );
}

function dropLabel(item: ExplorerProduct) {
  const drop = item.product.specifications.dropMm;
  return drop === null ? '—' : `${drop} mm`;
}

function stackHeightLabel(item: ExplorerProduct) {
  const stack = item.product.specifications.stackHeightMm;
  if (stack === null) return '—';
  return typeof stack === 'number'
    ? `${stack} mm`
    : `${stack.heel} / ${stack.forefoot} mm`;
}

export function ProductDetailsDialog({
  assetBase,
  comparableProducts = [],
  item,
  locale,
  onCloseAutoFocus,
  onCompare,
  onOpenChange,
}: ProductDetailsDialogProps) {
  const copy = catalogueCopy[locale];

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      {item ? (
        <DialogContent
          className="max-h-[calc(100vh-2rem)] w-[min(calc(100%-2rem),64rem)] overflow-y-auto p-0"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <div className="desktop:grid-cols-[0.85fr_1.15fr] grid">
            <div className="bg-surface-subtle desktop:flex desktop:items-center desktop:justify-center min-h-64 p-6">
              <ProductPicture
                assetBase={assetBase}
                item={item}
                locale={locale}
              />
            </div>
            <div className="tablet:p-8 p-6">
              <DialogHeader>
                <p className="text-muted-foreground m-0 text-xs font-bold tracking-[0.15em] uppercase">
                  {item.product.brand}
                </p>
                <DialogTitle className="text-3xl">
                  {item.product.model}
                </DialogTitle>
                <DialogDescription>
                  {
                    resolveLocalizedText(item.product.details.overview, locale)
                      .value
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 flex flex-wrap gap-2">
                {item.product.categories.map((category) => (
                  <span
                    className="bg-surface-subtle rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase"
                    key={category}
                  >
                    {categoryLabel(category, category, locale)}
                  </span>
                ))}
              </div>

              <section className="bg-surface-subtle mt-6 rounded-[var(--radius-control)] p-4">
                <h3 className="m-0 text-sm font-semibold">{copy.bestFor}</h3>
                <p className="mt-1 mb-0 text-sm leading-6">
                  {
                    resolveLocalizedText(item.product.details.bestFor, locale)
                      .value
                  }
                </p>
              </section>

              <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                <div className="border-border border-b pb-3">
                  <dt className="text-muted-foreground text-xs font-bold uppercase">
                    {copy.surface}
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {surfaceFamiliesForShoe(item.product)
                      .map((family) => surfaceFamilyLabel(family, locale))
                      .join(', ') || copy.notApplicable}
                  </dd>
                </div>
                <div className="border-border border-b pb-3">
                  <dt className="text-muted-foreground text-xs font-bold uppercase">
                    {copy.terrain}
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {terrainProfilesForShoe(item.product)
                      .map((terrain) => terrainProfileLabel(terrain, locale))
                      .join(', ') || copy.notApplicable}
                  </dd>
                </div>
                <div className="border-border border-b pb-3">
                  <dt className="text-muted-foreground text-xs font-bold uppercase">
                    {copy.stability}
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {stabilityLabel(item.product.stability, locale)}
                  </dd>
                </div>
                <div className="border-border border-b pb-3">
                  <dt className="text-muted-foreground text-xs font-bold uppercase">
                    {copy.weightValue}
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {item.weight
                      ? `${item.weight.amount} ${item.weight.unit}`
                      : copy.pending}
                  </dd>
                </div>
                <div className="border-border border-b pb-3">
                  <dt className="text-muted-foreground text-xs font-bold uppercase">
                    {copy.drop}
                  </dt>
                  <dd className="mt-1 font-semibold">{dropLabel(item)}</dd>
                </div>
                <div className="border-border border-b pb-3">
                  <dt className="text-muted-foreground text-xs font-bold uppercase">
                    {copy.fit}
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {item.product.specifications.fit.join(', ') || copy.pending}
                  </dd>
                </div>
                <div className="border-border border-b pb-3">
                  <dt className="text-muted-foreground text-xs font-bold uppercase">
                    {copy.stackHeight}
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {stackHeightLabel(item)}
                  </dd>
                </div>
              </dl>

              {item.product.sourceUrl ? (
                <a
                  className={cn(buttonVariants({ variant: 'primary' }), 'mt-6')}
                  href={item.product.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.sourceProduct}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="border-border tablet:p-8 grid gap-8 border-t p-6">
            <section>
              <h3 className="m-0 text-lg font-semibold">
                {item.product.details.construction
                  ? copy.constructionAndRide
                  : copy.technologies}
              </h3>
              {item.product.details.construction ? (
                <dl className="tablet:grid-cols-2 mt-4 grid gap-4 text-sm">
                  {(
                    [
                      [
                        copy.rideCharacter,
                        item.product.details.construction.ride,
                      ],
                      [copy.support, item.product.details.construction.support],
                      [copy.upper, item.product.details.construction.upper],
                      [copy.midsole, item.product.details.construction.midsole],
                      [copy.outsole, item.product.details.construction.outsole],
                    ] as const
                  ).map(([label, content]) => (
                    <div className="border-border border-t pt-3" key={label}>
                      <dt className="text-muted-foreground text-xs font-bold uppercase">
                        {label}
                      </dt>
                      <dd className="mt-1 leading-6">
                        {resolveLocalizedText(content, locale).value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <>
                  <p className="text-muted-foreground mt-3 mb-0 text-sm leading-6">
                    {copy.detailsPending}
                  </p>
                  <p className="text-muted-foreground mt-3 mb-0 text-sm leading-6">
                    {item.product.specifications.technologies.join(' · ') ||
                      copy.pending}
                  </p>
                </>
              )}
            </section>

            <section>
              <h3 className="m-0 text-lg font-semibold">
                {copy.strengthsAndLimitations}
              </h3>
              <p className="text-muted-foreground mt-1 mb-0 text-sm">
                {copy.strengthsLead}
              </p>
              <dl className="tablet:grid-cols-2 mt-4 grid gap-4 text-sm">
                <div className="border-border border-t pt-3">
                  <dt className="text-muted-foreground text-xs font-bold uppercase">
                    {copy.bestAt}
                  </dt>
                  <dd className="mt-1">
                    {
                      resolveLocalizedText(item.product.details.bestAt, locale)
                        .value
                    }
                  </dd>
                </div>
                <div className="border-border border-t pt-3">
                  <dt className="text-muted-foreground text-xs font-bold uppercase">
                    {copy.lessSuitableFor}
                  </dt>
                  <dd className="mt-1">
                    {
                      resolveLocalizedText(
                        item.product.details.lessSuitableFor,
                        locale,
                      ).value
                    }
                  </dd>
                </div>
              </dl>
            </section>

            {comparableProducts.length > 0 && onCompare ? (
              <section>
                <h3 className="m-0 text-lg font-semibold">
                  {copy.comparableProducts}
                </h3>
                <div className="mt-3 grid gap-2">
                  {comparableProducts.map((comparable) => (
                    <button
                      className="border-border hover:bg-surface-subtle flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-control)] border bg-transparent px-4 py-3 text-left"
                      key={comparable.product.id}
                      onClick={() => onCompare(comparable.product.id)}
                      type="button"
                    >
                      <span>
                        <span className="block text-xs font-bold tracking-wide uppercase">
                          {comparable.product.brand}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-sm">
                          {comparable.product.model}
                        </span>
                      </span>
                      <span className="text-primary text-sm font-semibold">
                        {copy.compareWith(comparable.product.model)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
