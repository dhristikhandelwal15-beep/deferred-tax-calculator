import { describe, expect, it } from 'vitest';
import { reviewIndAS12 } from '../indas12Review';
import { calculateAll } from '../engine';
import type { Asset } from '../types';

const item: Asset = {
  id: 'loss1', name: 'Tax loss carryforward', category: 'Tax losses', kind: 'asset',
  carryingAmount: 0, taxBase: 0, taxRate: 25.168,
  openingCarryingAmount: 0, openingTaxBase: 0,
  recognition: 'assess', notes: ''
};

describe('reviewIndAS12', () => {
  it('flags open DTA assessment, tax losses, missing notes and general review points', () => {
    const findings = reviewIndAS12([item], calculateAll([item]));
    expect(findings.some(f => f.code === 'LOSS_CREDIT_REVIEW')).toBe(true);
    expect(findings.some(f => f.code === 'NO_SUPPORTING_NOTE')).toBe(true);
    expect(findings.some(f => f.code === 'RATE_CONFIRM')).toBe(true);
    expect(findings.some(f => f.code === 'OFFSET_CONFIRM')).toBe(true);
  });
});
