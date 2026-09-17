import { writeFile } from 'node:fs/promises';

import productsJson from '../../src/content/catalogue/products.json';
import { prototypeProductDetails } from '../../src/content/catalogue/prototype-product-details';

const products = productsJson.map((product) => {
  const legacyDetails = prototypeProductDetails[product.id];
  if (!legacyDetails) return product;

  return {
    ...product,
    details: {
      ...product.details,
      construction: legacyDetails.construction,
    },
  };
});

const missing = products
  .filter((product) => !('construction' in product.details))
  .map((product) => product.id);

await writeFile(
  new URL('../../src/content/catalogue/products.json', import.meta.url),
  `${JSON.stringify(products, null, 2)}\n`,
);

console.log(
  `Migrated construction details for ${products.length - missing.length} of ${products.length} products.`,
);
if (missing.length > 0) {
  console.log(`Missing construction details: ${missing.join(', ')}`);
}
