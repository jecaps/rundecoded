import type {
  Evidence,
  LocalizedText,
  ProductSource,
  ShoeProduct,
} from '../../src/domain/catalogue';
import {
  validateCatalogue,
  type CatalogueProblem,
} from '../../src/domain/catalogue';

export interface MigrationInputs {
  legacyProductsCsv: string;
  imageProvenanceCsv: string;
}

export interface ReconciliationEntry {
  source: 'legacy-products' | 'image-provenance';
  row: number;
  sourceKey: string;
  productId: string;
  outcome: 'matched' | 'merged-alias' | 'unmatched';
}

export interface MigrationResult {
  products: ShoeProduct[];
  warnings: CatalogueProblem[];
  reconciliation: ReconciliationEntry[];
}

type Row = Record<string, string>;

const aliasKeys = new Map([
  ['new balance|propel v5', 'new balance|fuelcell propel v5'],
]);

const fallbackEvidence: Evidence = {
  status: 'fallback',
  sourceIds: ['legacy-catalogue'],
  note: 'Imported from the audited legacy catalogue; official verification is pending.',
};

const categoryTranslations: Record<string, LocalizedText> = {
  carbon: localized('Carbon', 'Carbon', 'Carbone'),
  'daily-trainer': localized(
    'Daily Trainer',
    'Tägliches Training',
    'Entraînement quotidien',
  ),
  'entry-level': localized('Entry Level', 'Einstieg', 'Débutant'),
  'fast-training': localized(
    'Fast Training',
    'Schnelles Training',
    'Entraînement rapide',
  ),
  'max-cushion': localized(
    'Max Cushion',
    'Maximale Dämpfung',
    'Amorti maximal',
  ),
  neutral: localized('Neutral', 'Neutral', 'Neutre'),
  race: localized('Race', 'Wettkampf', 'Compétition'),
  'road-to-trail': localized('Road-To-Trail', 'Road-to-Trail', 'Route-trail'),
  spikes: localized('Spikes', 'Spikes', 'Pointes'),
  'stability-and-guidance': localized(
    'Stability & Guidance',
    'Stabilität & Führung',
    'Stabilité et guidage',
  ),
  'super-trainer': localized('Super Trainer', 'Super-Trainer', 'Super-trainer'),
  support: localized('Support', 'Support', 'Maintien'),
  'technical-trail': localized(
    'Technical Trail',
    'Technischer Trail',
    'Trail technique',
  ),
  'track-spikes': localized(
    'Track / Spikes',
    'Bahn / Spikes',
    'Piste / pointes',
  ),
  trail: localized('Trail', 'Trail', 'Trail'),
  'trail-race': localized('Trail Race', 'Trail-Wettkampf', 'Compétition trail'),
};

interface RecordedWeight {
  amount: number;
  referenceSize: string;
  sourceUrl: string;
}

interface RecordedProductFacts {
  source: Omit<ProductSource, 'id'> & { idSuffix: string };
  maximumDistanceSource?: Omit<ProductSource, 'id'> & { idSuffix: string };
  heelToToeDrop?: number;
  stackHeight?: { heel: number; forefoot: number } | { maximum: number };
  weight?: { amount: number; referenceSize: string };
  surfaces?: string[];
  technologies?: string[];
  construction?: string[];
  maximumDistanceKm?: number;
  maximumDistanceStatus?: 'verified' | 'derived';
}

