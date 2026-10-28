import { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeIndianRupee,
  Bell, BookOpen, Calculator, Check, ChevronDown, CircleHelp, Download,
  FileSpreadsheet, FileText, LayoutDashboard, Plus, Printer, Save, Settings2,
  ShieldCheck, Trash2, Wallet, X
} from 'lucide-react';
import { calculateAll, formatINR, totals, validateAsset } from './engine';
import { sampleAssets } from './data/sampleData';
import type { Asset, CalcRow } from './types';

const blankAsset = (): Asset => ({
  id: crypto.randomUUID(), name: '', category: 'PPE', kind: 'asset',
  carryingAmount: 0, taxBase: 0, taxRate: 25.168,
  openingCarryingAmount: 0, openingTaxBase: 0,
  recognition: 'assess', notes: ''
});

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number) {
  const str = String(value ?? '');
  return `"${str.replaceAll('"', '""')}"`;
}

export default function App() {
  const [assets, setAssets] = useState<Asset[]>(sampleAssets);
  const [company, setCompany] = useState('Aster Manufacturing Private Limited');
  const [pan, setPan] = useState('AAACA0000A (sample)');
  const [fy, setFy] = useState('2025-26');
  const [periodEnd, setPeriodEnd] = useState('2026-03-31');
  const [taxRegime, setTaxRegime] = useState('Domestic company — verify applicable regime');
  const [showJournal, setShowJournal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState('Sample data loaded. Review assumptions before relying on results.');
  const [errorsVisible, setErrorsVisible] = useState(false);
  const [lastCalculated, setLastCalculated] = useState(new Date());
  const [reviewChecks, setReviewChecks] = useState<Record<string, boolean>>({});
  const reviewItems = [
    ['taxRate', 'Tax rate', 'Confirm enacted or substantively enacted rate at reporting date, including surcharge and cess.'],
    ['dtaEvidence', 'DTA recoverability', 'Document probable future taxable profits and reversal of taxable temporary differences.'],
    ['losses', 'Tax losses and credits', 'Confirm amounts, expiry dates, restrictions and supporting forecasts. Add them as separate schedule lines where applicable.'],
    ['initialRecognition', 'Initial recognition exception', 'Assess whether an initial recognition exception applies to each relevant transaction.'],
    ['investments', 'Investments in subsidiaries / associates / branches', 'Assess outside-basis differences and the relevant control / reversal criteria.'],
    ['destination', 'P&L, OCI, equity or business combination', 'Route tax effects consistently with the underlying transaction and applicable standard.'],
    ['offset', 'Offsetting', 'Confirm legally enforceable right and the same taxation authority / taxable entity criteria as applicable.'],
    ['leases', 'Leases and other complex transactions', 'Assess right-of-use assets, lease liabilities and other transactions under the applicable Ind AS 12 requirements.'],
    ['disclosures', 'Presentation and disclosures', 'Review tax reconciliation, DTA/DTL classes, unrecognised items and expiry information as applicable.']
  ];
  const openReviewCount = reviewItems.filter(([key]) => !reviewChecks[key as string]).length;

  const rows = useMemo(() => calculateAll(assets), [assets]);
  const summary = useMemo(() => totals(rows), [rows]);
  const errors = assets.flatMap(a => validateAsset(a).map(e => `${a.name || 'Unnamed item'}: ${e}`));
  const warnings = [
    'Sample figures and tax rate are illustrative, not verified accounting results.',
    'Check the applicable tax regime, surcharge, cess and enacted/substantively enacted rate at the reporting date.',
    'DTA recognition requires evidence supporting probable future taxable profits and assessment of applicable exceptions.',
    `Ind AS 12 review checklist: ${openReviewCount} of ${reviewItems.length} review areas remain unchecked.`,
    'Tax losses/credits, initial-recognition exceptions, outside-basis differences, tax-effect routing, offsetting and disclosures require item-specific assessment; checklist completion is not proof of compliance.'
  ];

  function updateAsset(id: string, key: keyof Asset, value: string | number) {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, [key]: value } : a));
    setSaved(false);
  }
  function addAsset() {
    setAssets(prev => [...prev, blankAsset()]);
    setNotice('New line added. Complete the required inputs.');
    setSaved(false);
  }
  function removeAsset(id: string) {
    setAssets(prev => prev.filter(a => a.id !== id));
    setSaved(false);
  }
  function calculate() {
    setErrorsVisible(true);
    setLastCalculated(new Date());
    setNotice(errors.length ? 'Please resolve validation errors before relying on this calculation.' : 'Calculation refreshed. Accounting review is still required.');
  }
  function saveCalculation() {
    const payload = { company, pan, fy, periodEnd, taxRegime, assets, reviewChecks, calculatedAt: new Date().toISOString() };
    localStorage.setItem('deferred-tax-calculation', JSON.stringify(payload));
    setSaved(true);
    setNotice('Calculation saved in this browser on this device.');
  }
  function exportCsv() {
    const header = ['Name', 'Category', 'Type', 'Carrying Amount', 'Tax Base', 'Temporary Difference', 'Difference Type', 'Tax Rate %', 'Gross DTA', 'Gross DTL', 'Recognised DTA', 'Recognised DTL', 'Unrecognised DTA', 'Current-year movement', 'Recognition assessment', 'Notes'];
    const data = rows.map(r => [r.name, r.category, r.kind, r.carryingAmount, r.taxBase, r.temporaryDifference, r.differenceType, r.taxRate, r.grossDta, r.grossDtl, r.recognisedDta, r.recognisedDtl, r.unrecognisedDta, r.movement, r.recognition, r.notes]);
    downloadFile('deferred-tax-schedule.csv', [header, ...data].map(line => line.map(csvEscape).join(',')).join('\r\n'), 'text/csv;charset=utf-8;');
  }
  function exportExcel() {
    // CSV opens in Excel and avoids pretending this prototype creates a native XLSX workbook.
    exportCsv();
    setNotice('CSV exported. Open it in Excel; native XLSX export is not implemented in this version.');
  }
  function exportReport() {
    const report = [
      'DEFERRED TAX CALCULATION — ILLUSTRATIVE',
      `Company: ${company}`, `PAN / identifier: ${pan}`, `Financial year: ${fy}`,
      `Reporting date: ${periodEnd}`, `Tax regime: ${taxRegime}`, '',
      'SUMMARY',
      `Gross DTA: ${summary.grossDta}`, `Gross DTL: ${summary.grossDtl}`,
      `Recognised DTA: ${summary.recognisedDta}`, `Recognised DTL: ${summary.recognisedDtl}`,
      `Net position (DTA less DTL): ${summary.netPosition}`,
      `Ind AS 12 checklist: ${reviewItems.length - openReviewCount}/${reviewItems.length} items checked`,
      ...reviewItems.map(([key, title, detail]) => `${reviewChecks[key as string] ? '[CHECKED]' : '[OPEN]'} ${title}: ${detail}`),
      `Unrecognised potential DTA: ${summary.unrecognisedDta}`, '',
      'SCHEDULE',
      ...rows.map(r => `${r.name} | CA ${r.carryingAmount} | Tax base ${r.taxBase} | ${r.differenceType} difference ${r.temporaryDifference} | DTA ${r.grossDta} | DTL ${r.grossDtl}`),
      '', 'IMPORTANT: Illustrative output only. Review Ind AS 12 recognition, measurement, presentation and disclosure requirements before use.'
    ].join('\n');
    downloadFile('deferred-tax-report.txt', report, 'text/plain;charset=utf-8;');
  }
  function journalLines() {
    const dta = summary.recognisedDta - summary.openingDta;
    const dtl = summary.recognisedDtl - summary.openingDtl;
    return [
      { label: 'Deferred tax asset movement', amount: dta, note: 'Positive movement may be a debit to DTA; determine corresponding P&L / OCI / equity destination.' },
      { label: 'Deferred tax liability movement', amount: dtl, note: 'Positive movement may be a credit to DTL; determine corresponding P&L / OCI / equity destination.' }
    ];
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Calculator size={20}/></div><div><strong>LedgerPilot</strong><span>FINANCE WORKSPACE</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><LayoutDashboard size={17}/> Deferred tax overview</button>
      <button className="nav-item" onClick={() => document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' })}><FileSpreadsheet size={17}/> Tax schedule</button>
      <button className="nav-item" onClick={() => setShowJournal(true)}><BookOpen size={17}/> Journal entries</button>
      <div className="side-label section-label">INPUTS <span>01—08</span></div>
      <div className="side-section"><span className="step-dot done">✓</span><div><b>Company details</b><small>Entity & identifiers</small></div></div>
      <div className="side-section"><span className="step-dot done">✓</span><div><b>Reporting period</b><small>Financial year & date</small></div></div>
      <div className="side-section"><span className="step-dot active-dot">3</span><div><b>Assets & liabilities</b><small>Carrying amount & tax base</small></div></div>
      <div className="side-section muted"><span className="step-dot">4</span><div><b>Depreciation assumptions</b><small>Book vs tax depreciation</small></div></div>
      <div className="side-section muted"><span className="step-dot">5</span><div><b>Tax rates</b><small>Rate & tax regime</small></div></div>
      <div className="side-section muted"><span className="step-dot">6</span><div><b>Recognition assessment</b><small>DTA / DTL criteria</small></div></div>
      <div className="side-section muted"><span className="step-dot">7</span><div><b>Review & validate</b><small>Warnings & checks</small></div></div>
      <div className="side-section muted"><span className="step-dot">8</span><div><b>Export & reporting</b><small>CSV / PDF / print</small></div></div>
      <div className="sidebar-bottom">
        <div className="secure-box"><ShieldCheck size={17}/><div><b>Review-ready workspace</b><small>Keep assumptions documented</small></div></div>
        <div className="user-row"><div className="avatar">CA</div><div><b>Finance team</b><small>Local demo environment</small></div><ChevronDown size={15}/></div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="breadcrumbs">Tax & Compliance <span>/</span> <b>Deferred Tax Calculator</b></div>
        <div className="top-actions"><span className="sample-badge"><span/> SAMPLE WORKSPACE</span><button className="icon-btn" aria-label="Notifications"><Bell size={17}/></button><button className="icon-btn" aria-label="Settings"><Settings2 size={17}/></button></div>
      </header>

      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line"/> IND AS 12 · INCOME TAXES</div>
          <h1>Deferred Tax Calculator</h1>
          <p>Ind AS 12 — Income Taxes <span>·</span> Companies Act, 2013 <span>·</span> Income-tax Act, 1961</p>
        </div>
        <div className="heading-actions"><button className="btn btn-quiet" onClick={() => window.print()}><Printer size={15}/> Print</button><button className="btn btn-primary" onClick={calculate}><Calculator size={15}/> Calculate <span className="shortcut">↵</span></button></div>
      </section>

      <div className="notice"><AlertTriangle size={17}/><span><b>Illustrative sample data.</b> {notice} Do not post entries without an Ind AS 12 review.</span><button onClick={() => setNotice('Sample data loaded. Review assumptions before relying on results.')} aria-label="Dismiss notice"><X size={15}/></button></div>

      <section className="input-grid">
        <div className="panel company-panel">
          <div className="panel-heading"><div className="panel-icon"><Wallet size={17}/></div><div><h2>Company details</h2><p>Entity information and tax profile</p></div><span className="panel-step">01</span></div>
          <label>Company / entity name<input value={company} onChange={e => setCompany(e.target.value)} /></label>
          <div className="two-col">
            <label>PAN / identifier<input value={pan} onChange={e => setPan(e.target.value)} /></label>
            <label>Tax regime<select value={taxRegime} onChange={e => setTaxRegime(e.target.value)}><option>Domestic company — verify applicable regime</option><option>Section 115BAA — verify eligibility</option><option>Section 115BAB — verify eligibility</option><option>Other / not selected</option></select></label>
          </div>
        </div>
        <div className="panel period-panel">
          <div className="panel-heading"><div className="panel-icon"><Activity size={17}/></div><div><h2>Reporting period</h2><p>Set the financial reporting date</p></div><span className="panel-step">02</span></div>
          <div className="two-col">
            <label>Financial year<select value={fy} onChange={e => setFy(e.target.value)}><option>2024-25</option><option>2025-26</option><option>2026-27</option><option>2027-28</option></select></label>
            <label>Reporting date<input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} /></label>
          </div>
          <div className="period-foot"><span className="status-dot"/> Financial year ending 31 March <span className="period-current">{fy}</span></div>
        </div>
      </section>

      <section className="section-title">
        <div><h2>Deferred tax position</h2><p>Closing balances based on the current input assumptions</p></div>
        <button className="text-button" onClick={() => setErrorsVisible(!errorsVisible)}><CircleHelp size={15}/> {errorsVisible ? 'Hide validation' : 'Validation & assumptions'}</button>
      </section>

      {errorsVisible && <div className="validation-panel">
        <div className="validation-title"><AlertTriangle size={16}/><b>Validation and accounting review</b></div>
        {errors.length > 0 ? errors.map((e, i) => <p className="error-line" key={i}>• {e}</p>) : <p className="success-line"><Check size={14}/> Basic input validation passed.</p>}
        {warnings.map((w, i) => <p className="warning-line" key={i}>• {w}</p>)}
      </div>}

      <section className="hero-card">
        <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
        <div className="hero-top"><div><span className="hero-label">NET DEFERRED TAX POSITION</span><div className="hero-amount">{formatINR(Math.abs(summary.netPosition), true)} <span className={summary.netPosition >= 0 ? 'dta-tag' : 'dtl-tag'}>{summary.netPosition >= 0 ? 'Net DTA' : 'Net DTL'}</span></div><p>Recognised deferred tax assets less recognised deferred tax liabilities</p></div><div className="hero-icon"><BadgeIndianRupee size={24}/></div></div>
        <div className="hero-divider"/>
        <div className="hero-bottom">
          <div><span>Recognised DTA</span><b className="green-text">{formatINR(summary.recognisedDta, true)}</b><small><ArrowUpRight size={13}/> Asset balance</small></div>
          <div><span>Recognised DTL</span><b className="red-text">{formatINR(summary.recognisedDtl, true)}</b><small><ArrowDownRight size={13}/> Liability balance</small></div>
          <div><span>Current-year movement</span><b>{formatINR(summary.movement, true)}</b><small>Compared with opening balances</small></div>
        </div>
      </section>

      <section className="metric-grid">
        <Metric title="Carrying amount" value={formatINR(summary.carryingAmount, true)} detail="Book value at reporting date" icon={<Wallet size={17}/>} tone="blue"/>
        <Metric title="Tax base" value={formatINR(summary.taxBase, true)} detail="Tax value at reporting date" icon={<FileText size={17}/>} tone="purple"/>
        <Metric title="Taxable differences" value={formatINR(summary.taxableDifference, true)} detail="Potential deferred tax liability" icon={<ArrowDownRight size={17}/>} tone="red"/>
        <Metric title="Deductible differences" value={formatINR(summary.deductibleDifference, true)} detail="Potential deferred tax asset" icon={<ArrowUpRight size={17}/>} tone="green"/>
      </section>

      <section className="split-grid">
        <div className="panel gross-panel">
          <div className="panel-heading"><div><h2>Gross deferred tax balances</h2><p>Before recognition assessment and any permitted offsetting</p></div><span className="subtle-tag">PRE-RECOGNITION</span></div>
          <div className="gross-row"><div className="gross-label"><span className="legend green"/> <div><b>Gross DTA</b><small>Potential deductible differences</small></div></div><strong className="green-text">{formatINR(summary.grossDta)}</strong><div className="mini-track"><span className="track-green" style={{width: `${summary.grossDta + summary.grossDtl ? summary.grossDta / (summary.grossDta + summary.grossDtl) * 100 : 0}%`}}/></div></div>
          <div className="gross-row"><div className="gross-label"><span className="legend red"/> <div><b>Gross DTL</b><small>Potential taxable differences</small></div></div><strong className="red-text">{formatINR(summary.grossDtl)}</strong><div className="mini-track"><span className="track-red" style={{width: `${summary.grossDta + summary.grossDtl ? summary.grossDtl / (summary.grossDta + summary.grossDtl) * 100 : 0}%`}}/></div></div>
          <div className="gross-foot"><span>Unrecognised potential DTA</span><b>{formatINR(summary.unrecognisedDta)}</b></div>
        </div>
        <div className="panel movement-panel">
          <div className="panel-heading"><div><h2>Balance movement</h2><p>Opening position to closing position</p></div><span className="panel-icon small"><Activity size={15}/></span></div>
          <div className="movement-list">
            <div><span>Opening recognised DTA / DTL*</span><b>{formatINR(summary.openingDta - summary.openingDtl)}</b></div>
            <div><span>Closing recognised DTA / DTL</span><b>{formatINR(summary.netPosition)}</b></div>
            <div className="movement-highlight"><span>Net movement*</span><b className={summary.movement >= 0 ? 'green-text' : 'red-text'}>{summary.movement > 0 ? '+' : ''}{formatINR(summary.movement)}</b></div>
          </div>
          <p className="tiny-note">*Opening balance is a simplified estimate using the current tax rate. Recalculate using prior-year recognised balances and the applicable rate for a reliable movement analysis.</p>
        </div>
      </section>

      <section className="panel schedule-panel" id="schedule">
        <div className="schedule-header"><div><div className="eyebrow"><span className="eyebrow-line"/> WORKING SCHEDULE</div><h2>Temporary difference schedule</h2><p>Asset / liability-wise computation and recognition assessment</p></div><div className="schedule-actions"><button className="btn btn-quiet" onClick={exportCsv}><Download size={15}/> Export CSV</button><button className="btn btn-quiet" onClick={exportExcel}><FileSpreadsheet size={15}/> Export for Excel</button><button className="btn btn-primary" onClick={addAsset}><Plus size={15}/> Add line item</button></div></div>
        <div className="table-wrap"><table>
          <thead><tr><th>ASSET / LIABILITY</th><th>TYPE</th><th>CARRYING AMOUNT</th><th>TAX BASE</th><th>TEMP. DIFF.</th><th>TAX RATE</th><th>GROSS DTA</th><th>GROSS DTL</th><th>RECOGNITION</th><th></th></tr></thead>
          <tbody>{rows.map(r => <ScheduleRow key={r.id} row={r} updateAsset={updateAsset} removeAsset={removeAsset} />)}</tbody>
          <tfoot><tr><td colSpan={2}>TOTAL</td><td>{formatINR(summary.carryingAmount)}</td><td>{formatINR(summary.taxBase)}</td><td>{formatINR(summary.taxableDifference + summary.deductibleDifference)}</td><td>—</td><td className="green-text">{formatINR(summary.grossDta)}</td><td className="red-text">{formatINR(summary.grossDtl)}</td><td colSpan={2}> </td></tr></tfoot>
        </table></div>
        <div className="schedule-footer"><span><span className="status-dot"/> {rows.length} line items · Last recalculated {lastCalculated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span><span>Amounts in INR <span className="footer-sep">·</span> Sample data</span></div>
      </section>

      <section className="panel review-checklist-panel" id="indas-review" style={{ marginTop: 24, padding: 24 }}>
        <div className="panel-heading"><div className="panel-icon"><ShieldCheck size={17}/></div><div><h2>Ind AS 12 review checklist</h2><p>Document key assessments before finalising the deferred tax working</p></div><span className="subtle-tag">{reviewItems.length - openReviewCount}/{reviewItems.length} CHECKED</span></div>
        <div className="validation-panel" style={{ marginTop: 16 }}><div className="validation-title"><AlertTriangle size={16}/><b>{openReviewCount === 0 ? 'Checklist marked complete — professional review still required' : `${openReviewCount} review areas remain open`}</b></div><p className="warning-line">Tick an item only after you have completed and documented the assessment. This checklist does not automatically determine the accounting conclusion.</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
          {reviewItems.map(([key, title, detail]) => <label key={key as string} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, border: '1px solid #26364d', borderRadius: 10, padding: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!reviewChecks[key as string]} onChange={e => { setReviewChecks(prev => ({ ...prev, [key as string]: e.target.checked })); setSaved(false); }} style={{ marginTop: 4, accentColor: '#31c99a' }} />
            <span><b style={{ display: 'block', marginBottom: 5 }}>{title as string}</b><small style={{ color: '#8da1bd', lineHeight: 1.5 }}>{detail as string}</small></span>
          </label>)}
        </div>
      </section>

      <section className="bottom-actions">
        <div className="bottom-note"><ShieldCheck size={17}/><span><b>Review before posting</b><small>Confirm tax law, recognition criteria and presentation under Ind AS 12.</small></span></div>
        <div className="bottom-buttons"><button className="btn btn-quiet" onClick={exportReport}><FileText size={15}/> Generate report</button><button className="btn btn-quiet" onClick={() => setShowJournal(true)}><BookOpen size={15}/> Journal entries</button><button className="btn btn-primary" onClick={saveCalculation}>{saved ? <Check size={15}/> : <Save size={15}/>} {saved ? 'Saved locally' : 'Save calculation'}</button></div>
      </section>
      <footer className="app-footer"><span>LedgerPilot <span className="footer-sep">/</span> Deferred Tax Calculator</span><span>Prototype v0.2.0 <span className="footer-sep">·</span> Ind AS 12 review required</span></footer>
    </main>

    {showJournal && <div className="modal-backdrop" onClick={() => setShowJournal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-head"><div><span className="eyebrow">REPORTING SUPPORT</span><h2>Illustrative journal entry analysis</h2></div><button className="icon-btn" onClick={() => setShowJournal(false)}><X size={18}/></button></div>
      <div className="modal-warning"><AlertTriangle size={17}/><span>This is not a posting-ready journal. Confirm whether the underlying item was recognised in profit or loss, OCI, equity or a business combination, and apply offsetting criteria separately.</span></div>
      <div className="journal-summary"><span>Net closing position</span><b>{formatINR(summary.netPosition)}</b></div>
      {journalLines().map((j, i) => <div className="journal-line" key={i}><div><b>{j.label}</b><p>{j.note}</p></div><strong>{formatINR(j.amount)}</strong></div>)}
      <div className="modal-actions"><button className="btn btn-quiet" onClick={() => downloadFile('journal-entry-review.txt', journalLines().map(j => `${j.label}: ${j.amount}\n${j.note}`).join('\n\n'), 'text/plain')}>Export review notes</button><button className="btn btn-primary" onClick={() => setShowJournal(false)}>Close</button></div>
    </div></div>}
  </div>;
}

function Metric({ title, value, detail, icon, tone }: { title: string; value: string; detail: string; icon: React.ReactNode; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-title">{title}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></div>;
}

function ScheduleRow({ row, updateAsset, removeAsset }: { row: CalcRow; updateAsset: (id: string, key: keyof Asset, value: string | number) => void; removeAsset: (id: string) => void }) {
  return <tr>
    <td className="asset-cell"><input className="table-input asset-name" aria-label="Asset or liability name" value={row.name} onChange={e => updateAsset(row.id, 'name', e.target.value)} placeholder="Enter item name"/><input className="table-input category-input" aria-label="Category" value={row.category} onChange={e => updateAsset(row.id, 'category', e.target.value)} placeholder="Category"/></td>
    <td><select className="table-select" value={row.kind} onChange={e => updateAsset(row.id, 'kind', e.target.value)}><option value="asset">Asset</option><option value="liability">Liability</option></select></td>
    <td><input className="table-input number-input" type="number" min="0" value={row.carryingAmount} onChange={e => updateAsset(row.id, 'carryingAmount', Number(e.target.value))}/></td>
    <td><input className="table-input number-input" type="number" min="0" value={row.taxBase} onChange={e => updateAsset(row.id, 'taxBase', Number(e.target.value))}/></td>
    <td><div className="difference-value">{formatINR(row.temporaryDifference, true)}</div><span className={`difference-pill ${row.differenceType.toLowerCase()}`}>{row.differenceType}</span></td>
    <td><div className="rate-input"><input className="table-input rate-number" type="number" min="0.01" max="100" step="0.001" value={row.taxRate} onChange={e => updateAsset(row.id, 'taxRate', Number(e.target.value))}/><span>%</span></div></td>
    <td className="green-text money-cell">{formatINR(row.grossDta)}</td><td className="red-text money-cell">{formatINR(row.grossDtl)}</td>
    <td><select className={`recognition-select ${row.recognition}`} value={row.recognition} onChange={e => updateAsset(row.id, 'recognition', e.target.value)}><option value="assess">Assess</option><option value="recognise">Recognise</option><option value="do-not-recognise">Do not recognise</option></select></td>
    <td><button className="delete-btn" onClick={() => removeAsset(row.id)} aria-label={`Delete ${row.name || 'line item'}`}><Trash2 size={14}/></button></td>
  </tr>;
}