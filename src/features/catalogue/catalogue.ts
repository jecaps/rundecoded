import productsJson from '@/content/catalogue/products.json';
import { catalogueShoesSchema, type CatalogueShoe } from '@/domain/catalogue';

export interface ExplorerWeight {
  amount: number;
  referenceSize: string | null;
  unit: 'g';
}

export interface ExplorerProduct {
  product: CatalogueShoe;
  weight: ExplorerWeight | null;
}

function explorerWeight(product: CatalogueShoe): ExplorerWeight | null {
  const amount = product.specifications.weightG;
  if (amount === null) return null;
  return {
    amount,
    referenceSize: product.specifications.weightReferenceSize,
    unit: 'g',
  };
}

export function getProductCatalogue(): ExplorerProduct[] {
  return catalogueShoesSchema.parse(productsJson).map((product) => ({
    product,
    weight: explorerWeight(product),
  }));
}
