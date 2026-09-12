import type {
  Evidence,
  LocalizedText,
  ProductSource,
  ShoeProduct,
  SurfaceFamily,
  SurfaceTag,
  TerrainProfile,
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
  measurementSource?: Omit<ProductSource, 'id'> & { idSuffix: string };
  stackHeightSource?: Omit<ProductSource, 'id'> & { idSuffix: string };
  maximumDistanceSource?: Omit<ProductSource, 'id'> & { idSuffix: string };
  heelToToeDrop?: number;
  stackHeight?: { heel: number; forefoot: number } | { maximum: number };
  weight?: { amount: number; referenceSize: string };
  surfaces?: string[];
  surfaceFamilies?: SurfaceFamily[];
  surfaceTags?: SurfaceTag[];
  terrainProfiles?: TerrainProfile[];
  stability?: 'neutral' | 'stability' | 'unknown';
  fit?: string[];
  technologies?: string[];
  construction?: string[];
  maximumDistanceKm?: number;
  maximumDistanceStatus?: 'verified' | 'derived';
}

const distanceTableSource: Omit<ProductSource, 'id'> & { idSuffix: string } = {
  idSuffix: 'range-table-distance',
  type: 'legacy-workbook',
  label: 'Supplied running-shoe range table',
  url: null,
  checkedAt: '2026-09-11',
  status: 'verified',
  note: 'Fallback distance only, transcribed from the supplied running-shoe range table when no existing product-page or catalogue distance is available. For a range, the upper listed distance is stored; for a plus value, the stated threshold is stored.',
};

const recordedMaximumDistancesKm = new Map<string, number>([
  ['decathlon-jogflow-100-1', 21],
  ['decathlon-jogflow-190-premium', 21],
  ['decathlon-jogflow-190-grip', 21],
  ['decathlon-jogflow-190-grip-wp', 21],
  ['decathlon-jogflow-190-max', 21],
  ['asics-gel-windhawk-5', 21],
  ['asics-gel-excite-11', 21],
  ['adidas-runblaze', 10],
  ['adidas-galaxy-7', 10],
  ['new-balance-520-v9', 10],
  ['kiprun-kipcore', 42],
  ['kiprun-kipcore-premium', 42],
  ['kiprun-kipride', 21],
  ['kiprun-kipride-max', 42],
  ['kiprun-kipride-max-wide', 42],
  ['kiprun-kipnext', 42],
  ['asics-gel-stratus-5', 42],
  ['asics-gel-pulse-17', 42],
  ['asics-gel-nimbus-28', 42],
  ['asics-novablast-5', 42],
  ['asics-dynablast-5', 42],
  ['hoka-clifton-10', 42],
  ['hoka-rincon-4', 42],
  ['adidas-supernova-rise-3', 42],
  ['brooks-ghost-17', 42],
  ['brooks-ghost-max-3', 42],
  ['brooks-revel-9', 42],
  ['brooks-revel-max', 42],
  ['brooks-glycerin-23', 42],
  ['mizuno-wave-rider-29', 42],
  ['mizuno-wave-ultima-17', 42],
  ['mizuno-wave-impulse', 42],
  ['mizuno-neo-zen-2', 42],
  ['mizuno-neo-cosmo', 42],
  ['puma-velocity-nitro-4', 42],
  ['saucony-ride-19', 42],
  ['new-balance-1080-v15', 42],
  ['new-balance-more-v6', 42],
  ['new-balance-ellipse', 42],
  ['new-balance-kaiha-v2', 42],
  ['new-balance-840-v1', 42],
  ['kiprun-kipride-support', 42],
  ['asics-gel-superion-8', 42],
  ['asics-gt-2000-13', 42],
  ['asics-gel-roadmiles-4', 42],
  ['brooks-adrenaline-gts-25', 42],
  ['saucony-guide-19', 42],
  ['kiprun-kipstorm-tempo', 21],
  ['kiprun-kipstorm-interval', 10],
  ['kiprun-kipstorm-challenger', 42],
  ['kiprun-kipstorm-pro', 21],
  ['kiprun-kipstorm-elite', 42],
  ['kiprun-kipstorm-lab', 42],
  ['adidas-adizero-boston-13', 42],
  ['adidas-adizero-evo-sl', 42],
  ['brooks-hyperion-3', 21],
  ['puma-deviate-nitro-4', 42],
  ['new-balance-fuelcell-rebel-v5', 42],
  ['new-balance-fuelcell-propel-v5', 42],
  ['kiprun-kipcore-gravel', 42],
  ['kiprun-kipcore-wr', 42],
  ['kiprun-kipride-gravel', 100],
  ['kiprun-kipride-wr', 42],
  ['kiprun-kipsummit', 42],
  ['kiprun-kipsummit-wp', 43],
  ['kiprun-kipsummit-max', 170],
  ['kiprun-kipclimb', 42],
  ['kiprun-kipclimb-wp', 42],
  ['kiprun-kipclimb-max', 170],
  ['hoka-torrent-4', 80],
  ['hoka-speedgoat-7', 42],
  ['asics-trabuco-14', 42],
  ['asics-trabuco-terra-3', 42],
  ['adidas-terrex-agravic-4', 42],
  ['salomon-supraglide', 42],
  ['salomon-ultra-flow-2', 80],
  ['salomon-aero-blaze-3-grvl', 42],
  ['salomon-ultra-glide-4', 80],
  ['brooks-cascadia-19', 42],
  ['brooks-ghost-trail', 42],
  ['saucony-peregrine-16', 42],
  ['new-balance-hierro-v9', 80],
  ['new-balance-garoe-v2', 42],
  ['new-balance-rebel-trail', 42],
  ['kiprun-kipstorm-challenger-gravel', 42],
  ['kiprun-kipstorm-pro-gravel', 21],
  ['kiprun-kipsummit-race', 170],
  ['kiprun-kipclimb-race', 170],
  ['adidas-adizero-agravic-speed-2', 21],
  ['salomon-speedcross-peak', 42],
  ['salomon-speedcross-peak-gtx', 42],
  ['salomon-genesis', 80],
  ['kiprun-kipsonic-mid', 3],
  ['kiprun-kipsonic-long', 10],
]);

