import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { practiceAreas, courts } from '@/data/mockData';
import {
  Upload, CheckCircle, ChevronRight, ChevronLeft, User,
  Briefcase, FileText, CreditCard, Phone, AlertCircle,
  Clock, Star, Calendar, MessageSquare, Send
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'case_details' | 'documents' | 'advocate' | 'payment' | 'confirmation';

interface CaseForm {
  // Step 1
  caseType: string;
  court: string;
  title: string;
  description: string;
  opposingParty: string;
  urgency: 'normal' | 'urgent' | 'very_urgent';
  // Step 2
  uploadedDocs: UploadedDoc[];
  // Step 3
  selectedAdvocate: string;
  preferredDate: string;
  consultationMode: 'physical' | 'virtual' | 'phone';
  // Step 4
  paymentMethod: 'mpesa' | 'bank' | 'card';
  mpesaPhone: string;
  agreedToTerms: boolean;
}

interface UploadedDoc {
  id: string;
  name: string;
  category: string;
  size: string;
}

// ─── Mock advocates ───────────────────────────────────────────────────────────

const ADVOCATES = [
  { id: 'adv1', name: 'Grace Wanjiku', title: 'Managing Partner', speciality: 'Land, Family, Employment', rating: 4.9, cases: 87, avatar: 'GW', available: true, rate: 'KES 15,000/hr' },
  { id: 'adv2', name: 'Peter Kamau',   title: 'Senior Advocate',  speciality: 'Commercial, IP, Criminal', rating: 4.8, cases: 64, avatar: 'PK', available: true, rate: 'KES 10,000/hr' },
  { id: 'adv3', name: 'James Mwangi',  title: 'Associate',        speciality: 'Civil, Constitutional',   rating: 4.6, cases: 42, avatar: 'JM', available: false, rate: 'KES 8,000/hr' },
];

const DOC_CATEGORIES = ['ID / Passport', 'Contract / Agreement', 'Land Title', 'Evidence', 'Court Order', 'Correspondence', 'Other'];

const FEES: Record<string, number> = {
  consultation: 5000,
  filing:       15000,
  court:        8500,
  urgency:      10000,
};

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'case_details', label: 'Case Details',  icon: <Briefcase className="w-4 h-4" /> },
  { id: 'documents',    label: 'Documents',     icon: <FileText   className="w-4 h-4" /> },
  { id: 'advocate',     label: 'Advocate',      icon: <User       className="w-4 h-4" /> },
  { id: 'payment',      label: 'Payment',       icon: <CreditCard className="w-4 h-4" /> },
  { id: 'confirmation', label: 'Confirmation',  icon: <CheckCircle className="w-4 h-4" /> },
];

// ─── Progress Stepper ─────────────────────────────────────────────────────────

