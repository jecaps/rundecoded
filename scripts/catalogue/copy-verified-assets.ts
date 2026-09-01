import { access, copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const sourceIndex = process.argv.indexOf('--source-root');
const sourceRoot =
  sourceIndex >= 0 && process.argv[sourceIndex + 1]
    ? resolve(process.argv[sourceIndex + 1])
    : null;

if (!sourceRoot) {
  throw new Error(
    'Provide the audited legacy repository with --source-root <path>.',
  );
}

const products = JSON.parse(
  await readFile(
    resolve(projectRoot, 'src/content/catalogue/products.json'),
    'utf8',
  ),
) as Array<{
  id: string;
  images: Array<{
    localPath: string | null;
    status: 'verified' | 'fallback' | 'pending';
  }>;
}>;
const assets = products.flatMap((product) =>
  product.images
    .filter((image) => image.status === 'verified')
    .map((image) => ({ productId: product.id, localPath: image.localPath })),
);

for (const asset of assets) {
  if (!asset.localPath) {
    throw new Error(`${asset.productId} has a verified image without a path.`);
  }
  const source = resolve(sourceRoot, asset.localPath);
  const destination = resolve(projectRoot, 'public', asset.localPath);
  if (!source.startsWith(`${sourceRoot}/`))
    throw new Error(`Unsafe source path: ${asset.localPath}`);
  if (!destination.startsWith(`${resolve(projectRoot, 'public')}/`))
    throw new Error(`Unsafe destination path: ${asset.localPath}`);
  await access(source);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

console.log(`Copied ${assets.length} verified catalogue assets.`);
