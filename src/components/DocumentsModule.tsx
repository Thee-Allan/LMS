import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { documents as initialDocs, Document } from '@/data/mockData';
import { Plus, Search, Download, Eye, Trash2, X, FileText, File, FolderOpen, Upload, Tag, Lock, Globe, Users, CheckCircle } from 'lucide-react';
import { downloadDocumentReceipt } from '@/lib/pdfGenerator';

const categoryColors: Record<string, string> = {
  pleading: '#ef4444', correspondence: '#3b82f6', evidence: '#f59e0b', contract: '#10b981', template: '#8b5cf6', other: '#6b7280',
};

const accessIcons: Record<string, React.ReactNode> = {
  public: <Globe className="w-3 h-3 text-green-400" />,
  team: <Users className="w-3 h-3 text-blue-400" />,
  restricted: <Lock className="w-3 h-3 text-red-400" />,
};

interface StoredDoc extends Document { dataUrl?: string; }

const DocumentsModule: React.FC = () => {
  const { user, hasPermission, addAuditLog } = useAuth();
  const [docs, setDocs] = useState<StoredDoc[]>(initialDocs);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<StoredDoc | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'other' as Document['category'], accessLevel: 'team' as Document['accessLevel'], tags: '', matterId: '', matterNumber: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return docs.filter(d => {
      const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchCat = categoryFilter === 'all' || d.category === categoryFilter;
      const matchAccess = accessFilter === 'all' || d.accessLevel === accessFilter;
      return matchSearch && matchCat && matchAccess;
    });
  }, [docs, search, categoryFilter, accessFilter]);

  const processFile = (file: File) => {
    setUploadedFile(file);
    setForm(f => ({ ...f, name: f.name || file.name }));
    const reader = new FileReader();
    reader.onload = e => setUploadedDataUrl(e.target?.result as string || '');
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!form.name) return;
    const newDoc: StoredDoc = {
      id: `d${Date.now()}`, name: form.name,
      type: form.name.split('.').pop()?.toLowerCase() || 'pdf',
      size: uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : '—',
      uploadedBy: user?.name || 'User', uploadedAt: new Date().toISOString().split('T')[0],
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), version: 1,
      accessLevel: form.accessLevel, category: form.category,
      matterId: form.matterId || undefined, matterNumber: form.matterNumber || undefined,
      dataUrl: uploadedDataUrl,
    };
    setDocs(prev => [newDoc, ...prev]);
    addAuditLog('CREATE', 'Documents', `Uploaded document: ${form.name}`);
    await downloadDocumentReceipt(form.name, user?.name || 'User', form.matterNumber || undefined);
    setShowUpload(false);
    setUploadedFile(null); setUploadedDataUrl('');
    setForm({ name: '', category: 'other', accessLevel: 'team', tags: '', matterId: '', matterNumber: '' });
  };

  const handleDelete = (d: StoredDoc) => {
    if (confirm(`Delete "${d.name}"?`)) {
      setDocs(prev => prev.filter(x => x.id !== d.id));
      addAuditLog('DELETE', 'Documents', `Deleted document: ${d.name}`);
    }
  };

  const handleDownload = async (d: StoredDoc) => {
    addAuditLog('DOWNLOAD', 'Documents', `Downloaded: ${d.name}`);
    if (d.dataUrl) {
      const a = document.createElement('a');
      a.href = d.dataUrl; a.download = d.name; a.click();
    } else {
      // For demo docs without actual data, download a receipt PDF
      await downloadDocumentReceipt(d.name, d.uploadedBy, d.matterNumber);
    }
  };

  const templates = docs.filter(d => d.category === 'template');
  const nonTemplates = filtered.filter(d => d.category !== 'template');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Documents</h1>
          <p className="text-sm text-[var(--text-secondary)]">{filtered.length} documents</p>
        </div>
        {hasPermission('documents.create') && (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        )}
      </div>

      {/* Templates Quick Access */}
      {templates.length > 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-purple-400" /> Document Templates
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {templates.map(t => (
              <button key={t.id} onClick={() => handleDownload(t)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-bg)] hover:border-purple-400/30 transition-all">
                <FileText className="w-8 h-8 text-purple-400" />
                <span className="text-xs text-[var(--text-primary)] text-center leading-tight">{t.name.replace(' Template.docx', '')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents or tags..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Categories</option>
          {['pleading', 'correspondence', 'evidence', 'contract', 'template', 'other'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select value={accessFilter} onChange={e => setAccessFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Access</option>
          {['public', 'team', 'restricted'].map(a => <option key={a} value={a} className="capitalize">{a}</option>)}
        </select>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nonTemplates.map(d => (
          <div key={d.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 hover:shadow-md transition-all group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${categoryColors[d.category]}15` }}>
                <File className="w-5 h-5" style={{ color: categoryColors[d.category] }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{d.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--text-secondary)]">{d.size}</span>
                  <span className="text-xs text-[var(--text-secondary)]">v{d.version}</span>
                  {accessIcons[d.accessLevel]}
                  {(d as StoredDoc).dataUrl && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">stored</span>}
                </div>
                {d.matterNumber && <p className="text-xs text-blue-400 mt-1">{d.matterNumber}</p>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {d.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--hover-bg)] text-[var(--text-secondary)]">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-secondary)]">{d.uploadedBy} · {d.uploadedAt}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setViewingDoc(d)} className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-blue-400"><Eye className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDownload(d)} className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-green-400"><Download className="w-3.5 h-3.5" /></button>
                {hasPermission('documents.delete') && <button onClick={() => handleDelete(d)} className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingDoc(null)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Document Details</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(viewingDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => setViewingDoc(null)} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {[['Name', viewingDoc.name], ['Type', viewingDoc.type.toUpperCase()], ['Size', viewingDoc.size], ['Category', viewingDoc.category], ['Version', `v${viewingDoc.version}`], ['Access', viewingDoc.accessLevel], ['Matter', viewingDoc.matterNumber || 'N/A'], ['Client', viewingDoc.clientName || 'N/A'], ['Uploaded By', viewingDoc.uploadedBy], ['Date', viewingDoc.uploadedAt], ['Tags', viewingDoc.tags.join(', ') || 'None']].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{l}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] capitalize max-w-[60%] text-right truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Upload Document</h3>
              <button onClick={() => setShowUpload(false)} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-400 bg-blue-500/10' : uploadedFile ? 'border-green-400 bg-green-500/10' : 'border-[var(--border-color)] hover:border-blue-400/50'}`}>
                {uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                    <p className="text-sm font-medium text-green-400">{uploadedFile.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[var(--text-primary)]">Click to browse or drag & drop</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">PDF, DOCX, XLSX, JPG, PNG (Max 10MB)</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Document Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Contract_Draft_v1.pdf"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    {['pleading', 'correspondence', 'evidence', 'contract', 'template', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Access Level</label>
                  <select value={form.accessLevel} onChange={e => setForm({ ...form, accessLevel: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    {['public', 'team', 'restricted'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Matter Number (optional)</label>
                <input type="text" value={form.matterNumber} onChange={e => setForm({ ...form, matterNumber: e.target.value })} placeholder="e.g., NLF/2024/0001"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g., pleading, court-filing"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <p className="text-xs text-amber-400">A stamped document receipt PDF will be automatically downloaded on upload.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm">Cancel</button>
                <button onClick={handleUpload} disabled={!form.name}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  Upload & Get Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsModule;
