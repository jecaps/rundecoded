import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import { site } from './site.config.mjs';

export default defineConfig({
  site: site.origin,
  base: site.base,
  trailingSlash: 'always',
  devToolbar: { enabled: process.env.RUNDECODED_E2E !== '1' },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
