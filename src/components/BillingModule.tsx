import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invoices as initialInvoices, Invoice, matters, clients } from '@/data/mockData';
import { Plus, Search, Eye, X, Download, ChevronLeft, ChevronRight, Receipt, DollarSign, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: '#6b7280', sent: '#3b82f6', partial: '#f59e0b', paid: '#10b981', overdue: '#ef4444', cancelled: '#9ca3af',
};

const BillingModule: React.FC = () => {
  const { user, hasPermission, addAuditLog } = useAuth();
  const isClient = user?.role === 'client';

  // Clients only see their own invoices.
  // We match by the client's first name as a proxy (in production, match by clientId).
  const baseInvoices = isClient
    ? initialInvoices.filter(i =>
        i.clientName.toLowerCase().includes(
          user?.name?.split(' ')[0]?.toLowerCase() ?? ''
        )
      )
    : initialInvoices;

  const [invoicesList, setInvoicesList] = useState<Invoice[]>(baseInvoices);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [form, setForm] = useState({
    matterId: '', clientId: '', dueDate: '', items: [{ description: '', hours: 0, rate: 0, amount: 0 }], tax: 16, discount: 0,
  });

  const filtered = useMemo(() => {
    return invoicesList.filter(i => {
      const matchSearch = !search || i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || i.clientName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoicesList, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const totalRevenue = invoicesList.filter(i => i.status === 'paid').reduce((s, i) => s + i.paid, 0);
  const totalOutstanding = invoicesList.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.amount - i.paid), 0);
  const totalOverdue = invoicesList.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.amount - i.paid), 0);

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', hours: 0, rate: 0, amount: 0 }] });
  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...form.items];
    (items[idx] as any)[field] = value;
    if (field === 'hours' || field === 'rate') items[idx].amount = items[idx].hours * items[idx].rate;
    setForm({ ...form, items });
  };
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const handleSave = () => {
    if (!form.matterId || !form.clientId) return;
    const matter = matters.find(m => m.id === form.matterId);
    const client = clients.find(c => c.id === form.clientId);
    const subtotal = form.items.reduce((s, i) => s + i.amount, 0);
    const taxAmount = subtotal * (form.tax / 100);
    const newInvoice: Invoice = {
      id: `i${Date.now()}`, invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoicesList.length + 1).padStart(3, '0')}`,
      matterId: form.matterId, matterNumber: matter?.matterNumber || '', clientId: form.clientId,
      clientName: client?.name || '', amount: subtotal + taxAmount - form.discount, paid: 0,
      status: 'draft', dueDate: form.dueDate, issuedDate: new Date().toISOString().split('T')[0],
      items: form.items, tax: taxAmount, discount: form.discount,
    };
    setInvoicesList(prev => [newInvoice, ...prev]);
    addAuditLog('CREATE', 'Billing', `Created invoice: ${newInvoice.invoiceNumber}`);
    setShowForm(false);
  };

  const markAsSent = (inv: Invoice) => {
    setInvoicesList(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'sent' } : i));
    addAuditLog('UPDATE', 'Billing', `Marked invoice ${inv.invoiceNumber} as sent`);
  };

  const recordPayment = (inv: Invoice) => {
    const amount = prompt(`Enter payment amount for ${inv.invoiceNumber} (Outstanding: KES ${(inv.amount - inv.paid).toLocaleString()}):`);
    if (!amount) return;
    const payment = parseFloat(amount);
    if (isNaN(payment) || payment <= 0) return;
    const newPaid = inv.paid + payment;
    const newStatus = newPaid >= inv.amount ? 'paid' : 'partial';
    setInvoicesList(prev => prev.map(i => i.id === inv.id ? { ...i, paid: newPaid, status: newStatus } : i));
    addAuditLog('PAYMENT', 'Billing', `Recorded payment of KES ${payment.toLocaleString()} for ${inv.invoiceNumber}`);
  };

  const exportCSV = () => {
    const headers = 'Invoice,Client,Amount,Paid,Outstanding,Status,Due Date\n';
    const rows = filtered.map(i => `"${i.invoiceNumber}","${i.clientName}","${i.amount}","${i.paid}","${i.amount - i.paid}","${i.status}","${i.dueDate}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'invoices.csv'; a.click();
    addAuditLog('EXPORT', 'Billing', 'Exported invoices to CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {isClient ? 'My Invoices' : 'Billing & Invoicing'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isClient && hasPermission('billing.export') && (
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          )}
          {!isClient && hasPermission('billing.create') && (
            <button onClick={() => { setForm({ matterId: '', clientId: '', dueDate: '', items: [{ description: '', hours: 0, rate: 0, amount: 0 }], tax: 16, discount: 0 }); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: isClient ? 'Total Paid' : 'Total Revenue', value: totalRevenue, icon: CheckCircle2, color: '#10b981' },
          { label: isClient ? 'Amount Due' : 'Outstanding', value: totalOutstanding, icon: Clock, color: '#f59e0b' },
          { label: 'Overdue', value: totalOverdue, icon: AlertTriangle, color: '#ef4444' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">KES {(s.value / 1000).toFixed(0)}K</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search invoices..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Status</option>
          {['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Invoice</th>
                {!isClient && <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden md:table-cell">Client</th>}
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Amount</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden md:table-cell">Paid</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden lg:table-cell">Due Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(inv => (
                <tr key={inv.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{inv.invoiceNumber}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{inv.matterNumber}</p>
                  </td>
                  {!isClient && <td className="px-4 py-3 hidden md:table-cell text-sm text-[var(--text-primary)]">{inv.clientName}</td>}
                  <td className="px-4 py-3 text-right text-sm font-medium text-[var(--text-primary)]">KES {inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right hidden md:table-cell text-sm text-[var(--text-secondary)]">KES {inv.paid.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full capitalize" style={{ backgroundColor: `${statusColors[inv.status]}20`, color: statusColors[inv.status] }}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-[var(--text-secondary)]">{new Date(inv.dueDate).toLocaleDateString('en-KE')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewingInvoice(inv)} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-blue-400"><Eye className="w-4 h-4" /></button>
                      {!isClient && inv.status === 'draft' && hasPermission('billing.edit') && (
                        <button onClick={() => markAsSent(inv)} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Send</button>
                      )}
                      {!isClient && ['sent', 'partial', 'overdue'].includes(inv.status) && hasPermission('billing.edit') && (
                        <button onClick={() => recordPayment(inv)} className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">Pay</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)]">
            <p className="text-sm text-[var(--text-secondary)]">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] disabled:opacity-30 text-[var(--text-secondary)]"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] disabled:opacity-30 text-[var(--text-secondary)]"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingInvoice(null)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{viewingInvoice.invoiceNumber}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{viewingInvoice.clientName}</p>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[['Matter', viewingInvoice.matterNumber], ['Status', viewingInvoice.status], ['Issued', viewingInvoice.issuedDate], ['Due', viewingInvoice.dueDate]].map(([l, v]) => (
                  <div key={l}><span className="text-xs text-[var(--text-secondary)] uppercase">{l}</span><p className="text-sm font-medium text-[var(--text-primary)] capitalize">{v}</p></div>
                ))}
              </div>
              <table className="w-full mb-4">
                <thead><tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-2 text-xs text-[var(--text-secondary)]">Description</th>
                  <th className="text-right py-2 text-xs text-[var(--text-secondary)]">Hours</th>
                  <th className="text-right py-2 text-xs text-[var(--text-secondary)]">Rate</th>
                  <th className="text-right py-2 text-xs text-[var(--text-secondary)]">Amount</th>
                </tr></thead>
                <tbody>
                  {viewingInvoice.items.map((item, i) => (
                    <tr key={i} className="border-b border-[var(--border-color)]">
                      <td className="py-2 text-sm text-[var(--text-primary)]">{item.description}</td>
                      <td className="py-2 text-sm text-[var(--text-secondary)] text-right">{item.hours}</td>
                      <td className="py-2 text-sm text-[var(--text-secondary)] text-right">KES {item.rate.toLocaleString()}</td>
                      <td className="py-2 text-sm font-medium text-[var(--text-primary)] text-right">KES {item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-2 text-right">
                <div className="flex justify-end gap-8"><span className="text-sm text-[var(--text-secondary)]">Subtotal</span><span className="text-sm font-medium text-[var(--text-primary)]">KES {viewingInvoice.items.reduce((s, i) => s + i.amount, 0).toLocaleString()}</span></div>
                <div className="flex justify-end gap-8"><span className="text-sm text-[var(--text-secondary)]">Tax (16%)</span><span className="text-sm font-medium text-[var(--text-primary)]">KES {viewingInvoice.tax.toLocaleString()}</span></div>
                {viewingInvoice.discount > 0 && <div className="flex justify-end gap-8"><span className="text-sm text-[var(--text-secondary)]">Discount</span><span className="text-sm font-medium text-green-400">-KES {viewingInvoice.discount.toLocaleString()}</span></div>}
                <div className="flex justify-end gap-8 pt-2 border-t border-[var(--border-color)]"><span className="text-sm font-semibold text-[var(--text-primary)]">Total</span><span className="text-lg font-bold text-[var(--text-primary)]">KES {viewingInvoice.amount.toLocaleString()}</span></div>
                <div className="flex justify-end gap-8"><span className="text-sm text-[var(--text-secondary)]">Paid</span><span className="text-sm font-medium text-green-400">KES {viewingInvoice.paid.toLocaleString()}</span></div>
                <div className="flex justify-end gap-8"><span className="text-sm font-semibold text-[var(--text-primary)]">Balance</span><span className="text-lg font-bold text-red-400">KES {(viewingInvoice.amount - viewingInvoice.paid).toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Invoice</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Client</label>
                  <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    <option value="">Select</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Matter</label>
                  <select value={form.matterId} onChange={e => setForm({ ...form, matterId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    <option value="">Select</option>
                    {matters.filter(m => !form.clientId || m.clientId === form.clientId).map(m => <option key={m.id} value={m.id}>{m.matterNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Line Items</label>
                  <button onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300">+ Add Item</button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                    <input type="text" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Description"
                      className="col-span-5 px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-xs" />
                    <input type="number" value={item.hours || ''} onChange={e => updateItem(idx, 'hours', Number(e.target.value))} placeholder="Hrs"
                      className="col-span-2 px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-xs" />
                    <input type="number" value={item.rate || ''} onChange={e => updateItem(idx, 'rate', Number(e.target.value))} placeholder="Rate"
                      className="col-span-2 px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-xs" />
                    <span className="col-span-2 flex items-center text-xs font-medium text-[var(--text-primary)]">KES {item.amount.toLocaleString()}</span>
                    <button onClick={() => removeItem(idx)} className="col-span-1 text-red-400 hover:text-red-300 text-xs">X</button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">Create Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingModule;
