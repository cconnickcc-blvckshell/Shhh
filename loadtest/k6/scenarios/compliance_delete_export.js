/**
 * Compliance scenario: data export (light). Delete request is rare.
 */
import { postDataExport } from '../lib/api.js';
import { check } from 'k6';
import { errorRate } from '../lib/metrics.js';
import { recordResponse } from '../lib/classifier.js';

export function complianceExport(token) {
  const res = postDataExport(token);
  recordResponse('compliance_export', res);
  const ok = check(res, { 'export 200': (r) => r.status === 200 });
  errorRate.add(!ok);
}
