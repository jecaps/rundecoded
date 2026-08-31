import { resolveLocalizedText, type SupportedLocale } from '@/domain/catalogue';

import { categoryLabel, stabilityLabel } from './copy';
import type { ExplorerProduct } from './slice';

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
