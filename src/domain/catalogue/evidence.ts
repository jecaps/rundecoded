import type {
  Evidence,
  ProductSource,
  ShoeProduct,
  VerificationStatus,
} from './schema';

export const confidenceLevels = ['high', 'medium', 'low', 'unknown'] as const;

export type ConfidenceLevel = (typeof confidenceLevels)[number];

export interface FactProvenance {
  confidence: ConfidenceLevel;
  sources: ProductSource[];
  status: VerificationStatus;
}

const confidenceByStatus: Record<VerificationStatus, ConfidenceLevel> = {
  verified: 'high',
  derived: 'medium',
  fallback: 'low',
  pending: 'unknown',
};

export function confidenceForEvidence(evidence: Evidence): ConfidenceLevel {
  return confidenceByStatus[evidence.status];
}

export function resolveFactProvenance(
  product: ShoeProduct,
  evidence: Evidence,
): FactProvenance {
  const sourceIds = new Set(evidence.sourceIds);
  return {
    confidence: confidenceForEvidence(evidence),
    sources: product.sources.filter(({ id }) => sourceIds.has(id)),
    status: evidence.status,
  };
}
