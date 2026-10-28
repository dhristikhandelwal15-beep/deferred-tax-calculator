import type { Asset, CalcRow } from './types';

export type ReviewSeverity = 'blocker' | 'warning' | 'info';
export type ReviewFinding = { severity: ReviewSeverity; code: string; title: string; detail: string; itemId?: string };

/**
 * A review-assistance layer, not an automated legal/accounting opinion.
 * Findings flag missing evidence and common risk areas for a reviewer.
 */
export function reviewIndAS12(items: Asset[], rows: CalcRow[]): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  if (items.length === 0) findings.push({ severity: 'blocker', code: 'NO_ITEMS', title: 'No schedule items', detail: 'Add temporary-difference items before calculating deferred tax.' });
  items.forEach((item, index) => {
    const row = rows[index];
    if (!item.name.trim()) findings.push({ severity: 'blocker', code: 'MISSING_NAME', title: 'Missing line-item name', detail: 'Give the item a clear account / transaction name.', itemId: item.id });
    if (item.recognition === 'assess' && row?.grossDta > 0) findings.push({ severity: 'warning', code: 'DTA_ASSESSMENT_OPEN', title: 'DTA recognition assessment is open', detail: `${item.name || 'Unnamed item'} has a potential DTA but has not been marked recognised or not recognised. Document probable taxable-profit support and applicable exceptions.`, itemId: item.id });
    if (/loss|credit/i.test(`${item.name} ${item.category}`)) findings.push({ severity: 'warning', code: 'LOSS_CREDIT_REVIEW', title: 'Tax loss / credit review required', detail: `${item.name}: verify carry-forward amount, expiry, restrictions, utilisation forecasts and applicable tax law. A generic temporary-difference calculation may not be sufficient.`, itemId: item.id });
    if (/lease|right.of.use|rou/i.test(`${item.name} ${item.category}`)) findings.push({ severity: 'warning', code: 'LEASE_REVIEW', title: 'Lease accounting review required', detail: `${item.name}: assess the relevant asset and liability tax bases and the applicable Ind AS 12 requirements.`, itemId: item.id });
    if (/subsidiar|associate|branch|joint venture|investment/i.test(`${item.name} ${item.category}`)) findings.push({ severity: 'warning', code: 'OUTSIDE_BASIS_REVIEW', title: 'Outside-basis difference review', detail: `${item.name}: assess temporary differences in investments and whether the relevant recognition criteria are met.`, itemId: item.id });
    if (!item.notes.trim()) findings.push({ severity: 'info', code: 'NO_SUPPORTING_NOTE', title: 'No supporting note', detail: `${item.name || 'Unnamed item'} has no working-paper note or source reference.`, itemId: item.id });
    if (row && row.grossDta > 0 && item.recognition === 'recognise') findings.push({ severity: 'info', code: 'DTA_EVIDENCE_CONFIRM', title: 'Confirm DTA evidence', detail: `Ensure the recognition decision for ${item.name} is supported by documented evidence, not only by the dropdown selection.`, itemId: item.id });
  });
  findings.push({ severity: 'warning', code: 'RATE_CONFIRM', title: 'Confirm applicable tax rate', detail: 'Use the rate expected to apply when the temporary difference reverses, based on laws enacted or substantively enacted at the reporting date; confirm regime, surcharge and cess.' });
  findings.push({ severity: 'warning', code: 'ROUTING_CONFIRM', title: 'Confirm tax-effect destination', detail: 'Determine whether each tax effect belongs in profit or loss, OCI, equity or a business combination by reference to the underlying transaction and applicable requirements.' });
  findings.push({ severity: 'warning', code: 'OFFSET_CONFIRM', title: 'Do not automatically offset DTA and DTL', detail: 'Assess the applicable legal right and taxation-authority / taxable-entity conditions before presentation on a net basis.' });
  return findings;
}
