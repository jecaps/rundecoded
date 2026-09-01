import { describe, expect, it } from 'vitest';

import { resolveLocalizedText } from './localization';
import type { ShoeProduct } from './schema';
import {
  CatalogueValidationError,
  parseProduct,
  validateCatalogue,
} from './validation';

function shoe(overrides: Partial<ShoeProduct> = {}): ShoeProduct {
  return {
    schemaVersion: 1,
    id: 'example-shoe',
    kind: 'shoe',
    lifecycle: 'active',
    brand: { id: 'example', name: 'Example' },
    model: 'Shoe',
    categories: [
      {
        id: 'daily-training',
        label: { en: 'Daily training', de: null, fr: null },
      },
    ],
    copy: {
      bestFor: {
        en: 'Daily runs',
        de: 'Tägliche Läufe',
        fr: 'Sorties quotidiennes',
      },
    },
    technologies: {
      value: null,
      evidence: { status: 'pending', sourceIds: [], note: 'Research needed.' },
    },
    images: [],
    sources: [
      {
        id: 'official-source',
        type: 'manufacturer',
        label: 'Official source',
        url: 'https://example.com/shoe',
        checkedAt: '2026-08-31',
        status: 'verified',
      },
    ],
    comparables: [],
    specifications: {
      surfaces: {
        value: ['Road'],
        evidence: { status: 'verified', sourceIds: ['official-source'] },
      },
      stability: {
        value: 'neutral',
        evidence: { status: 'verified', sourceIds: ['official-source'] },
      },
      heelToToeDrop: {
        value: { amount: 8, unit: 'mm' },
        evidence: { status: 'verified', sourceIds: ['official-source'] },
      },
      stackHeight: {
        value: null,
        evidence: {
          status: 'pending',
          sourceIds: [],
          note: 'Research needed.',
        },
      },
      weight: {
        value: null,
        evidence: {
          status: 'pending',
          sourceIds: [],
          note: 'Research needed.',
        },
      },
      fit: {
        value: null,
        evidence: {
          status: 'pending',
          sourceIds: [],
          note: 'Research needed.',
        },
      },
      construction: {
        value: null,
        evidence: {
          status: 'pending',
          sourceIds: [],
          note: 'Research needed.',
        },
      },
    },
    ...overrides,
  };
}

describe('product catalogue validation', () => {
  it('accepts explicit pending research without failing the record', () => {
    expect(parseProduct(shoe()).technologies.evidence.status).toBe('pending');
  });

  it('reports the record name and invalid field', () => {
    const invalid = {
      ...shoe(),
      specifications: {
        ...shoe().specifications,
        heelToToeDrop: {
          value: { amount: -2, unit: 'mm' },
          evidence: { status: 'verified', sourceIds: ['official-source'] },
        },
      },
    };
    expect(() => parseProduct(invalid, 'Example Shoe')).toThrow(
      /Example Shoe: specifications\.heelToToeDrop\.value\.amount/,
    );
  });

  it('requires an explicit value or null for every supported language', () => {
    const invalid = {
      ...shoe(),
      copy: { bestFor: { en: 'Daily runs', de: 'Tägliche Läufe' } },
    };
    expect(() => parseProduct(invalid, 'Missing French copy')).toThrow(
      /Missing French copy: copy\.bestFor\.fr/,
    );
  });

  it('rejects shoe-only specifications on future product kinds', () => {
    const { specifications, ...shared } = shoe();
    expect(specifications).toBeDefined();
    expect(() =>
      parseProduct({ ...shared, kind: 'vest', attributes: {}, specifications }),
    ).toThrow(CatalogueValidationError);
  });

  it('detects duplicate IDs, category labels, and broken comparables', () => {
    const duplicateCategories = shoe({
      categories: [
        {
          id: 'daily-training',
          label: { en: 'Daily training', de: null, fr: null },
        },
        {
          id: 'another-id',
          label: { en: 'Daily training', de: null, fr: null },
        },
      ],
      comparables: ['missing-shoe'],
    });
    expect(() => validateCatalogue([duplicateCategories, shoe()])).toThrow(
      /duplicate product ID|duplicate category ID or English label|unknown comparable product/,
    );
  });
});

describe('localized content', () => {
  it('returns localized content without fallback when available', () => {
    expect(
      resolveLocalizedText({ en: 'Road', de: 'Straße', fr: null }, 'de'),
    ).toEqual({
      value: 'Straße',
      requestedLocale: 'de',
      resolvedLocale: 'de',
      usedFallback: false,
    });
  });

  it('makes English fallback explicit when a translation is missing', () => {
    expect(
      resolveLocalizedText({ en: 'Road', de: null, fr: null }, 'fr'),
    ).toEqual({
      value: 'Road',
      requestedLocale: 'fr',
      resolvedLocale: 'en',
      usedFallback: true,
    });
  });
});
