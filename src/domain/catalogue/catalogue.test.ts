import { describe, expect, it } from 'vitest';

import { confidenceForEvidence, resolveFactProvenance } from './evidence';
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
      surfaceFamilies: {
        value: ['road'],
        evidence: {
          status: 'derived',
          sourceIds: ['official-source'],
          note: 'Normalized from the published surface.',
        },
      },
      terrainProfiles: {
        value: [],
        evidence: {
          status: 'derived',
          sourceIds: ['official-source'],
          note: 'Terrain profiles do not apply to this road shoe.',
        },
      },
      stability: {
        value: 'neutral',
        evidence: { status: 'verified', sourceIds: ['official-source'] },
      },
      maximumDistance: {
        value: { amount: 10, unit: 'km' },
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

  it('requires provenance for non-pending facts and an explanation for derived values', () => {
    const product = shoe();
    product.specifications.maximumDistance.evidence = {
      status: 'derived',
      sourceIds: [],
    };

    expect(() => parseProduct(product)).toThrow(
      /non-pending evidence requires at least one source|derived evidence must explain/,
    );
  });

  it('accepts a published maximum stack when heel and forefoot are unavailable', () => {
    const product = shoe();
    product.specifications.stackHeight = {
      value: { maximum: 20, unit: 'mm' },
      evidence: { status: 'verified', sourceIds: ['official-source'] },
    };

    const parsed = parseProduct(product);
    expect(parsed.kind).toBe('shoe');
    if (parsed.kind !== 'shoe') throw new Error('Expected a shoe product');
    expect(parsed.specifications.stackHeight.value).toEqual({
      maximum: 20,
      unit: 'mm',
    });
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

describe('fact provenance and confidence', () => {
  it('maps evidence status to a stable confidence level', () => {
    expect(
      ['verified', 'derived', 'fallback', 'pending'].map((status) =>
        confidenceForEvidence({
          status: status as 'verified' | 'derived' | 'fallback' | 'pending',
          sourceIds: status === 'pending' ? [] : ['official-source'],
        }),
      ),
    ).toEqual(['high', 'medium', 'low', 'unknown']);
  });

  it('resolves a fact to the exact supporting product source', () => {
    const product = shoe();
    expect(
      resolveFactProvenance(
        product,
        product.specifications.maximumDistance.evidence,
      ),
    ).toEqual(
      expect.objectContaining({
        confidence: 'high',
        status: 'verified',
        sources: [expect.objectContaining({ id: 'official-source' })],
      }),
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