const recordedProductFacts = new Map<string, RecordedProductFacts>([
  [
    'brooks-adrenaline-gts-25',
    {
      source: {
        idSuffix: 'range-table-classification',
        type: 'legacy-workbook',
        label: 'Supplied running-shoe range table',
        url: null,
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The supplied range table classifies the Adrenaline GTS 25 as a road daily trainer with stability and guidance.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'stability',
    },
  ],
  [
    'brooks-cascadia-19',
    {
      source: {
        idSuffix: 'range-table-classification',
        type: 'legacy-workbook',
        label: 'Supplied running-shoe range table',
        url: null,
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The supplied range table and recorded product guidance classify the Cascadia 19 as a versatile trail shoe for varied and technical terrain.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain'],
      stability: 'neutral',
    },
  ],
  [
    'brooks-ghost-17',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Brooks Ghost 17 product page',
        url: 'https://www.decathlon.de/p/mp/herren-laufschuh-ghost-17/8ec73b50-c015-4dd4-9019-335c569c4de7/c251c255',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications classify the Ghost 17 as a neutral road shoe for training.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'brooks-ghost-18',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Brooks Ghost 18 product page',
        url: 'https://www.decathlon.de/p/mp/laufschuhe-herren-ghost-18-weiss-schwarz-hellblau/2427ca19-ec33-4d44-a9c3-99c5be534375/c4c1c6',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications classify the Ghost 18 as a neutral road cushioning shoe.',
      },
      maximumDistanceSource: {
        idSuffix: 'previous-generation-distance-reference',
        type: 'legacy-workbook',
        label: 'Brooks Ghost 17 distance reference',
        url: null,
        checkedAt: '2026-09-11',
        status: 'derived',
        note: 'Carried forward from the 42 km Brooks Ghost 17 distance at the user’s direction for the newer Ghost 18.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'derived',
    },
  ],
  [
    'brooks-ghost-max-3',
    {
      source: {
        idSuffix: 'range-table-classification',
        type: 'legacy-workbook',
        label: 'Supplied running-shoe range table',
        url: null,
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The supplied range table and recorded product description classify the Ghost Max 3 as a neutral maximum-cushion road daily trainer.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'brooks-ghost-max-4',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Brooks Ghost Max 4 product page',
        url: 'https://www.decathlon.de/p/mp/laufschuhe-damen-ghost-max-4-weiss-rosa-beige/b6b7cf2d-a73e-41b0-9ec5-c382f6c95223/c4c24c30',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications classify the Ghost Max 4 as a neutral road shoe with protective maximum cushioning.',
      },
      maximumDistanceSource: {
        idSuffix: 'previous-generation-distance-reference',
        type: 'legacy-workbook',
        label: 'Brooks Ghost Max 3 distance reference',
        url: null,
        checkedAt: '2026-09-11',
        status: 'derived',
        note: 'Carried forward from the 42 km Brooks Ghost Max 3 distance at the user’s direction for the newer Ghost Max 4.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'derived',
    },
  ],
  [
    'brooks-ghost-trail',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Brooks Ghost Trail product page',
        url: 'https://www.decathlon.de/p/mp/laufschuhe-herren-ghost-trail-schwarz-rot-orange/dd19c822-df3e-45ae-bfa6-659e7fddcceb/c1c14c20',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon description explicitly identifies the Ghost Trail as a neutral hybrid that performs on both road and trail; the recorded guidance specifies park paths, gravel, and groomed easy trails.',
      },
      surfaces: ['Road', 'Trail'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'asphalt', 'gravel', 'firm-paths', 'easy-terrain'],
      terrainProfiles: ['gravel', 'road-to-trail', 'easy-terrain'],
      stability: 'neutral',
    },
  ],
  [
    'brooks-glycerin-23',
    {
      source: {
        idSuffix: 'range-table-classification',
        type: 'legacy-workbook',
        label: 'Supplied running-shoe range table',
        url: null,
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The supplied range table classifies the Glycerin 23 as a neutral maximum-cushion road daily trainer.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'brooks-hyperion-3',
    {
      source: {
        idSuffix: 'range-table-classification',
        type: 'legacy-workbook',
        label: 'Supplied running-shoe range table',
        url: null,
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The supplied range table classifies the Hyperion 3 as a neutral road shoe for fast training and racing.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'brooks-range',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Brooks Range product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-damen-brooks-range/386581/m9029849',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The supplied Decathlon specifications publish rugged, muddy and uneven terrain, adaptive stability, 4.5 mm lugs, and a trail-running distance from 0 to 170 km for the Brooks Range.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
      maximumDistanceKm: 170,
    },
  ],
  [
    'brooks-revel-9',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Brooks Revel 9 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-brooks-revel-9-weiss-orange/386930/c4c20m9030421',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon page classifies the Revel 9 as a neutral training shoe and explicitly describes grip on dry and wet roads.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'brooks-revel-max',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Brooks Revel Max product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-brooks-revel-max-blau/381120/m9029594',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications classify the neutral Revel Max for road and path use with strong cushioning.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'decathlon-jogflow-100-1',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Jogflow 100.1 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-jogflow-100-1-schwarz-grau/337693/c382c227m8733464',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications classify the neutral beginner Jogflow 100.1 for road and path training.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'decathlon-jogflow-190-grip',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Jogflow 190 Grip product page',
        url: 'https://www.decathlon.de/p/laufschuhe-trailrunning-damen-jogflow-190-grip-schwarz-rosa/348767/c382c183c260m8913965',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications publish road, asphalt, grass, field and sand surfaces, while the description specifies grip on even and uneven natural paths.',
      },
      surfaces: ['Road', 'Trail'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths', 'easy-terrain'],
      terrainProfiles: ['road-to-trail', 'easy-terrain'],
      stability: 'neutral',
    },
  ],
  [
    'decathlon-jogflow-190-grip-wp',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Jogflow 190 Grip WP product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-trailrunning-herren-wasserdicht-jogflow-190-grip-schwarz/365616/c382c208m8958646',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications explicitly publish road, trail and urban surfaces together with marshland, forest and park use for this waterproof beginner model.',
      },
      surfaces: ['Road', 'Trail'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: [
        'road',
        'asphalt',
        'firm-paths',
        'easy-terrain',
        'muddy-terrain',
      ],
      terrainProfiles: ['road-to-trail', 'easy-terrain', 'muddy-terrain'],
      stability: 'neutral',
    },
  ],
  [
    'decathlon-jogflow-190-max',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Jogflow 190 Max product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-jogflow-190-max-grau/365587/c208c227m8958639',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The supplied Decathlon page and recorded catalogue classify the neutral Jogflow 190 Max as a highly cushioned road running shoe.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'decathlon-jogflow-190-premium',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Jogflow 190.1 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-jogflow-190-1-dunkelblau/339940/c43c104c227m8874411',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications classify the neutral beginner Jogflow 190.1 for road and path training.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'hoka-clifton-10',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'manufacturer',
        label: 'Hoka Clifton 10 product page',
        url: 'https://cl.hoka.com/p/hoka-clifton-10-hombre-black/',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The official Hoka product page lists road running and walking as the Clifton 10 use cases and describes it as a cushioned daily-distance shoe.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'hoka-rincon-4',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'manufacturer',
        label: 'Hoka Rincon 4 product page',
        url: 'https://au.hoka.com/products/m-rincon-4-1155130-bwht-bwht',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The official Hoka page classifies the Rincon 4 as a road shoe for everyday running; the supplied Decathlon page also lists training and competition.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'kiprun-kipclimb',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipclimb product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-kipclimb-schwarz/366862/c382c71m9001242',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon page specifies highly technical paths with rocks, roots, steep climbs and muddy passages for the Kipclimb.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
    },
  ],
  [
    'kiprun-kipclimb-max',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipclimb Max product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-kipclimb-max-beige/366852/c370m9001260',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon page publishes mixed ground and describes highly technical paths with rocks, roots, steep climbs and muddy passages for the Kipclimb Max.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
    },
  ],
  [
    'kiprun-kipclimb-race',
    {
      source: {
        idSuffix: 'book-monitor-range-source',
        type: 'legacy-workbook',
        label: 'Supplied Decathlon Kipclimb franchise range sheets',
        url: null,
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The supplied Decathlon range sheets describe the Kipclimb Race as a light, fast trail-race shoe designed for technical racing and technical ground.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['technical-terrain'],
      terrainProfiles: ['technical-terrain'],
    },
  ],
  [
    'kiprun-kipclimb-wp',
    {
      source: {
        idSuffix: 'book-monitor-range-source',
        type: 'legacy-workbook',
        label: 'Supplied Decathlon Kipclimb franchise range sheets',
        url: null,
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The supplied Decathlon range sheets identify the Kipclimb WP as a waterproof all-condition trail shoe for rain, mud and cold with strong traction.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['muddy-terrain'],
      terrainProfiles: ['muddy-terrain'],
    },
  ],
  [
    'kiprun-kipcore',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipcore product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-kipcore-schwarz-weiss/353286/c381c183m8873071',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications classify the Kipcore as a neutral road training shoe.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'kiprun-kipcore-gravel',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipcore Gravel product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-wege-herren-kipcore-gravel-beige-orange/362150/c279c296c342m8990702',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon page explicitly describes a road-to-unpaved-path hybrid for asphalt, dirt and gravel in easy terrain.',
      },
      surfaces: ['Road', 'Trail'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'asphalt', 'gravel', 'firm-paths', 'easy-terrain'],
      terrainProfiles: ['gravel', 'road-to-trail', 'easy-terrain'],
      stability: 'neutral',
    },
  ],
  [
    'kiprun-kipcore-premium',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipcore Premium product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-herren-vielseitig-kipcore-premium-blau/353370/c98c40c227m8958673',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon description repeatedly identifies the Kipcore Premium as a neutral asphalt road shoe for regular, tempo and interval training.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'kiprun-kipcore-wr',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Cushion 500 WR product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-vielseitig-wasserabweisend-cushion-500-wr-schwarz/353371/c382c383m8873083',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The recorded product page classifies this water-repellent neutral shoe for road and path use and explicitly describes wet-asphalt grip.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'kiprun-kipnext',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipnext product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-herren-kipnext-beige/353380/c179c183m8913928',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon specifications classify the Kipnext as a neutral road training shoe.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
    },
  ],
  [
    'kiprun-kipride',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipride product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-herren-kipride-malve/352928/c368c98c385m8960539',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon product page identifies the Kipride as a neutral road shoe for daily running through intensive training.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      heelToToeDrop: 6,
      stackHeight: { heel: 36, forefoot: 30 },
      weight: { amount: 243, referenceSize: 'EU 42' },
      fit: ['Regular', 'Medium width'],
      technologies: ['Fastech'],
      construction: ['Fastech foam midsole'],
    },
  ],
  [
    'kiprun-kipride-gravel',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipride Gravel product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-wege-herren-kipride-gravel-schwarz-grau/365827/c383c382c169m9019968',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon page explicitly describes a neutral road-to-trail shoe for asphalt, unpaved paths and gravel, with 3 mm lugs and light protection.',
      },
      stackHeightSource: {
        idSuffix: 'book-monitor-range-source',
        type: 'legacy-workbook',
        label: 'Supplied Decathlon Kipride range slide',
        url: null,
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The supplied Decathlon Kipride range slide publishes a 36/30 mm stack for the Kipride Gravel.',
      },
      surfaces: ['Road', 'Trail'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'asphalt', 'gravel', 'firm-paths', 'easy-terrain'],
      terrainProfiles: ['gravel', 'road-to-trail', 'easy-terrain'],
      stability: 'neutral',
      heelToToeDrop: 6,
      stackHeight: { heel: 36, forefoot: 30 },
      weight: { amount: 264, referenceSize: 'EU 42' },
      fit: ['Regular', 'Medium width'],
      technologies: ['Fastech', '3 mm lugs'],
      construction: [
        'Fastech foam midsole',
        '3 mm lugged outsole',
        'Reinforced upper with light rock protection',
      ],
    },
  ],
  [
    'kiprun-kipride-max',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipride Max product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-herren-kipride-max-blau-orange/362185/c309c231c125m8960620',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon product page identifies the Kipride Max as a neutral maximum-cushion road shoe.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      heelToToeDrop: 6,
      stackHeight: { heel: 42, forefoot: 36 },
      weight: { amount: 271, referenceSize: 'EU 42' },
      fit: ['Regular', 'Medium width'],
      technologies: ['Softech+', 'Fitting Sniper', 'Warp Knit'],
      construction: [
        'Softech+ maximum-cushion midsole',
        'Warp-knit engineered mesh upper',
        'Fitting Sniper heel and midfoot hold system',
      ],
    },
  ],
  [
    'kiprun-kipride-max-wide',
    {
      source: {
        idSuffix: 'book-monitor-range-source',
        type: 'legacy-workbook',
        label: 'Supplied Decathlon Kipride range slide',
        url: null,
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The supplied Decathlon Kipride range slide identifies the Kipride Max Wide as a maximum-comfort recovery and fun-run shoe for wide feet and publishes its measurements.',
      },
      heelToToeDrop: 6,
      stackHeight: { heel: 42, forefoot: 36 },
      weight: { amount: 220, referenceSize: 'Size not stated' },
      fit: ['Wide'],
      technologies: ['Softech+'],
      construction: ['Softech+ maximum-cushion midsole', 'Wide-foot fit'],
    },
  ],
  [
    'kiprun-kipride-support',
    {
      source: {
        idSuffix: 'book-monitor-range-source',
        type: 'legacy-workbook',
        label: 'Supplied Decathlon Kipride Support range slides',
        url: null,
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The supplied Decathlon slides identify the Kipride Support as an everyday stability shoe, exclude trail running, and publish its EU 42 measurements and support construction.',
      },
      heelToToeDrop: 6,
      stackHeight: { heel: 40, forefoot: 34 },
      weight: { amount: 319, referenceSize: 'EU 42' },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road'],
      terrainProfiles: [],
      stability: 'stability',
      technologies: ['Softech+', 'Support Frame'],
      construction: [
        'Warp-knit e-mesh upper',
        'Eyestay wing wrapping system',
        'Supportive heel counter',
        'Pronation-control sole geometry',
        'Oversized Softech+ cushioned midsole',
      ],
    },
  ],
  [
    'kiprun-kipride-wr',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipride WR product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-wasserabweisend-kipride-wr-dunkelgrun/365905/c117c311c227m8990045',
        checkedAt: '2026-09-11',
        status: 'verified',
        note: 'The Decathlon page describes a neutral water-repellent road shoe whose outsole is designed to retain grip and disperse water on wet asphalt.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      stackHeightSource: {
        idSuffix: 'book-monitor-range-source',
        type: 'legacy-workbook',
        label: 'Supplied Decathlon Kipride range slide',
        url: null,
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The supplied Decathlon Kipride range slide publishes a 36/30 mm stack for the Kipride WR.',
      },
      heelToToeDrop: 6,
      stackHeight: { heel: 36, forefoot: 30 },
      weight: { amount: 280, referenceSize: 'EU 42' },
      fit: ['Regular', 'Medium width'],
      technologies: ['Fastech', '360° reflectivity'],
      construction: [
        'Fastech foam midsole',
        'Water-repellent mesh upper',
        'Wet-asphalt water-dispersing outsole',
        '360-degree reflective details',
      ],
    },
  ],
  [
    'kiprun-kipstorm-challenger',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipstorm Challenger product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-carbon-platte-kipstorm-challenger-weiss-schwarz/358423/c227c382m8963782',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page identifies the Kipstorm Challenger as a neutral carbon-plated road shoe for training and racing over all road distances.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fastech+', 'Carbon plate'],
      construction: ['Fastech+ foam midsole', 'Carbon plate'],
      heelToToeDrop: 8,
    },
  ],
  [
    'kiprun-kipstorm-elite',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipstorm Elite product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-carbon-platte-kipstorm-elite-hellgelb/362113/c269c382m8961381',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page positions the Kipstorm Elite as a neutral carbon-plated road racing shoe for half-marathon through marathon distances.',
      },
      stackHeightSource: {
        idSuffix: 'official-press-kit-source',
        type: 'manufacturer',
        label: 'Decathlon Kipstorm Elite press kit',
        url: 'https://einblicke.decathlon.de/presse/pressekit/kiprun-kipstorm-elite/',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The official press kit confirms a 39 mm heel and 34 mm forefoot stack.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fastech+', 'Carbon plate'],
      construction: ['Fastech+ foam midsole', 'Carbon plate', 'Knit upper'],
      heelToToeDrop: 5,
      stackHeight: { heel: 39, forefoot: 34 },
    },
  ],
  [
    'kiprun-kipstorm-interval',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipstorm Interval product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-herren-kipstorm-interval-weiss-rot/339603/c227c125m8961337',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page identifies the Kipstorm Interval as a neutral speed shoe for short-distance road and track training and competition.',
      },
      surfaces: ['Road', 'Track'],
      surfaceFamilies: ['road', 'track'],
      surfaceTags: ['road', 'asphalt', 'track'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fastech+'],
      construction: ['Fastech+ foam midsole'],
      heelToToeDrop: 6,
    },
  ],
  [
    'kiprun-kipstorm-lab',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipstorm Lab product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-strasse-carbon-platte-kipstorm-lab/369831/c140m8953316',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page identifies the Kipstorm Lab as a carbon-plated race shoe for asphalt and track, from 5 km through half marathon.',
      },
      surfaces: ['Road', 'Track'],
      surfaceFamilies: ['road', 'track'],
      surfaceTags: ['road', 'asphalt', 'track'],
      terrainProfiles: [],
      fit: ['Regular', 'Medium width'],
      technologies: ['Fluid Foam', 'Featherbounce', 'Hook Plate'],
      construction: ['Fluid Foam midsole', 'J-shaped carbon Hook Plate'],
      heelToToeDrop: 4,
    },
  ],
  [
    'kiprun-kipstorm-pro',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipstorm Pro product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-mit-carbon-platte-kd900x-ld2-orange-gruen/_/R-p-360707',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page identifies the Kipstorm Pro as a neutral Fastech+ carbon shoe for long, fast road runs and marathon racing.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fastech+', 'Carbon plate'],
      construction: ['Fastech+ foam midsole', 'Carbon plate'],
      heelToToeDrop: 4,
    },
  ],
  [
    'kiprun-kipstorm-tempo',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipstorm Tempo product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-herren-kipstorm-tempo-grun-gelb/362245/c266c132m9001574',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page identifies the Kipstorm Tempo as a non-carbon road shoe for tempo training and competition.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      fit: ['Regular', 'Medium width'],
      technologies: ['Fastech+', 'CMEVA'],
      construction: ['Dual-density Fastech+ and CMEVA midsole'],
      heelToToeDrop: 8,
      stackHeight: { heel: 45, forefoot: 37 },
    },
  ],
  [
    'kiprun-kipsummit',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipsummit product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-kipsummit-grau-orange/361994/c71m8932900',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page describes use across varied and hilly trails, including steep climbs, descents, and technical sections, and specifies mixed ground.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain'],
      fit: ['Regular', 'Medium width'],
      technologies: ['Softech', '4 mm lugs'],
      construction: [
        'Softech cushioned midsole',
        '4 mm lugged outsole',
        'Toe protection',
      ],
      heelToToeDrop: 6,
    },
  ],
  [
    'kiprun-kipsummit-max',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipsummit Max product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-kipsummit-max-schwarz-grau/362206/c208c382m8933583',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page identifies the Kipsummit Max as a maximum-cushion ultra-trail shoe for mixed terrain, hills, forests, and steep climbs.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain'],
      terrainProfiles: ['mixed-terrain'],
      fit: ['Regular', 'Medium width'],
      technologies: ['Fastech+', 'Vibram outsole', '4 mm lugs'],
      construction: [
        'Fastech+ SCF maximum-cushion midsole',
        'Vibram outsole with 4 mm lugs',
      ],
      heelToToeDrop: 6,
    },
  ],
  [
    'kiprun-kipsummit-race',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipsummit Race product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-carbon-platte-kipsummit-race-beige/361989/c269m8987899',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page identifies a carbon-plated ultra-trail race shoe with Vibram grip intended to perform across every terrain.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain'],
      terrainProfiles: ['mixed-terrain'],
      fit: ['Regular', 'Medium width'],
      technologies: [
        'Fastech+',
        'Carbon plate',
        'Vibram Megagrip Litebase',
        '4 mm lugs',
      ],
      construction: [
        'Fastech+ ATPU midsole',
        'Patented carbon plate',
        'Vibram Megagrip Litebase outsole with 4 mm lugs',
      ],
      heelToToeDrop: 6,
      stackHeight: { heel: 37.5, forefoot: 31.5 },
      maximumDistanceKm: 170,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'kiprun-kipsummit-wp',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Kipsummit WP product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-wasserdicht-kipsummit-wp-schwarz/362177/c382m8933575',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page describes the waterproof Kipsummit for wet grass, mud, forests, mountains, hilly paths and technical trail sections.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      fit: ['Regular', 'Medium width'],
      technologies: ['Softech', 'Waterproof membrane', '4 mm lugs'],
      construction: [
        'Softech cushioned midsole',
        'Waterproof hydrophobic upper',
        '4 mm lugged outsole',
      ],
      heelToToeDrop: 6,
      maximumDistanceKm: 60,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'mizuno-neo-cosmo',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'manufacturer',
        label: 'Mizuno Neo Cosmo product page',
        url: 'https://jpn.mizuno.com/ec/disp/attgrp/J1GC2513/',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'Mizuno classifies the Neo Cosmo as a neutral daily road shoe and the entry model in the Neo range; Decathlon publishes a 6 mm drop and half-marathon distance.',
      },
      measurementSource: {
        idSuffix: 'retailer-measurement-source',
        type: 'retailer-product',
        label: 'Decathlon Mizuno Neo Cosmo product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-mizuno-neo-cosmo/X9010160/m9010160',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page publishes a 6 mm drop.',
      },
      maximumDistanceSource: {
        idSuffix: 'retailer-distance-source',
        type: 'retailer-product',
        label: 'Decathlon Mizuno Neo Cosmo product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-mizuno-neo-cosmo/X9010160/m9010160',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications publish use through half-marathon distance.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Mizuno Enerzy NXT', 'X10 rubber'],
      construction: ['Mizuno Enerzy NXT midsole', 'X10 rubber outsole'],
      heelToToeDrop: 6,
      maximumDistanceKm: 21,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'mizuno-neo-zen-2',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Mizuno Neo Zen 2 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-mizuno-neo-zen-2-grau/381104/m9030792',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page classifies the Neo Zen 2 as a neutral road shoe for every level and publishes half-marathon distance, a 6 mm drop and no carbon plate.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Mizuno Enerzy NXT'],
      construction: ['Nitrogen-infused Mizuno Enerzy NXT midsole'],
      heelToToeDrop: 6,
      maximumDistanceKm: 21,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'mizuno-wave-impulse',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Mizuno Wave Impulse product page',
        url: 'https://www.decathlon.co.uk/p/women-s-mizuno-wave-impulse-firm-road-and-trail-running-shoes-mauve/365870/c16m8944005',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page explicitly identifies the neutral Wave Impulse for firm road and easy trail training, without claiming gravel or technical-terrain use.',
      },
      surfaces: ['Road', 'Firm Paths'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'firm-paths', 'easy-terrain'],
      terrainProfiles: ['road-to-trail', 'easy-terrain'],
      stability: 'neutral',
      fit: ['Wide'],
      technologies: ['Mizuno Enerzy', 'Foam Wave', 'Airmesh', 'X10 rubber'],
      construction: [
        'Mizuno Enerzy midsole',
        'Foam Wave cushioning',
        'Airmesh upper',
      ],
      heelToToeDrop: 8,
    },
  ],
  [
    'mizuno-wave-rider-29',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'manufacturer',
        label: 'Mizuno Wave Rider 29 product page',
        url: 'https://emea.mizuno.com/eu/en/wave-rider-29/J1GC250301.html',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'Mizuno positions the Wave Rider 29 as a neutral daily road trainer for runners from beginners through marathon training, with moderate cushioning.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['Mizuno Enerzy NXT', 'Mizuno Wave', 'X10 rubber'],
      construction: [
        'Full-length Mizuno Enerzy NXT midsole',
        'Mizuno Wave plate',
        'X10 heel rubber',
      ],
      heelToToeDrop: 10,
    },
  ],
  [
    'mizuno-wave-ultima-17',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'manufacturer',
        label: 'Mizuno Wave Ultima 17 product page',
        url: 'https://emea.mizuno.com/eu/en-ro/wave-ultima-17/J1GC261803.html',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'Mizuno positions the Wave Ultima 17 as a highly cushioned neutral daily shoe for beginners and recreational runners, including long runs.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Mizuno Enerzy NXT', 'Mizuno Wave', 'X10 rubber'],
      construction: [
        'Mizuno Enerzy NXT midsole',
        'Heel-to-midfoot Mizuno Wave plate',
        'Soft mesh upper with molded heel counter',
      ],
    },
  ],
  [
    'new-balance-1080-v15',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'manufacturer',
        label: 'New Balance 1080v15 product page',
        url: 'https://www.newbalance.com/pd/1080v15/M10808MP-D-08.html',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'New Balance classifies the 1080v15 as a neutral, extra-soft cushioned shoe for everyday road running and long runs.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Standard width'],
      technologies: ['Infinion foam'],
      construction: [
        'Infinion foam midsole',
        'Perforated mesh upper',
        'Rubber outsole',
      ],
      heelToToeDrop: 6,
    },
  ],
  [
    'new-balance-520-v9',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance 520 v9 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-new-balance-fresh-foam-520-v9-beige/364997/m9001464',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page classifies the 520 v9 as a neutral entry-level training shoe for simple ground with standard cushioning.',
      },
      maximumDistanceSource: distanceTableSource,
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['EVA cushioning'],
      construction: ['EVA foam midsole', 'One-piece breathable mesh upper'],
      heelToToeDrop: 10,
      maximumDistanceKm: 10,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'new-balance-840-v1',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance 840 v1 product page',
        url: 'https://www.decathlon.co.uk/p/men-s-new-balance-840-running-shoes/362117/c2m8933543',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon page classifies the 840 v1 as a neutral cushioned training and competition shoe for half-marathon and marathon distances on simple ground.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fresh Foam X', 'Ndurance'],
      construction: [
        'Fresh Foam X cushioned midsole',
        'Ndurance rubber outsole',
        'Ventilated upper',
      ],
      heelToToeDrop: 4,
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'new-balance-ellipse',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance Fresh Foam X Ellipse product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-new-balance-fresh-foam-x-ellipse-beige/380844/m9030755',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications classify the Ellipse as a neutral cushioned and dynamic shoe for roads and paths, up to half-marathon distance.',
      },
      surfaces: ['Road', 'Firm Paths'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths', 'easy-terrain'],
      terrainProfiles: ['easy-terrain'],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fresh Foam X'],
      construction: [
        'Fresh Foam X cushioned midsole',
        'Breathable engineered mesh upper',
        'Durable rubber outsole',
      ],
      heelToToeDrop: 8,
      maximumDistanceKm: 21,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'new-balance-fuelcell-propel-v5',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance FuelCell Propel v5 product page',
        url: 'https://www.decathlon.co.uk/p/men-s-running-shoes-new-balance-fuelcell-propel-v5-grey/357868/c2m8968035',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications classify the Propel v5 as a neutral dynamic training and competition shoe for road and easy ground, through marathon distance.',
      },
      surfaces: ['Road', 'Firm Paths'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths', 'easy-terrain'],
      terrainProfiles: ['easy-terrain'],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['FuelCell', 'Ndurance'],
      construction: [
        'FuelCell responsive midsole',
        'TPU propulsion plate',
        'Ndurance rubber outsole',
      ],
      heelToToeDrop: 6,
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'new-balance-fuelcell-rebel-v5',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance FuelCell Rebel v5 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-new-balance-fuelcell-rebel-v5-gelb/372784/m9030750',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications classify the Rebel v5 as a neutral, highly dynamic road and track shoe through half-marathon distance.',
      },
      surfaces: ['Road', 'Track'],
      surfaceFamilies: ['road', 'track'],
      surfaceTags: ['road', 'asphalt', 'track'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['FuelCell', 'FantomFit', 'Ndurance'],
      construction: [
        'PEBA and EVA FuelCell midsole',
        'FantomFit engineered mesh upper',
        'Ndurance rubber outsole',
      ],
      heelToToeDrop: 6,
      stackHeight: { heel: 32, forefoot: 26 },
      maximumDistanceKm: 21,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'new-balance-garoe-v2',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance Fresh Foam X Garoe v2 product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-new-balance-fresh-foam-x-garoe-v2-braun/377744/m9003163',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications describe snow, rocky, sandy, muddy, uneven, and dry-grass terrain for this neutral trail shoe, up to 80 km.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fresh Foam X', 'AT Tread'],
      construction: [
        'Fresh Foam X cushioned midsole',
        'AT Tread outsole with 3 mm lugs',
      ],
      heelToToeDrop: 8,
      maximumDistanceKm: 80,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'new-balance-hierro-v9',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance Fresh Foam X Hierro v9 product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-new-balance-fresh-foam-x-hierro-v9-grau-gelb/365842/m9029852',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications classify the Hierro v9 as a maximum-cushion trail shoe for rough, muddy, and uneven ground, up to 170 km.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fresh Foam X', 'Vibram Megagrip'],
      construction: [
        'Dual-density Fresh Foam X midsole',
        'Vibram Megagrip outsole with 4.5 mm lugs',
        'Toe Protect reinforcement',
      ],
      heelToToeDrop: 4,
      weight: { amount: 294, referenceSize: 'Size not stated' },
      maximumDistanceKm: 170,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'new-balance-kaiha-v2',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance Fresh Foam X Kaiha v2 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-new-balance-fresh-foam-x-kaiha-v2-grau/380864/m8999965',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications classify the Kaiha v2 as a neutral maximum-cushion daily shoe for roads and paths, up to half-marathon distance.',
      },
      surfaces: ['Road', 'Firm Paths'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths', 'easy-terrain'],
      terrainProfiles: ['easy-terrain'],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fresh Foam X'],
      construction: [
        'Fresh Foam X cushioned midsole',
        'Seamless breathable mesh upper',
        'Reinforced heel counter',
      ],
      heelToToeDrop: 4,
      maximumDistanceKm: 21,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'new-balance-more-v6',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance Fresh Foam X More v6 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-new-balance-fresh-foam-x-more-v6-grau/372907/c251m9030746',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications classify the More v6 as a neutral maximum-cushion road and path shoe through marathon distance.',
      },
      surfaces: ['Road', 'Firm Paths'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths', 'easy-terrain'],
      terrainProfiles: ['easy-terrain'],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Fresh Foam X', 'Ndurance'],
      construction: [
        'Fresh Foam X maximum-cushion midsole',
        'Seamless mesh upper',
        'Ndurance rubber outsole',
      ],
      heelToToeDrop: 4,
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'new-balance-rebel-trail',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon New Balance Rebel Trail product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-new-balance-rebel-trail-grun/381806/m9003166',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications classify the Rebel Trail as a neutral, highly dynamic shoe for rough, muddy, and uneven trails, up to 170 km.',
      },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['FuelCell', 'Vibram Megagrip'],
      construction: [
        'FuelCell responsive midsole',
        'Vibram Megagrip outsole',
        'Toe protection reinforcement',
      ],
      heelToToeDrop: 6,
      weight: { amount: 302, referenceSize: 'Size not stated' },
      maximumDistanceKm: 170,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'puma-deviate-nitro-4',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Puma Deviate Nitro 4 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-hyrox-puma-deviate-nitro-4-rot/380836/m9026894',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications classify the Deviate Nitro 4 as a highly dynamic, carbon-plated shoe for roads and track through marathon distance.',
      },
      surfaces: ['Road', 'Track'],
      surfaceFamilies: ['road', 'track'],
      surfaceTags: ['road', 'asphalt', 'track'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['NITROFOAM', 'PWRPLATE', 'PUMAGRIP', 'PWRTAPE'],
      construction: [
        'NITROFOAM cushioned midsole',
        'Carbon PWRPLATE',
        'PUMAGRIP rubber outsole',
      ],
      heelToToeDrop: 8,
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'puma-velocity-nitro-4',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'manufacturer',
        label: 'Puma Velocity Nitro 4 product page',
        url: 'https://eu.puma.com/de/en/pd/velocity-nitro-4-running-shoes-men/311140',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'Puma classifies the Velocity Nitro 4 as a neutral everyday road-running shoe with multi-surface traction.',
      },
      maximumDistanceSource: distanceTableSource,
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['NITROFOAM', 'PUMAGRIP', 'PWRTAPE'],
      construction: [
        'Full-length NITROFOAM midsole',
        'Engineered knit upper reinforced with PWRTAPE',
        'PUMAGRIP rubber outsole',
      ],
      heelToToeDrop: 10,
      stackHeight: { heel: 36, forefoot: 26 },
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'puma-velocity-nitro-5',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'manufacturer',
        label: 'Puma Velocity Nitro 5 product page',
        url: 'https://eu.puma.com/de/en/pd/velocity-nitro-5-running-shoes-men/312944',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'Puma classifies the Velocity Nitro 5 as a regular-width neutral road shoe for frequent daily running, with medium cushioning and an 8 mm drop.',
      },
      maximumDistanceSource: {
        idSuffix: 'previous-generation-distance-reference',
        type: 'legacy-workbook',
        label: 'Puma Velocity Nitro 4 distance reference',
        url: null,
        checkedAt: '2026-09-11',
        status: 'derived',
        note: 'Carried forward from the 42 km Puma Velocity Nitro 4 distance at the user’s direction for the newer Velocity Nitro 5.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['NITROFOAM', 'PUMAGRIP'],
      construction: [
        'NITROFOAM responsive midsole',
        'Engineered mesh upper',
        'PUMAGRIP rubber outsole',
      ],
      heelToToeDrop: 8,
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'derived',
    },
  ],
  [
    'asics-gel-nimbus-28',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Gel Nimbus 28 product page',
        url: 'https://www.decathlon.de/p/mp/herren-laufschuh-gel-nimbus-28/0a18c211-e167-4553-b254-bb1c35cefb8a/c218c255',
        checkedAt: '2026-09-10',
        status: 'verified',
        note: 'The supplied Decathlon marketplace page confirms a medium-width maximum-cushion shoe for long runs, with FF BLAST PLUS, PureGEL, and a knit upper. It does not publish numerical distance, drop, stack height, or weight measurements.',
      },
      fit: ['Regular', 'Medium width'],
      technologies: ['FF BLAST PLUS', 'PureGEL'],
      construction: [
        'Knit upper',
        'FF BLAST PLUS cushioned midsole',
        'PureGEL cushioning',
      ],
    },
  ],
  [
    'asics-gel-roadmiles-4',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Gel Roadmiles 4 product page',
        url: 'https://www.decathlon.de/p/gebraucht-laufschuhe-damen-gel-roadmiles-4/386750-N/m9030408-N',
        checkedAt: '2026-09-10',
        status: 'verified',
        note: 'The supplied Decathlon page publishes road use through half-marathon distance, stability from a wider platform, medium width, an 8 mm drop, 35.5/27.5 mm stack, and the product construction. The published 241 g weight has no reference size and remains unstructured.',
      },
      heelToToeDrop: 8,
      stackHeight: { heel: 35.5, forefoot: 27.5 },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'stability',
      fit: ['Regular', 'Medium width'],
      technologies: ['PureGEL', 'FF BLAST MAX', 'Engineered mesh'],
      construction: [
        'Engineered mesh upper',
        'FF BLAST MAX cushioned midsole',
        'PureGEL cushioning',
        'High-density rubber outsole inserts',
        'Wide platform for stability',
      ],
      maximumDistanceKm: 21,
    },
  ],
  [
    'asics-gt-2000-13',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon GT-2000 13 product page',
        url: 'https://www.decathlon.de/p/mp/lauf-gt-2000-13/159548fe-29c2-4080-ae74-6f0b7a43942b/c1',
        checkedAt: '2026-09-10',
        status: 'verified',
        note: 'The supplied Decathlon marketplace page confirms additional support from the 3D Guidance System, PureGEL cushioning, and an FF BLAST PLUS midsole. Its specifications label the running style neutral, while the description explicitly positions the guidance system as added support. It does not publish numerical distance, drop, stack height, or weight measurements.',
      },
      stability: 'stability',
      technologies: ['3D Guidance System', 'PureGEL', 'FF BLAST PLUS'],
      construction: [
        '3D Guidance System',
        'PureGEL cushioning',
        'FF BLAST PLUS cushioned midsole',
        'Textile and synthetic upper',
      ],
    },
  ],
  [
    'asics-novablast-5',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Novablast 5 product page',
        url: 'https://www.decathlon.de/p/mp/herren-laufschuh-novablast-5/1a789de4-2b5f-4e64-b9a3-ea3019c87410/c5',
        checkedAt: '2026-09-10',
        status: 'verified',
        note: 'The supplied Decathlon marketplace page confirms neutral road use, medium width, FF BLAST MAX cushioning, an engineered jacquard mesh upper, and AHAR LO outsole rubber. It does not publish numerical distance, drop, stack height, or weight measurements.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['FF BLAST MAX', 'AHAR LO'],
      construction: [
        'Engineered jacquard mesh upper',
        'FF BLAST MAX cushioned midsole',
        'Trampoline-inspired outsole geometry',
        'AHAR LO outsole rubber',
      ],
    },
  ],
  [
    'asics-dynablast-5',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Dynablast 5 product page',
        url: 'https://www.decathlon.de/p/mp/herren-laufschuh-dynablast-5/d405bb5a-0a1d-45f8-aa31-19eb9b053869/c8',
        checkedAt: '2026-09-10',
        status: 'verified',
        note: 'The supplied Decathlon marketplace page publishes neutral road training use, medium width, an 8 mm drop, a 43–80 km distance range, and the product construction. It does not publish stack height or weight.',
      },
      heelToToeDrop: 8,
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Jacquard mesh'],
      construction: [
        'Engineered jacquard mesh upper',
        'Mesh tongue',
        'Midsole and outsole geometry designed for energy return',
      ],
      maximumDistanceKm: 80,
    },
  ],
  [
    'asics-gel-kayano-32',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Gel Kayano 32 product page',
        url: 'https://www.decathlon.de/p/mp/gel-kayano-32-turnschuhe/dcaa3e25-52c8-4b43-ab0d-e9b8d8bbc46f/c255',
        checkedAt: '2026-09-10',
        status: 'verified',
        note: 'The supplied Decathlon marketplace page confirms a stability and cushioning shoe for daily training and long distances. It does not publish numerical distance, drop, stack height, or weight measurements.',
      },
      stability: 'stability',
      technologies: ['Stability support', 'Cushioning'],
      construction: ['Stability support system', 'Cushioned midsole'],
      maximumDistanceSource: {
        idSuffix: 'kayano-31-distance-reference',
        type: 'legacy-workbook',
        label: 'Supplied running-shoe range table',
        url: null,
        checkedAt: '2026-09-11',
        status: 'derived',
        note: 'Carried forward from the 42 km Gel Kayano 31 distance in the supplied range table at the user’s direction for the newer Gel Kayano 32.',
      },
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'derived',
    },
  ],
  [
    'asics-gel-kayano-33',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Gel Kayano 33 product page',
        url: 'https://www.decathlon.de/p/mp/asics-laufschuhe-gel-kayano-33-erwachsene/fcd91655-12a3-4705-84cb-ff9be7b03c4d/c251',
        checkedAt: '2026-09-10',
        status: 'verified',
        note: 'The supplied Decathlon marketplace page confirms stable support, maximum cushioning, FF BLAST MAX, and the 4D Guidance System. It does not publish numerical distance, drop, stack height, or weight measurements.',
      },
      stability: 'stability',
      technologies: ['FF BLAST MAX', '4D Guidance System'],
      construction: [
        'FF BLAST MAX cushioned midsole',
        '4D Guidance System',
        'Breathable mesh upper with structured overlays',
        'Padded collar and integrated tongue',
      ],
      maximumDistanceSource: {
        idSuffix: 'kayano-31-distance-reference',
        type: 'legacy-workbook',
        label: 'Supplied running-shoe range table',
        url: null,
        checkedAt: '2026-09-11',
        status: 'derived',
        note: 'Carried forward from the 42 km Gel Kayano 31 distance in the supplied range table at the user’s direction for the newer Gel Kayano 33.',
      },
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'derived',
    },
  ],
  [
    'asics-gel-excite-11',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Gel Excite 11 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-asics-gel-excite-11/373644/m9030731',
        checkedAt: '2026-09-10',
        status: 'verified',
        note: 'The Decathlon description and specifications publish entry-level road use up to 10 km, neutral gait, medium width, an 8 mm drop, 25/17 mm stack, 290 g weight at EU 42.5, and the product construction.',
      },
      heelToToeDrop: 8,
      stackHeight: { heel: 25, forefoot: 17 },
      weight: { amount: 290, referenceSize: 'EU 42.5' },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['Amplifoam+', 'GEL', 'Guidance Line'],
      construction: [
        'Amplifoam+ midsole',
        'GEL cushioning',
        'Jacquard mesh upper',
        'Guidance Line geometry',
      ],
      maximumDistanceKm: 10,
    },
  ],
  [
    'asics-gel-superion-8',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Gel Superion 8 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-asics-gel-superion-8-turkis-grun/372789/c1m8999636',
        checkedAt: '2026-09-10',
        status: 'verified',
        note: 'The Decathlon specifications publish road use through half-marathon distance, adaptive stability, medium width, a 10 mm drop, and the product construction. The published 305 g weight has no reference size and remains unstructured.',
      },
      heelToToeDrop: 10,
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'stability',
      fit: ['Regular', 'Medium width'],
      technologies: ['FF BLAST PLUS ECO', 'PureGEL', '4D Guidance System'],
      construction: [
        'FF BLAST PLUS ECO midsole',
        'PureGEL cushioning',
        '4D Guidance System',
        'Seamless knit mesh upper',
        'AHAR+ outsole',
      ],
      maximumDistanceKm: 21,
    },
  ],
  [
    'adidas-adistar-5',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Adistar 5 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-strasse-herren-adidas-adistar-5-weiss-beige-orange/386393/c4c30c20m9026814',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'The supplied Decathlon page identifies road and path use, neutral gait, regular width, marathon use, and the published construction details.',
      },
      measurementSource: {
        idSuffix: 'manufacturer-measurements',
        type: 'manufacturer',
        label: 'Adidas Adistar 5 product details',
        url: 'https://www.adidas.de/en/adistar-5-running-shoes/KI4355.html',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'Adidas publishes a 6 mm drop, 45/39 mm stack, and 264 g weight at EU 42⅔ for the Adistar 5. Decathlon currently lists a conflicting 10 mm drop.',
      },
      heelToToeDrop: 6,
      stackHeight: { heel: 45, forefoot: 39 },
      weight: { amount: 264, referenceSize: 'EU 42⅔' },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: [
        'Dreamstrike foam',
        'Internal fit panel',
        'Adiwear outsole',
      ],
      construction: [
        'Dreamstrike foam midsole',
        'Rockered midsole geometry',
        'Technical mono-mesh upper with internal fit panel',
        'Adiwear rubber outsole',
      ],
      maximumDistanceKm: 42,
    },
  ],
  [
    'adidas-adizero-boston-13',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Adizero Boston 13 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-leicht-dynamisch-adidas-adizero-boston-13-gelb/372901/c22m8999870',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'The supplied Decathlon page describes road training through marathon racing and publishes neutral construction, regular width, an 8 mm drop, and 260 g weight.',
      },
      stackHeightSource: {
        idSuffix: 'manufacturer-stack-source',
        type: 'manufacturer',
        label: 'Adidas Adizero Boston 13 product details',
        url: 'https://www.adidas.de/adizero-boston-13-schuh/JP9246.html',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'This Adidas product variant matches the linked Decathlon page’s published 8 mm drop and specifies a 36/28 mm stack.',
      },
      heelToToeDrop: 8,
      stackHeight: { heel: 36, forefoot: 28 },
      weight: { amount: 260, referenceSize: 'Size not stated' },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: [
        'Lightstrike 2.0',
        'Lightstrike Pro',
        'Energyrods 2.0',
        'Lighttraxion outsole',
        'Continental rubber',
      ],
      construction: [
        'Lightstrike 2.0 and Lightstrike Pro midsole',
        'Glass-fibre Energyrods 2.0',
        'Technical mesh upper',
        'Lighttraxion outsole with Continental rubber toe-off',
      ],
      maximumDistanceKm: 42,
    },
  ],
  [
    'adidas-adizero-evo-sl',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Adizero Evo SL product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-leicht-adidas-adizero-evo-sl-beige-schwarz/372979/c30c27m9026813',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'The supplied Decathlon specifications publish road use through half marathon, regular width, a 6 mm drop, and 224 g at EU 42.',
      },
      stackHeightSource: {
        idSuffix: 'manufacturer-stack-source',
        type: 'manufacturer',
        label: 'Adidas Adizero Evo SL product details',
        url: 'https://www.adidas.de/en/adizero-evo-sl-shoes/JS4494.html',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'This Adidas product variant matches the supplied Decathlon page’s 224 g weight and 6 mm drop and specifies a 38/32 mm stack.',
      },
      heelToToeDrop: 6,
      stackHeight: { heel: 38, forefoot: 32 },
      weight: { amount: 224, referenceSize: 'EU 42' },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['Lightstrike Pro', 'Continental rubber'],
      construction: [
        'Lightstrike Pro midsole',
        'Technical mesh upper',
        'Continental rubber forefoot patch',
      ],
      maximumDistanceKm: 21.1,
    },
  ],
  [
    'adidas-galaxy-7',
    {
      source: {
        idSuffix: 'manufacturer-product-source',
        type: 'manufacturer',
        label: 'Adidas Galaxy 7 product details',
        url: 'https://www.adidas.de/en/galaxy-7-running-shoes/ID8754.html',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'Adidas publishes road use, a 10 km maximum distance, neutral gait, regular fit, 6 mm drop, 35/29 mm stack, and 319 g at UK 8.5.',
      },
      heelToToeDrop: 6,
      stackHeight: { heel: 35, forefoot: 29 },
      weight: { amount: 319, referenceSize: 'UK 8.5' },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['Cloudfoam', 'TPU outsole'],
      construction: [
        'Cloudfoam midsole',
        'Textile upper and lining',
        'TPU outsole',
      ],
      maximumDistanceKm: 10,
    },
  ],
  [
    'adidas-supernova-rise-3',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Supernova Rise 3 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-damen-adidas-supernova-rise-3-weiss-rosa/381630/c4c24m9002353',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'The supplied Decathlon page publishes road and easy-ground use, neutral gait, marathon distance, regular width, a 10 mm drop, and 230 g at EU 38 2/3.',
      },
      heelToToeDrop: 10,
      weight: { amount: 230, referenceSize: 'EU 38 2/3' },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['Dreamstrike+', 'Primeweave', 'Lighttraxion'],
      construction: [
        'Dreamstrike+ midsole',
        'Primeweave technical upper',
        'Lighttraxion road outsole',
      ],
      maximumDistanceKm: 42,
    },
  ],
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
      surfaceFamilies: ['off-road'],
      surfaceTags: ['technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
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
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain'],
      stability: 'neutral',
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
      surfaces: ['Road', 'Gravel', 'Firm Paths'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: [
        'road',
        'asphalt',
        'gravel',
        'firm-paths',
        'easy-terrain',
        'mixed-terrain',
      ],
      terrainProfiles: [
        'gravel',
        'road-to-trail',
        'easy-terrain',
        'mixed-terrain',
      ],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: [
        'optiFOAM²',
        'Gravel Contagrip',
        'SensiFit',
        'Engineered mesh',
      ],
      construction: [
        'optiFOAM² responsive midsole',
        'Gravel Contagrip outsole with 2.5 mm lugs',
        'Engineered mesh upper',
      ],
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
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: [
        'optiFOAM',
        'Active Chassis',
        'All-Terrain Contagrip',
        'Matryx upper',
      ],
      construction: [
        'optiFOAM cushioned midsole',
        'Active Chassis guidance structure',
        'All-Terrain Contagrip outsole with 4.5 mm lugs',
        'Matryx upper',
      ],
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
      surfaceFamilies: ['off-road'],
      surfaceTags: ['technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
      technologies: ['Fuze Foam', 'All-Terrain Contagrip', 'SensiFit'],
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
      surfaceFamilies: ['off-road'],
      surfaceTags: ['technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
      technologies: [
        'Fuze Foam',
        'All-Terrain Contagrip',
        'SensiFit',
        'Gore-Tex',
      ],
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
      surfaces: ['Road', 'Trail'],
      surfaceFamilies: ['road', 'off-road'],
      surfaceTags: ['road', 'asphalt', 'firm-paths', 'mixed-terrain'],
      terrainProfiles: ['road-to-trail', 'mixed-terrain'],
      stability: 'neutral',
      technologies: ['optiFOAM', 'All-Terrain Contagrip'],
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
      surfaceFamilies: ['off-road'],
      surfaceTags: ['easy-terrain'],
      terrainProfiles: ['easy-terrain'],
      stability: 'neutral',
      technologies: ['Fuze Foam', 'All-Terrain Contagrip', 'SensiFit'],
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
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain'],
      terrainProfiles: ['mixed-terrain'],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['optiFOAM', 'All-Terrain Contagrip', 'relieveSPHERE'],
      construction: [
        'optiFOAM cushioned midsole',
        'All-Terrain Contagrip outsole with 4 mm lugs',
        'Engineered mesh upper with EndoFit sleeve',
      ],
    },
  ],
  [
    'saucony-guide-19',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'manufacturer',
        label: 'Saucony Guide 19 product page',
        url: 'https://www.saucony.com/UK/en_GB/guide-19-prism/62408M.html',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'Saucony classifies the Guide 19 as a maximum-cushion everyday guidance shoe with a 6 mm offset.',
      },
      maximumDistanceSource: distanceTableSource,
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'stability',
      fit: ['Regular'],
      technologies: ['PWRRUN', 'CenterPath'],
      construction: [
        'PWRRUN cushioned midsole',
        'CenterPath guidance geometry',
        'Adaptive mesh upper',
      ],
      heelToToeDrop: 6,
      stackHeight: { heel: 35, forefoot: 29 },
      maximumDistanceKm: 42,
      maximumDistanceStatus: 'verified',
    },
  ],
  [
    'saucony-ride-19',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Saucony Ride 19 product page',
        url: 'https://www.decathlon.de/p/laufschuhe-herren-saucony-ride-19-orange-weiss/381005/c20c22c4m9000219',
        checkedAt: '2026-09-12',
        status: 'verified',
        note: 'The Decathlon specifications classify the Ride 19 as a medium-width road shoe for every level, with strong cushioning, regular dynamism, and use through half-marathon distance.',
      },
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular', 'Medium width'],
      technologies: ['PWRRUN+'],
      construction: [
        'Full-length PWRRUN+ cushioned midsole',
        'Engineered breathable mesh upper',
        'Durable rubber outsole with forefoot flex grooves',
      ],
      heelToToeDrop: 8,
      maximumDistanceKm: 21,
      maximumDistanceStatus: 'verified',
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
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
      technologies: ['PWRRUN foam', 'Vibram Megagrip', '4 mm lugs'],
      construction: [
        'PWRRUN midsole',
        'Vibram Megagrip outsole',
        '4 mm trail lugs',
        'Protective abrasion-resistant mesh upper',
      ],
      maximumDistanceKm: 60,
    },
  ],
  [
    'adidas-runblaze',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Runblaze product page',
        url: 'https://www.decathlon.it/p/scarpe-running-uomo-adidas-runblaze-nere/361354/c1m8929086',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'The Decathlon specifications publish beginner road and easy-ground training use, neutral gait, regular width, and a 1–10 km distance range.',
      },
      measurementSource: {
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
      surfaces: ['Road'],
      surfaceFamilies: ['road'],
      surfaceTags: ['road', 'asphalt'],
      terrainProfiles: [],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['Cloudfoam', 'Mesh upper', 'Rubber outsole'],
      construction: ['Cloudfoam cushioning', 'Mesh upper', 'Rubber outsole'],
      maximumDistanceKm: 10,
    },
  ],
  [
    'adidas-adizero-agravic-speed-2',
    {
      source: {
        idSuffix: 'verified-product-source',
        type: 'retailer-product',
        label: 'Decathlon Agravic Speed 2 product page',
        url: 'https://www.decathlon.de/p/trailrunningschuhe-herren-adidas-terrex-agravic-speed-2-orange/382059/c20m9004460',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'The supplied Decathlon page publishes trail racing use up to 40 km, neutral gait, regular fit, and easy, mixed, and technical terrain.',
      },
      measurementSource: {
        idSuffix: 'manufacturer-measurements',
        type: 'manufacturer',
        label: 'Adidas Agravic Speed 2 product details',
        url: 'https://www.adidas.de/terrex-agravic-speed-2-trailrunning-schuh/JR9102.html',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'Adidas publishes an 8 mm drop, 35/27 mm stack, and 220.6 g weight.',
      },
      heelToToeDrop: 8,
      stackHeight: { heel: 35, forefoot: 27 },
      weight: { amount: 220.6, referenceSize: 'Size not stated' },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain'],
      terrainProfiles: ['easy-terrain', 'mixed-terrain', 'technical-terrain'],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['Lightstrike Pro', 'Lightstrike', 'Continental rubber'],
      construction: [
        'Lightstrike Pro and Lightstrike dual-density midsole',
        'Technical mono-mesh upper',
        'Continental rubber outsole',
      ],
      maximumDistanceKm: 40,
    },
  ],
  [
    'adidas-terrex-agravic-4',
    {
      source: {
        idSuffix: 'manufacturer-product-source',
        type: 'manufacturer',
        label: 'Adidas Terrex Agravic 4 product details',
        url: 'https://www.adidas.de/en/terrex-agravic-4-trail-running-shoes/KJ1291.html',
        checkedAt: '2026-09-09',
        status: 'verified',
        note: 'Adidas publishes multi-terrain trail use, regular fit, an 8 mm drop, 35/27 mm stack, 276.8 g weight, and the product construction.',
      },
      maximumDistanceSource: {
        idSuffix: 'book-monitor-source',
        type: 'legacy-workbook',
        label: 'Decathlon Book Monitor Agravic 4 product slide',
        url: null,
        checkedAt: '2026-09-07',
        status: 'verified',
        note: 'The supplied Decathlon Book Monitor slide publishes a 0–80 km use range.',
      },
      heelToToeDrop: 8,
      stackHeight: { heel: 35, forefoot: 27 },
      surfaces: ['Trail'],
      surfaceFamilies: ['off-road'],
      surfaceTags: ['mixed-terrain'],
      terrainProfiles: ['mixed-terrain', 'technical-terrain', 'muddy-terrain'],
      stability: 'neutral',
      fit: ['Regular'],
      technologies: ['Lightstrike', 'Continental rubber', 'TPU overlays'],
      construction: [
        'Lightstrike midsole',
        'Mesh upper with TPU overlays',
        'Continental rubber outsole',
      ],
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
      surfaceFamilies: ['track', 'off-road'],
      surfaceTags: ['track', 'cross-country'],
      terrainProfiles: [],
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
      surfaceFamilies: ['off-road'],
      surfaceTags: ['cross-country'],
      terrainProfiles: [],
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
      surfaceFamilies: ['track'],
      surfaceTags: ['track'],
      terrainProfiles: [],
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
      surfaceFamilies: ['track'],
      surfaceTags: ['track'],
      terrainProfiles: [],
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

function deriveSurfaceFamilies(surfaces: string[]): SurfaceFamily[] {
  const families = new Set<SurfaceFamily>();
  for (const surface of surfaces.map((value) =>
    value.toLocaleLowerCase('en'),
  )) {
    if (surface === 'road') families.add('road');
    if (surface === 'track' || surface === 'cross-country') {
      families.add('track');
    }
    if (
      surface === 'trail' ||
      surface === 'muddy trail' ||
      surface === 'gravel' ||
      surface === 'firm paths' ||
      surface === 'cross-country'
    ) {
      families.add('off-road');
    }
  }
  return [...families];
}

function deriveTerrainProfiles(
  row: Row,
  surfaceFamilies: SurfaceFamily[],
): TerrainProfile[] | null {
  if (!surfaceFamilies.includes('off-road')) return [];

  const normalizedSurfaces = splitList(row.surface, /\s*[·|]\s*/).map((value) =>
    value.toLocaleLowerCase('en'),
  );
  if (
    normalizedSurfaces.length > 0 &&
    normalizedSurfaces.every((surface) =>
      ['track', 'cross-country'].includes(surface),
    )
  ) {
    return [];
  }

  const text = [row.model, row.surface, row.best_for_en]
    .join(' ')
    .toLocaleLowerCase('en');
  const secondaryCategory = slugify(row.secondary_category);
  const profiles = new Set<TerrainProfile>();

  if (
    text.includes('road-to-trail') ||
    secondaryCategory === 'road-to-trail' ||
    (surfaceFamilies.includes('road') && surfaceFamilies.includes('off-road'))
  ) {
    profiles.add('road-to-trail');
  }
  if (/\b(gravel|firm paths?|park paths?)\b/.test(text)) {
    profiles.add('gravel');
  }
  if (/\b(easy|light|groomed)\b/.test(text)) {
    profiles.add('easy-terrain');
  }
  if (/\b(mixed|varied|versatile)\b/.test(text)) {
    profiles.add('mixed-terrain');
  }
  if (/\b(technical|rugged|steep|mountain)\b/.test(text)) {
    profiles.add('technical-terrain');
  }
  if (/\b(muddy|soft trails?)\b/.test(text) || text.includes('muddy trail')) {
    profiles.add('muddy-terrain');
  }

  if (profiles.size > 0) return [...profiles];
  return text.includes('cross-country') ? [] : null;
}

function deriveSurfaceTags(
  surfaces: string[],
  surfaceFamilies: SurfaceFamily[],
  terrainProfiles: TerrainProfile[] | null,
): SurfaceTag[] {
  const tags = new Set<SurfaceTag>();
  const normalizedSurfaces = surfaces.map((surface) =>
    surface.toLocaleLowerCase('en'),
  );

  if (surfaceFamilies.includes('road')) tags.add('road');
  if (surfaceFamilies.includes('track')) tags.add('track');
  if (normalizedSurfaces.includes('cross-country')) tags.add('cross-country');
  if (normalizedSurfaces.includes('gravel')) tags.add('gravel');
  if (
    normalizedSurfaces.some((surface) =>
      ['firm paths', 'easy terrain'].includes(surface),
    )
  ) {
    tags.add('firm-paths');
  }

  for (const profile of terrainProfiles ?? []) {
    if (profile === 'gravel') tags.add('gravel');
    if (profile === 'road-to-trail') {
      tags.add('firm-paths');
    }
    if (profile === 'easy-terrain') tags.add('easy-terrain');
    if (profile === 'mixed-terrain') tags.add('mixed-terrain');
    if (profile === 'technical-terrain') tags.add('technical-terrain');
    if (profile === 'muddy-terrain') tags.add('muddy-terrain');
  }

  if (tags.size === 0 && surfaceFamilies.includes('off-road')) {
    tags.add('mixed-terrain');
  }
  return [...tags];
}

function comparableScore(current: ShoeProduct, candidate: ShoeProduct) {
  const currentCategories = current.categories.map(({ id }) => id);
  const candidateCategories = new Set(candidate.categories.map(({ id }) => id));
  const sharedCategories = currentCategories.filter((id) =>
    candidateCategories.has(id),
  ).length;
  const currentSurfaces = current.specifications.surfaceTags.value ?? [];
  const candidateSurfaces = new Set(
    candidate.specifications.surfaceTags.value ?? [],
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
    sharedSurfaces * 10 +
    (current.specifications.stability.value ===
    candidate.specifications.stability.value
      ? 3
      : 0) +
    dropAffinity +
    (current.brand.id !== candidate.brand.id ? 0.25 : 0)
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
    const primaryCategory = product.categories[0]?.id;
    const samePrimaryCategory = ranked.filter(
      ({ candidate }) => candidate.categories[0]?.id === primaryCategory,
    );
    const preferred =
      samePrimaryCategory.length >= 3
        ? samePrimaryCategory
        : [
            ...samePrimaryCategory,
            ...ranked.filter(
              ({ candidate }) =>
                candidate.categories[0]?.id !== primaryCategory,
            ),
          ];
    const selected = preferred.slice(0, 3).map(({ candidate }) => candidate);
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
      (category) =>
        Boolean(category) &&
        !['road-to-trail', 'technical-trail'].includes(slugify(category)),
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
    const distanceFromBestFor = parseMaximumDistance(row.best_for_en);
    const tableMaximumDistanceKm = recordedMaximumDistancesKm.get(productId);
    const shouldUseDistanceTable =
      recordedFacts?.maximumDistanceKm === undefined &&
      distanceFromBestFor.value === null &&
      tableMaximumDistanceKm !== undefined;
    const weightSourceId = weight
      ? ensureWeightSource(productId, sources, weight)
      : null;
    const recordedFactsSourceId = recordedFacts
      ? ensureRecordedProductSource(productId, sources, recordedFacts)
      : null;
    const measurementSourceId = recordedFacts?.measurementSource
      ? ensureAdditionalRecordedSource(
          productId,
          sources,
          recordedFacts.measurementSource,
        )
      : recordedFactsSourceId;
    const stackHeightSourceId = recordedFacts?.stackHeightSource
      ? ensureAdditionalRecordedSource(
          productId,
          sources,
          recordedFacts.stackHeightSource,
        )
      : measurementSourceId;
    const maximumDistanceSourceId = shouldUseDistanceTable
      ? ensureAdditionalRecordedSource(productId, sources, distanceTableSource)
      : recordedFacts?.maximumDistanceSource
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
    const surfaces =
      recordedFacts?.surfaces ??
      splitList(row.surface, /\s*[·|]\s*/).map(titleCase);
    const surfaceEvidence =
      recordedFacts?.surfaces && recordedFactsSourceId
        ? {
            status: 'verified' as const,
            sourceIds: [recordedFactsSourceId],
            note: recordedFacts.source.note,
          }
        : fallbackEvidence;
    const surfaceFamilies =
      recordedFacts?.surfaceFamilies ?? deriveSurfaceFamilies(surfaces);
    const terrainProfiles =
      recordedFacts?.terrainProfiles ??
      deriveTerrainProfiles(row, surfaceFamilies);
    const productSurfaceTags =
      recordedFacts?.surfaceTags ??
      deriveSurfaceTags(surfaces, surfaceFamilies, terrainProfiles);

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
          value: surfaces,
          evidence: surfaceEvidence,
        },
        surfaceFamilies: {
          value: surfaceFamilies,
          evidence:
            recordedFacts?.surfaceFamilies && recordedFactsSourceId
              ? {
                  status: 'verified',
                  sourceIds: [recordedFactsSourceId],
                  note: recordedFacts.source.note,
                }
              : {
                  status: 'derived',
                  sourceIds: surfaceEvidence.sourceIds,
                  note: 'Normalized from the recorded product surface terminology.',
                },
        },
        terrainProfiles:
          terrainProfiles === null
            ? pendingFact(
                'The available source does not describe terrain difficulty or transition use precisely enough.',
              )
            : {
                value: terrainProfiles,
                evidence:
                  recordedFacts?.terrainProfiles !== undefined &&
                  recordedFactsSourceId
                    ? {
                        status: 'verified',
                        sourceIds: [recordedFactsSourceId],
                        note: recordedFacts.source.note,
                      }
                    : {
                        status: 'derived',
                        sourceIds: ['legacy-catalogue'],
                        note: 'Normalized from explicit terrain wording in the audited model name, surface, and intended-use guidance.',
                      },
              },
        surfaceTags: {
          value: productSurfaceTags,
          evidence:
            recordedFacts?.surfaceTags && recordedFactsSourceId
              ? {
                  status: 'verified',
                  sourceIds: [recordedFactsSourceId],
                  note: recordedFacts.source.note,
                }
              : {
                  status: 'derived',
                  sourceIds: surfaceEvidence.sourceIds,
                  note: 'Normalized into controlled surface tags from the recorded surface and terrain terminology; shoe-by-shoe verification is pending.',
                },
        },
        stability:
          recordedFacts?.stability && recordedFactsSourceId
            ? {
                value: recordedFacts.stability,
                evidence: {
                  status: 'verified',
                  sourceIds: [recordedFactsSourceId],
                  note: recordedFacts.source.note,
                },
              }
            : {
                value: normalizeStability(row.stability),
                evidence: fallbackEvidence,
              },
        maximumDistance:
          (recordedFacts?.maximumDistanceKm ??
            (shouldUseDistanceTable ? tableMaximumDistanceKm : undefined)) !==
            undefined && maximumDistanceSourceId
            ? {
                value: {
                  amount:
                    recordedFacts?.maximumDistanceKm ??
                    tableMaximumDistanceKm ??
                    0,
                  unit: 'km' as const,
                },
                evidence: {
                  status:
                    (shouldUseDistanceTable
                      ? 'verified'
                      : recordedFacts?.maximumDistanceStatus) ??
                    ('verified' as const),
                  sourceIds: [maximumDistanceSourceId],
                  note: shouldUseDistanceTable
                    ? distanceTableSource.note
                    : recordedFacts?.maximumDistanceStatus === 'derived'
                      ? (recordedFacts.maximumDistanceSource?.note ??
                        (recordedFacts.source.status === 'derived'
                          ? recordedFacts.source.note
                          : undefined) ??
                        'Derived from the confirmed standard 3–12 km cross-country race range; this is guidance rather than a manufacturer limit.')
                      : (recordedFacts?.maximumDistanceSource?.note ??
                        recordedFacts?.source.note),
                },
              }
            : distanceFromBestFor,
        heelToToeDrop:
          recordedFacts?.heelToToeDrop !== undefined && measurementSourceId
            ? {
                value: {
                  amount: recordedFacts.heelToToeDrop,
                  unit: 'mm' as const,
                },
                evidence: {
                  status: 'verified' as const,
                  sourceIds: [measurementSourceId],
                  note:
                    recordedFacts.measurementSource?.note ??
                    recordedFacts.source.note,
                },
              }
            : parseDrop(row.drop, productId, warnings),
        stackHeight:
          recordedFacts?.stackHeight && stackHeightSourceId
            ? {
                value: {
                  ...recordedFacts.stackHeight,
                  unit: 'mm' as const,
                },
                evidence: {
                  status: 'verified' as const,
                  sourceIds: [stackHeightSourceId],
                  note:
                    recordedFacts.stackHeightSource?.note ??
                    recordedFacts.measurementSource?.note ??
                    recordedFacts.source.note,
                },
              }
            : pendingFact(
                'No reliable heel and forefoot stack measurements exist in the audited source.',
              ),
        weight:
          recordedFacts?.weight && measurementSourceId
            ? {
                value: {
                  ...recordedFacts.weight,
                  unit: 'g' as const,
                },
                evidence: {
                  status: 'verified' as const,
                  sourceIds: [measurementSourceId],
                  note:
                    recordedFacts.measurementSource?.note ??
                    recordedFacts.source.note,
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
        fit:
          recordedFacts?.fit && recordedFactsSourceId
            ? {
                value: recordedFacts.fit,
                evidence: {
                  status: 'verified',
                  sourceIds: [recordedFactsSourceId],
                  note: recordedFacts.source.note,
                },
              }
            : pendingFact(
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
