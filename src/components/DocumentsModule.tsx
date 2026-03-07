import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { documents as initialDocs, Document } from '@/data/mockData';
import { Search, Download, Eye, Trash2, X, FileText, File, FolderOpen, Upload, Lock, Globe, Users, CheckCircle } from 'lucide-react';
import {
  downloadDocumentReceipt,
  downloadFeeNote,
  downloadPlaint,
  downloadPowerOfAttorney,
  downloadDemandLetter,
  downloadAffidavit,
} from '@/lib/pdfGenerator';

const categoryColors: Record<string, string> = {
  pleading: '#ef4444', correspondence: '#3b82f6', evidence: '#f59e0b',
  contract: '#10b981', template: '#8b5cf6', other: '#6b7280',
};

const accessIcons: Record<string, React.ReactNode> = {
  public:     <Globe className="w-3 h-3 text-green-400" />,
  team:       <Users className="w-3 h-3 text-blue-400" />,
  restricted: <Lock className="w-3 h-3 text-red-400" />,
};

interface StoredDoc extends Document { dataUrl?: string; }

const TEMPLATE_GENERATORS: Record<string, () => Promise<void>> = {
  'Fee Note Template.docx':          () => downloadFeeNote(),
  'Plaint Template.docx':            () => downloadPlaint(),
  'Power of Attorney Template.docx': () => downloadPowerOfAttorney(),
  'Demand Letter Template.docx':     () => downloadDemandLetter(),
  'Affidavit Template.docx':         () => downloadAffidavit(),
};

const emptyForm = {
  name: '', category: 'other' as Document['category'],
  accessLevel: 'team' as Document['accessLevel'],
  tags: '', matterNumber: '',
};

