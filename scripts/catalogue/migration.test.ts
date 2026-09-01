import { describe, expect, it } from 'vitest';

import { migrateRows } from './migration';

const productRow = {
  brand: 'NEW BALANCE',
  model: 'FuelCell Propel v5',
  primary_category: 'FAST TRAINING',
  secondary_category: 'FAST TRAINING',
  surface: 'Road',
  stability: 'Neutral',
  drop: '6 mm',
  technologies: 'FuelCell | TPU plate',
  best_for_en: 'Fast daily training',
  best_for_de: 'Schnelles tägliches Training',
  best_for_fr: 'Entraînement quotidien rapide',
  display_image: 'assets/shoes/new-balance--fuelcell-propel-v5.webp',
};

const provenanceRows = [
  {
    brand: 'New Balance',
    model: 'FuelCell Propel v5',
    image_status: 'verified-image',
    product_page: 'https://www.decathlon.co.uk/product',
    source_image: 'https://contents.mediadecathlon.com/image.jpg',
    workbook_advantage: 'FuelCell',
  },
  {
    brand: 'New Balance',
    model: 'Propel v5',
    image_status: 'verified-image',
    product_page: 'https://www.decathlon.de/product',
    source_image: 'https://contents.mediadecathlon.com/image.jpg',
    workbook_advantage: 'FuelCell',
  },
];

describe('legacy catalogue migration', () => {
  it('is deterministic and reconciles every source row', () => {
    const first = migrateRows([productRow], provenanceRows);
    const second = migrateRows([productRow], provenanceRows);

    expect(first).toEqual(second);
    expect(first.products).toHaveLength(1);
    expect(first.reconciliation).toHaveLength(3);
    expect(
      first.reconciliation.filter((entry) => entry.outcome === 'merged-alias'),
    ).toHaveLength(1);
  });

  it('deduplicates categories with an actionable warning', () => {
    const result = migrateRows([productRow], provenanceRows);
    expect(result.products[0]?.categories).toHaveLength(1);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        field: 'categories',
        message: expect.stringContaining('duplicate'),
      }),
    );
  });

  it('preserves product and image provenance through an alias merge', () => {
    const result = migrateRows([productRow], provenanceRows);
    const product = result.products[0];
    expect(
      product?.sources.filter((source) => source.type === 'retailer-product'),
    ).toHaveLength(2);
    expect(product?.images[0]).toEqual(
      expect.objectContaining({
        status: 'verified',
        sourceUrl: provenanceRows[0]?.source_image,
      }),
    );
  });

  it('keeps missing measurements as explicit pending research', () => {
    const result = migrateRows([{ ...productRow, drop: '–' }], provenanceRows);
    const specifications = result.products[0]?.specifications;
    expect(specifications?.heelToToeDrop).toEqual(
      expect.objectContaining({
        value: null,
        evidence: expect.objectContaining({ status: 'pending' }),
      }),
    );
    expect(specifications?.stackHeight.evidence.status).toBe('pending');
    expect(specifications?.weight.evidence.status).toBe('pending');
    expect(specifications?.fit.evidence.status).toBe('pending');
    expect(specifications?.construction.evidence.status).toBe('pending');
  });

  it('normalizes legacy stability labels and fully localizes categories', () => {
    const result = migrateRows(
      [
        {
          ...productRow,
          primary_category: 'STABILITY & GUIDANCE',
          secondary_category: 'DAILY TRAINER',
          stability: 'Stability shoe',
        },
      ],
      provenanceRows,
    );
    const product = result.products[0];
    expect(product?.specifications.stability.value).toBe('stability');
    expect(product?.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'stability-and-guidance',
          label: expect.objectContaining({
            en: 'Stability & Guidance',
            de: 'Stabilität & Führung',
            fr: 'Stabilité et guidage',
          }),
        }),
      ]),
    );
  });
});
