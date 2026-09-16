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
    ).toHaveLength(3);
    expect(product?.images[0]).toEqual(
      expect.objectContaining({
        status: 'verified',
        sourceUrl: provenanceRows[0]?.source_image,
      }),
    );
  });

  it('keeps missing measurements as explicit pending research', () => {
    const result = migrateRows(
      [{ ...productRow, model: 'Unrecorded Test Shoe', drop: '–' }],
      [],
    );
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

  it('preserves existing product-page distances ahead of the fallback table', () => {
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
        value: { amount: 40, unit: 'km' },
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

  it('uses the supplied range table when no distance is already available', () => {
    const result = migrateRows(
      [
        {
          ...productRow,
          brand: 'ASICS',
          model: 'Gel Nimbus 28',
          best_for_en: 'Maximum-cushion daily trainer',
        },
      ],
      [],
    );
    const distance = result.products[0]?.specifications.maximumDistance;

    expect(distance).toEqual(
      expect.objectContaining({
        value: { amount: 42, unit: 'km' },
        evidence: expect.objectContaining({
          status: 'verified',
          sourceIds: ['asics-gel-nimbus-28-range-table-distance'],
        }),
      }),
    );
  });

  it('carries the Kayano 31 distance forward to Kayano 32 and 33', () => {
    const result = migrateRows(
      ['Gel Kayano 32', 'Gel Kayano 33'].map((model) => ({
        ...productRow,
        brand: 'ASICS',
        model,
      })),
      [],
    );

    for (const product of result.products) {
      expect(product.specifications.maximumDistance).toEqual(
        expect.objectContaining({
          value: { amount: 42, unit: 'km' },
          evidence: expect.objectContaining({
            status: 'derived',
            sourceIds: [`${product.id}-kayano-31-distance-reference`],
          }),
        }),
      );
    }
  });

  it('records the confirmed remaining catalogue distances', () => {
    const cases = [
      ['BROOKS', 'Ghost 18', 42, 'derived'],
      ['BROOKS', 'Ghost Max 4', 42, 'derived'],
      ['BROOKS', 'Range', 170, 'verified'],
      ['PUMA', 'Velocity Nitro 5', 42, 'derived'],
    ] as const;
    const result = migrateRows(
      cases.map(([brand, model]) => ({ ...productRow, brand, model })),
      [],
    );

    for (const [brand, model, amount, status] of cases) {
      const product = result.products.find(
        (item) =>
          item.brand.name === brand[0] + brand.slice(1).toLowerCase() &&
          item.model === model,
      );
      expect(product?.specifications.maximumDistance).toEqual(
        expect.objectContaining({
          value: { amount, unit: 'km' },
          evidence: expect.objectContaining({ status }),
        }),
      );
    }
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
          model: 'Stability Test Shoe',
          primary_category: 'STABILITY & GUIDANCE',
          secondary_category: 'DAILY TRAINER',
          stability: 'Stability shoe',
        },
      ],
      [],
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

  it('prefers supplied product-page distances over range-table fallbacks', () => {
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

  it('preserves Book Monitor distances when already available', () => {
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

  it('records Brooks category and terrain distinctions for recommendations', () => {
    const result = migrateRows(
      [
        { ...productRow, brand: 'BROOKS', model: 'Ghost 17' },
        {
          ...productRow,
          brand: 'BROOKS',
          model: 'Ghost Trail',
          primary_category: 'TRAIL',
          secondary_category: 'TRAIL',
        },
        {
          ...productRow,
          brand: 'BROOKS',
          model: 'Hyperion 3',
          primary_category: 'FAST TRAINING',
          secondary_category: 'RACE',
        },
        {
          ...productRow,
          brand: 'BROOKS',
          model: 'Range',
          primary_category: 'TRAIL',
          secondary_category: 'TRAIL',
        },
      ],
      [],
    );
    const getProduct = (id: string) =>
      result.products.find((product) => product.id === id);

    expect(
      getProduct('brooks-ghost-17')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt']);
    expect(
      getProduct('brooks-ghost-trail')?.specifications.surfaceFamilies.value,
    ).toEqual(['road', 'off-road']);
    expect(
      getProduct('brooks-ghost-trail')?.specifications.terrainProfiles.value,
    ).toEqual(['gravel', 'road-to-trail', 'easy-terrain']);
    expect(
      getProduct('brooks-hyperion-3')?.categories.map(({ id }) => id),
    ).toEqual(['fast-training', 'race']);
    expect(
      getProduct('brooks-range')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain', 'technical-terrain', 'muddy-terrain']);
  });

  it('records the next Brooks, Decathlon, and Hoka surface taxonomy batch', () => {
    const cases = [
      ['BROOKS', 'Revel 9'],
      ['BROOKS', 'Revel Max'],
      ['DECATHLON', 'Jogflow 100.1'],
      ['DECATHLON', 'Jogflow 190 Grip'],
      ['DECATHLON', 'Jogflow 190 Grip WP'],
      ['DECATHLON', 'Jogflow 190 Max'],
      ['DECATHLON', 'Jogflow 190 Premium'],
      ['HOKA', 'Clifton 10'],
      ['HOKA', 'Rincon 4'],
      ['HOKA', 'Speedgoat 7'],
    ] as const;
    const result = migrateRows(
      cases.map(([brand, model]) => ({ ...productRow, brand, model })),
      [],
    );
    const getProduct = (id: string) =>
      result.products.find((product) => product.id === id);

    expect(
      getProduct('decathlon-jogflow-190-grip')?.specifications.surfaceFamilies
        .value,
    ).toEqual(['road', 'off-road']);
    expect(
      getProduct('decathlon-jogflow-190-grip')?.specifications.terrainProfiles
        .value,
    ).toEqual(['road-to-trail', 'easy-terrain']);
    expect(
      getProduct('decathlon-jogflow-190-grip-wp')?.specifications.surfaceTags
        .value,
    ).toEqual([
      'road',
      'asphalt',
      'firm-paths',
      'easy-terrain',
      'muddy-terrain',
    ]);
    expect(
      getProduct('hoka-speedgoat-7')?.specifications.terrainProfiles.value,
    ).toEqual(['technical-terrain', 'muddy-terrain']);
    expect(
      getProduct('hoka-clifton-10')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt']);
    expect(
      getProduct('brooks-revel-max')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt', 'firm-paths']);
    for (const id of [
      'decathlon-jogflow-100-1',
      'decathlon-jogflow-190-grip',
      'decathlon-jogflow-190-grip-wp',
      'decathlon-jogflow-190-max',
      'decathlon-jogflow-190-premium',
    ]) {
      expect(getProduct(id)?.specifications.maximumDistance).toEqual(
        expect.objectContaining({
          value: { amount: 10, unit: 'km' },
          evidence: expect.objectContaining({ status: 'derived' }),
        }),
      );
    }
  });

  it('records verified Hoka and Kiprun terrain profiles without filling unsupported models', () => {
    const cases = [
      ['HOKA', 'Torrent 4', 'TRAIL'],
      ['KIPRUN', 'Kipclimb', 'TRAIL'],
      ['KIPRUN', 'Kipclimb Max', 'TRAIL'],
      ['KIPRUN', 'Kipclimb Race', 'TRAIL RACE'],
      ['KIPRUN', 'Kipclimb WP', 'TRAIL'],
      ['KIPRUN', 'Kipcore', 'DAILY TRAINER'],
      ['KIPRUN', 'Kipcore Gravel', 'TRAIL'],
      ['KIPRUN', 'Kipcore Premium', 'DAILY TRAINER'],
      ['KIPRUN', 'Kipcore WR', 'DAILY TRAINER'],
      ['KIPRUN', 'Kipnext', 'DAILY TRAINER'],
    ] as const;
    const result = migrateRows(
      cases.map(([brand, model, primary_category]) => ({
        ...productRow,
        brand,
        model,
        primary_category,
      })),
      [],
    );
    const getProduct = (id: string) =>
      result.products.find((product) => product.id === id);

    expect(
      getProduct('hoka-torrent-4')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain', 'technical-terrain']);
    expect(
      getProduct('kiprun-kipclimb')?.specifications.terrainProfiles.value,
    ).toEqual(['technical-terrain', 'muddy-terrain']);
    expect(
      getProduct('kiprun-kipclimb-max')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain', 'technical-terrain', 'muddy-terrain']);
    expect(
      getProduct('kiprun-kipcore-gravel')?.specifications.surfaceFamilies.value,
    ).toEqual(['road', 'off-road']);
    expect(
      getProduct('kiprun-kipcore-gravel')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt', 'gravel', 'firm-paths', 'easy-terrain']);
    expect(
      getProduct('kiprun-kipcore-wr')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt', 'firm-paths']);
    expect(
      getProduct('kiprun-kipclimb-race')?.specifications.terrainProfiles.value,
    ).toEqual(['technical-terrain']);
    expect(
      getProduct('kiprun-kipclimb-wp')?.specifications.terrainProfiles.value,
    ).toEqual(['muddy-terrain']);
  });

  it('records the Kipride and Kipsonic taxonomy batch', () => {
    const cases = [
      ['KIPRUN', 'Kipride', 'DAILY TRAINER', 'FAST TRAINING'],
      ['KIPRUN', 'Kipride Gravel', 'TRAIL', 'FAST TRAINING'],
      ['KIPRUN', 'Kipride Max', 'MAX CUSHION', 'DAILY TRAINER'],
      ['KIPRUN', 'Kipride Max Wide', 'MAX CUSHION', 'DAILY TRAINER'],
      ['KIPRUN', 'Kipride Support', 'STABILITY & GUIDANCE', 'SUPPORT'],
      ['KIPRUN', 'Kipride WR', 'DAILY TRAINER', 'NEUTRAL'],
      ['KIPRUN', 'Kipsonic Start', 'TRACK / SPIKES', 'ENTRY LEVEL'],
      ['KIPRUN', 'Kipsonic X-Country', 'TRACK / SPIKES', 'SPIKES'],
      ['KIPRUN', 'Kipsonic Mid', 'TRACK / SPIKES', 'SPIKES'],
      ['KIPRUN', 'Kipsonic Long', 'TRACK / SPIKES', 'CARBON'],
    ] as const;
    const result = migrateRows(
      cases.map(([brand, model, primary_category, secondary_category]) => ({
        ...productRow,
        brand,
        model,
        primary_category,
        secondary_category,
      })),
      [],
    );
    const getProduct = (id: string) =>
      result.products.find((product) => product.id === id);

    expect(
      getProduct('kiprun-kipride-gravel')?.specifications.surfaceFamilies.value,
    ).toEqual(['road', 'off-road']);
    expect(
      getProduct('kiprun-kipride-gravel')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt', 'gravel', 'firm-paths', 'easy-terrain']);
    expect(
      getProduct('kiprun-kipride-gravel')?.specifications.terrainProfiles.value,
    ).toEqual(['gravel', 'road-to-trail', 'easy-terrain']);
    expect(
      getProduct('kiprun-kipride-wr')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt']);
    expect(
      getProduct('kiprun-kipsonic-start')?.specifications.surfaceTags.value,
    ).toEqual(['track', 'cross-country']);
    expect(
      getProduct('kiprun-kipsonic-x-country')?.specifications.surfaceFamilies
        .value,
    ).toEqual(['off-road']);
    expect(
      getProduct('kiprun-kipsonic-mid')?.specifications.surfaceTags.value,
    ).toEqual(['track']);
    expect(
      getProduct('kiprun-kipsonic-long')?.specifications.surfaceTags.value,
    ).toEqual(['track']);
    expect(
      getProduct('kiprun-kipride-max-wide')?.specifications.stackHeight.value,
    ).toEqual({ heel: 42, forefoot: 36, unit: 'mm' });
    expect(
      getProduct('kiprun-kipride-max-wide')?.specifications.weight.value,
    ).toEqual({ amount: 220, referenceSize: 'Size not stated', unit: 'g' });
    expect(
      getProduct('kiprun-kipride-support')?.specifications.stackHeight.value,
    ).toEqual({ heel: 40, forefoot: 34, unit: 'mm' });
    expect(
      getProduct('kiprun-kipride-support')?.specifications.weight.value,
    ).toEqual({ amount: 319, referenceSize: 'EU 42', unit: 'g' });
    expect(
      getProduct('kiprun-kipride-support')?.specifications.surfaceTags.value,
    ).toEqual(['road']);
    expect(
      getProduct('kiprun-kipride-max')?.specifications.weight.value,
    ).toEqual({ amount: 271, referenceSize: 'EU 42', unit: 'g' });
  });

  it('records the verified Kipstorm and Kipsummit taxonomy batch', () => {
    const cases = [
      ['KIPRUN', 'Kipstorm Challenger', 'RACE', 'CARBON'],
      ['KIPRUN', 'Kipstorm Elite', 'RACE', 'CARBON'],
      ['KIPRUN', 'Kipstorm Interval', 'FAST TRAINING', 'NEUTRAL'],
      ['KIPRUN', 'Kipstorm Lab', 'RACE', 'CARBON'],
      ['KIPRUN', 'Kipstorm Pro', 'RACE', 'CARBON'],
      ['KIPRUN', 'Kipstorm Tempo', 'FAST TRAINING', 'NEUTRAL'],
      ['KIPRUN', 'Kipsummit', 'TRAIL', 'TECHNICAL TRAIL'],
      ['KIPRUN', 'Kipsummit Max', 'TRAIL', 'MAX CUSHION'],
    ] as const;
    const result = migrateRows(
      cases.map(([brand, model, primary_category, secondary_category]) => ({
        ...productRow,
        brand,
        model,
        primary_category,
        secondary_category,
      })),
      [],
    );
    const getProduct = (id: string) =>
      result.products.find((product) => product.id === id);

    expect(
      getProduct('kiprun-kipstorm-challenger')?.specifications.surfaceTags
        .value,
    ).toEqual(['road', 'asphalt']);
    expect(
      getProduct('kiprun-kipstorm-interval')?.specifications.surfaceFamilies
        .value,
    ).toEqual(['road', 'track']);
    expect(
      getProduct('kiprun-kipstorm-lab')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt', 'track']);
    expect(
      getProduct('kiprun-kipstorm-tempo')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt']);
    expect(
      getProduct('kiprun-kipsummit')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain', 'technical-terrain']);
    expect(
      getProduct('kiprun-kipsummit-max')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain']);
    expect(
      getProduct('kiprun-kipstorm-elite')?.specifications.stackHeight.value,
    ).toEqual({ heel: 39, forefoot: 34, unit: 'mm' });
  });

  it('records the Kipsummit, Mizuno, and New Balance taxonomy batch', () => {
    const cases = [
      ['KIPRUN', 'Kipsummit Race', 'TRAIL RACE', 'CARBON'],
      ['KIPRUN', 'Kipsummit WP', 'TRAIL', 'TECHNICAL TRAIL'],
      ['MIZUNO', 'Neo Cosmo', 'FAST TRAINING', 'DAILY TRAINER'],
      ['MIZUNO', 'Neo Zen 2', 'FAST TRAINING', 'DAILY TRAINER'],
      ['MIZUNO', 'Wave Impulse', 'DAILY TRAINER', 'NEUTRAL'],
      ['MIZUNO', 'Wave Rider 29', 'DAILY TRAINER', 'NEUTRAL'],
      ['MIZUNO', 'Wave Ultima 17', 'DAILY TRAINER', 'MAX CUSHION'],
      ['NEW BALANCE', '1080 v15', 'MAX CUSHION', 'DAILY TRAINER'],
      ['NEW BALANCE', '520 v9', 'ENTRY LEVEL', 'DAILY TRAINER'],
      ['NEW BALANCE', '840 v1', 'MAX CUSHION', 'DAILY TRAINER'],
    ] as const;
    const result = migrateRows(
      cases.map(([brand, model, primary_category, secondary_category]) => ({
        ...productRow,
        brand,
        model,
        primary_category,
        secondary_category,
      })),
      [],
    );
    const getProduct = (id: string) =>
      result.products.find((product) => product.id === id);

    expect(
      getProduct('kiprun-kipsummit-race')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain']);
    expect(
      getProduct('kiprun-kipsummit-wp')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain', 'technical-terrain', 'muddy-terrain']);
    expect(
      getProduct('mizuno-wave-impulse')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'firm-paths', 'easy-terrain']);
    expect(
      getProduct('mizuno-wave-impulse')?.specifications.terrainProfiles.value,
    ).toEqual(['road-to-trail', 'easy-terrain']);
    expect(getProduct('mizuno-wave-rider-29')?.categories).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'support' })]),
    );
    expect(getProduct('mizuno-wave-ultima-17')?.categories).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'max-cushion' })]),
    );
    expect(
      getProduct('mizuno-neo-zen-2')?.specifications.maximumDistance.value,
    ).toEqual({ amount: 21, unit: 'km' });
    expect(
      getProduct('new-balance-520-v9')?.specifications.maximumDistance.value,
    ).toEqual({ amount: 10, unit: 'km' });
  });

  it('records the New Balance and Puma taxonomy batch', () => {
    const cases = [
      ['NEW BALANCE', 'Ellipse', 'DAILY TRAINER', 'NEUTRAL'],
      ['NEW BALANCE', 'FuelCell Propel v5', 'FAST TRAINING', 'DAILY TRAINER'],
      ['NEW BALANCE', 'FuelCell Rebel v5', 'FAST TRAINING', 'DAILY TRAINER'],
      ['NEW BALANCE', 'Garoe v2', 'TRAIL', 'TECHNICAL TRAIL'],
      ['NEW BALANCE', 'Hierro v9', 'TRAIL', 'MAX CUSHION'],
      ['NEW BALANCE', 'Kaiha v2', 'MAX CUSHION', 'DAILY TRAINER'],
      ['NEW BALANCE', 'More v6', 'MAX CUSHION', 'DAILY TRAINER'],
      ['NEW BALANCE', 'Rebel Trail', 'TRAIL', 'TECHNICAL TRAIL'],
      ['PUMA', 'Deviate Nitro 4', 'SUPER TRAINER', 'CARBON'],
      ['PUMA', 'Velocity Nitro 4', 'DAILY TRAINER', 'FAST TRAINING'],
    ] as const;
    const result = migrateRows(
      cases.map(([brand, model, primary_category, secondary_category]) => ({
        ...productRow,
        brand,
        model,
        primary_category,
        secondary_category,
      })),
      [],
    );
    const getProduct = (id: string) =>
      result.products.find((product) => product.id === id);

    expect(
      getProduct('new-balance-ellipse')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt', 'firm-paths', 'easy-terrain']);
    expect(
      getProduct('new-balance-fuelcell-rebel-v5')?.specifications.surfaceTags
        .value,
    ).toEqual(['road', 'asphalt', 'track']);
    expect(
      getProduct('new-balance-fuelcell-rebel-v5')?.specifications
        .maximumDistance.value,
    ).toEqual({ amount: 21, unit: 'km' });
    expect(
      getProduct('new-balance-garoe-v2')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain', 'technical-terrain', 'muddy-terrain']);
    expect(getProduct('new-balance-hierro-v9')?.categories).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'max-cushion' })]),
    );
    expect(
      getProduct('new-balance-rebel-trail')?.specifications.terrainProfiles
        .value,
    ).toEqual(['technical-terrain', 'muddy-terrain']);
    expect(
      getProduct('new-balance-kaiha-v2')?.specifications.maximumDistance.value,
    ).toEqual({ amount: 21, unit: 'km' });
    expect(
      getProduct('puma-deviate-nitro-4')?.specifications.surfaceTags.value,
    ).toEqual(['road', 'asphalt', 'track']);
    expect(
      getProduct('puma-velocity-nitro-4')?.specifications.stackHeight.value,
    ).toEqual({ heel: 36, forefoot: 26, unit: 'mm' });
  });

  it('records the Puma, Salomon, and Saucony taxonomy batch with canonical terrain tags', () => {
    const cases = [
      ['PUMA', 'Velocity Nitro 5', 'DAILY TRAINER', 'FAST TRAINING'],
      ['SALOMON', 'Aero Blaze 3 Grvl', 'TRAIL', 'FAST TRAINING'],
      ['SALOMON', 'Genesis', 'TRAIL', 'TECHNICAL TRAIL'],
      ['SALOMON', 'Speedcross Peak', 'TRAIL RACE', 'TECHNICAL TRAIL'],
      ['SALOMON', 'Speedcross Peak GTX', 'TRAIL RACE', 'TECHNICAL TRAIL'],
      ['SALOMON', 'Supraglide', 'TRAIL', 'TECHNICAL TRAIL'],
      ['SALOMON', 'Ultra Flow 2', 'TRAIL', 'TECHNICAL TRAIL'],
      ['SALOMON', 'Ultra Glide 4', 'TRAIL', 'TECHNICAL TRAIL'],
      ['SAUCONY', 'Guide 19', 'STABILITY & GUIDANCE', 'MAX CUSHION'],
      ['SAUCONY', 'Peregrine 16', 'TRAIL', 'TECHNICAL TRAIL'],
    ] as const;
    const result = migrateRows(
      cases.map(([brand, model, primary_category, secondary_category]) => ({
        ...productRow,
        brand,
        model,
        primary_category,
        secondary_category,
      })),
      [],
    );
    const getProduct = (id: string) =>
      result.products.find((product) => product.id === id);
    const allSurfaceTags = result.products.flatMap(
      (product) => product.specifications.surfaceTags.value ?? [],
    );

    expect(allSurfaceTags).not.toContain('mixed');
    expect(
      getProduct('salomon-aero-blaze-3-grvl')?.specifications.terrainProfiles
        .value,
    ).toEqual(['gravel', 'road-to-trail', 'easy-terrain', 'mixed-terrain']);
    expect(
      getProduct('salomon-genesis')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain', 'technical-terrain', 'muddy-terrain']);
    expect(
      getProduct('salomon-speedcross-peak-gtx')?.specifications.terrainProfiles
        .value,
    ).toEqual(['technical-terrain', 'muddy-terrain']);
    expect(
      getProduct('salomon-supraglide')?.specifications.terrainProfiles.value,
    ).toEqual(['easy-terrain']);
    expect(
      getProduct('salomon-ultra-flow-2')?.specifications.surfaceFamilies.value,
    ).toEqual(['road', 'off-road']);
    expect(getProduct('saucony-guide-19')?.categories).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'max-cushion' })]),
    );
    expect(
      getProduct('saucony-guide-19')?.specifications.heelToToeDrop.value,
    ).toEqual({ amount: 6, unit: 'mm' });
    expect(
      getProduct('saucony-peregrine-16')?.specifications.terrainProfiles.value,
    ).toEqual(['mixed-terrain', 'technical-terrain', 'muddy-terrain']);
  });

  it('records the final Saucony Ride 19 catalogue classification', () => {
    const result = migrateRows(
      [
        {
          ...productRow,
          brand: 'SAUCONY',
          model: 'Ride 19',
          primary_category: 'DAILY TRAINER',
          secondary_category: 'NEUTRAL',
        },
      ],
      [],
    );
    const product = result.products[0];

    expect(product?.specifications.surfaceTags.value).toEqual([
      'road',
      'asphalt',
    ]);
    expect(product?.specifications.terrainProfiles.value).toEqual([]);
    expect(product?.specifications.maximumDistance.value).toEqual({
      amount: 21,
      unit: 'km',
    });
    expect(product?.specifications.fit.value).toEqual([
      'Regular',
      'Medium width',
    ]);
  });
});