const Stepper: React.FC<{ current: Step }> = ({ current }) => {
  const currentIdx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[70px]">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? '#10b981' : active ? '#3b82f6' : 'var(--hover-bg)',
                  color: done || active ? '#fff' : 'var(--text-secondary)',
                  border: active ? '2px solid #3b82f6' : '2px solid transparent',
                }}
              >
                {done ? <CheckCircle className="w-4 h-4" /> : step.icon}
              </div>
              <p className="text-[10px] mt-1 text-center"
                style={{ color: active ? '#3b82f6' : done ? '#10b981' : 'var(--text-secondary)', fontWeight: active ? 600 : 400 }}>
                {step.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-0.5 w-8 mx-1 flex-shrink-0 mb-4 transition-all"
                style={{ background: done ? '#10b981' : 'var(--border-color)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ClientCaseSubmission: React.FC = () => {
  const { user } = useAuth();
  const isStaff = user?.role !== 'client';

  const [step, setStep] = useState<Step>('case_details');
  const [form, setForm] = useState<CaseForm>({
    caseType: '', court: '', title: '', description: '', opposingParty: '', urgency: 'normal',
    uploadedDocs: [], selectedAdvocate: '', preferredDate: '',
    consultationMode: 'physical', paymentMethod: 'mpesa', mpesaPhone: '', agreedToTerms: false,
  });
  const [mpesaState, setMpesaState] = useState<'idle' | 'pending' | 'success'>('idle');
  const [refNumber, setRefNumber] = useState('');

  const set = (key: keyof CaseForm, val: any) => setForm(p => ({ ...p, [key]: val }));

  const totalFee = FEES.consultation + FEES.filing +
    (form.urgency === 'urgent' ? FEES.urgency / 2 : form.urgency === 'very_urgent' ? FEES.urgency : 0);

  const addDoc = (cat: string) => {
    const doc: UploadedDoc = {
      id: `doc_${Date.now()}`, name: `${cat.replace(/ \/ /g, '_')}_${form.uploadedDocs.length + 1}.pdf`,
      category: cat, size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
    };
    set('uploadedDocs', [...form.uploadedDocs, doc]);
  };

  const removeDoc = (id: string) => set('uploadedDocs', form.uploadedDocs.filter(d => d.id !== id));

  const simulateMpesa = () => {
    setMpesaState('pending');
    setTimeout(() => {
      setMpesaState('success');
      setRefNumber(`NLF${Date.now().toString().slice(-8)}`);
    }, 2500);
  };

  const canProceed = (): boolean => {
    if (step === 'case_details') return !!(form.caseType && form.title && form.description);
    if (step === 'documents')    return form.uploadedDocs.length > 0;
    if (step === 'advocate')     return !!(form.selectedAdvocate && form.preferredDate);
    if (step === 'payment')      return form.agreedToTerms && (mpesaState === 'success');
    return true;
  };

  const next = () => {
    const order: Step[] = ['case_details', 'documents', 'advocate', 'payment', 'confirmation'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  const back = () => {
    const order: Step[] = ['case_details', 'documents', 'advocate', 'payment', 'confirmation'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {isStaff ? 'New Case Submission (Staff View)' : 'Submit Your Case'}
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {isStaff
            ? 'Submit a case on behalf of a client — all steps in one place.'
            : 'Tell us about your legal matter and we will match you with the right advocate.'}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Stepper current={step} />

        <div
          className="rounded-2xl border p-6 animate-fade-in"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >

          {/* ── Step 1: Case Details ─────────────────────────────────────── */}
          {step === 'case_details' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Tell us about your case</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Type of Case *</label>
                  <select value={form.caseType} onChange={e => set('caseType', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]">
                    <option value="">Select case type</option>
                    {practiceAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Preferred Court</label>
                  <select value={form.court} onChange={e => set('court', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]">
                    <option value="">Select court</option>
                    {courts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Case Title / Name *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Land Dispute — Plot LR 1234 Nanyuki"
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]" />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Describe Your Situation *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={4} placeholder="Explain what happened, what you need help with, and any important dates or facts..."
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)] resize-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Opposing Party (if any)</label>
                <input value={form.opposingParty} onChange={e => set('opposingParty', e.target.value)}
                  placeholder="Name of person, company or institution on the other side"
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]" />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Urgency Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { val: 'normal',     label: 'Normal',      sub: 'Standard processing', color: '#10b981' },
                    { val: 'urgent',     label: 'Urgent',      sub: '+KES 5,000 fee',      color: '#f59e0b' },
                    { val: 'very_urgent',label: 'Very Urgent', sub: '+KES 10,000 fee',      color: '#ef4444' },
                  ] as const).map(opt => (
                    <button key={opt.val} onClick={() => set('urgency', opt.val)}
                      className="p-3 rounded-xl border text-left transition-all"
                      style={{
                        background: form.urgency === opt.val ? opt.color + '15' : 'var(--hover-bg)',
                        borderColor: form.urgency === opt.val ? opt.color + '60' : 'var(--border-color)',
                      }}>
                      <p className="text-sm font-semibold" style={{ color: form.urgency === opt.val ? opt.color : 'var(--text-primary)' }}>{opt.label}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Documents ────────────────────────────────────────── */}
          {step === 'documents' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Upload Supporting Documents</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Upload any documents relevant to your case. At least one document is required.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DOC_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => addDoc(cat)}
                    className="flex items-center gap-2 p-3 rounded-lg border text-left transition-all hover:border-blue-400"
                    style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>
                    <Upload className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-[var(--text-primary)]">{cat}</span>
                  </button>
                ))}
              </div>

              {form.uploadedDocs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">UPLOADED ({form.uploadedDocs.length})</p>
                  {form.uploadedDocs.map(doc => (
                    <div key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                      style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{doc.category} · {doc.size}</p>
                      </div>
                      <button onClick={() => removeDoc(doc.id)} className="text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.uploadedDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed text-center"
                  style={{ borderColor: 'var(--border-color)' }}>
                  <FileText className="w-10 h-10 text-[var(--text-secondary)] opacity-30 mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">Click a category above to add documents</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-70">PDF, JPG, PNG · Max 50MB each</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Advocate Selection ───────────────────────────────── */}
          {step === 'advocate' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Choose Your Advocate</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Select an advocate and book your consultation.</p>
              </div>

              <div className="space-y-3">
                {ADVOCATES.map(adv => (
                  <button key={adv.id} onClick={() => adv.available && set('selectedAdvocate', adv.id)}
                    disabled={!adv.available}
                    className="w-full p-4 rounded-xl border text-left transition-all"
                    style={{
                      background: form.selectedAdvocate === adv.id ? 'rgba(59,130,246,0.08)' : 'var(--hover-bg)',
                      borderColor: form.selectedAdvocate === adv.id ? 'rgba(59,130,246,0.4)' : 'var(--border-color)',
                      opacity: adv.available ? 1 : 0.5,
                      cursor: adv.available ? 'pointer' : 'not-allowed',
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>
                        {adv.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[var(--text-primary)] text-sm">{adv.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: adv.available ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)', color: adv.available ? '#10b981' : '#6b7280' }}>
                            {adv.available ? '● Available' : '● Unavailable'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{adv.title} · {adv.speciality}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                            <Star className="w-3 h-3" style={{ color: '#f59e0b' }} /> {adv.rating}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                            <Briefcase className="w-3 h-3" /> {adv.cases} cases
                          </span>
                          <span className="text-xs font-medium" style={{ color: '#3b82f6' }}>{adv.rate}</span>
                        </div>
                      </div>
                      {form.selectedAdvocate === adv.id && (
                        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Preferred Consultation Date *</label>
                  <input type="date" value={form.preferredDate} onChange={e => set('preferredDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Consultation Mode</label>
                  <select value={form.consultationMode} onChange={e => set('consultationMode', e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]">
                    <option value="physical">Physical — Visit Office</option>
                    <option value="virtual">Virtual — Video Call</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Payment ──────────────────────────────────────────── */}
          {step === 'payment' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Pay Fees</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Secure payment — all transactions are protected.</p>
              </div>

              {/* Fee Breakdown */}
              <div className="rounded-xl border p-4 space-y-2"
                style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">Fee Breakdown</p>
                {[
                  { label: 'Consultation Fee',  amount: FEES.consultation },
                  { label: 'Filing Preparation Fee', amount: FEES.filing },
                  ...(form.urgency !== 'normal' ? [{ label: 'Urgency Surcharge', amount: form.urgency === 'urgent' ? FEES.urgency / 2 : FEES.urgency }] : []),
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center text-sm">
                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                    <span className="text-[var(--text-primary)] font-medium">KES {item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold"
                  style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-[var(--text-primary)]">Total</span>
                  <span style={{ color: '#3b82f6', fontSize: 16 }}>KES {totalFee.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Payment Method</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { val: 'mpesa', label: 'M-Pesa',   icon: <Phone className="w-5 h-5" /> },
                    { val: 'bank',  label: 'Bank',      icon: <CreditCard className="w-5 h-5" /> },
                    { val: 'card',  label: 'Card',      icon: <CreditCard className="w-5 h-5" /> },
                  ] as const).map(m => (
                    <button key={m.val} onClick={() => set('paymentMethod', m.val)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all"
                      style={{
                        background: form.paymentMethod === m.val ? 'rgba(59,130,246,0.10)' : 'var(--hover-bg)',
                        borderColor: form.paymentMethod === m.val ? 'rgba(59,130,246,0.4)' : 'var(--border-color)',
                        color: form.paymentMethod === m.val ? '#3b82f6' : 'var(--text-secondary)',
                      }}>
                      {m.icon}
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* M-Pesa STK Push */}
              {form.paymentMethod === 'mpesa' && (
                <div className="rounded-xl border p-4 space-y-3"
                  style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.25)' }}>
                  <p className="text-sm font-semibold" style={{ color: '#10b981' }}>📱 M-Pesa STK Push</p>
                  <div className="flex gap-3">
                    <input value={form.mpesaPhone} onChange={e => set('mpesaPhone', e.target.value)}
                      placeholder="e.g. 0712 345 678"
                      className="flex-1 px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]" />
                    <button onClick={simulateMpesa} disabled={!form.mpesaPhone || mpesaState !== 'idle'}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        background: mpesaState === 'success' ? '#10b981' : 'rgba(16,185,129,0.15)',
                        color: mpesaState === 'success' ? '#fff' : '#10b981',
                        border: '1px solid rgba(16,185,129,0.3)',
                        opacity: !form.mpesaPhone || mpesaState !== 'idle' ? 0.6 : 1,
                      }}>
                      {mpesaState === 'idle'    ? 'Send Request' :
                       mpesaState === 'pending' ? 'Waiting...' : '✓ Paid'}
                    </button>
                  </div>
                  {mpesaState === 'pending' && (
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                      <Clock className="w-3 h-3 animate-spin" />
                      STK Push sent to {form.mpesaPhone} — enter your M-Pesa PIN to confirm
                    </p>
                  )}
                  {mpesaState === 'success' && (
                    <p className="text-xs font-semibold flex items-center gap-2" style={{ color: '#10b981' }}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Payment confirmed! KES {totalFee.toLocaleString()} received. Ref: {refNumber}
                    </p>
                  )}
                </div>
              )}

              {/* Bank / Card */}
              {form.paymentMethod !== 'mpesa' && (
                <div className="rounded-xl border p-4 text-center space-y-2"
                  style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {form.paymentMethod === 'bank'
                      ? 'Bank: Equity Bank — A/C 0250298765432 — Nanyuki Law Firm'
                      : 'Card payment integration coming soon. Please use M-Pesa.'}
                  </p>
                  {form.paymentMethod === 'bank' && (
                    <button onClick={() => { setMpesaState('success'); setRefNumber(`BANK${Date.now().toString().slice(-8)}`); }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                      Mark as Paid (Staff Use)
                    </button>
                  )}
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreedToTerms} onChange={e => set('agreedToTerms', e.target.checked)}
                  className="mt-0.5 rounded" />
                <span className="text-xs text-[var(--text-secondary)]">
                  I agree to Nanyuki Law Firm's terms and conditions. I understand that consultation fees are non-refundable.
                </span>
              </label>
            </div>
          )}

          {/* ── Step 5: Confirmation ─────────────────────────────────────── */}
          {step === 'confirmation' && (
            <div className="space-y-5 text-center">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: '#10b981' }} />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Case Submitted Successfully!</h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                  Your case has been received. Your advocate will contact you within 24 hours to confirm your consultation.
                </p>
              </div>

              <div className="rounded-xl border p-4 text-left space-y-3"
                style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>
                {[
                  { label: 'Reference Number', value: `NLF/SUB/${Date.now().toString().slice(-6)}` },
                  { label: 'Case Type',         value: form.caseType },
                  { label: 'Assigned Advocate', value: ADVOCATES.find(a => a.id === form.selectedAdvocate)?.name || '—' },
                  { label: 'Consultation Date', value: form.preferredDate ? new Date(form.preferredDate).toLocaleDateString('en-KE', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) : '—' },
                  { label: 'Mode',              value: form.consultationMode === 'physical' ? 'Visit Office' : form.consultationMode === 'virtual' ? 'Video Call' : 'Phone Call' },
                  { label: 'Payment',           value: `KES ${totalFee.toLocaleString()} — Ref: ${refNumber}` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                    <span className="font-medium text-[var(--text-primary)]">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  <MessageSquare className="w-4 h-4" /> Message Advocate
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  onClick={() => { setStep('case_details'); setForm({ caseType:'',court:'',title:'',description:'',opposingParty:'',urgency:'normal',uploadedDocs:[],selectedAdvocate:'',preferredDate:'',consultationMode:'physical',paymentMethod:'mpesa',mpesaPhone:'',agreedToTerms:false }); setMpesaState('idle'); setRefNumber(''); }}
                  style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <Send className="w-4 h-4" /> Submit Another Case
                </button>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ───────────────────────────────────────── */}
          {step !== 'confirmation' && (
            <div className="flex justify-between mt-8 pt-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button onClick={back} disabled={step === 'case_details'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: 'var(--hover-bg)', color: 'var(--text-secondary)',
                  opacity: step === 'case_details' ? 0.4 : 1,
                  cursor: step === 'case_details' ? 'not-allowed' : 'pointer',
                }}>
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={next} disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: canProceed() ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'var(--hover-bg)',
                  color: canProceed() ? '#fff' : 'var(--text-secondary)',
                  cursor: canProceed() ? 'pointer' : 'not-allowed',
                }}>
                {step === 'payment' ? 'Submit Case' : 'Continue'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientCaseSubmission;
