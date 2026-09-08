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

  it('uses recorded technical measurements with exact-model provenance', () => {
    const result = migrateRows(
      [
        {
          ...productRow,
          brand: 'ADIDAS',
          model: 'Runblaze',
          drop: '–',
        },
      ],
      [],
    );
    const product = result.products[0];
    const source = product?.sources.find((item) =>
      item.id.endsWith('book-monitor-source'),
    );

    expect(source).toEqual(
      expect.objectContaining({
        status: 'verified',
        type: 'legacy-workbook',
        url: null,
      }),
    );
    expect(product?.specifications.heelToToeDrop).toEqual(
      expect.objectContaining({
        value: { amount: 10, unit: 'mm' },
        evidence: expect.objectContaining({
          status: 'verified',
          sourceIds: [source?.id],
        }),
      }),
    );
    expect(product?.specifications.stackHeight.value).toEqual({
      heel: 33,
      forefoot: 23,
      unit: 'mm',
    });
    expect(product?.specifications.weight.value).toEqual({
      amount: 274,
      referenceSize: 'Men; size not stated',
      unit: 'g',
    });
    expect(result.warnings).not.toContainEqual(
      expect.objectContaining({
        recordId: 'adidas-runblaze',
        field: 'specifications.heelToToeDrop',
      }),
    );
  });

  it('records the Book Monitor maximum distances for Adidas trail shoes', () => {
    const result = migrateRows(
      [
        {
          ...productRow,
          brand: 'ADIDAS',
          model: 'Adizero Agravic Speed 2',
        },
        {
          ...productRow,
          brand: 'ADIDAS',
          model: 'Terrex Agravic 4',
        },
      ],
      [],
    );
    const speed = result.products.find(
      ({ id }) => id === 'adidas-adizero-agravic-speed-2',
    );
    const agravic = result.products.find(
      ({ id }) => id === 'adidas-terrex-agravic-4',
    );

    expect(speed?.specifications.maximumDistance).toEqual(
      expect.objectContaining({
        value: { amount: 100, unit: 'km' },
        evidence: expect.objectContaining({ status: 'verified' }),
      }),
    );
    expect(agravic?.specifications.maximumDistance).toEqual(
      expect.objectContaining({
        value: { amount: 80, unit: 'km' },
        evidence: expect.objectContaining({ status: 'verified' }),
      }),
    );
  });

  it('records the confirmed Kipsonic zero drop', () => {
    const result = migrateRows(
      [
        {
          ...productRow,
          brand: 'KIPRUN',
          model: 'Kipsonic Long',
          drop: '–',
        },
      ],
      [],
    );
    const product = result.products[0];

    expect(product?.specifications.heelToToeDrop).toEqual(
      expect.objectContaining({
        value: { amount: 0, unit: 'mm' },
        evidence: expect.objectContaining({
          status: 'verified',
        }),
      }),
    );
    expect(product?.specifications.weight.value).toEqual({
      amount: 158,
      referenceSize: 'EU 42',
      unit: 'g',
    });
    expect(product?.specifications.maximumDistance.value).toEqual({
      amount: 10,
      unit: 'km',
    });
    expect(result.warnings).not.toContainEqual(
      expect.objectContaining({
        recordId: 'kiprun-kipsonic-long',
        field: 'specifications.heelToToeDrop',
      }),
    );
  });

  it('records Gel-Kanaku measurements from the Decathlon description', () => {
    const result = migrateRows(
      [
        {
          ...productRow,
          brand: 'ASICS',
          model: 'Gel Kanaku 6',
          drop: '–',
        },
      ],
      [
        {
          brand: 'Asics',
          model: 'Gel Kanaku 6',
          image_status: 'verified-image',
          product_page:
            'https://www.decathlon.de/p/trailrunningschuhe-herren-asics-gel-kanaku-6-blau-grau/364874/m9029775',
          source_image: 'https://contents.mediadecathlon.com/kanaku.jpg',
          workbook_advantage: 'AMPLIFOAM, GEL, 3.5 mm lugs',
        },
      ],
    );
    const product = result.products[0];

    expect(product?.specifications.heelToToeDrop.value).toEqual({
      amount: 8,
      unit: 'mm',
    });
    expect(product?.specifications.stackHeight.value).toEqual({
      heel: 35,
      forefoot: 27,
      unit: 'mm',
    });
    expect(product?.specifications.weight.value).toEqual({
      amount: 295,
      referenceSize: 'EU 42.5',
      unit: 'g',
    });
    expect(
      product?.sources.find((source) =>
        product.specifications.heelToToeDrop.evidence.sourceIds.includes(
          source.id,
        ),
      ),
    ).toEqual(expect.objectContaining({ status: 'verified' }));
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

  it('records ASICS trail specifications from supplied product pages', () => {
    const result = migrateRows(
      [
        {
          ...productRow,
          brand: 'ASICS',
          model: 'Gel-Sonoma 8 GTX',
        },
        {
          ...productRow,
          brand: 'ASICS',
          model: 'Trabuco 14',
        },
        {
          ...productRow,
          brand: 'ASICS',
          model: 'Trabuco Terra 3',
        },
      ],
      [],
    );
    const sonoma = result.products.find(
      ({ id }) => id === 'asics-gel-sonoma-8-gtx',
    );
    const trabuco = result.products.find(({ id }) => id === 'asics-trabuco-14');
    const terra = result.products.find(
      ({ id }) => id === 'asics-trabuco-terra-3',
    );

    expect(sonoma?.specifications).toEqual(
      expect.objectContaining({
        heelToToeDrop: expect.objectContaining({
          value: { amount: 8, unit: 'mm' },
        }),
        stackHeight: expect.objectContaining({
          value: { heel: 36, forefoot: 28, unit: 'mm' },
        }),
        weight: expect.objectContaining({
          value: { amount: 325, referenceSize: 'EU 42.5', unit: 'g' },
        }),
        maximumDistance: expect.objectContaining({
          value: { amount: 40, unit: 'km' },
        }),
      }),
    );
    expect(trabuco?.technologies).toEqual(
      expect.objectContaining({
        value: expect.arrayContaining([
          'FF Blast Max foam',
          'Rock Protection Plate',
        ]),
      }),
    );
    expect(trabuco?.specifications.maximumDistance.value).toEqual({
      amount: 80,
      unit: 'km',
    });
    expect(terra?.specifications).toEqual(
      expect.objectContaining({
        heelToToeDrop: expect.objectContaining({
          value: { amount: 8, unit: 'mm' },
        }),
        stackHeight: expect.objectContaining({
          value: { heel: 35, forefoot: 27, unit: 'mm' },
        }),
        weight: expect.objectContaining({
          value: { amount: 279, referenceSize: 'EU 39', unit: 'g' },
        }),
        maximumDistance: expect.objectContaining({
          value: { amount: 80, unit: 'km' },
        }),
      }),
    );
  });

  it('prefers supplied product-page distances over range-chart fallbacks', () => {
    const cases = [
      ['hoka-speedgoat-7', 'HOKA', 'Speedgoat 7', 170],
      ['hoka-torrent-4', 'HOKA', 'Torrent 4', 60],
      ['new-balance-hierro-v9', 'NEW BALANCE', 'Hierro v9', 170],
      ['new-balance-rebel-trail', 'NEW BALANCE', 'Rebel Trail', 170],
      ['salomon-aero-blaze-3-grvl', 'SALOMON', 'Aero Blaze 3 GRVL', 40],
      ['salomon-genesis', 'SALOMON', 'Genesis', 80],
      ['saucony-peregrine-16', 'SAUCONY', 'Peregrine 16', 60],
    ] as const;
    const result = migrateRows(
      cases.map(([, brand, model]) => ({ ...productRow, brand, model })),
      [],
    );

    for (const [id, , , amount] of cases) {
      const product = result.products.find((item) => item.id === id);
      expect(product?.specifications.maximumDistance).toEqual(
        expect.objectContaining({
          value: { amount, unit: 'km' },
          evidence: expect.objectContaining({ status: 'verified' }),
        }),
      );
    }

    for (const id of ['salomon-aero-blaze-3-grvl', 'salomon-genesis']) {
      const product = result.products.find((item) => item.id === id);
      expect(
        product?.sources.find((source) =>
          product.specifications.maximumDistance.evidence.sourceIds.includes(
            source.id,
          ),
        )?.type,
      ).toBe('retailer-product');
    }
  });

  it('uses Book Monitor distances only when no product page was supplied', () => {
    const cases = [
      ['salomon-speedcross-peak', 'Speedcross Peak', 42],
      ['salomon-speedcross-peak-gtx', 'Speedcross Peak GTX', 42],
      ['salomon-ultra-flow-2', 'Ultra Flow 2', 42],
      ['salomon-supraglide', 'Supraglide', 20],
      ['salomon-ultra-glide-4', 'Ultra Glide 4', 100],
    ] as const;
    const result = migrateRows(
      cases.map(([, model]) => ({ ...productRow, brand: 'SALOMON', model })),
      [],
    );

    for (const [id, , amount] of cases) {
      const product = result.products.find((item) => item.id === id);
      expect(product?.specifications.maximumDistance).toEqual(
        expect.objectContaining({
          value: { amount, unit: 'km' },
          evidence: expect.objectContaining({ status: 'verified' }),
        }),
      );
    }
  });
});
