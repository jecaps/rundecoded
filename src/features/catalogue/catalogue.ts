import productsJson from '@/content/catalogue/products.json';
import {
  validateCatalogue,
  type ShoeProduct,
  type VerificationStatus,
} from '@/domain/catalogue';

export interface ExplorerWeight {
  amount: number;
  referenceSize: string;
  sourceUrl: string | null;
  status: VerificationStatus;
  unit: 'g';
}

export interface ExplorerProduct {
  product: ShoeProduct;
  weight: ExplorerWeight | null;
}

function explorerWeight(product: ShoeProduct): ExplorerWeight | null {
  const value = product.specifications.weight.value;
  if (!value) return null;
  const source = product.sources.find((candidate) =>
    product.specifications.weight.evidence.sourceIds.includes(candidate.id),
  );
  return {
    ...value,
    sourceUrl: source?.url ?? null,
    status: product.specifications.weight.evidence.status,
  };
}

export function getProductCatalogue(): ExplorerProduct[] {
  return validateCatalogue(productsJson)
    .products.filter(
      (product): product is ShoeProduct => product.kind === 'shoe',
    )
    .map((product) => ({ product, weight: explorerWeight(product) }));
}
