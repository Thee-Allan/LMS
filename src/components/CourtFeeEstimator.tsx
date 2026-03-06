import React, { useState, useMemo } from 'react';
import { DollarSign, Calculator, ChevronDown, Info, AlertTriangle, CheckCircle, Scale, FileText } from 'lucide-react';

interface FeeStructure {
  category: string;
  description: string;
  baseAmount: number;
  variable?: string;
  notes?: string;
}

const COURT_FEES: Record<string, FeeStructure[]> = {
  civil: [
    { category: 'Filing Fee', description: 'Court filing fee (Plaint/Motion)', baseAmount: 4000, notes: 'Payable to the court at filing' },
    { category: 'Service Fee', description: 'Service of process', baseAmount: 2000, notes: 'Per defendant served' },
    { category: 'Hearing Fee', description: 'Per hearing/mention', baseAmount: 1500, notes: 'Approximate — varies by court' },
    { category: 'Stamp Duty', description: 'Document stamp duty', baseAmount: 500, notes: 'Varies by document type' },
  ],
  land: [
    { category: 'Filing Fee (ELC)', description: 'Environment & Land Court filing', baseAmount: 6000, notes: 'Payable at ELC registry' },
    { category: 'Land Search', description: 'Official land search fee', baseAmount: 3000, notes: 'Per parcel searched' },
    { category: 'Service Fee', description: 'Service of summons', baseAmount: 2000, notes: 'Per respondent' },
    { category: 'Surveyor Report', description: 'Licensed surveyor (if needed)', baseAmount: 15000, variable: '10,000–25,000', notes: 'Depends on parcel size' },
  ],
  employment: [
    { category: 'Filing Fee (ELRC)', description: 'Employment & Labour Relations Court', baseAmount: 3000, notes: 'Fixed rate for employment claims' },
    { category: 'Service Fee', description: 'Service on employer', baseAmount: 1500 },
    { category: 'Hearing Fee', description: 'Per session', baseAmount: 1000 },
  ],
  criminal: [
    { category: 'Bail Application', description: 'Bail hearing fee', baseAmount: 2000, notes: 'May be waived in some courts' },
    { category: 'Mitigation Hearing', description: 'Mitigation/plea hearing', baseAmount: 1500 },
    { category: 'Appeal Fee', description: 'Criminal appeal to High Court', baseAmount: 5000 },
  ],
  family: [
    { category: 'Petition Fee', description: 'Divorce/custody petition', baseAmount: 5000 },
    { category: 'Service Fee', description: 'Service on respondent', baseAmount: 2000 },
    { category: 'Hearing Fee', description: 'Per hearing session', baseAmount: 1500 },
    { category: 'Valuation (assets)', description: 'If matrimonial assets disputed', baseAmount: 10000, variable: '8,000–20,000', notes: 'Depends on asset value' },
  ],
};

const FIRM_FEES: Record<string, { consultation: number; preparation: number; advocacy: number; urgency: number }> = {
  civil: { consultation: 5000, preparation: 15000, advocacy: 25000, urgency: 7500 },
  land: { consultation: 5000, preparation: 20000, advocacy: 30000, urgency: 10000 },
  employment: { consultation: 5000, preparation: 12000, advocacy: 20000, urgency: 7500 },
  criminal: { consultation: 5000, preparation: 15000, advocacy: 35000, urgency: 15000 },
  family: { consultation: 5000, preparation: 12000, advocacy: 22000, urgency: 7500 },
};

const caseTypes = [
  { value: 'civil', label: 'Civil Litigation', icon: '⚖️' },
  { value: 'land', label: 'Land & Property (ELC)', icon: '🏡' },
  { value: 'employment', label: 'Employment (ELRC)', icon: '💼' },
  { value: 'criminal', label: 'Criminal Defence', icon: '🛡️' },
  { value: 'family', label: 'Family Law', icon: '👨‍👩‍👧' },
];

