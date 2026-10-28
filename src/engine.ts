import type { Asset, CalcRow } from './types';

const EPSILON = 1e-9;

/**
 * Calculation support for temporary differences.
 *
 * This module calculates arithmetic only. It does NOT determine whether an item
 * qualifies for recognition under Ind AS 12, determine tax bases under tax law,
 * decide whether a rate is enacted/substantively enacted, or decide presentation
 * / offsetting. Those remain documented reviewer judgements.
 *
 * Sign convention:
 * - Asset: carrying amount > tax base => taxable difference (normally DTL).
 * - Liability: carrying amount > tax base => deductible difference (normally DTA).
 */
export function calculateAsset(item: Asset): CalcRow {
  const raw = temporaryDifferenceRaw(item.kind, item.carryingAmount, item.taxBase);
  const temporaryDifference = Math.abs(raw);
  const differenceType = classify(raw);
  const amount = temporaryDifference * item.taxRate / 100;
  const grossDta = differenceType === 'Deductible' ? amount : 0;
  const grossDtl = differenceType === 'Taxable' ? amount : 0;

  const recognisedDta = item.recognition === 'recognise' ? grossDta : 0;
  const recognisedDtl = item.recognition === 'recognise' ? grossDtl : 0;
  const unrecognisedDta = Math.max(0, grossDta - recognisedDta);
  const unrecognisedDtl = Math.max(0, grossDtl - recognisedDtl);

  const openingRaw = temporaryDifferenceRaw(item.kind, item.openingCarryingAmount, item.openingTaxBase);
  const openingDifferenceType = classify(openingRaw);
  const openingTaxRate = item.openingTaxRate ?? item.taxRate;
  const openingAmount = Math.abs(openingRaw) * openingTaxRate / 100;
  const openingDta = openingDifferenceType === 'Deductible' ? openingAmount : 0;
  const openingDtl = openingDifferenceType === 'Taxable' ? openingAmount : 0;

  // Do not silently assume an opening recognition decision differs from the
  // current one. Legacy inputs default to the current selection; users can set
  // openingRecognition to model a genuine prior-period decision.
  const openingRecognition = item.openingRecognition ?? item.recognition;
  const openingRecognisedDta = openingRecognition === 'recognise' ? openingDta : 0;
  const openingRecognisedDtl = openingRecognition === 'recognise' ? openingDtl : 0;
  const unrecognisedOpeningDta = Math.max(0, openingDta - openingRecognisedDta);
  const unrecognisedOpeningDtl = Math.max(0, openingDtl - openingRecognisedDtl);

  // Signed net asset position: DTA positive, DTL negative.
  const openingNetRecognised = openingRecognisedDta - openingRecognisedDtl;
  const closingNetRecognised = recognisedDta - recognisedDtl;
  const movement = closingNetRecognised - openingNetRecognised;

  // Separate balance movement at the closing recognition decision from changes
  // in recognition status. Together they equal total movement.
  const openingRecognitionFactor = openingRecognition === 'recognise' ? 1 : 0;
  const closingRecognitionFactor = item.recognition === 'recognise' ? 1 : 0;
  const balanceMovement =
    ((grossDta - grossDtl) - (openingDta - openingDtl)) * openingRecognitionFactor;
  const recognitionMovement =
    (grossDta - grossDtl) * (closingRecognitionFactor - openingRecognitionFactor);

  return {
    ...item,
    temporaryDifference,
    differenceType,
    grossDta,
    grossDtl,
    recognisedDta,
    recognisedDtl,
    unrecognisedDta,
    unrecognisedDtl,
    openingDta,
    openingDtl,
    openingRecognisedDta,
    openingRecognisedDtl,
    unrecognisedOpeningDta,
    unrecognisedOpeningDtl,
    movement,
    balanceMovement,
    recognitionMovement
  };
}

function temporaryDifferenceRaw(kind: Asset['kind'], carryingAmount: number, taxBase: number): number {
  return kind === 'asset' ? carryingAmount - taxBase : taxBase - carryingAmount;
}

