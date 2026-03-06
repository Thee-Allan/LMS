import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invoices, matters, clients } from '@/data/mockData';
import {
  Phone, CheckCircle, Clock, AlertCircle, Download, Search,
  RefreshCw, Send, CreditCard, TrendingUp, DollarSign,
  X, ChevronRight, Eye
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PayMethod  = 'mpesa' | 'bank' | 'card';
type TxStatus   = 'pending' | 'success' | 'failed';

interface Transaction {
  id: string;
  date: string;
  clientName: string;
  matterNumber: string;
  amount: number;
  method: PayMethod;
  reference: string;
  status: TxStatus;
  invoiceId: string;
  phone?: string;
  description: string;
}

interface MpesaState {
  stage: 'idle' | 'entering' | 'pushing' | 'confirmed' | 'failed';
  phone: string;
  amount: number;
  invoiceId: string;
  ref: string;
}

// ─── Mock Transactions ────────────────────────────────────────────────────────

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2026-02-28', clientName: 'Safaricom PLC',       matterNumber: 'NLF/2024/0001', amount: 75000,  method: 'mpesa', reference: 'NLF12345678', status: 'success', invoiceId: 'i1', phone: '+254 722 000 001', description: 'Legal fees - Feb 2026' },
  { id: 't2', date: '2026-02-25', clientName: 'Equity Bank Limited', matterNumber: 'NLF/2024/0003', amount: 120000, method: 'bank',  reference: 'BANK00234567', status: 'success', invoiceId: 'i2', description: 'Retainer fee - Q1 2026' },
  { id: 't3', date: '2026-02-20', clientName: 'David Kimani',        matterNumber: 'NLF/2024/0002', amount: 25000,  method: 'mpesa', reference: 'NLF87654321', status: 'success', invoiceId: 'i3', phone: '+254 712 345 678', description: 'Consultation fee' },
  { id: 't4', date: '2026-03-01', clientName: 'Jane Achieng Ouma',   matterNumber: 'NLF/2024/0004', amount: 40000,  method: 'mpesa', reference: 'NLF11112222', status: 'pending', invoiceId: 'i4', phone: '+254 733 456 789', description: 'Filing fees' },
  { id: 't5', date: '2026-02-15', clientName: 'Mt. Kenya Breweries', matterNumber: 'NLF/2024/0005', amount: 85000,  method: 'bank',  reference: 'BANK00123456', status: 'success', invoiceId: 'i5', description: 'IP advisory fee' },
  { id: 't6', date: '2026-02-10', clientName: 'Samuel Mutua',        matterNumber: 'NLF/2024/0006', amount: 15000,  method: 'mpesa', reference: '',            status: 'failed',  invoiceId: 'i6', phone: '+254 700 567 890', description: 'Consultation fee' },
];

const METHOD_CONFIG: Record<PayMethod, { label: string; color: string; icon: React.ReactNode }> = {
  mpesa: { label: 'M-Pesa',   color: '#10b981', icon: <Phone     className="w-3.5 h-3.5" /> },
  bank:  { label: 'Bank',     color: '#3b82f6', icon: <CreditCard className="w-3.5 h-3.5" /> },
  card:  { label: 'Card',     color: '#8b5cf6', icon: <CreditCard className="w-3.5 h-3.5" /> },
};

