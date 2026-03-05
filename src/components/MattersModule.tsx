import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { matters as initialMatters, Matter, practiceAreas, courts, clients } from '@/data/mockData';
import { Plus, Search, Edit2, Trash2, Eye, X, Download, ChevronLeft, ChevronRight, Briefcase, AlertCircle } from 'lucide-react';
import AdminActions from './AdminActions';

const statusColors: Record<string, string> = {
  consultation: '#6b7280', active: '#3b82f6', court: '#ef4444', settled: '#10b981', closed: '#8b5cf6', archived: '#9ca3af',
};

const MattersModule: React.FC = () => {
  const { user, hasPermission, addAuditLog, allUsers } = useAuth();
  const isClient = user?.role === 'client';
  const [mattersList, setMattersList] = useState<Matter[]>(initialMatters);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMatter, setEditingMatter] = useState<Matter | null>(null);
  const [viewingMatter, setViewingMatter] = useState<Matter | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const advocates = allUsers.filter(u => ['advocate', 'managing_partner', 'super_admin'].includes(u.role));

  const [form, setForm] = useState({
    title: '', clientId: '', practiceArea: '', status: 'consultation' as Matter['status'],
    assignedAdvocateId: '', court: '', registry: '', filingDate: '', nextHearing: '',
    description: '', opposingParty: '', opposingCounsel: '', value: 0,
  });

  const filtered = useMemo(() => {
    return mattersList.filter(m => {
      const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.matterNumber.toLowerCase().includes(search.toLowerCase()) || m.clientName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchArea = areaFilter === 'all' || m.practiceArea === areaFilter;
      return matchSearch && matchStatus && matchArea;
    });
  }, [mattersList, search, statusFilter, areaFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const generateMatterNumber = () => {
    const year = new Date().getFullYear();
    const num = mattersList.length + 1;
    return `NLF/${year}/${num.toString().padStart(4, '0')}`;
  };

  const openCreate = () => {
    setForm({ title: '', clientId: '', practiceArea: '', status: 'consultation', assignedAdvocateId: '', court: '', registry: '', filingDate: '', nextHearing: '', description: '', opposingParty: '', opposingCounsel: '', value: 0 });
    setEditingMatter(null);
    setShowForm(true);
  };

  const openEdit = (m: Matter) => {
    setForm({ title: m.title, clientId: m.clientId, practiceArea: m.practiceArea, status: m.status, assignedAdvocateId: m.assignedAdvocateId, court: m.court, registry: m.registry, filingDate: m.filingDate, nextHearing: m.nextHearing, description: m.description, opposingParty: m.opposingParty, opposingCounsel: m.opposingCounsel, value: m.value });
    setEditingMatter(m);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title || !form.clientId) return;
    const client = clients.find(c => c.id === form.clientId);
    const advocate = advocates.find(a => a.id === form.assignedAdvocateId);
    if (editingMatter) {
      setMattersList(prev => prev.map(m => m.id === editingMatter.id ? {
        ...m, ...form, clientName: client?.name || m.clientName,
        assignedAdvocate: advocate?.name || m.assignedAdvocate,
      } : m));
      addAuditLog('UPDATE', 'Matters', `Updated matter: ${editingMatter.matterNumber}`);
    } else {
      const newMatter: Matter = {
        ...form, id: `m${Date.now()}`, matterNumber: generateMatterNumber(),
        clientName: client?.name || '', assignedAdvocate: advocate?.name || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setMattersList(prev => [newMatter, ...prev]);
      addAuditLog('CREATE', 'Matters', `Created matter: ${newMatter.matterNumber}`);
    }
    setShowForm(false);
  };

  const handleDelete = (m: Matter) => {
    if (confirm(`Delete matter "${m.matterNumber}"?`)) {
      setMattersList(prev => prev.filter(x => x.id !== m.id));
      addAuditLog('DELETE', 'Matters', `Deleted matter: ${m.matterNumber}`);
    }
  };

  const exportCSV = () => {
    const headers = 'Matter Number,Title,Client,Practice Area,Status,Advocate,Court,Value\n';
    const rows = filtered.map(m => `"${m.matterNumber}","${m.title}","${m.clientName}","${m.practiceArea}","${m.status}","${m.assignedAdvocate}","${m.court}","${m.value}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'matters.csv'; a.click();
    addAuditLog('EXPORT', 'Matters', 'Exported matters to CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Matters / Cases</h1>
          <p className="text-sm text-[var(--text-secondary)]">{filtered.length} matters found</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('matters.export') && (
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          )}
          {hasPermission('matters.create') && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New Matter
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search matters..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Status</option>
          {['consultation', 'active', 'court', 'settled', 'closed', 'archived'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select value={areaFilter} onChange={e => { setAreaFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Practice Areas</option>
          {practiceAreas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Matter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden md:table-cell">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden lg:table-cell">Area</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden lg:table-cell">Advocate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden xl:table-cell">Next Hearing</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(m => (
                <tr key={m.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[m.status] }} />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{m.matterNumber}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">{m.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-[var(--text-primary)]">{m.clientName}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">{m.practiceArea}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full capitalize" style={{ backgroundColor: `${statusColors[m.status]}20`, color: statusColors[m.status] }}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-[var(--text-secondary)]">{m.assignedAdvocate}</td>
                  <td className="px-4 py-3 hidden xl:table-cell text-sm text-[var(--text-secondary)]">
                    {m.nextHearing ? new Date(m.nextHearing).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      {isClient ? (
                        // Clients: plain view button only
                        <button onClick={() => setViewingMatter(m)} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-blue-400" title="View Matter">
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        // Admins / Advocates / Partners: rich action menu
                        <AdminActions
                          label="Matter"
                          onView={() => setViewingMatter(m)}
                          onEdit={hasPermission('matters.edit') ? () => openEdit(m) : undefined}
                          onDelete={hasPermission('matters.delete') ? () => handleDelete(m) : undefined}
                          onExport={hasPermission('matters.export') ? () => {
                            const row = `"${m.matterNumber}","${m.title}","${m.clientName}","${m.practiceArea}","${m.status}","${m.assignedAdvocate}","${m.court}","${m.value}"`;
                            const blob = new Blob([`Matter Number,Title,Client,Practice Area,Status,Advocate,Court,Value\n${row}`], { type: 'text/csv' });
                            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${m.matterNumber}.csv`; a.click();
                          } : undefined}
                          onChangeStatus={hasPermission('matters.edit') ? () => {
                            const next: Record<string, string> = { consultation: 'active', active: 'court', court: 'settled', settled: 'closed', closed: 'archived', archived: 'closed' };
                            if (confirm(`Change status from "${m.status}" → "${next[m.status]}"?`)) {
                              setMattersList(prev => prev.map(x => x.id === m.id ? { ...x, status: next[m.status] as Matter['status'] } : x));
                            }
                          } : undefined}
                          onPrint={() => window.print()}
                        />
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

      {/* View Modal */}
      {viewingMatter && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingMatter(null)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{viewingMatter.matterNumber}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{viewingMatter.title}</p>
              </div>
              <button onClick={() => setViewingMatter(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Client', viewingMatter.clientName], ['Practice Area', viewingMatter.practiceArea],
                ['Status', viewingMatter.status], ['Assigned Advocate', viewingMatter.assignedAdvocate],
                ['Court', viewingMatter.court || 'N/A'], ['Registry', viewingMatter.registry || 'N/A'],
                ['Filing Date', viewingMatter.filingDate || 'N/A'], ['Next Hearing', viewingMatter.nextHearing || 'N/A'],
                ['Opposing Party', viewingMatter.opposingParty || 'N/A'], ['Opposing Counsel', viewingMatter.opposingCounsel || 'N/A'],
                ['Value (KES)', viewingMatter.value.toLocaleString()], ['Created', viewingMatter.createdAt],
              ].map(([label, val]) => (
                <div key={label}>
                  <span className="text-xs text-[var(--text-secondary)] uppercase">{label}</span>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-1 capitalize">{val}</p>
                </div>
              ))}
              <div className="col-span-2">
                <span className="text-xs text-[var(--text-secondary)] uppercase">Description</span>
                <p className="text-sm text-[var(--text-primary)] mt-1">{viewingMatter.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{editingMatter ? 'Edit Matter' : 'New Matter'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title <span className="text-red-400">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Client <span className="text-red-400">*</span></label>
                  <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Practice Area</label>
                  <select value={form.practiceArea} onChange={e => setForm({ ...form, practiceArea: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    <option value="">Select Area</option>
                    {practiceAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    {['consultation', 'active', 'court', 'settled', 'closed', 'archived'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Assigned Advocate</label>
                  <select value={form.assignedAdvocateId} onChange={e => setForm({ ...form, assignedAdvocateId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    <option value="">Select Advocate</option>
                    {advocates.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Court</label>
                  <select value={form.court} onChange={e => setForm({ ...form, court: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    <option value="">Select Court</option>
                    {courts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Value (KES)</label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Filing Date</label>
                  <input type="date" value={form.filingDate} onChange={e => setForm({ ...form, filingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Next Hearing</label>
                  <input type="date" value={form.nextHearing} onChange={e => setForm({ ...form, nextHearing: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Opposing Party</label>
                  <input type="text" value={form.opposingParty} onChange={e => setForm({ ...form, opposingParty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Opposing Counsel</label>
                  <input type="text" value={form.opposingCounsel} onChange={e => setForm({ ...form, opposingCounsel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] text-sm">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
                  {editingMatter ? 'Update Matter' : 'Create Matter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MattersModule;
