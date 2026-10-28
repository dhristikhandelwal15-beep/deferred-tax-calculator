import { describe, expect, it } from 'vitest';
import { calculateAsset, calculateAll, formatINR, totals, validateAsset } from '../engine';
import type { Asset } from '../types';

const base: Asset = {
  id: 'test', name: 'Test asset', category: 'PPE', kind: 'asset',
  carryingAmount: 800000, taxBase: 600000, taxRate: 25.168,
  openingCarryingAmount: 900000, openingTaxBase: 750000,
  recognition: 'recognise', notes: ''
};

describe('temporary-difference calculation', () => {
  it('calculates taxable difference and DTL for an asset where carrying amount exceeds tax base', () => {
    const row = calculateAsset(base);
    expect(row.temporaryDifference).toBe(200000);
    expect(row.differenceType).toBe('Taxable');
    expect(row.grossDtl).toBeCloseTo(50336, 8);
    expect(row.recognisedDtl).toBeCloseTo(50336, 8);
  });
  it('calculates deductible difference and DTA where asset tax base exceeds carrying amount', () => {
    const row = calculateAsset({ ...base, carryingAmount: 600000, taxBase: 800000 });
    expect(row.differenceType).toBe('Deductible');
    expect(row.grossDta).toBeCloseTo(50336, 8);
  });
  it('uses reversed sign convention for liabilities', () => {
    const row = calculateAsset({ ...base, kind: 'liability', carryingAmount: 250000, taxBase: 0 });
    expect(row.differenceType).toBe('Deductible');
    expect(row.grossDta).toBeCloseTo(62920, 8);
  });
  it('returns nil when carrying amount equals tax base', () => {
    const row = calculateAsset({ ...base, carryingAmount: 600000, taxBase: 600000 });
    expect(row.differenceType).toBe('Nil');
    expect(row.grossDta).toBe(0);
    expect(row.grossDtl).toBe(0);
  });
});

describe('recognition and opening balances', () => {
  it('does not automatically recognise balances while assessment is open', () => {
    const row = calculateAsset({ ...base, recognition: 'assess' });
    expect(row.grossDtl).toBeCloseTo(50336, 8);
    expect(row.recognisedDtl).toBe(0);
    expect(row.unrecognisedDtl).toBeCloseTo(50336, 8);
  });
  it('recognises DTA and DTL only for explicit recognise selection', () => {
    const dta = calculateAsset({ ...base, carryingAmount: 600000, taxBase: 800000, recognition: 'recognise' });
    expect(dta.recognisedDta).toBeCloseTo(50336, 8);
    const no = calculateAsset({ ...base, recognition: 'do-not-recognise' });
    expect(no.recognisedDta).toBe(0);
    expect(no.recognisedDtl).toBe(0);
  });
  it('uses opening tax rate when supplied', () => {
    const row = calculateAsset({ ...base, openingTaxRate: 20 });
    expect(row.openingDtl).toBe(30000);
    expect(row.grossDtl).toBeCloseTo(50336, 8);
  });
  it('uses opening recognition decision and separately identifies recognition movement', () => {
    const row = calculateAsset({ ...base, openingRecognition: 'do-not-recognise', recognition: 'recognise' });
    expect(row.openingRecognisedDtl).toBe(0);
    expect(row.recognisedDtl).toBeCloseTo(50336, 8);
    expect(row.movement).toBeCloseTo(row.balanceMovement + row.recognitionMovement, 8);
  });
  it('aggregated movement reconciles to closing less opening recognised net position', () => {
    const rows = calculateAll([
      base,
      { ...base, id: 'b', kind: 'liability', carryingAmount: 250000, taxBase: 0, openingCarryingAmount: 180000, openingTaxBase: 0, recognition: 'assess' }
    ]);
    const t = totals(rows);
    expect(t.movement).toBeCloseTo(t.netPosition - t.openingNetPosition, 8);
    expect(t.movementReconciliationDifference).toBeCloseTo(0, 8);
  });
});

describe('validation and formatting', () => {
  it('flags missing name and invalid tax rate', () => {
    expect(validateAsset({ ...base, name: '', taxRate: 0 })).toContain('Asset / liability name is required.');
    expect(validateAsset({ ...base, taxRate: 0 })).toContain('Tax rate must be above 0% and not more than 100%.');
  });
  it('flags non-finite amounts', () => {
    expect(validateAsset({ ...base, carryingAmount: Number.NaN })).toContain('Carrying amount must be a finite number.');
  });
  it('formats Indian currency with paise precision', () => {
    expect(formatINR(125000)).toContain('1,25,000');
    expect(formatINR(125000.25)).toContain('1,25,000.25');
  });
});
