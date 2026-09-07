import prototypeAdidasDetailsJson from './prototype-adidas-details.json';
import prototypeRemainingDetailsJson from './prototype-remaining-details.json';
import verifiedDecathlonDetailsJson from './verified-decathlon-details.json';

import type { LocalizedText } from '@/domain/catalogue';

export interface PrototypeProductDetails {
  overview: LocalizedText;
  cardSummary: LocalizedText;
  bestFor: LocalizedText;
  construction: {
    ride: LocalizedText;
    support: LocalizedText;
    upper: LocalizedText;
    midsole: LocalizedText;
    outsole: LocalizedText;
  };
  decision: {
    bestAt: LocalizedText;
    lessSuitableFor: LocalizedText;
  };
  specifications: {
    drop: string;
    fit: LocalizedText;
    plateSystem: LocalizedText;
    stackHeight: string;
    technologies: string[];
    weight: string;
  };
  provenance: {
    label: string;
    note: LocalizedText;
    officialProductUrl: string;
    status: 'fallback' | 'verified';
  };
}

/**
 * Product knowledge migrated from the primary merged dataset that powers the
 * original RunDecoded detail dialogs. Keys use the new catalogue's exact IDs,
 * so similarly named products cannot inherit one another's profiles.
 */
export const prototypeProductDetails = {
  ...prototypeAdidasDetailsJson,
  ...prototypeRemainingDetailsJson,
  ...verifiedDecathlonDetailsJson,
} as Record<string, PrototypeProductDetails>;
