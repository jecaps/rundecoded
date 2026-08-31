import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '.astro/',
      'dist/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: [
      '*.config.{js,mjs,ts}',
      'scripts/**/*.{js,mjs,ts}',
      'site.config.mjs',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    ...reactHooks.configs.flat['recommended-latest'],
    files: ['src/**/*.{ts,tsx}'],
  },
];
