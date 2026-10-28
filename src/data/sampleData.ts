import type { Asset } from '../types';

export const sampleAssets: Asset[] = [
  {
    id: 'a1', name: 'Plant & machinery', category: 'PPE', kind: 'asset',
    carryingAmount: 800000, taxBase: 600000, taxRate: 25.168,
    openingCarryingAmount: 900000, openingTaxBase: 750000,
    recognition: 'recognise', notes: 'Illustrative depreciation timing difference.'
  },
  {
    id: 'a2', name: 'Provision for employee benefits', category: 'Provision', kind: 'liability',
    carryingAmount: 250000, taxBase: 0, taxRate: 25.168,
    openingCarryingAmount: 180000, openingTaxBase: 0,
    recognition: 'assess', notes: 'Confirm tax deduction timing and conditions.'
  },
  {
    id: 'a3', name: 'Expected credit loss allowance', category: 'Financial asset', kind: 'asset',
    carryingAmount: 120000, taxBase: 200000, taxRate: 25.168,
    openingCarryingAmount: 90000, openingTaxBase: 180000,
    recognition: 'recognise', notes: 'Recognition depends on evidence and applicable tax rules.'
  }
];