import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { matters, clients, Matter } from '@/data/mockData';
import {
  FileText, CheckCircle, Circle, AlertCircle, Upload, Download,
  ChevronRight, Clock, Package, ExternalLink, Search, Filter,
  ClipboardList, BookOpen, Zap, CheckSquare, Eye, X, Printer,
  ArrowRight, RefreshCw
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilingDocument {
  id: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  fileName?: string;
}

interface FilingRecord {
  matterId: string;
  courtCaseNumber: string;
  courtStation: string;
  filingDate: string;
  paymentReceipt: string;
  status: FilingStatus;
  documents: FilingDocument[];
  procedureStep: number;
  notes: string;
}

type FilingStatus =
  | 'draft'
  | 'preparing'
  | 'ready'
  | 'filed'
  | 'accepted'
  | 'returned'
  | 'mention_scheduled'
  | 'hearing_scheduled'
  | 'judgment_delivered';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROCEDURE_STEPS: Record<string, string[]> = {
  Civil: [
    'Draft Plaint',
    'Prepare Supporting Affidavit',
    'Upload List of Witnesses',
    'Upload List of Documents',
    'Prepare Verifying Affidavit',
    'File through eFiling portal',
    'Await court acceptance',
    'Schedule mention date',
    'Serve defendant',
    'File affidavit of service',
  ],
  Criminal: [
    'Obtain copy of charge sheet',
    'Prepare Defence Statement',
    'Upload List of Defence Witnesses',
    'Prepare bail application (if required)',
    'File through eFiling portal',
    'Await court acceptance',
    'Attend plea taking',
    'File defence documents',
    'Attend hearing',
    'Await judgment',
  ],
  Land: [
    'Obtain title documents',
    'Draft Originating Summons / Plaint',
    'Prepare Supporting Affidavit',
    'Attach title search results',
    'Upload surveyor report (if any)',
    'File through eFiling portal',
    'Await court acceptance',
    'Schedule mention date',
    'Serve respondent',
    'File affidavit of service',
  ],
  Employment: [
    'Draft Memorandum of Claim',
    'Attach employment documents',
    'Prepare witness statements',
    'File through eFiling portal',
    'Await court acceptance',
    'Attend pre-trial conference',
    'File agreed issues',
    'Attend hearing',
    'File written submissions',
    'Await judgment',
  ],
  Commercial: [
    'Draft Plaint / Petition',
    'Prepare Supporting Affidavit',
    'Attach contract documents',
    'Upload financial statements',
    'List of Documents',
    'File through eFiling portal',
    'Await court acceptance',
    'Schedule mention',
    'Serve defendant',
    'File affidavit of service',
  ],
  Family: [
    'Draft Petition',
    'Attach marriage certificate',
    'Prepare supporting affidavit',
    'List matrimonial assets',
    'Custody / maintenance proposal',
    'File through eFiling portal',
    'Await court acceptance',
    'Attend case conference',
    'Attend hearing',
    'Collect decree',
  ],
};

const DEFAULT_STEPS = PROCEDURE_STEPS['Civil'];

const FILING_DOCS: Record<string, FilingDocument[]> = {
  Civil: [
    { id: 'plaint', name: 'Plaint', required: true, uploaded: false },
    { id: 'aff_support', name: 'Supporting Affidavit', required: true, uploaded: false },
    { id: 'list_witness', name: 'List of Witnesses', required: true, uploaded: false },
    { id: 'list_docs', name: 'List of Documents', required: true, uploaded: false },
    { id: 'verifying_aff', name: 'Verifying Affidavit', required: true, uploaded: false },
    { id: 'cert_urgency', name: 'Certificate of Urgency', required: false, uploaded: false },
  ],
  Criminal: [
    { id: 'charge_sheet', name: 'Charge Sheet Copy', required: true, uploaded: false },
    { id: 'defence_stmt', name: 'Defence Statement', required: true, uploaded: false },
    { id: 'bail_app', name: 'Bail Application', required: false, uploaded: false },
    { id: 'witness_list', name: 'List of Defence Witnesses', required: true, uploaded: false },
  ],
  Land: [
    { id: 'plaint', name: 'Plaint / Originating Summons', required: true, uploaded: false },
    { id: 'title_docs', name: 'Title Documents', required: true, uploaded: false },
    { id: 'aff_support', name: 'Supporting Affidavit', required: true, uploaded: false },
    { id: 'title_search', name: 'Title Search Results', required: true, uploaded: false },
    { id: 'survey', name: 'Surveyor Report', required: false, uploaded: false },
  ],
  default: [
    { id: 'main_doc', name: 'Main Pleading', required: true, uploaded: false },
    { id: 'aff_support', name: 'Supporting Affidavit', required: true, uploaded: false },
    { id: 'list_docs', name: 'List of Documents', required: true, uploaded: false },
    { id: 'list_witness', name: 'List of Witnesses', required: true, uploaded: false },
  ],
};

const STATUS_CONFIG: Record<FilingStatus, { label: string; color: string; bg: string }> = {
  draft:              { label: 'Draft',              color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  preparing:          { label: 'Preparing',          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  ready:              { label: 'Ready to File',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  filed:              { label: 'Filed',              color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  accepted:           { label: 'Accepted',           color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  returned:           { label: 'Returned',           color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  mention_scheduled:  { label: 'Mention Scheduled',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  hearing_scheduled:  { label: 'Hearing Scheduled',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  judgment_delivered: { label: 'Judgment Delivered', color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

const DOC_TEMPLATES = [
  'Plaint',
  'Supporting Affidavit',
  'Verifying Affidavit',
  'Demand Letter',
  'Witness Statement',
  'Certificate of Urgency',
  'Court Motion / Application',
  'Memorandum of Appearance',
];

// ─── Helper ───────────────────────────────────────────────────────────────────

const getDocsForArea = (area: string): FilingDocument[] => {
  const base = FILING_DOCS[area] || FILING_DOCS['default'];
  return base.map(d => ({ ...d })); // fresh copy
};

const getStepsForArea = (area: string): string[] =>
  PROCEDURE_STEPS[area] || DEFAULT_STEPS;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: FilingStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
      borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; max: number; color?: string }> = ({
  value, max, color = '#3b82f6',
}) => (
  <div style={{ background: 'var(--border-color)', borderRadius: 99, height: 6, width: '100%', overflow: 'hidden' }}>
    <div style={{
      width: `${Math.min((value / max) * 100, 100)}%`,
      background: color, height: '100%', borderRadius: 99,
      transition: 'width 0.5s ease',
    }} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const EFilingAssistant: React.FC = () => {
  const { user, addAuditLog } = useAuth();
  const isClient = user?.role === 'client';

  // All filing records keyed by matterId
  const [filingRecords, setFilingRecords] = useState<Record<string, FilingRecord>>({});
  const [selectedMatterId, setSelectedMatterId] = useState<string>(matters[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'checklist' | 'procedure' | 'tracker' | 'generator'>('checklist');
  const [search, setSearch] = useState('');
  const [packageReady, setPackageReady] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [showDocPreview, setShowDocPreview] = useState(false);

  // Filter matters relevant to the user
  const visibleMatters = useMemo(() => {
    const base = isClient
      ? matters.slice(0, 3)
      : matters.filter(m => ['active', 'court', 'consultation'].includes(m.status));
    if (!search) return base;
    return base.filter(m =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.matterNumber.toLowerCase().includes(search.toLowerCase())
    );
  }, [isClient, search]);

  const selectedMatter = matters.find(m => m.id === selectedMatterId) || matters[0];

  // Get or initialise filing record for selected matter
  const getRecord = (matterId: string): FilingRecord => {
    if (filingRecords[matterId]) return filingRecords[matterId];
    return {
      matterId,
      courtCaseNumber: '',
      courtStation: matters.find(m => m.id === matterId)?.court || '',
      filingDate: '',
      paymentReceipt: '',
      status: 'draft',
      documents: getDocsForArea(matters.find(m => m.id === matterId)?.practiceArea || 'Civil'),
      procedureStep: 0,
      notes: '',
    };
  };

  const record = getRecord(selectedMatterId);
  const steps = getStepsForArea(selectedMatter?.practiceArea || 'Civil');
  const requiredDocs = record.documents.filter(d => d.required);
  const uploadedRequired = requiredDocs.filter(d => d.uploaded);
  const allRequiredUploaded = uploadedRequired.length === requiredDocs.length;
  const totalDocs = record.documents.length;
  const uploadedDocs = record.documents.filter(d => d.uploaded).length;

  const updateRecord = (updates: Partial<FilingRecord>) => {
    setFilingRecords(prev => ({
      ...prev,
      [selectedMatterId]: { ...getRecord(selectedMatterId), ...updates },
    }));
    setPackageReady(false);
  };

  const toggleDocument = (docId: string) => {
    const updated = record.documents.map(d =>
      d.id === docId ? { ...d, uploaded: !d.uploaded } : d
    );
    const allReq = updated.filter(d => d.required).every(d => d.uploaded);
    updateRecord({
      documents: updated,
      status: allReq ? 'ready' : record.status === 'draft' ? 'preparing' : record.status,
    });
  };

  const advanceStep = () => {
    if (record.procedureStep < steps.length - 1) {
      updateRecord({ procedureStep: record.procedureStep + 1 });
      addAuditLog('UPDATE', 'eFiling', `Advanced procedure step for ${selectedMatter?.matterNumber}`);
    }
  };

  const handleGenerateDoc = (template: string) => {
    setSelectedTemplate(template);
    setGeneratingDoc(true);
    setTimeout(() => {
      const m = selectedMatter;
      const client = clients.find(c => c.id === m?.clientId);
      setGeneratedDoc(
        `REPUBLIC OF KENYA\nIN THE ${(m?.court || 'HIGH COURT OF KENYA').toUpperCase()}\n\n${m?.matterNumber || ''}\n\nBETWEEN\n\n${(m?.clientName || '').toUpperCase()}..........................PLAINTIFF/PETITIONER\n\nAND\n\n${(m?.opposingParty || 'RESPONDENT').toUpperCase()}..........................DEFENDANT/RESPONDENT\n\n\n${template.toUpperCase()}\n\nI, ${client?.contactPerson || client?.name || '[FULL NAME]'}, of ID No. ${client?.idNumber || 'XXXXXXXX'}, of Post Office Box No. _______, ${client?.address || 'Nairobi'}, hereby make oath and state as follows:\n\n1. THAT I am the Plaintiff/Petitioner in the above-mentioned matter and am duly authorised to make this ${template} on behalf of the Plaintiff.\n\n2. THAT the facts stated herein are true and correct to the best of my knowledge, information, and belief.\n\n3. THAT this matter concerns: ${m?.description || '[Brief description of matter]'}.\n\n4. THAT the Opposing Party is ${m?.opposingParty || '[Opposing party]'} who is represented by ${m?.opposingCounsel || '[Opposing counsel]'}.\n\n5. THAT I make this ${template} in good faith and for the purposes of justice.\n\nSWORN at NAIROBI\nThis ______ day of ____________, 2026\n\n\n_______________________________\nDEPONENT\n\nBefore me:\n\n_______________________________\nCOMMISSIONER FOR OATHS/NOTARY PUBLIC`
      );
      setGeneratingDoc(false);
      setShowDocPreview(true);
    }, 800);
  };

  const handlePreparePackage = () => {
    updateRecord({ status: 'filed', filingDate: new Date().toISOString().split('T')[0] });
    setPackageReady(true);
    addAuditLog('CREATE', 'eFiling', `Filing package prepared for ${selectedMatter?.matterNumber}`);
  };

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'checklist',  label: 'Filing Checklist', icon: CheckSquare },
    { id: 'procedure',  label: 'Procedure Guide',  icon: BookOpen    },
    { id: 'tracker',    label: 'eFiling Tracker',  icon: ClipboardList },
    { id: 'generator',  label: 'Doc Generator',   icon: FileText    },
  ] as const;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">eFiling Assistant</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            Digital secretary — prepare, track and manage court filings for Kenya Judiciary eFiling portal
          </p>
        </div>
        <a
          href="https://efiling.court.go.ke"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
        >
          <ExternalLink className="w-4 h-4" />
          Open Judiciary eFiling Portal
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Left: Matter List ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search matters..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {visibleMatters.map(m => {
              const rec = getRecord(m.id);
              const cfg = STATUS_CONFIG[rec.status];
              const isSelected = m.id === selectedMatterId;
              const upCount = rec.documents.filter(d => d.uploaded).length;
              const totalCount = rec.documents.length;

              return (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMatterId(m.id); setPackageReady(false); }}
                  className="w-full text-left rounded-xl p-3 transition-all border"
                  style={{
                    background: isSelected ? 'rgba(59,130,246,0.08)' : 'var(--card-bg)',
                    borderColor: isSelected ? 'rgba(59,130,246,0.4)' : 'var(--border-color)',
                  }}
                >
                  <p className="text-[var(--text-primary)] font-medium text-xs leading-tight mb-1 truncate">
                    {m.title}
                  </p>
                  <p className="text-[var(--text-secondary)] text-[10px] mb-2">{m.matterNumber}</p>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: cfg.color, fontSize: 10, fontWeight: 600 }}>{cfg.label}</span>
                    <span className="text-[var(--text-secondary)] text-[10px]">{upCount}/{totalCount} docs</span>
                  </div>
                  <ProgressBar
                    value={upCount}
                    max={totalCount}
                    color={upCount === totalCount ? '#10b981' : '#3b82f6'}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: Main Panel ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Matter Header */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[var(--text-primary)] font-bold text-base">{selectedMatter?.title}</h2>
                  <StatusBadge status={record.status} />
                </div>
                <p className="text-[var(--text-secondary)] text-xs mt-1">
                  {selectedMatter?.matterNumber} &nbsp;·&nbsp; {selectedMatter?.court} &nbsp;·&nbsp;
                  <span className="font-medium" style={{ color: '#f59e0b' }}>{selectedMatter?.practiceArea}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[var(--text-secondary)] text-xs">Documents Ready</p>
                <p className="font-bold text-lg text-[var(--text-primary)]">
                  {uploadedDocs}<span className="text-[var(--text-secondary)] font-normal text-sm">/{totalDocs}</span>
                </p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar
                value={uploadedDocs}
                max={totalDocs}
                color={allRequiredUploaded ? '#10b981' : '#3b82f6'}
              />
              <p className="text-xs mt-1" style={{ color: allRequiredUploaded ? '#10b981' : '#f59e0b' }}>
                {allRequiredUploaded
                  ? '✅ All required documents uploaded — Filing Ready!'
                  : `⚠ ${uploadedRequired.length}/${requiredDocs.length} required documents uploaded`}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 rounded-xl p-1"
            style={{ background: 'var(--hover-bg)' }}
          >
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeTab === tab.id ? 'var(--card-bg)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Tab: Checklist ─────────────────────────────────────────────── */}
          {activeTab === 'checklist' && (
            <div
              className="rounded-xl border p-5 space-y-4"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                  Required Filing Documents
                </h3>
                <span className="text-xs text-[var(--text-secondary)]">
                  Click to mark as uploaded
                </span>
              </div>

              <div className="space-y-2">
                {record.documents.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => toggleDocument(doc.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left"
                    style={{
                      background: doc.uploaded ? 'rgba(16,185,129,0.06)' : 'var(--hover-bg)',
                      borderColor: doc.uploaded ? 'rgba(16,185,129,0.3)' : 'var(--border-color)',
                    }}
                  >
                    {doc.uploaded
                      ? <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} />
                      : <Circle className="w-5 h-5 flex-shrink-0 text-[var(--text-secondary)]" />
                    }
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{doc.name}</span>
                      {!doc.required && (
                        <span className="ml-2 text-[10px] text-[var(--text-secondary)]">(optional)</span>
                      )}
                    </div>
                    {doc.uploaded && (
                      <span className="text-[10px] font-semibold" style={{ color: '#10b981' }}>✓ Uploaded</span>
                    )}
                    {!doc.uploaded && doc.required && (
                      <span className="text-[10px]" style={{ color: '#f59e0b' }}>Required</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Readiness Banner */}
              <div
                className="rounded-lg p-4 border"
                style={{
                  background: allRequiredUploaded ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  borderColor: allRequiredUploaded ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Filing Readiness</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: allRequiredUploaded ? '#10b981' : '#f59e0b' }}
                  >
                    {uploadedRequired.length} / {requiredDocs.length} required docs
                  </span>
                </div>
                <ProgressBar
                  value={uploadedRequired.length}
                  max={requiredDocs.length}
                  color={allRequiredUploaded ? '#10b981' : '#f59e0b'}
                />
                <p
                  className="text-sm font-bold mt-2"
                  style={{ color: allRequiredUploaded ? '#10b981' : '#f59e0b' }}
                >
                  {allRequiredUploaded ? '✅ FILING READY' : '⚠ NOT READY — Upload remaining required documents'}
                </p>
              </div>

              {/* Prepare Package Button */}
              <button
                onClick={handlePreparePackage}
                disabled={!allRequiredUploaded}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: allRequiredUploaded
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                    : 'var(--hover-bg)',
                  color: allRequiredUploaded ? '#fff' : 'var(--text-secondary)',
                  cursor: allRequiredUploaded ? 'pointer' : 'not-allowed',
                  opacity: allRequiredUploaded ? 1 : 0.6,
                }}
              >
                <Package className="w-4 h-4" />
                PREPARE eFILING PACKAGE
              </button>

              {/* Package Ready */}
              {packageReady && (
                <div
                  className="rounded-xl border p-4 space-y-3 animate-fade-in"
                  style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.3)' }}
                >
                  <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#10b981' }}>
                    <Package className="w-4 h-4" />
                    FilingPackage_{selectedMatter?.matterNumber?.replace(/\//g, '_')}.zip — Ready
                  </p>
                  <div className="space-y-1">
                    {record.documents.filter(d => d.uploaded).map(d => (
                      <div key={d.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <FileText className="w-3 h-3" /> {d.name}.pdf
                        </span>
                        <CheckCircle className="w-3 h-3" style={{ color: '#10b981' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      <Download className="w-3.5 h-3.5" /> Download Package
                    </button>
                    <a
                      href="https://efiling.court.go.ke"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open eFiling Portal
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Procedure Guide ────────────────────────────────────────── */}
          {activeTab === 'procedure' && (
            <div
              className="rounded-xl border p-5 space-y-4"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  Court Procedure — {selectedMatter?.practiceArea} Case
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}
                  >
                    {record.procedureStep} / {steps.length} Steps
                  </span>
                </div>
              </div>

              <ProgressBar
                value={record.procedureStep}
                max={steps.length}
                color="#8b5cf6"
              />
              <p className="text-xs text-[var(--text-secondary)]">
                Procedure Progress: {record.procedureStep} of {steps.length} steps complete
              </p>

              <div className="space-y-2">
                {steps.map((step, i) => {
                  const done = i < record.procedureStep;
                  const current = i === record.procedureStep;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg border transition-all"
                      style={{
                        background: current ? 'rgba(139,92,246,0.08)' : done ? 'transparent' : 'var(--hover-bg)',
                        borderColor: current ? 'rgba(139,92,246,0.35)' : 'var(--border-color)',
                        opacity: done ? 0.55 : 1,
                      }}
                    >
                      {/* Step indicator */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: done ? '#10b981' : current ? '#8b5cf6' : 'var(--border-color)',
                          color: done || current ? '#fff' : 'var(--text-secondary)',
                        }}
                      >
                        {done ? '✓' : i + 1}
                      </div>

                      <span
                        className="text-sm flex-1"
                        style={{
                          color: done ? 'var(--text-secondary)' : 'var(--text-primary)',
                          textDecoration: done ? 'line-through' : 'none',
                          fontWeight: current ? 600 : 400,
                        }}
                      >
                        {step}
                      </span>

                      {current && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}
                        >
                          CURRENT
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {record.procedureStep < steps.length && (
                <button
                  onClick={advanceStep}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  <ArrowRight className="w-4 h-4" />
                  Mark Step {record.procedureStep + 1} Complete — Advance to Step {record.procedureStep + 2}
                </button>
              )}
              {record.procedureStep === steps.length && (
                <div
                  className="text-center py-4 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <p className="font-bold text-sm" style={{ color: '#10b981' }}>
                    🎉 All procedure steps complete!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: eFiling Tracker ────────────────────────────────────────── */}
          {activeTab === 'tracker' && (
            <div
              className="rounded-xl border p-5 space-y-5"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-yellow-400" />
                eFiling Tracker — Court Interaction Record
              </h3>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Court Case Number', key: 'courtCaseNumber', placeholder: 'e.g. HC/COMM/E234/2026' },
                  { label: 'Court Station', key: 'courtStation', placeholder: 'e.g. Milimani Commercial Court' },
                  { label: 'Filing Date', key: 'filingDate', placeholder: '', type: 'date' },
                  { label: 'Payment Receipt No.', key: 'paymentReceipt', placeholder: 'e.g. RCT-2026-00234' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type || 'text'}
                      value={(record as any)[field.key]}
                      onChange={e => updateRecord({ [field.key]: e.target.value } as any)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]"
                    />
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Notes</label>
                <textarea
                  value={record.notes}
                  onChange={e => updateRecord({ notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes about this filing..."
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)] resize-none"
                />
              </div>

              {/* Status Pipeline */}
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Case Lifecycle Status</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_CONFIG) as FilingStatus[]).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    const isActive = record.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => updateRecord({ status: s })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                        style={{
                          background: isActive ? cfg.bg : 'transparent',
                          color: isActive ? cfg.color : 'var(--text-secondary)',
                          borderColor: isActive ? cfg.color + '60' : 'var(--border-color)',
                          fontWeight: isActive ? 700 : 400,
                        }}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Row */}
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {[
                  { label: 'Matter No.', value: selectedMatter?.matterNumber },
                  { label: 'Practice Area', value: selectedMatter?.practiceArea },
                  { label: 'Assigned Advocate', value: selectedMatter?.assignedAdvocate },
                  { label: 'Current Status', value: STATUS_CONFIG[record.status].label },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{item.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: Document Generator ─────────────────────────────────────── */}
          {activeTab === 'generator' && (
            <div
              className="rounded-xl border p-5"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-green-400" />
                Smart Document Generator
              </h3>

              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Auto-generate legal documents pre-filled with data from{' '}
                <span className="font-semibold text-[var(--text-primary)]">{selectedMatter?.title}</span>.
                Edit before downloading.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-5">
                {DOC_TEMPLATES.map(t => (
                  <button
                    key={t}
                    onClick={() => handleGenerateDoc(t)}
                    className="flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-all"
                    style={{
                      background: selectedTemplate === t ? 'rgba(16,185,129,0.08)' : 'var(--hover-bg)',
                      borderColor: selectedTemplate === t ? 'rgba(16,185,129,0.35)' : 'var(--border-color)',
                    }}
                  >
                    <FileText className="w-4 h-4" style={{ color: selectedTemplate === t ? '#10b981' : '#6b7280' }} />
                    <span className="text-xs font-medium text-[var(--text-primary)]">{t}</span>
                  </button>
                ))}
              </div>

              {generatingDoc && (
                <div className="flex items-center justify-center py-12 gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-sm text-[var(--text-secondary)]">Generating {selectedTemplate}...</span>
                </div>
              )}

              {showDocPreview && generatedDoc && !generatingDoc && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedTemplate}</p>
                    <div className="flex gap-2">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-5 text-sm leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-80"
                    style={{ background: '#fff', color: '#1a1a1a', fontSize: 12, lineHeight: 1.9 }}
                  >
                    {generatedDoc}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    ✏ Click inside to edit before downloading. All data is pre-filled from the case record.
                  </p>
                </div>
              )}

              {!showDocPreview && !generatingDoc && (
                <div
                  className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <FileText className="w-10 h-10 text-[var(--text-secondary)] mb-3 opacity-40" />
                  <p className="text-sm text-[var(--text-secondary)]">Select a template above to generate a document</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EFilingAssistant;