const STATUS_CONFIG: Record<TxStatus, { label: string; color: string; bg: string }> = {
  success: { label: 'Success', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  failed:  { label: 'Failed',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PaymentsModule: React.FC = () => {
  const { user } = useAuth();
  const isClient = user?.role === 'client';

  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilter]     = useState<'all' | TxStatus>('all');
  const [showPayModal, setShowModal]  = useState(false);
  const [viewingTx, setViewingTx]     = useState<Transaction | null>(null);

  const [mpesa, setMpesa] = useState<MpesaState>({
    stage: 'idle', phone: '', amount: 0, invoiceId: '', ref: '',
  });
  const [newPayForm, setNewPayForm] = useState({
    invoiceId: '', method: 'mpesa' as PayMethod, phone: '', amount: 0,
  });

  // Summary stats
  const totalCollected  = transactions.filter(t => t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalPending    = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0);
  const totalFailed     = transactions.filter(t => t.status === 'failed').length;
  const mpesaTotal      = transactions.filter(t => t.method === 'mpesa' && t.status === 'success').reduce((s, t) => s + t.amount, 0);

  // Filtered list
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search ||
        t.clientName.toLowerCase().includes(search.toLowerCase()) ||
        t.reference.toLowerCase().includes(search.toLowerCase()) ||
        t.matterNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [transactions, search, filterStatus]);

  // Open pay modal
  const openPayModal = (inv?: typeof invoices[0]) => {
    if (inv) {
      setNewPayForm({ invoiceId: inv.id, method: 'mpesa', phone: '', amount: inv.amount - inv.paid });
    } else {
      setNewPayForm({ invoiceId: '', method: 'mpesa', phone: '', amount: 0 });
    }
    setMpesa({ stage: 'idle', phone: '', amount: 0, invoiceId: '', ref: '' });
    setShowModal(true);
  };

  // Simulate STK push
  const sendStk = () => {
    setMpesa(p => ({ ...p, stage: 'pushing', phone: newPayForm.phone, amount: newPayForm.amount, invoiceId: newPayForm.invoiceId }));
    setTimeout(() => {
      const ref = `NLF${Date.now().toString().slice(-8)}`;
      setMpesa(p => ({ ...p, stage: 'confirmed', ref }));
      // Add transaction
      const inv = invoices.find(i => i.id === newPayForm.invoiceId);
      const newTx: Transaction = {
        id: `t${Date.now()}`, date: new Date().toISOString().split('T')[0],
        clientName: inv?.clientName || 'Client', matterNumber: inv?.matterNumber || '—',
        amount: newPayForm.amount, method: newPayForm.method,
        reference: ref, status: 'success', invoiceId: newPayForm.invoiceId,
        phone: newPayForm.phone, description: `Payment for ${inv?.invoiceNumber || 'invoice'}`,
      };
      setTransactions(p => [newTx, ...p]);
    }, 2800);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Payments</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            M-Pesa, bank, and card transactions — all in one place
          </p>
        </div>
        {!isClient && (
          <button onClick={() => openPayModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff' }}>
            <Send className="w-4 h-4" /> Collect Payment
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected',  value: `KES ${(totalCollected/1000).toFixed(0)}K`,  color: '#10b981', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'M-Pesa Collected', value: `KES ${(mpesaTotal/1000).toFixed(0)}K`,      color: '#10b981', icon: <Phone className="w-4 h-4" /> },
          { label: 'Pending',          value: `KES ${(totalPending/1000).toFixed(0)}K`,    color: '#f59e0b', icon: <Clock className="w-4 h-4" /> },
          { label: 'Failed Payments',  value: totalFailed,                                  color: '#ef4444', icon: <AlertCircle className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color + '18', color: s.color }}>{s.icon}</div>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Invoices (quick pay) */}
      {!isClient && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <p className="font-semibold text-sm text-[var(--text-primary)]">Pending / Overdue Invoices</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {invoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)).slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{inv.clientName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{inv.invoiceNumber} · Due {inv.dueDate}</p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--text-primary)]">KES {(inv.amount - inv.paid).toLocaleString()}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold"
                      style={{ background: inv.status === 'overdue' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: inv.status === 'overdue' ? '#ef4444' : '#f59e0b' }}>
                      {inv.status}
                    </span>
                  </div>
                  <button onClick={() => openPayModal(inv)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <Phone className="w-3.5 h-3.5" /> Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="px-5 py-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <p className="font-semibold text-[var(--text-primary)] flex-1">Transaction History</p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)] w-44" />
          </div>

          {/* Filter */}
          <div className="flex gap-1">
            {(['all', 'success', 'pending', 'failed'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all"
                style={{
                  background: filterStatus === s ? (s === 'all' ? 'rgba(59,130,246,0.12)' : STATUS_CONFIG[s as TxStatus]?.bg || 'rgba(59,130,246,0.12)') : 'var(--hover-bg)',
                  color: filterStatus === s ? (s === 'all' ? '#3b82f6' : STATUS_CONFIG[s as TxStatus]?.color || '#3b82f6') : 'var(--text-secondary)',
                  border: `1px solid ${filterStatus === s ? (s === 'all' ? 'rgba(59,130,246,0.35)' : (STATUS_CONFIG[s as TxStatus]?.color || '#3b82f6') + '40') : 'var(--border-color)'}`,
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                {['Date', 'Client', 'Matter', 'Amount', 'Method', 'Reference', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {filtered.map(tx => {
                const scfg = STATUS_CONFIG[tx.status];
                const mcfg = METHOD_CONFIG[tx.method];
                return (
                  <tr key={tx.id} className="transition-colors hover:bg-[var(--hover-bg)]">
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{tx.date}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{tx.clientName}</p>
                      {tx.phone && <p className="text-[10px] text-[var(--text-secondary)]">{tx.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{tx.matterNumber}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[var(--text-primary)]">
                      KES {tx.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: mcfg.color }}>
                        {mcfg.icon} {mcfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--text-secondary)]">
                      {tx.reference || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded"
                        style={{ background: scfg.bg, color: scfg.color }}>
                        {scfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewingTx(tx)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--text-secondary)]">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Collect Payment Modal ─────────────────────────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border shadow-2xl animate-fade-in"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-[var(--text-primary)]">Collect Payment</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {mpesa.stage !== 'confirmed' ? (
                <>
                  {/* Invoice selector */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Invoice</label>
                    <select value={newPayForm.invoiceId}
                      onChange={e => {
                        const inv = invoices.find(i => i.id === e.target.value);
                        setNewPayForm(p => ({ ...p, invoiceId: e.target.value, amount: inv ? inv.amount - inv.paid : p.amount }));
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]">
                      <option value="">Select invoice</option>
                      {invoices.filter(i => ['sent','partial','overdue'].includes(i.status)).map(inv => (
                        <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — {inv.clientName} — KES {(inv.amount - inv.paid).toLocaleString()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Amount (KES)</label>
                    <input type="number" value={newPayForm.amount || ''}
                      onChange={e => setNewPayForm(p => ({ ...p, amount: +e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]" />
                  </div>

                  {/* Method Tabs */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['mpesa','bank','card'] as PayMethod[]).map(m => {
                        const cfg = METHOD_CONFIG[m];
                        return (
                          <button key={m} onClick={() => setNewPayForm(p => ({ ...p, method: m }))}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-medium"
                            style={{
                              background: newPayForm.method === m ? cfg.color + '15' : 'var(--hover-bg)',
                              borderColor: newPayForm.method === m ? cfg.color + '50' : 'var(--border-color)',
                              color: newPayForm.method === m ? cfg.color : 'var(--text-secondary)',
                            }}>
                            <span style={{ color: cfg.color }}>{cfg.icon}</span>
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* M-Pesa Fields */}
                  {newPayForm.method === 'mpesa' && (
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Client M-Pesa Phone</label>
                      <input value={newPayForm.phone}
                        onChange={e => setNewPayForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="e.g. 0712 345 678"
                        className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]" />
                      {mpesa.stage === 'pushing' && (
                        <p className="text-xs mt-2 flex items-center gap-2 text-[var(--text-secondary)]">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          STK Push sent — waiting for client to enter PIN...
                        </p>
                      )}
                    </div>
                  )}

                  {newPayForm.method === 'bank' && (
                    <div className="rounded-lg p-3 text-xs text-[var(--text-secondary)]"
                      style={{ background: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}>
                      <p className="font-semibold text-[var(--text-primary)] mb-1">Bank Details</p>
                      <p>Bank: Equity Bank Kenya</p>
                      <p>Account: 0250298765432</p>
                      <p>Name: Nanyuki Law Firm</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      Cancel
                    </button>
                    <button
                      onClick={newPayForm.method === 'mpesa' ? sendStk : () => {
                        const ref = `BANK${Date.now().toString().slice(-8)}`;
                        setMpesa(p => ({ ...p, stage: 'confirmed', ref }));
                        const inv = invoices.find(i => i.id === newPayForm.invoiceId);
                        const newTx: Transaction = {
                          id: `t${Date.now()}`, date: new Date().toISOString().split('T')[0],
                          clientName: inv?.clientName || 'Client', matterNumber: inv?.matterNumber || '—',
                          amount: newPayForm.amount, method: newPayForm.method, reference: ref,
                          status: 'success', invoiceId: newPayForm.invoiceId,
                          description: `Payment for ${inv?.invoiceNumber || 'invoice'}`,
                        };
                        setTransactions(p => [newTx, ...p]);
                      }}
                      disabled={!newPayForm.amount || mpesa.stage === 'pushing' || (newPayForm.method === 'mpesa' && !newPayForm.phone)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: 'linear-gradient(135deg,#10b981,#059669)',
                        color: '#fff',
                        opacity: (!newPayForm.amount || mpesa.stage === 'pushing' || (newPayForm.method === 'mpesa' && !newPayForm.phone)) ? 0.5 : 1,
                      }}>
                      {mpesa.stage === 'pushing'
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Waiting...</>
                        : <><Send className="w-4 h-4" /> {newPayForm.method === 'mpesa' ? 'Send STK Push' : 'Confirm Payment'}</>}
                    </button>
                  </div>
                </>
              ) : (
                /* Confirmed State */
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)' }}>
                    <CheckCircle className="w-8 h-8" style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text-primary)] text-lg">Payment Confirmed!</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      KES {newPayForm.amount.toLocaleString()} received successfully
                    </p>
                  </div>
                  <div className="rounded-xl border p-4 text-left space-y-2 text-sm"
                    style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Reference</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">{mpesa.ref}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Amount</span>
                      <span className="font-bold text-[var(--text-primary)]">KES {newPayForm.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Method</span>
                      <span className="font-bold" style={{ color: METHOD_CONFIG[newPayForm.method].color }}>
                        {METHOD_CONFIG[newPayForm.method].label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      <Download className="w-4 h-4" /> Receipt
                    </button>
                    <button onClick={() => setShowModal(false)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                      Done <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── View Transaction Modal ─────────────────────────────────────────── */}
      {viewingTx && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl animate-fade-in"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-[var(--text-primary)]">Transaction Detail</h3>
              <button onClick={() => setViewingTx(null)} className="text-[var(--text-secondary)] hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Client',     value: viewingTx.clientName },
                { label: 'Matter',     value: viewingTx.matterNumber },
                { label: 'Date',       value: viewingTx.date },
                { label: 'Amount',     value: `KES ${viewingTx.amount.toLocaleString()}` },
                { label: 'Method',     value: METHOD_CONFIG[viewingTx.method].label },
                { label: 'Reference',  value: viewingTx.reference || '—' },
                { label: 'Status',     value: STATUS_CONFIG[viewingTx.status].label },
                { label: 'Description',value: viewingTx.description },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                  <span className="font-medium text-[var(--text-primary)] text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mt-2"
                style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                <Download className="w-4 h-4" /> Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsModule;