function classify(raw: number): CalcRow['differenceType'] {
  if (Math.abs(raw) < EPSILON) return 'Nil';
  return raw > 0 ? 'Taxable' : 'Deductible';
}

export function calculateAll(items: Asset[]): CalcRow[] {
  return items.map(calculateAsset);
}

export function totals(rows: CalcRow[]) {
  const sum = (key: keyof CalcRow) => rows.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
  const grossDta = sum('grossDta');
  const grossDtl = sum('grossDtl');
  const recognisedDta = sum('recognisedDta');
  const recognisedDtl = sum('recognisedDtl');
  const openingDta = sum('openingDta');
  const openingDtl = sum('openingDtl');
  const openingRecognisedDta = sum('openingRecognisedDta');
  const openingRecognisedDtl = sum('openingRecognisedDtl');
  const unrecognisedDta = sum('unrecognisedDta');
  const unrecognisedDtl = sum('unrecognisedDtl');
  const movement = sum('movement');
  const closingNetPosition = recognisedDta - recognisedDtl;
  const openingNetPosition = openingRecognisedDta - openingRecognisedDtl;

  return {
    carryingAmount: sum('carryingAmount'),
    taxBase: sum('taxBase'),
    deductibleDifference: rows.filter(r => r.differenceType === 'Deductible').reduce((s, r) => s + r.temporaryDifference, 0),
    taxableDifference: rows.filter(r => r.differenceType === 'Taxable').reduce((s, r) => s + r.temporaryDifference, 0),
    grossDta,
    grossDtl,
    recognisedDta,
    recognisedDtl,
    unrecognisedDta,
    unrecognisedDtl,
    openingDta,
    openingDtl,
    openingRecognisedDta,
    openingRecognisedDtl,
    unrecognisedOpeningDta: sum('unrecognisedOpeningDta'),
    unrecognisedOpeningDtl: sum('unrecognisedOpeningDtl'),
    netPosition: closingNetPosition,
    openingNetPosition,
    movement,
    // This should be zero apart from floating-point noise. Exposed for tests/reconciliation.
    movementReconciliationDifference: movement - (closingNetPosition - openingNetPosition)
  };
}

export function formatINR(value: number, compact = false): string {
  if (!Number.isFinite(value)) return '—';
  if (compact && Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (compact && Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2
  }).format(value);
}

export function validateAsset(item: Asset): string[] {
  const errors: string[] = [];
  if (!item.name.trim()) errors.push('Asset / liability name is required.');
  if (!['asset', 'liability'].includes(item.kind)) errors.push('Kind must be asset or liability.');
  const numericFields: Array<[string, number]> = [
    ['Carrying amount', item.carryingAmount],
    ['Tax base', item.taxBase],
    ['Tax rate', item.taxRate],
    ['Opening carrying amount', item.openingCarryingAmount],
    ['Opening tax base', item.openingTaxBase],
    ['Opening tax rate', item.openingTaxRate ?? item.taxRate]
  ];
  numericFields.forEach(([label, value]) => {
    if (!Number.isFinite(value)) errors.push(`${label} must be a finite number.`);
  });
  if (item.carryingAmount < 0 || item.taxBase < 0) errors.push('Carrying amount and tax base cannot be negative.');
  if (item.taxRate <= 0 || item.taxRate > 100) errors.push('Tax rate must be above 0% and not more than 100%.');
  if (item.openingCarryingAmount < 0 || item.openingTaxBase < 0) errors.push('Opening balances cannot be negative.');
  if ((item.openingTaxRate ?? item.taxRate) <= 0 || (item.openingTaxRate ?? item.taxRate) > 100) errors.push('Opening tax rate must be above 0% and not more than 100%.');
  if (!['assess', 'recognise', 'do-not-recognise'].includes(item.recognition)) errors.push('Select a valid recognition status.');
  return [...new Set(errors)];
}