const recordedProductFacts = new Map<string, RecordedProductFacts>([
  [
    'asics-gel-sonoma-8-gtx',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Gel-Sonoma 8 GTX product description',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-asics-gel-sonoma-8-gtx-schwarz/365812/c1m8943728',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Technical measurements, construction details, and a 40 km maximum distance are published on the supplied Decathlon product page.',
      },
      heelToToeDrop: 8,
      stackHeight: { heel: 36, forefoot: 28 },
      weight: { amount: 325, referenceSize: 'EU 42.5' },
      surfaces: ['Trail'],
      technologies: [
        'Amplifoam midsole',
        'Rearfoot GEL',
        'Gore-Tex membrane',
        'High-density rubber outsole',
      ],
      construction: [
        'Full-length Amplifoam midsole',
        'Strategically placed GEL cushioning',
        'Gore-Tex upper',
        'High-density rubber outsole',
      ],
      maximumDistanceKm: 40,
    },
  ],
  [
    'asics-gel-kanaku-6',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Gel-Kanaku 6 product description',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-asics-gel-kanaku-6-blau-grau/364874/m9029775',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Technical measurements are published in the Decathlon product description rather than its specifications panel.',
      },
      heelToToeDrop: 8,
      stackHeight: { heel: 35, forefoot: 27 },
      weight: { amount: 295, referenceSize: 'EU 42.5' },
      technologies: [
        'Amplifoam cushioning',
        'Rearfoot GEL',
        'Reinforced breathable mesh',
        '3.5 mm lugs',
      ],
      construction: [
        'Amplifoam midsole',
        'Rearfoot GEL cushioning',
        'Reinforced breathable mesh upper',
        '3.5 mm trail lugs',
      ],
    },
  ],
  [
    'asics-trabuco-14',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Trabuco 14 product description',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-asics-trabuco-14-schwarz-khaki/381851/m9029773',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Construction details and an 80 km maximum distance are published on the supplied Decathlon product page.',
      },
      surfaces: ['Trail'],
      technologies: [
        'FF Blast Max foam',
        'Asicsgrip outsole',
        'Rock Protection Plate',
        'Engineered mesh',
      ],
      construction: [
        'FF Blast Max midsole',
        'Asicsgrip outsole',
        'Rock Protection Plate',
        'Engineered mesh upper with reinforced overlays',
      ],
      maximumDistanceKm: 80,
    },
  ],
  [
    'asics-trabuco-terra-3',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Trabuco Terra 3 product description',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-damen-asics-trabuco-terra-3-beige-rosa/362581/c30c24c9m9003170',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Technical measurements, construction details, and an 80 km maximum distance are published on the supplied Decathlon product page.',
      },
      heelToToeDrop: 8,
      stackHeight: { heel: 35, forefoot: 27 },
      weight: { amount: 279, referenceSize: 'EU 39' },
      surfaces: ['Trail'],
      technologies: ['FF Blast foam', 'Asicsgrip outsole', '3.5 mm lugs'],
      construction: [
        'FF Blast midsole',
        'Asicsgrip outsole',
        '3.5 mm trail lugs',
        'Breathable stretch upper',
      ],
      maximumDistanceKm: 80,
    },
  ],
  [
    'hoka-speedgoat-7',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Speedgoat 7 product description',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-damen-hoka-speedgoat-7-lila-weiss/382212/m9004597',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Technical measurements, construction details, and a 170 km maximum distance are published on the supplied Decathlon product page.',
      },
      heelToToeDrop: 4,
      weight: { amount: 241, referenceSize: 'EU 40' },
      surfaces: ['Trail'],
      technologies: [
        'SuperCriticalFoam midsole',
        '5 mm lugs',
        'Lightweight RPET mesh',
      ],
      construction: [
        'SuperCriticalFoam midsole',
        '5 mm trail lugs',
        'Lightweight RPET mesh upper',
        'Integrated debris gaiter',
      ],
      maximumDistanceKm: 170,
    },
  ],
  [
    'hoka-torrent-4',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Torrent 4 product description',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-damen-hoka-torrent-4-lila-grun/361366/c16c9m9004592',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Technical measurements, construction details, and a 60 km maximum distance are published on the supplied Decathlon product page.',
      },
      heelToToeDrop: 5,
      weight: { amount: 236, referenceSize: 'EU 40' },
      surfaces: ['Trail'],
      technologies: ['EVA midsole', '5 mm lugs', 'Recycled polyester mesh'],
      construction: [
        'Thick EVA midsole',
        'High-abrasion rubber outsole',
        '5 mm trail lugs',
        'Single-layer mesh upper with 35% recycled polyester',
      ],
      maximumDistanceKm: 60,
    },
  ],
  [
    'new-balance-hierro-v9',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Fresh Foam X Hierro v9 product description',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-new-balance-fresh-foam-x-hierro-v9-grau-gelb/365842/m9029852',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Technical measurements, construction details, and a 170 km maximum distance are published on the supplied Decathlon product page.',
      },
      heelToToeDrop: 4,
      weight: { amount: 294, referenceSize: 'Size not stated' },
      surfaces: ['Trail'],
      technologies: [
        'Fresh Foam X',
        'Vibram outsole',
        '4.5 mm lugs',
        'Toe Protect',
        'Hybrid mesh',
      ],
      construction: [
        'Fresh Foam X midsole',
        'Vibram outsole with 4.5 mm lugs',
        'Hybrid mesh upper',
        'Toe Protect reinforcement',
      ],
      maximumDistanceKm: 170,
    },
  ],
  [
    'new-balance-rebel-trail',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Rebel Trail product description',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-new-balance-rebel-trail-grun/381806/m9003166',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Technical measurements, construction details, and a 170 km maximum distance are published on the supplied Decathlon product page; the description displays an obvious typo in the drop unit while the specifications panel confirms 6 mm.',
      },
      heelToToeDrop: 6,
      weight: { amount: 302, referenceSize: 'Size not stated' },
      surfaces: ['Trail'],
      technologies: [
        'FuelCell foam',
        'Vibram Megagrip outsole',
        'Toe Protect',
        'Hybrid mesh',
      ],
      construction: [
        'Injection-moulded FuelCell midsole',
        'Full-length Vibram Megagrip outsole',
        'Hybrid mesh upper',
        'Toe Protect reinforcement',
      ],
      maximumDistanceKm: 170,
    },
  ],
  [
    'salomon-aero-blaze-3-grvl',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Salomon comparison chart',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the supplied Decathlon Book Monitor Salomon comparison chart, which publishes a 5–42 km use range.',
      },
      maximumDistanceSource: {
        idSuffix: 'verified-distance-source',
        type: 'retailer-product',
        label: 'Decathlon Aero Blaze 3 GRVL specifications',
        url: 'https://www.decathlon.de/p/laufschuhe-gravel-running-herren-salomon-aero-blaze-3-grvl-weiss/382331/m9005033',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'The current product specifications publish a 0–40 km distance range; this product-specific value supersedes the 5–42 km comparison-chart range.',
      },
      maximumDistanceKm: 40,
      heelToToeDrop: 8,
      stackHeight: { heel: 35, forefoot: 27 },
      weight: { amount: 248, referenceSize: 'EU 42' },
      surfaces: ['Road', 'Gravel'],
      technologies: ['optiFOAM²', 'Gravel Contagrip', 'Engineered mesh'],
    },
  ],
  [
    'salomon-genesis',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Salomon comparison chart',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the supplied Decathlon Book Monitor Salomon comparison chart, which publishes a 5–100 km use range.',
      },
      maximumDistanceSource: {
        idSuffix: 'verified-distance-source',
        type: 'retailer-product',
        label: 'Decathlon Genesis specifications',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-salomon-genesis-rot-schwarz/358451/c14c1m9004858',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'The current product specifications publish a 0–80 km distance range; this product-specific value supersedes the 5–100 km comparison-chart range.',
      },
      maximumDistanceKm: 80,
      heelToToeDrop: 8,
      stackHeight: { heel: 34, forefoot: 26 },
      weight: { amount: 269, referenceSize: 'EU 42⅔' },
      surfaces: ['Trail'],
      technologies: ['optiFOAM', 'Active Chassis', 'Matryx upper'],
    },
  ],
  [
    'salomon-speedcross-peak',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Salomon comparison chart',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the supplied Decathlon Book Monitor Salomon comparison chart, which publishes a 5–42 km use range.',
      },
      maximumDistanceKm: 42,
      heelToToeDrop: 10,
      stackHeight: { heel: 28, forefoot: 18 },
      weight: { amount: 319, referenceSize: 'EU 42⅔' },
      surfaces: ['Trail', 'Muddy trail'],
      technologies: ['FuzeFoam'],
    },
  ],
  [
    'salomon-speedcross-peak-gtx',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Salomon comparison chart',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the supplied Decathlon Book Monitor Salomon comparison chart, which publishes a 5–42 km use range.',
      },
      maximumDistanceKm: 42,
      heelToToeDrop: 10,
      stackHeight: { heel: 28, forefoot: 18 },
      weight: { amount: 330, referenceSize: 'EU 42⅔' },
      surfaces: ['Trail', 'Muddy trail'],
      technologies: ['optiFOAM', 'Gore-Tex'],
    },
  ],
  [
    'salomon-ultra-flow-2',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Salomon comparison chart',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the supplied Decathlon Book Monitor Salomon comparison chart, which publishes a 5–42 km use range.',
      },
      maximumDistanceKm: 42,
      heelToToeDrop: 6,
      stackHeight: { heel: 34, forefoot: 28 },
      weight: { amount: 273, referenceSize: 'EU 42' },
      surfaces: ['Trail'],
      technologies: ['optiFOAM'],
    },
  ],
  [
    'salomon-supraglide',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Salomon comparison chart',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the supplied Decathlon Book Monitor Salomon comparison chart, which publishes a 5–20 km use range.',
      },
      maximumDistanceKm: 20,
      heelToToeDrop: 8,
      weight: { amount: 285, referenceSize: 'EU 42' },
      surfaces: ['Trail'],
      technologies: ['FuzeFoam'],
    },
  ],
  [
    'salomon-ultra-glide-4',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Salomon comparison chart',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the supplied Decathlon Book Monitor Salomon comparison chart, which publishes a 5–100 km use range.',
      },
      maximumDistanceKm: 100,
      heelToToeDrop: 6,
      stackHeight: { heel: 41, forefoot: 35 },
      weight: { amount: 285, referenceSize: 'EU 42' },
      surfaces: ['Trail'],
      technologies: ['optiFOAM'],
    },
  ],
  [
    'saucony-peregrine-16',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Peregrine 16 product description',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-saucony-peregrine-16-grun-gelb-orange/381823/c9c22c20m9003027',
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Technical measurements, construction details, and a 60 km maximum distance are published on the supplied Decathlon product page.',
      },
      heelToToeDrop: 4,
      weight: { amount: 271, referenceSize: 'EU 42' },
      surfaces: ['Trail'],
      technologies: ['PWRRUN foam', 'Vibram Megagrip', '4 mm lugs'],
      construction: [
        'PWRRUN midsole',
        'Vibram Megagrip outsole',
        '4 mm trail lugs',
      ],
      maximumDistanceKm: 60,
    },
  ],
  [
    'adidas-runblaze',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Runblaze product slide',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the Decathlon Book Monitor slide supplied for this catalogue audit.',
      },
      heelToToeDrop: 10,
      stackHeight: { heel: 33, forefoot: 23 },
      weight: { amount: 274, referenceSize: 'Men; size not stated' },
      technologies: ['Cloudfoam', 'Mesh upper', 'Rubber outsole'],
      construction: ['Cloudfoam cushioning', 'Mesh upper', 'Rubber outsole'],
    },
  ],
  [
    'adidas-adizero-agravic-speed-2',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Agravic Speed 2 product slide',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the Decathlon Book Monitor slide supplied for this catalogue audit; the slide publishes a 0–100 km use range.',
      },
      maximumDistanceKm: 100,
    },
  ],
  [
    'adidas-terrex-agravic-4',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Agravic 4 product slide',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the Decathlon Book Monitor slide supplied for this catalogue audit; the slide publishes a 0–80 km use range.',
      },
      maximumDistanceKm: 80,
    },
  ],
  [
    'kiprun-kipsonic-start',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Kipsonic range slide',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the Decathlon Book Monitor Kipsonic range slide, with zero-drop clarification confirmed during the catalogue audit.',
      },
      weight: { amount: 170, referenceSize: 'Size not stated' },
      surfaces: ['Track', 'Cross-country'],
      heelToToeDrop: 0,
    },
  ],
  [
    'kiprun-kipsonic-x-country',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Kipsonic range slide',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the Decathlon Book Monitor Kipsonic range slide, with zero-drop clarification confirmed during the catalogue audit.',
      },
      stackHeight: { maximum: 20 },
      weight: { amount: 158, referenceSize: 'Size not stated' },
      surfaces: ['Cross-country'],
      technologies: ['Softech'],
      heelToToeDrop: 0,
      maximumDistanceKm: 12,
      maximumDistanceStatus: 'derived',
    },
  ],
  [
    'kiprun-kipsonic-mid',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Kipsonic Mid product slide',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the Decathlon Book Monitor Kipsonic Mid product slide, with zero-drop clarification confirmed during the catalogue audit.',
      },
      stackHeight: { maximum: 20 },
      weight: { amount: 138, referenceSize: 'EU 42' },
      surfaces: ['Track'],
      technologies: [
        'Fastech+ foam',
        'Carbon plate',
        '6 mm spikes',
        'Seamless upper',
      ],
      construction: [
        'Fastech+ foam',
        'Carbon plate',
        '6 mm spikes',
        'Seamless upper',
      ],
      heelToToeDrop: 0,
      maximumDistanceKm: 3,
    },
  ],
  [
    'kiprun-kipsonic-long',
    {
      source: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Kipsonic Long product slides',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'Transcribed from the supplied Decathlon Book Monitor slides; zero drop was confirmed during the catalogue audit, and the detailed slide identifies the 158 g weight as EU 42.',
      },
      stackHeight: { maximum: 20 },
      weight: { amount: 158, referenceSize: 'EU 42' },
      surfaces: ['Track'],
      technologies: [
        'Fastech+ foam',
        'TPU plate with 10% carbon fibre',
        '6 mm aluminium spikes',
        'Knit upper',
      ],
      construction: [
        'Fastech+ foam',
        'TPU plate with 10% carbon fibre',
        '6 mm aluminium spikes',
        'Knit upper',
      ],
      heelToToeDrop: 0,
      maximumDistanceKm: 10,
    },
  ],
]);

