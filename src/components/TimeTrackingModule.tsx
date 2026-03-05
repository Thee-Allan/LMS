import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { timeEntries as initialEntries, TimeEntry, matters } from '@/data/mockData';
import { Plus, Search, X, Clock, CheckCircle2, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const statusColors: Record<string, string> = { pending: '#f59e0b', approved: '#10b981', billed: '#8b5cf6' };

const TimeTrackingModule: React.FC = () => {
  const { hasPermission, addAuditLog, user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [form, setForm] = useState({ matterId: '', date: '', hours: 0, description: '', billable: true, rate: user?.billingRate || 10000 });

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.matterNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [entries, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const billableHours = entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const totalValue = entries.filter(e => e.billable).reduce((s, e) => s + (e.hours * e.rate), 0);

  const handleSave = () => {
    if (!form.matterId || !form.hours) return;
    const matter = matters.find(m => m.id === form.matterId);
    const newEntry: TimeEntry = {
      id: `te${Date.now()}`, matterId: form.matterId, matterNumber: matter?.matterNumber || '',
      userId: user?.id || '', userName: user?.name || '', date: form.date || new Date().toISOString().split('T')[0],
      hours: form.hours, description: form.description, billable: form.billable, rate: form.billable ? form.rate : 0, status: 'pending',
    };
    setEntries(prev => [newEntry, ...prev]);
    addAuditLog('CREATE', 'Time', `Logged ${form.hours}h for ${matter?.matterNumber}`);
    setShowForm(false);
  };

  const approveEntry = (e: TimeEntry) => {
    setEntries(prev => prev.map(x => x.id === e.id ? { ...x, status: 'approved' } : x));
    addAuditLog('APPROVE', 'Time', `Approved time entry for ${e.matterNumber}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Time Tracking</h1>
          <p className="text-sm text-[var(--text-secondary)]">{entries.length} entries</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('time.export') && (
            <button onClick={() => {
              const csv = 'Date,Matter,User,Hours,Description,Billable,Rate,Status\n' + filtered.map(e => `"${e.date}","${e.matterNumber}","${e.userName}","${e.hours}","${e.description}","${e.billable}","${e.rate}","${e.status}"`).join('\n');
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'time-entries.csv'; a.click();
            }} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          )}
          {hasPermission('time.create') && (
            <button onClick={() => { setForm({ matterId: '', date: new Date().toISOString().split('T')[0], hours: 0, description: '', billable: true, rate: user?.billingRate || 10000 }); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Log Time
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, color: '#3b82f6' },
          { label: 'Billable Hours', value: `${billableHours.toFixed(1)}h`, color: '#10b981' },
          { label: 'Total Value', value: `KES ${(totalValue / 1000).toFixed(0)}K`, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
              <Clock className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search time entries..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Status</option>
          {['pending', 'approved', 'billed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Matter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden md:table-cell">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden lg:table-cell">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Hours</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden md:table-cell">Value</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(e => (
                <tr key={e.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors">
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{e.date}</td>
                  <td className="px-4 py-3 text-sm text-blue-400">{e.matterNumber}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">{e.userName}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden lg:table-cell truncate max-w-[200px]">{e.description}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] text-right">{e.hours}h</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)] text-right hidden md:table-cell">{e.billable ? `KES ${(e.hours * e.rate).toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full capitalize" style={{ backgroundColor: `${statusColors[e.status]}20`, color: statusColors[e.status] }}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {e.status === 'pending' && hasPermission('time.approve') && (
                      <button onClick={() => approveEntry(e)} className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">Approve</button>
                    )}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Log Time</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Matter</label>
                <select value={form.matterId} onChange={e => setForm({ ...form, matterId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                  <option value="">Select Matter</option>
                  {matters.map(m => <option key={m.id} value={m.id}>{m.matterNumber} - {m.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Hours</label>
                  <input type="number" step="0.5" value={form.hours || ''} onChange={e => setForm({ ...form, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.billable} onChange={e => setForm({ ...form, billable: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-[var(--text-primary)]">Billable</span>
                </label>
                {form.billable && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)]">Rate:</span>
                    <input type="number" value={form.rate} onChange={e => setForm({ ...form, rate: Number(e.target.value) })}
                      className="w-24 px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">Log Time</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingModule;
