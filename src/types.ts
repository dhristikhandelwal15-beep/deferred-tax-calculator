export type AssetKind = 'asset' | 'liability';
export type Asset = {
  id: string;
  name: string;
  category: string;
  kind: AssetKind;
  carryingAmount: number;
  taxBase: number;
  taxRate: number;
  openingCarryingAmount: number;
  openingTaxBase: number;
  /** Optional rate applicable to opening balances; defaults to taxRate for legacy data. */
  openingTaxRate?: number;
  /** Optional prior-period recognition decision; defaults to current decision for legacy data. */
  openingRecognition?: 'assess' | 'recognise' | 'do-not-recognise';
  recognition: 'assess' | 'recognise' | 'do-not-recognise';
  notes: string;
};
export type CalcRow = Asset & {
  temporaryDifference: number;
  differenceType: 'Taxable' | 'Deductible' | 'Nil';
  grossDta: number;
  grossDtl: number;
  recognisedDta: number;
  recognisedDtl: number;
  unrecognisedDta: number;
  unrecognisedDtl: number;
  openingDta: number;
  openingDtl: number;
  openingRecognisedDta: number;
  openingRecognisedDtl: number;
  unrecognisedOpeningDta: number;
  unrecognisedOpeningDtl: number;
  movement: number;
  /** Movement split, useful for explaining changes to reviewers. */
  balanceMovement: number;
  recognitionMovement: number;
};