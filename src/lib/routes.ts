const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

function withBase(path: string) {
  return `${baseUrl}${path.replace(/^\/+/, '')}`;
}

function normalizePath(path: string) {
  return path === '/' ? path : path.replace(/\/+$/, '');
}

export const routes = {
  home: baseUrl,
  catalogue: withBase('catalogue/'),
  runningBasics: withBase('running-basics/'),
} as const;

export function isCurrentRoute(pathname: string, route: string) {
  return normalizePath(pathname) === normalizePath(route);
}