const CourtFeeEstimator: React.FC = () => {
  const [selectedType, setSelectedType] = useState('civil');
  const [hearings, setHearings] = useState(3);
  const [defendants, setDefendants] = useState(1);
  const [isUrgent, setIsUrgent] = useState(false);
  const [includeAdvocacy, setIncludeAdvocacy] = useState(true);

  const courtFees = COURT_FEES[selectedType] || [];
  const firmFees = FIRM_FEES[selectedType];

  const totals = useMemo(() => {
    let courtTotal = 0;
    courtFees.forEach(f => {
      if (f.category === 'Hearing Fee') courtTotal += f.baseAmount * hearings;
      else if (f.category === 'Service Fee') courtTotal += f.baseAmount * defendants;
      else courtTotal += f.baseAmount;
    });

    let firmTotal = firmFees.consultation + firmFees.preparation;
    if (includeAdvocacy) firmTotal += firmFees.advocacy;
    if (isUrgent) firmTotal += firmFees.urgency;

    return {
      court: courtTotal,
      firm: firmTotal,
      total: courtTotal + firmTotal,
    };
  }, [selectedType, hearings, defendants, isUrgent, includeAdvocacy, courtFees, firmFees]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Court Fee Estimator</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Estimate total legal costs before committing to a case</p>
      </div>

      <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-secondary)]">These are estimates based on standard court schedules. Actual costs may vary depending on the court, complexity, and duration of the case.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Configuration */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">Case Type</label>
            <div className="grid grid-cols-1 gap-2">
              {caseTypes.map(t => (
                <button key={t.value} onClick={() => setSelectedType(t.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedType === t.value ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--hover-bg)]'}`}>
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{t.label}</span>
                  {selectedType === t.value && <CheckCircle className="w-4 h-4 text-blue-400 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">Expected Number of Hearings</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setHearings(Math.max(1, hearings - 1))} className="w-8 h-8 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">-</button>
                <span className="text-lg font-bold text-[var(--text-primary)] w-8 text-center">{hearings}</span>
                <button onClick={() => setHearings(hearings + 1)} className="w-8 h-8 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">+</button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">Number of Defendants/Respondents</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setDefendants(Math.max(1, defendants - 1))} className="w-8 h-8 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">-</button>
                <span className="text-lg font-bold text-[var(--text-primary)] w-8 text-center">{defendants}</span>
                <button onClick={() => setDefendants(defendants + 1)} className="w-8 h-8 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]">+</button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] cursor-pointer">
              <input type="checkbox" checked={includeAdvocacy} onChange={e => setIncludeAdvocacy(e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Include Advocacy Fees</p>
                <p className="text-xs text-[var(--text-secondary)]">Court appearances by your advocate</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] cursor-pointer">
              <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Urgent Matter</p>
                <p className="text-xs text-[var(--text-secondary)]">Add urgency surcharge (+KES {firmFees.urgency.toLocaleString()})</p>
              </div>
            </label>
          </div>
        </div>

        {/* Right - Breakdown */}
        <div className="space-y-4">
          {/* Court Fees Breakdown */}
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <p className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Scale className="w-4 h-4 text-blue-400" /> Court Fees</p>
            <div className="space-y-2">
              {courtFees.map(f => (
                <div key={f.category} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">{f.category}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{f.description}{f.notes ? ` — ${f.notes}` : ''}</p>
                  </div>
                  <p className="text-xs font-bold text-[var(--text-primary)] flex-shrink-0">
                    KES {(f.category === 'Hearing Fee' ? f.baseAmount * hearings : f.category === 'Service Fee' ? f.baseAmount * defendants : f.baseAmount).toLocaleString()}
                    {f.variable && <span className="text-[10px] text-[var(--text-secondary)] font-normal"> (est.)</span>}
                  </p>
                </div>
              ))}
              <div className="border-t border-[var(--border-color)] pt-2 flex justify-between">
                <p className="text-xs font-bold text-[var(--text-primary)]">Court Subtotal</p>
                <p className="text-xs font-bold text-blue-400">KES {totals.court.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Firm Fees Breakdown */}
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <p className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-purple-400" /> Nanyuki Law Firm Fees</p>
            <div className="space-y-2">
              <div className="flex justify-between"><p className="text-xs text-[var(--text-primary)]">Consultation</p><p className="text-xs font-bold text-[var(--text-primary)]">KES {firmFees.consultation.toLocaleString()}</p></div>
              <div className="flex justify-between"><p className="text-xs text-[var(--text-primary)]">Document Preparation</p><p className="text-xs font-bold text-[var(--text-primary)]">KES {firmFees.preparation.toLocaleString()}</p></div>
              {includeAdvocacy && <div className="flex justify-between"><p className="text-xs text-[var(--text-primary)]">Advocacy / Court Appearances</p><p className="text-xs font-bold text-[var(--text-primary)]">KES {firmFees.advocacy.toLocaleString()}</p></div>}
              {isUrgent && <div className="flex justify-between"><p className="text-xs text-orange-400">Urgency Surcharge</p><p className="text-xs font-bold text-orange-400">KES {firmFees.urgency.toLocaleString()}</p></div>}
              <div className="border-t border-[var(--border-color)] pt-2 flex justify-between">
                <p className="text-xs font-bold text-[var(--text-primary)]">Firm Subtotal</p>
                <p className="text-xs font-bold text-purple-400">KES {totals.firm.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-200">Estimated Total Cost</p>
                <p className="text-2xl font-bold text-white mt-0.5">KES {totals.total.toLocaleString()}</p>
                <p className="text-[11px] text-blue-200 mt-0.5">Court: KES {totals.court.toLocaleString()} + Firm: KES {totals.firm.toLocaleString()}</p>
              </div>
              <Calculator className="w-10 h-10 text-blue-200 opacity-50" />
            </div>
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] text-center">Estimates based on current Kenya Judiciary court fee schedules. Consult your advocate for a precise quote.</p>
        </div>
      </div>
    </div>
  );
};

export default CourtFeeEstimator;