const DocumentsModule: React.FC = () => {
  const { user, hasPermission, addAuditLog } = useAuth();
  const [docs, setDocs]                     = useState<StoredDoc[]>(initialDocs);
  const [search, setSearch]                 = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessFilter, setAccessFilter]     = useState('all');
  const [showUpload, setShowUpload]         = useState(false);
  const [viewingDoc, setViewingDoc]         = useState<StoredDoc | null>(null);
  const [form, setForm]                     = useState(emptyForm);
  const [uploadedFile, setUploadedFile]     = useState<File | null>(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState('');
  const [dragging, setDragging]             = useState(false);
  const [uploading, setUploading]           = useState(false);

  // File input lives OUTSIDE the drop zone div to prevent click conflicts
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => docs.filter(d => {
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchSearch &&
      (categoryFilter === 'all' || d.category === categoryFilter) &&
      (accessFilter   === 'all' || d.accessLevel === accessFilter);
  }), [docs, search, categoryFilter, accessFilter]);

  const templates    = docs.filter(d => d.category === 'template');
  const nonTemplates = filtered.filter(d => d.category !== 'template');

  const processFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10 MB'); return; }
    setUploadedFile(file);
    setForm(prev => ({ ...prev, name: file.name }));  // always use actual filename
    const reader = new FileReader();
    reader.onload = e => setUploadedDataUrl((e.target?.result as string) || '');
    reader.readAsDataURL(file);
  }, []);

  const triggerFilePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!form.name.trim()) return;
    setUploading(true);
    const newDoc: StoredDoc = {
      id:           `d${Date.now()}`,
      name:         form.name.trim(),
      type:         form.name.split('.').pop()?.toLowerCase() || 'pdf',
      size:         uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : '—',
      uploadedBy:   user?.name || 'User',
      uploadedAt:   new Date().toISOString().split('T')[0],
      tags:         form.tags.split(',').map(t => t.trim()).filter(Boolean),
      version:      1,
      accessLevel:  form.accessLevel,
      category:     form.category,
      matterNumber: form.matterNumber.trim() || undefined,
      dataUrl:      uploadedDataUrl || undefined,
    };
    setDocs(prev => [newDoc, ...prev]);
    addAuditLog('CREATE', 'Documents', `Uploaded: ${newDoc.name}`);
    await downloadDocumentReceipt(newDoc.name, newDoc.uploadedBy, newDoc.matterNumber);
    setShowUpload(false);
    setUploadedFile(null);
    setUploadedDataUrl('');
    setForm(emptyForm);
    setUploading(false);
  };

  const closeUpload = () => {
    setShowUpload(false);
    setUploadedFile(null);
    setUploadedDataUrl('');
    setForm(emptyForm);
  };

  const handleDelete = (d: StoredDoc) => {
    if (!confirm(`Delete "${d.name}"?`)) return;
    setDocs(prev => prev.filter(x => x.id !== d.id));
    addAuditLog('DELETE', 'Documents', `Deleted: ${d.name}`);
  };

  const handleDownload = async (d: StoredDoc) => {
    addAuditLog('DOWNLOAD', 'Documents', `Downloaded: ${d.name}`);
    if (d.dataUrl) {
      const a = document.createElement('a');
      a.href = d.dataUrl; a.download = d.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } else if (TEMPLATE_GENERATORS[d.name]) {
      await TEMPLATE_GENERATORS[d.name]();
    } else {
      await downloadDocumentReceipt(d.name, d.uploadedBy, d.matterNumber);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Documents</h1>
          <p className="text-sm text-[var(--text-secondary)]">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {hasPermission('documents.create') && (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        )}
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-purple-400" /> Document Templates
            <span className="text-xs text-purple-400/70 font-normal">— click to generate stamped PDF</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {templates.map(t => (
              <button key={t.id} onClick={() => handleDownload(t)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-bg)] hover:border-purple-400/50 transition-all group">
                <FileText className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-[var(--text-primary)] text-center leading-tight">
                  {t.name.replace(' Template.docx', '')}
                </span>
                <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">↓ PDF</span>
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
            placeholder="Search documents or tags…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Categories</option>
          {['pleading','correspondence','evidence','contract','template','other'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select value={accessFilter} onChange={e => setAccessFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
          <option value="all">All Access</option>
          {['public','team','restricted'].map(a => <option key={a} value={a} className="capitalize">{a}</option>)}
        </select>
      </div>

      {/* Document grid */}
      {nonTemplates.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          <File className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No documents match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nonTemplates.map(d => (
            <div key={d.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 hover:shadow-md transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${categoryColors[d.category]}18` }}>
                  <File className="w-5 h-5" style={{ color: categoryColors[d.category] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{d.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--text-secondary)]">{d.size}</span>
                    <span className="text-xs text-[var(--text-secondary)]">v{d.version}</span>
                    {accessIcons[d.accessLevel]}
                    {d.dataUrl && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">stored</span>}
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
                  <button onClick={() => setViewingDoc(d)} title="View"
                    className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-blue-400"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDownload(d)} title="Download"
                    className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-green-400"><Download className="w-3.5 h-3.5" /></button>
                  {hasPermission('documents.delete') && (
                    <button onClick={() => handleDelete(d)} title="Delete"
                      className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
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
              {([['Name', viewingDoc.name], ['Type', viewingDoc.type.toUpperCase()], ['Size', viewingDoc.size],
                ['Category', viewingDoc.category], ['Version', `v${viewingDoc.version}`], ['Access', viewingDoc.accessLevel],
                ['Matter', viewingDoc.matterNumber || 'N/A'], ['Client', viewingDoc.clientName || 'N/A'],
                ['Uploaded By', viewingDoc.uploadedBy], ['Date', viewingDoc.uploadedAt],
                ['Tags', viewingDoc.tags.join(', ') || 'None']] as [string,string][]).map(([l, v]) => (
                <div key={l} className="flex justify-between gap-4">
                  <span className="text-sm text-[var(--text-secondary)] flex-shrink-0">{l}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] capitalize text-right truncate max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeUpload}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Upload Document</h3>
              <button onClick={closeUpload} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">

              {/* Drop zone — NO nested input */}
              <div
                onDragOver={e  => { e.preventDefault(); setDragging(true);  }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
                  ${dragging ? 'border-blue-400 bg-blue-500/10'
                  : uploadedFile ? 'border-green-400 bg-green-500/10'
                  : 'border-[var(--border-color)]'}`}
              >
                {uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                    <p className="text-sm font-medium text-green-400 break-all px-2">{uploadedFile.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button onClick={triggerFilePicker} className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline">
                      Replace file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-10 h-10 text-[var(--text-secondary)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Drag & drop files here</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">PDF, DOCX, XLSX, JPG, PNG (Max 10 MB)</p>
                    </div>
                    <button onClick={triggerFilePicker}
                      className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-sm font-medium transition-colors">
                      Browse files
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden file input — OUTSIDE drop zone */}
              <input ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />

              {/* Form fields */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Document Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Contract_Draft_v1.pdf"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Document['category'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    {['pleading','correspondence','evidence','contract','template','other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Access Level</label>
                  <select value={form.accessLevel} onChange={e => setForm(f => ({ ...f, accessLevel: e.target.value as Document['accessLevel'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    {['public','team','restricted'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Matter Number <span className="text-[var(--text-secondary)] font-normal">(optional)</span></label>
                <input type="text" value={form.matterNumber} onChange={e => setForm(f => ({ ...f, matterNumber: e.target.value }))}
                  placeholder="e.g., NLF/2024/0001"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tags <span className="text-[var(--text-secondary)] font-normal">(comma-separated)</span></label>
                <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g., pleading, court-filing"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
              </div>

              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                A stamped document receipt PDF will auto-download on upload.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={closeUpload}
                  className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm hover:bg-[var(--hover-bg)]">
                  Cancel
                </button>
                <button onClick={handleUpload} disabled={!form.name.trim() || uploading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                  {uploading ? 'Uploading…' : 'Upload & Get Receipt'}
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
