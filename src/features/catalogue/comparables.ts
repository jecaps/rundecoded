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
  const currentCategories = current.product.categories;
  const currentSurfaces = current.product.surfaceTags;
  const currentDrop = current.product.specifications.dropMm;

  const primaryCategory = current.product.categories[0];
  const rankedCandidates = candidates
    .filter(({ product }) => product.id !== current.product.id)
    .map((candidate) => {
      const candidateCategories = candidate.product.categories;
      const candidateSurfaces = candidate.product.surfaceTags;
      const candidateDrop = candidate.product.specifications.dropMm;
      const sharedCategories = sharedValues(
        currentCategories,
        candidateCategories,
      );
      const sharedSurfaces = sharedValues(currentSurfaces, candidateSurfaces);
      const sameStability =
        current.product.stability === candidate.product.stability;
      const dropDistance =
        currentDrop !== null && candidateDrop !== null
          ? Math.abs(currentDrop - candidateDrop)
          : null;

      return {
        candidate,
        score:
          sharedCategories * 5 +
          sharedSurfaces * 5 +
          (sameStability ? 2 : 0) +
          (dropDistance === null ? 0 : Math.max(0, 2 - dropDistance / 2)) +
          (candidate.product.brand !== current.product.brand ? 0.5 : 0),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.candidate.product.model.localeCompare(
          right.candidate.product.model,
          locale,
        ),
    );
  const samePrimaryCategory = rankedCandidates.filter(
    ({ candidate }) => candidate.product.categories[0] === primaryCategory,
  );
  const preferredCandidates =
    samePrimaryCategory.length >= limit
      ? samePrimaryCategory
      : [
          ...samePrimaryCategory,
          ...rankedCandidates.filter(
            ({ candidate }) =>
              candidate.product.categories[0] !== primaryCategory,
          ),
        ];

  return preferredCandidates.slice(0, limit).map(({ candidate }) => candidate);
}
