import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { site } from '../site.config.mjs';

const base = `${site.base.replace(/\/+$/, '')}/`;
const routes = {
  catalogue: `${base}catalogue/`,
  runningBasics: `${base}running-basics/`,
};

const routeFiles = [
  ['Catalogue', 'catalogue/index.html'],
  ['Running Basics', 'running-basics/index.html'],
];

for (const [routeName, relativePath] of routeFiles) {
  const html = await readFile(join('dist', relativePath), 'utf8');
  const absoluteAssetOrLink = /\b(?:href|src)="(\/[^"#?]*)/g;

  for (const match of html.matchAll(absoluteAssetOrLink)) {
    const path = match[1];

    if (!path.startsWith(base)) {
      throw new Error(`${routeName} contains a path outside ${base}: ${path}`);
    }
  }

  for (const expectedRoute of Object.values(routes)) {
    if (!html.includes(`href="${expectedRoute}"`)) {
      throw new Error(`${routeName} does not link to ${expectedRoute}`);
    }
  }
}

const rootHtml = await readFile(join('dist', 'index.html'), 'utf8');

if (!rootHtml.includes(routes.catalogue)) {
  throw new Error(`The root redirect does not target ${routes.catalogue}`);
}

console.log(`Pages build verified for ${base}`);
