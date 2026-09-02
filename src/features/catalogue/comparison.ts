import { resolveLocalizedText, type SupportedLocale } from '@/domain/catalogue';

import { categoryLabel, stabilityLabel } from './copy';
import type { ExplorerProduct } from './catalogue';

export interface ComparisonRow {
  difference: boolean | null;
  key: 'category' | 'drop' | 'stability' | 'surface' | 'weight';
  left: string;
  right: string;
}

function primaryCategory(
  item: ExplorerProduct,
  locale: SupportedLocale,
): string {
  const category = item.product.categories[0];
  if (!category) return '—';
  return categoryLabel(
    category.id,
    resolveLocalizedText(category.label, locale).value,
    locale,
  );
}

function surfaces(item: ExplorerProduct): string {
  return item.product.specifications.surfaces.value?.join(', ') ?? '—';
}

function drop(item: ExplorerProduct): string {
  const value = item.product.specifications.heelToToeDrop.value;
  return value ? `${value.amount} ${value.unit}` : '—';
}

function weight(item: ExplorerProduct): string {
  return item.weight
    ? `${item.weight.amount} ${item.weight.unit} (${item.weight.referenceSize})`
    : '—';
}

export function compareProducts(
  left: ExplorerProduct,
  right: ExplorerProduct,
  locale: SupportedLocale,
): ComparisonRow[] {
  const leftWeight = left.weight;
  const rightWeight = right.weight;
  const comparableWeight =
    leftWeight !== null &&
    rightWeight !== null &&
    leftWeight.referenceSize === rightWeight.referenceSize;

  const rows: ComparisonRow[] = [
    {
      key: 'category',
      left: primaryCategory(left, locale),
      right: primaryCategory(right, locale),
      difference:
        primaryCategory(left, locale) !== primaryCategory(right, locale),
    },
    {
      key: 'surface',
      left: surfaces(left),
      right: surfaces(right),
      difference: surfaces(left) !== surfaces(right),
    },
    {
      key: 'stability',
      left: stabilityLabel(
        left.product.specifications.stability.value ?? 'unknown',
        locale,
      ),
      right: stabilityLabel(
        right.product.specifications.stability.value ?? 'unknown',
        locale,
      ),
      difference:
        left.product.specifications.stability.value !==
        right.product.specifications.stability.value,
    },
    {
      key: 'drop',
      left: drop(left),
      right: drop(right),
      difference: drop(left) !== drop(right),
    },
    {
      key: 'weight',
      left: weight(left),
      right: weight(right),
      difference: comparableWeight
        ? leftWeight.amount !== rightWeight.amount
        : null,
    },
  ];

  return rows;
}

export function comparisonSummary(
  left: ExplorerProduct,
  right: ExplorerProduct,
  locale: SupportedLocale,
): string {
  const leftCategory = primaryCategory(left, locale);
  const rightCategory = primaryCategory(right, locale);
  const leftSurface = surfaces(left);
  const rightSurface = surfaces(right);
  const leftDrop = left.product.specifications.heelToToeDrop.value?.amount;
  const rightDrop = right.product.specifications.heelToToeDrop.value?.amount;
  const dropDifference =
    leftDrop !== undefined && rightDrop !== undefined
      ? Math.abs(leftDrop - rightDrop)
      : null;

  const summaries = {
    en:
      leftCategory === rightCategory && leftSurface === rightSurface
        ? `${left.product.model} and ${right.product.model} share a ${leftCategory.toLocaleLowerCase(locale)} role on ${leftSurface.toLocaleLowerCase(locale)} surfaces${dropDifference ? `, with a ${dropDifference} mm drop difference` : ''}.`
        : `${left.product.model} is a ${leftCategory.toLocaleLowerCase(locale)} option for ${leftSurface.toLocaleLowerCase(locale)}, while ${right.product.model} is oriented toward ${rightCategory.toLocaleLowerCase(locale)} use on ${rightSurface.toLocaleLowerCase(locale)}${dropDifference ? `; their drops differ by ${dropDifference} mm` : ''}.`,
    de:
      leftCategory === rightCategory && leftSurface === rightSurface
        ? `${left.product.model} und ${right.product.model} teilen den Einsatzzweck ${leftCategory} auf ${leftSurface}${dropDifference ? `; die Sprengung unterscheidet sich um ${dropDifference} mm` : ''}.`
        : `${left.product.model} ist für ${leftCategory} auf ${leftSurface} ausgelegt, während ${right.product.model} auf ${rightCategory} auf ${rightSurface} zielt${dropDifference ? `; die Sprengung unterscheidet sich um ${dropDifference} mm` : ''}.`,
    fr:
      leftCategory === rightCategory && leftSurface === rightSurface
        ? `${left.product.model} et ${right.product.model} partagent un usage ${leftCategory} sur ${leftSurface}${dropDifference ? `, avec ${dropDifference} mm d’écart de drop` : ''}.`
        : `${left.product.model} vise un usage ${leftCategory} sur ${leftSurface}, tandis que ${right.product.model} est orientée ${rightCategory} sur ${rightSurface}${dropDifference ? ` ; leur drop diffère de ${dropDifference} mm` : ''}.`,
  } as const;

  return summaries[locale];
}