const recordedWeights = new Map<string, RecordedWeight>([
  [
    'adidas-adistar-5',
    {
      amount: 264,
      referenceSize: 'EU 42⅔',
      sourceUrl: 'https://www.adidas.de/en/adistar-5-running-shoes/KI4355.html',
    },
  ],
  [
    'adidas-terrex-agravic-4',
    {
      amount: 276.8,
      referenceSize: 'EU 42⅔',
      sourceUrl:
        'https://www.adidas.de/en/terrex-agravic-4-trail-running-shoes/KJ1291.html',
    },
  ],
  [
    'decathlon-jogflow-100-1',
    {
      amount: 250,
      referenceSize: 'EU 43',
      sourceUrl:
        'https://www.decathlon.de/p/laufschuhe-herren-jogflow-100-1-schwarz-grau/337693/c382c227m8733464',
    },
  ],
  [
    'decathlon-jogflow-190-grip-wp',
    {
      amount: 364,
      referenceSize: 'EU 42',
      sourceUrl:
        'https://www.decathlon.de/p/laufschuhe-strasse-trailrunning-herren-wasserdicht-jogflow-190-grip-schwarz/365616/c382c208m8958646',
    },
  ],
]);

function pendingFact(note: string) {
  return {
    value: null,
    evidence: { status: 'pending' as const, sourceIds: [], note },
  };
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function keyFor(brand: string, model: string): string {
  const key = `${brand.trim()}|${model.trim()}`.toLocaleLowerCase('en');
  return aliasKeys.get(key) ?? key;
}

function productIdFor(brand: string, model: string): string {
  return slugify(`${brand} ${model}`);
}

function splitList(value: string, separator: RegExp): string[] {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function localized(
  en: string,
  de: string | null,
  fr: string | null,
): LocalizedText {
  return { en, de, fr };
}

function localizedCategory(label: string): LocalizedText {
  return categoryTranslations[slugify(label)] ?? localized(label, null, null);
}

function titleCase(value: string): string {
  return value
    .toLocaleLowerCase('en')
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('en'));
}

function sourceId(productId: string, suffix: string): string {
  return slugify(`${productId}-${suffix}`);
}

function makeSources(
  productId: string,
  provenanceRows: Row[],
): ProductSource[] {
  const sources: ProductSource[] = [
    {
      id: 'legacy-catalogue',
      type: 'legacy-catalogue',
      label: 'Phase 0 audited legacy catalogue',
      url: null,
      checkedAt: null,
      status: 'fallback',
      note: 'Migration evidence only; not an official technical source.',
    },
  ];

  const unique = new Set<string>();
  for (const row of provenanceRows) {
    if (row.product_page && !unique.has(`product:${row.product_page}`)) {
      unique.add(`product:${row.product_page}`);
      sources.push({
        id: sourceId(productId, `product-page-${sources.length}`),
        type: 'retailer-product',
        label: 'Recorded Decathlon product page',
        url: row.product_page,
        checkedAt: null,
        status: 'fallback',
        note: 'Preserved from legacy provenance; re-check date is pending.',
      });
    }
    if (row.source_image && !unique.has(`image:${row.source_image}`)) {
      unique.add(`image:${row.source_image}`);
      sources.push({
        id: sourceId(productId, `image-${sources.length}`),
        type: 'retailer-image',
        label: 'Recorded product image source',
        url: row.source_image,
        checkedAt: null,
        status: row.image_status === 'verified-image' ? 'verified' : 'pending',
        note: 'Preserved from the Phase 0 image provenance inventory.',
      });
    }
  }

  return sources;
}

function ensureWeightSource(
  productId: string,
  sources: ProductSource[],
  weight: RecordedWeight,
): string {
  const existing = sources.find((source) => source.url === weight.sourceUrl);
  if (existing) return existing.id;

  const id = sourceId(productId, 'weight-source');
  sources.push({
    id,
    type: weight.sourceUrl.includes('adidas.')
      ? 'manufacturer'
      : 'retailer-product',
    label: 'Phase 4 recorded weight source',
    url: weight.sourceUrl,
    checkedAt: null,
    status: 'fallback',
    note: 'Preserved from the approved explorer slice; re-check date is pending.',
  });
  return id;
}

function ensureRecordedProductSource(
  productId: string,
  sources: ProductSource[],
  recorded: RecordedProductFacts,
): string {
  const existing = sources.find(
    (source) =>
      recorded.source.url !== null && source.url === recorded.source.url,
  );
  if (existing) {
    Object.assign(existing, {
      type: recorded.source.type,
      label: recorded.source.label,
      url: recorded.source.url,
      checkedAt: recorded.source.checkedAt,
      status: recorded.source.status,
      note: recorded.source.note,
    });
    return existing.id;
  }

  const { idSuffix, ...source } = recorded.source;
  const id = sourceId(productId, idSuffix);
  sources.push({ id, ...source });
  return id;
}

function ensureAdditionalRecordedSource(
  productId: string,
  sources: ProductSource[],
  sourceWithId: Omit<ProductSource, 'id'> & { idSuffix: string },
): string {
  const existing = sources.find(
    (source) => sourceWithId.url !== null && source.url === sourceWithId.url,
  );
  if (existing) {
    const { idSuffix, ...source } = sourceWithId;
    void idSuffix;
    Object.assign(existing, source);
    return existing.id;
  }

  const { idSuffix, ...source } = sourceWithId;
  const id = sourceId(productId, idSuffix);
  sources.push({ id, ...source });
  return id;
}

function parseDrop(
  value: string,
  productId: string,
  warnings: CatalogueProblem[],
) {
  const match = /^(\d+(?:\.\d+)?)\s*mm$/i.exec(value.trim());
  if (!match) {
    warnings.push({
      severity: 'warning',
      recordId: productId,
      field: 'specifications.heelToToeDrop',
      message: 'drop is missing or unparseable; official research is required',
    });
    return {
      value: null,
      evidence: {
        status: 'pending' as const,
        sourceIds: [],
        note: 'No reliable drop measurement exists in the legacy source.',
      },
    };
  }

  return {
    value: { amount: Number(match[1]), unit: 'mm' as const },
    evidence: fallbackEvidence,
  };
}

function parseMaximumDistance(value: string) {
  const distances: number[] = [];
  for (const match of value.matchAll(/(\d+(?:[.,]\d+)?)\s*(km|k|m)\b/gi)) {
    const amount = Number(match[1]?.replace(',', '.'));
    const unit = match[2]?.toLocaleLowerCase('en');
    if (!Number.isFinite(amount) || !unit) continue;
    distances.push(unit === 'm' ? amount / 1000 : amount);
  }
  if (/\b(?:half|semi[- ]?)marathon\b/i.test(value)) distances.push(21);
  if (/(?<!half\s)(?<!semi[- ])\bmarathon\b/i.test(value)) distances.push(42);

  const maximum = distances.length > 0 ? Math.max(...distances) : null;
  return maximum === null
    ? pendingFact('No numerical maximum distance is published.')
    : {
        value: { amount: maximum, unit: 'km' as const },
        evidence: {
          status: 'derived' as const,
          sourceIds: ['legacy-catalogue'],
          note: 'Normalized from the numerical distance in the audited best-for guidance.',
        },
      };
}

function normalizeStability(
  value: string,
): 'neutral' | 'stability' | 'unknown' {
  const normalized = value.trim().toLocaleLowerCase('en');
  if (normalized === 'neutral') return 'neutral';
  if (normalized === 'stability' || normalized === 'stability shoe')
    return 'stability';
  return 'unknown';
}

function comparableScore(current: ShoeProduct, candidate: ShoeProduct) {
  const currentCategories = current.categories.map(({ id }) => id);
  const candidateCategories = new Set(candidate.categories.map(({ id }) => id));
  const sharedCategories = currentCategories.filter((id) =>
    candidateCategories.has(id),
  ).length;
  const currentSurfaces = current.specifications.surfaces.value ?? [];
  const candidateSurfaces = new Set(
    candidate.specifications.surfaces.value ?? [],
  );
  const sharedSurfaces = currentSurfaces.filter((surface) =>
    candidateSurfaces.has(surface),
  ).length;
  const currentDrop = current.specifications.heelToToeDrop.value?.amount;
  const candidateDrop = candidate.specifications.heelToToeDrop.value?.amount;
  const dropAffinity =
    currentDrop === undefined || candidateDrop === undefined
      ? 0
      : Math.max(0, 4 - Math.abs(currentDrop - candidateDrop) / 2);

  return (
    (currentCategories[0] === candidate.categories[0]?.id ? 16 : 0) +
    sharedCategories * 6 +
    sharedSurfaces * 8 +
    (current.specifications.stability.value ===
    candidate.specifications.stability.value
      ? 3
      : 0) +
    dropAffinity +
    (current.brand.id !== candidate.brand.id ? 0.25 : 0)
  );
}

function sharesIntendedUse(
  current: ShoeProduct,
  candidate: ShoeProduct,
): boolean {
  const currentCategories = new Set(current.categories.map(({ id }) => id));
  const currentSurfaces = new Set(current.specifications.surfaces.value ?? []);
  return (
    candidate.categories.some(({ id }) => currentCategories.has(id)) ||
    (candidate.specifications.surfaces.value ?? []).some((surface) =>
      currentSurfaces.has(surface),
    )
  );
}

function assignComparables(products: ShoeProduct[]) {
  for (const product of products) {
    const ranked = products
      .filter((candidate) => candidate.id !== product.id)
      .map((candidate) => ({
        candidate,
        score: comparableScore(product, candidate),
      }))
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.candidate.id.localeCompare(right.candidate.id, 'en'),
      );
    const selected = ranked.slice(0, 3).map(({ candidate }) => candidate);
    const crossBrand = ranked.find(
      ({ candidate }) =>
        candidate.brand.id !== product.brand.id &&
        sharesIntendedUse(product, candidate),
    )?.candidate;

    if (crossBrand && !selected.some(({ id }) => id === crossBrand.id)) {
      selected[selected.length - 1] = crossBrand;
    }
    product.comparables = selected.map(({ id }) => id);
  }
}

