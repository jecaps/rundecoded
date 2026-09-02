import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

interface QualityReport {
  assets: Array<{ present: boolean; status: string }>;
  counts: Record<string, number>;
  languages: Record<string, { missing: number }>;
  research: unknown[];
  schemaVersion: number;
  status: string;
}

const report = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'reports/catalogue-quality.json'),
    'utf8',
  ),
) as QualityReport;

describe('generated catalogue quality report', () => {
  it('accounts for the approved catalogue and every verified asset', () => {
    expect(report.schemaVersion).toBe(2);
    expect(report.status).toBe('valid');
    expect(report.counts.products).toBe(106);
    expect(report.counts.reconciledRows).toBe(213);
    expect(report.counts.unmatchedRows).toBe(0);
    expect(report.counts.verifiedImages).toBe(97);
    expect(report.counts.pendingImages).toBe(9);
    expect(report.counts.missingLocalAssets).toBe(0);
    expect(
      report.assets.filter(({ status }) => status === 'verified'),
    ).toHaveLength(97);
    expect(
      report.assets.filter(
        ({ present, status }) => status === 'verified' && !present,
      ),
    ).toHaveLength(0);
  });

  it('reports complete translations and an actionable research queue', () => {
    expect(Object.keys(report.languages).sort()).toEqual(['de', 'en', 'fr']);
    expect(
      Object.values(report.languages).every(({ missing }) => missing === 0),
    ).toBe(true);
    expect(report.research.length).toBeGreaterThan(0);
  });
});
