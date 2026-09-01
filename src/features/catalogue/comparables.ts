import type { SupportedLocale } from '@/domain/catalogue';

import type { ExplorerProduct } from './catalogue';

function sharedValues(left: string[], right: string[]): number {
  const rightValues = new Set(right);
  return left.filter((value) => rightValues.has(value)).length;
}

export function rankComparableProducts(
  current: ExplorerProduct,
  candidates: ExplorerProduct[],
  locale: SupportedLocale,
  limit = 3,
): ExplorerProduct[] {
  const currentCategories = current.product.categories.map(({ id }) => id);
  const currentSurfaces = current.product.specifications.surfaces.value ?? [];
  const currentDrop =
    current.product.specifications.heelToToeDrop.value?.amount ?? null;

  return candidates
    .filter(({ product }) => product.id !== current.product.id)
    .map((candidate) => {
      const candidateCategories = candidate.product.categories.map(
        ({ id }) => id,
      );
      const candidateSurfaces =
        candidate.product.specifications.surfaces.value ?? [];
      const candidateDrop =
        candidate.product.specifications.heelToToeDrop.value?.amount ?? null;
      const sharedCategories = sharedValues(
        currentCategories,
        candidateCategories,
      );
      const sharedSurfaces = sharedValues(currentSurfaces, candidateSurfaces);
      const sameStability =
        current.product.specifications.stability.value ===
        candidate.product.specifications.stability.value;
      const explicitComparable = current.product.comparables.includes(
        candidate.product.id,
      );
      const dropDistance =
        currentDrop !== null && candidateDrop !== null
          ? Math.abs(currentDrop - candidateDrop)
          : null;

      return {
        candidate,
        score:
          sharedCategories * 5 +
          sharedSurfaces * 3 +
          (sameStability ? 2 : 0) +
          (dropDistance === null ? 0 : Math.max(0, 2 - dropDistance / 2)) +
          (explicitComparable ? 12 : 0) +
          (candidate.product.brand.name !== current.product.brand.name
            ? 0.5
            : 0),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.candidate.product.model.localeCompare(
          right.candidate.product.model,
          locale,
        ),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
