import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';

const root = resolve('dist');
const basePath = '/rundecoded';
const portFlagIndex = process.argv.indexOf('--port');
const port = Number(
  portFlagIndex === -1
    ? (process.env.PORT ?? 4321)
    : process.argv[portFlagIndex + 1],
);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function pathnameWithoutBase(requestUrl) {
  const pathname = decodeURIComponent(
    new URL(requestUrl, 'http://localhost').pathname,
  );
  return pathname === basePath
    ? '/'
    : pathname.startsWith(`${basePath}/`)
      ? pathname.slice(basePath.length)
      : pathname;
}

async function resolveFile(requestUrl) {
  const pathname = pathnameWithoutBase(requestUrl);
  const candidate = resolve(root, `.${normalize(pathname)}`);
  const relativePath = relative(root, candidate);
  if (
    relativePath.startsWith('..') ||
    relativePath.includes(`..${normalize('/')}`)
  ) {
    return null;
  }

  const candidates = [candidate];
  if (pathname.endsWith('/')) candidates.push(join(candidate, 'index.html'));

  for (const file of candidates) {
    try {
      const details = await stat(file);
      if (details.isFile()) return file;
    } catch {
      // Try the next candidate and return a 404 when neither exists.
    }
  }

  return null;
}

const server = createServer(async (request, response) => {
  try {
    const file = await resolveFile(request.url ?? '/');
    if (!file) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    await access(file);
    const contentType =
      contentTypes[extname(file)] ?? 'application/octet-stream';
    response.writeHead(200, {
      'cache-control': file.includes('/_astro/')
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
      'content-type': contentType,
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}${basePath}/`);
});