export function migrateRows(
  productRows: Row[],
  provenanceRows: Row[],
): MigrationResult {
  const warnings: CatalogueProblem[] = [];
  const reconciliation: ReconciliationEntry[] = [];
  const provenanceByKey = new Map<string, Row[]>();
  const productKeys = new Set(
    productRows.map((row) => keyFor(row.brand, row.model)),
  );

  for (const [index, row] of provenanceRows.entries()) {
    const originalKey = `${row.brand}|${row.model}`;
    const normalizedKey = keyFor(row.brand, row.model);
    const rows = provenanceByKey.get(normalizedKey) ?? [];
    rows.push(row);
    provenanceByKey.set(normalizedKey, rows);
    const isAlias = normalizedKey !== originalKey.toLocaleLowerCase('en');
    const matchesProduct = productKeys.has(normalizedKey);
    reconciliation.push({
      source: 'image-provenance',
      row: index + 2,
      sourceKey: originalKey,
      productId: productIdFor(
        ...(normalizedKey.split('|') as [string, string]),
      ),
      outcome: !matchesProduct
        ? 'unmatched'
        : isAlias
          ? 'merged-alias'
          : 'matched',
    });
    if (!matchesProduct) {
      warnings.push({
        severity: 'warning',
        recordId: productIdFor(
          ...(normalizedKey.split('|') as [string, string]),
        ),
        field: 'provenance',
        message: `provenance row ${index + 2} has no matching legacy product`,
      });
    }
  }

  const products = productRows.map((row, index): ShoeProduct => {
    const normalizedKey = keyFor(row.brand, row.model);
    const productId = productIdFor(row.brand, row.model);
    const matchingProvenance = provenanceByKey.get(normalizedKey) ?? [];
    reconciliation.push({
      source: 'legacy-products',
      row: index + 2,
      sourceKey: `${row.brand}|${row.model}`,
      productId,
      outcome: 'matched',
    });

    if (matchingProvenance.length === 0) {
      warnings.push({
        severity: 'warning',
        recordId: productId,
        field: 'images',
        message: 'no matching provenance row was found',
      });
    }

    const rawCategories = [row.primary_category, row.secondary_category].filter(
      Boolean,
    );
    const categoryLabels = [
      ...new Set(rawCategories.map((value) => titleCase(value))),
    ];
    if (categoryLabels.length < rawCategories.length) {
      warnings.push({
        severity: 'warning',
        recordId: productId,
        field: 'categories',
        message: 'duplicate legacy category label was removed',
      });
    }

    const technologies = splitList(row.technologies, /\s*\|\s*/);
    const primaryProvenance = matchingProvenance[0];
    const sources = makeSources(productId, matchingProvenance);
    const weight = recordedWeights.get(productId);
    const recordedFacts = recordedProductFacts.get(productId);
    const weightSourceId = weight
      ? ensureWeightSource(productId, sources, weight)
      : null;
    const recordedFactsSourceId = recordedFacts
      ? ensureRecordedProductSource(productId, sources, recordedFacts)
      : null;
    const maximumDistanceSourceId = recordedFacts?.maximumDistanceSource
      ? ensureAdditionalRecordedSource(
          productId,
          sources,
          recordedFacts.maximumDistanceSource,
        )
      : recordedFactsSourceId;
    const imageSource = sources.find(
      (source) => source.type === 'retailer-image',
    );
    const imageVerified =
      primaryProvenance?.image_status === 'verified-image' && imageSource;

    if (technologies.length === 0 && !recordedFacts?.technologies) {
      warnings.push({
        severity: 'warning',
        recordId: productId,
        field: 'technologies',
        message: 'technology research is pending',
      });
    }

    return {
      schemaVersion: 1,
      id: productId,
      kind: 'shoe',
      lifecycle: 'active',
      brand: { id: slugify(row.brand), name: titleCase(row.brand) },
      model: row.model.trim(),
      categories: categoryLabels.map((label) => ({
        id: slugify(label),
        label: localizedCategory(label),
      })),
      copy: {
        bestFor: localized(
          row.best_for_en.trim(),
          row.best_for_de.trim(),
          row.best_for_fr.trim(),
        ),
      },
      technologies:
        recordedFacts?.technologies && recordedFactsSourceId
          ? {
              value: recordedFacts.technologies,
              evidence: {
                status: 'verified',
                sourceIds: [recordedFactsSourceId],
                note: recordedFacts.source.note,
              },
            }
          : technologies.length > 0
            ? { value: technologies, evidence: fallbackEvidence }
            : {
                value: null,
                evidence: {
                  status: 'pending',
                  sourceIds: [],
                  note: 'No technology list exists in the audited legacy catalogue.',
                },
              },
      images: [
        {
          id: sourceId(productId, 'primary-image'),
          role: 'primary',
          localPath: imageVerified ? row.display_image.trim() || null : null,
          sourceUrl: primaryProvenance?.source_image || null,
          sourceId: imageSource?.id ?? null,
          status: imageVerified ? 'verified' : 'pending',
          alt: localized(
            `${titleCase(row.brand)} ${row.model}`,
            `${titleCase(row.brand)} ${row.model}`,
            `${titleCase(row.brand)} ${row.model}`,
          ),
        },
      ],
      sources,
      comparables: [],
      specifications: {
        surfaces: {
          value:
            recordedFacts?.surfaces ??
            splitList(row.surface, /\s*[·|]\s*/).map(titleCase),
          evidence:
            recordedFacts?.surfaces && recordedFactsSourceId
              ? {
                  status: 'verified',
                  sourceIds: [recordedFactsSourceId],
                  note: recordedFacts.source.note,
                }
              : fallbackEvidence,
        },
        stability: {
          value: normalizeStability(row.stability),
          evidence: fallbackEvidence,
        },
        maximumDistance:
          recordedFacts?.maximumDistanceKm && maximumDistanceSourceId
            ? {
                value: {
                  amount: recordedFacts.maximumDistanceKm,
                  unit: 'km' as const,
                },
                evidence: {
                  status:
                    recordedFacts.maximumDistanceStatus ??
                    ('verified' as const),
                  sourceIds: [maximumDistanceSourceId],
                  note:
                    recordedFacts.maximumDistanceStatus === 'derived'
                      ? 'Derived from the confirmed standard 3–12 km cross-country race range; this is guidance rather than a manufacturer limit.'
                      : (recordedFacts.maximumDistanceSource?.note ??
                        recordedFacts.source.note),
                },
              }
            : parseMaximumDistance(row.best_for_en),
        heelToToeDrop:
          recordedFacts?.heelToToeDrop !== undefined && recordedFactsSourceId
            ? {
                value: {
                  amount: recordedFacts.heelToToeDrop,
                  unit: 'mm' as const,
                },
                evidence: {
                  status: 'verified' as const,
                  sourceIds: [recordedFactsSourceId],
                  note: recordedFacts.source.note,
                },
              }
            : parseDrop(row.drop, productId, warnings),
        stackHeight:
          recordedFacts?.stackHeight && recordedFactsSourceId
            ? {
                value: {
                  ...recordedFacts.stackHeight,
                  unit: 'mm' as const,
                },
                evidence: {
                  status: 'verified' as const,
                  sourceIds: [recordedFactsSourceId],
                  note: recordedFacts.source.note,
                },
              }
            : pendingFact(
                'No reliable heel and forefoot stack measurements exist in the audited source.',
              ),
        weight:
          recordedFacts?.weight && recordedFactsSourceId
            ? {
                value: {
                  ...recordedFacts.weight,
                  unit: 'g' as const,
                },
                evidence: {
                  status: 'verified' as const,
                  sourceIds: [recordedFactsSourceId],
                  note: recordedFacts.source.note,
                },
              }
            : weight
              ? {
                  value: {
                    amount: weight.amount,
                    unit: 'g',
                    referenceSize: weight.referenceSize,
                  },
                  evidence: {
                    status: 'fallback',
                    sourceIds: weightSourceId ? [weightSourceId] : [],
                    note: 'Preserved from the approved Phase 4 explorer slice.',
                  },
                }
              : pendingFact(
                  'No weight with a reliable reference size exists in the audited source.',
                ),
        fit: pendingFact(
          'No structured fit assessment exists in the audited source.',
        ),
        construction:
          recordedFacts?.construction && recordedFactsSourceId
            ? {
                value: recordedFacts.construction,
                evidence: {
                  status: 'verified' as const,
                  sourceIds: [recordedFactsSourceId],
                  note: recordedFacts.source.note,
                },
              }
            : pendingFact(
                'Construction details require official-source research.',
              ),
      },
    };
  });

  assignComparables(products);
  products.sort((left, right) => left.id.localeCompare(right.id, 'en'));
  reconciliation.sort((left, right) =>
    `${left.source}:${left.row}`.localeCompare(
      `${right.source}:${right.row}`,
      'en',
    ),
  );

  const validated = validateCatalogue(products);
  return {
    products: validated.products as ShoeProduct[],
    warnings: [...warnings, ...validated.warnings].sort((left, right) =>
      `${left.recordId}:${left.field}:${left.message}`.localeCompare(
        `${right.recordId}:${right.field}:${right.message}`,
        'en',
      ),
    ),
    reconciliation,
  };
}
