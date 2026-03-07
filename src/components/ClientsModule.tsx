import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { clients as initialClients, Client } from '@/data/mockData';
import { Plus, Search, Filter, Edit2, Trash2, Eye, X, Building2, User, Download, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { downloadClientPDF } from '@/lib/pdfGenerator';
import AdminActions from './AdminActions';

const ClientsModule: React.FC = () => {
  const { user, hasPermission, addAuditLog } = useAuth();
  const isClient = user?.role === 'client';
  const [clientsList, setClientsList] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [form, setForm] = useState({ name: '', type: 'individual' as 'individual' | 'corporate', email: '', phone: '', kraPin: '', address: '', idNumber: '', contactPerson: '', notes: '' });

  const filtered = useMemo(() => {
    return clientsList.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.kraPin.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [clientsList, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setForm({ name: '', type: 'individual', email: '', phone: '', kraPin: '', address: '', idNumber: '', contactPerson: '', notes: '' });
    setEditingClient(null);
    setShowForm(true);
  };

  const openEdit = (c: Client) => {
    setForm({ name: c.name, type: c.type, email: c.email, phone: c.phone, kraPin: c.kraPin, address: c.address, idNumber: c.idNumber, contactPerson: c.contactPerson || '', notes: c.notes });
    setEditingClient(c);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editingClient) {
      setClientsList(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...form } : c));
      addAuditLog('UPDATE', 'Clients', `Updated client: ${form.name}`);
    } else {
      const newClient: Client = { ...form, id: `c${Date.now()}`, status: 'active', createdAt: new Date().toISOString().split('T')[0], mattersCount: 0 };
      setClientsList(prev => [newClient, ...prev]);
      addAuditLog('CREATE', 'Clients', `Created client: ${form.name}`);
    }
    setShowForm(false);
  };

  const handleDelete = (c: Client) => {
    if (confirm(`Delete client "${c.name}"?`)) {
      setClientsList(prev => prev.filter(x => x.id !== c.id));
      addAuditLog('DELETE', 'Clients', `Deleted client: ${c.name}`);
    }
  };

  const exportCSV = () => {
    const headers = 'Name,Type,Email,Phone,KRA PIN,Address,Status\n';
    const rows = filtered.map(c => `"${c.name}","${c.type}","${c.email}","${c.phone}","${c.kraPin}","${c.address}","${c.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'clients.csv'; a.click();
    addAuditLog('EXPORT', 'Clients', 'Exported clients to CSV');
  };

  const handleDownloadClientPDF = async (c: Client) => {
    addAuditLog('DOWNLOAD', 'Clients', `Downloaded profile PDF: ${c.name}`);
    await downloadClientPDF(c);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Clients</h1>
          <p className="text-sm text-[var(--text-secondary)]">{filtered.length} clients found</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('clients.export') && (
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          )}
          {hasPermission('clients.create') && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Client
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search clients..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="all">All Types</option>
          <option value="individual">Individual</option>
          <option value="corporate">Corporate</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase hidden lg:table-cell">KRA PIN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Matters</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => (
                <tr key={c.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.type === 'corporate' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {c.type === 'corporate' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                        <p className="text-xs text-[var(--text-secondary)] capitalize">{c.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-[var(--text-primary)]">{c.email}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{c.phone}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-[var(--text-secondary)]">{c.kraPin}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{c.mattersCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      {isClient ? (
                        <button onClick={() => setViewingClient(c)} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-blue-400" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <AdminActions
                          label="Client"
                          onView={() => setViewingClient(c)}
                          onEdit={hasPermission('clients.edit') ? () => openEdit(c) : undefined}
                          onDelete={hasPermission('clients.delete') ? () => handleDelete(c) : undefined}
                          onExport={hasPermission('clients.export') ? () => {
                            const row = `"${c.name}","${c.email}","${c.phone}","${c.type}","${c.status}"`;
                            const blob = new Blob([`Name,Email,Phone,Type,Status\n${row}`], { type: 'text/csv' });
                            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${c.name.replace(/\s+/g,'-')}.csv`; a.click();
                          } : undefined}
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] disabled:opacity-30 text-[var(--text-secondary)]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] disabled:opacity-30 text-[var(--text-secondary)]">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewingClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingClient(null)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Client Details</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadClientPDF(viewingClient)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium">
                  <FileText className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button onClick={() => setViewingClient(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                ['Name', viewingClient.name], ['Type', viewingClient.type], ['Email', viewingClient.email],
                ['Phone', viewingClient.phone], ['KRA PIN', viewingClient.kraPin], ['ID Number', viewingClient.idNumber],
                ['Address', viewingClient.address], ['Contact Person', viewingClient.contactPerson || 'N/A'],
                ['Matters', viewingClient.mattersCount.toString()], ['Notes', viewingClient.notes],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] text-right max-w-[60%]">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{editingClient ? 'Edit Client' : 'New Client'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Client Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                  <option value="individual">Individual</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              {[
                { key: 'name', label: 'Full Name / Company Name', required: true },
                { key: 'email', label: 'Email Address', required: true },
                { key: 'phone', label: 'Phone Number' },
                { key: 'kraPin', label: 'KRA PIN' },
                { key: 'idNumber', label: 'ID / Registration Number' },
                { key: 'address', label: 'Address' },
                ...(form.type === 'corporate' ? [{ key: 'contactPerson', label: 'Contact Person' }] : []),
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{f.label} {f.required && <span className="text-red-400">*</span>}</label>
                  <input type="text" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] text-sm">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
                  {editingClient ? 'Update Client' : 'Create Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsModule;
