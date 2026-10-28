# Deferred Tax Calculator — Ind AS 12 prototype

A React + TypeScript dashboard prototype with an independent calculation engine, sample data, local save, CSV export, print styling, and an illustrative journal review modal.

## Run locally
1. Install Node.js 20 LTS or later.
2. Extract this folder.
3. Double-click `start-windows.bat` OR open a terminal in the extracted folder.
4. If using the terminal, run `npm install` and then `npm run dev`.
5. Open the exact local URL printed by Vite (it may use port 5174 or another port if 5173 is busy).

## Build and test
- `npm run build`
- `npm test`

## Included
- Editable company, financial year, reporting date and tax-regime fields.
- Multiple asset/liability rows with add and delete.
- Live calculation of carrying amount, tax base, temporary differences, gross DTA/DTL and illustrative recognised amounts.
- Basic validation and accounting-review warnings.
- Local browser save using localStorage.
- CSV export (opens in Excel), report text export, print, and journal-entry review notes.
- Responsive desktop/tablet/mobile layouts.

## Accounting limitations
This is a prototype, not a verified Ind AS 12 compliance tool. Sample data and tax rates are illustrative. The calculation engine uses a simplified temporary-difference sign convention and user-selected recognition flag. It does not implement all Ind AS 12 recognition exceptions, tax-loss carryforwards, tax-credit rules, outside-basis differences, initial recognition exceptions, tax-rate remeasurement, tax effects in OCI/equity, business combinations, offsetting criteria, uncertain tax treatments, or all disclosure requirements. Liability tax bases and certain temporary differences require careful item-specific analysis.

Before use in financial statements, review against the current notified Ind AS 12, relevant tax law, applicable company tax regime and entity facts with a qualified accounting professional. Do not post journal entries solely from this prototype.

## Project structure
- `src/App.tsx` — dashboard and interactions
- `src/engine.ts` — independent calculation and validation functions
- `src/types.ts` — shared TypeScript types
- `src/data/sampleData.ts` — illustrative sample items
- `src/styles.css` — design system and responsive styling
- `src/main.tsx` — app entry point

## Next development steps
Remaining development priorities: (1) dedicated year-wise book/tax depreciation schedules, (2) prior-year recognised balances and tax-rate remeasurement, (3) native XLSX/PDF generation, (4) fuller tax-loss and tax-credit modelling, and (5) secure server-side storage and audit trail before multi-user or production use.

## Version 0.3 — recognition control correction and usability fixes
- Fixed a calculation issue: a DTL is no longer automatically treated as recognised when the row is still marked “Assess”. Both DTA and DTL recognition now require an explicit “Recognise” selection.
- Added unrecognised DTL to the calculation output model.
- Widened the tax-rate input so values such as 25.168% are easier to read.
- Added `start-windows.bat` for easier launch on Windows.

## Version 0.2 — broader Ind AS 12 review support
This version adds a documented review checklist covering tax rates, DTA recoverability, tax losses/credits, initial recognition, outside-basis differences, tax-effect destination, offsetting, leases/complex transactions, and disclosures. Checklist status is saved with the local calculation and included in the text report.

A separate `src/indas12Review.ts` review-assistance layer flags open DTA assessments, likely tax-loss/credit items, lease items, investment/outside-basis items, missing supporting notes, and recurring rate/routing/offsetting review points.

**Important scope boundary:** This is still an accounting-support prototype, not a complete or independently validated Ind AS 12 compliance engine. The checklist is manual and does not prove compliance. Tax losses/credits and depreciation schedules are not yet fully modelled as dedicated multi-year calculations; lease, initial-recognition, outside-basis, OCI/equity, business-combination and offsetting cases are flagged for review rather than automatically resolved. Do not use the output as a posting-ready journal or final financial-statement number without qualified review.


## Version 0.4 — calculation-engine hardening
- Centralised temporary-difference sign convention and added a nil-difference tolerance.
- Added optional opening-period tax rate (`openingTaxRate`) and prior-period recognition decision (`openingRecognition`) so rate changes and changes in recognition can be modelled rather than silently assumed away.
- Added recognised and unrecognised opening DTA/DTL values.
- Added movement decomposition (`balanceMovement` and `recognitionMovement`) and an aggregate reconciliation check.
- Added finite-number and opening-rate validation.
- Currency formatting now preserves paise to avoid hiding small arithmetic differences in detailed schedules.
- Expanded unit tests for asset/liability sign conventions, 25.168% arithmetic, nil differences, recognition status, opening-rate changes, movement reconciliation and invalid numeric inputs.

### Important implementation note
For backward compatibility, if `openingTaxRate` is omitted the engine uses the current `taxRate`; if `openingRecognition` is omitted it uses the current `recognition`. For reporting-grade movement analysis, populate these opening-period fields from the prior-period workpaper. This calculation engine still uses the selected recognition flag as a user decision; it does not determine whether recognition is permitted under Ind AS 12. Do not interpret the movement decomposition as automatically determining P&L / OCI / equity routing.
