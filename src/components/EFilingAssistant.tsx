import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { matters, clients, Matter } from '@/data/mockData';
import {
  FileText, CheckCircle, Circle, AlertCircle, Upload, Download,
  ChevronRight, Clock, Package, ExternalLink, Search, Filter,
  ClipboardList, BookOpen, Zap, CheckSquare, Eye, X, Printer,
  ArrowRight, RefreshCw, AlertTriangle, Info, Phone, Mail,
  CreditCard, Smartphone, Building2, ChevronDown, ChevronUp,
  Wifi, WifiOff, Star, HelpCircle, Play, Layers, Send,
  ShieldCheck, FileCheck, Landmark, Users, Hash, MessageSquare
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilingDocument {
  id: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  fileName?: string;
  tip?: string;
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
  efilingUsername?: string;
  invoiceRef?: string;
  paymentMethod?: string;
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

// ─── Real Kenya Judiciary eFiling Steps ──────────────────────────────────────

const EFILING_PORTAL_STEPS = [
  {
    phase: 'ACCOUNT',
    color: '#6366f1',
    steps: [
      { label: 'Log into efiling.court.go.ke', detail: 'Visit https://efiling.court.go.ke. New users: Register as Individual, Organization, or Law Firm. Activate via email link (check spam folder).' },
      { label: 'Update account details', detail: 'After first login, complete your profile: firm name, advocates on record, contact details, and LSK membership number.' },
    ]
  },
  {
    phase: 'CASE SETUP',
    color: '#f59e0b',
    steps: [
      { label: 'Click "File New Case"', detail: 'On your eFiling dashboard, click the "File New Case" tab to begin a fresh filing.' },
      { label: 'Select court station & division', detail: 'Choose where to file — e.g. Milimani Commercial Court, Milimani Law Courts, Environment & Land Court, etc. Select court division (Civil, Family, Commercial, etc.).' },
      { label: 'Enter party details', detail: 'Key in Plaintiff/Petitioner and Defendant/Respondent details including full names, ID numbers, and email addresses for e-service.' },
      { label: 'Enter case value & prayers', detail: 'Fill in the value of the case (if applicable) and a clear summary of prayers sought.' },
    ]
  },
  {
    phase: 'DOCUMENT UPLOAD',
    color: '#10b981',
    steps: [
      { label: 'Scan & label all documents', detail: 'Each document must be scanned SEPARATELY as a PDF. Label correctly: e.g. "Plaint", "Supporting_Affidavit", "List_of_Witnesses". Max file size: 10MB per document.' },
      { label: 'Upload documents one by one', detail: 'For each document: select Filed By → Document Type → Select File → Add Caption. Click "Proceed to Uploads" when all are added.' },
      { label: 'Confirm & submit', detail: 'Review all details carefully. Click "Confirm and Submit". You can click Previous to correct errors before final submission.' },
    ]
  },
  {
    phase: 'PAYMENT',
    color: '#ef4444',
    steps: [
      { label: 'Download invoice', detail: 'Go to Cases tab → Download Invoice. The system auto-assesses court fees based on case type and value. Note your Customer Reference Number.' },
      { label: 'Pay via M-PESA / KCB', detail: 'Payment options: M-PESA Paybill, KCB Teller, KCB Mtaani, or RTGS. Follow payment instructions on the invoice exactly.' },
      { label: 'Receive case number', detail: 'Upon successful payment, you receive SMS + email confirmation from KCB. The system auto-generates your case number. Note it down immediately.' },
    ]
  },
  {
    phase: 'POST-FILING',
    color: '#8b5cf6',
    steps: [
      { label: 'Track case status', detail: 'Log in to eFiling portal and go to "My Cases" to monitor acceptance status. Court registry reviews and accepts/returns within 2-3 working days.' },
      { label: 'Check Cause List Portal', detail: 'Visit the Judiciary Causelist Portal to check when your matter is scheduled. Updated daily by 8am.' },
      { label: 'E-serve the other party', detail: 'The eFiling system facilitates e-service to the other party\'s email. Confirm their email was correctly entered at filing.' },
    ]
  }
];

const PROCEDURE_STEPS: Record<string, { step: string; detail: string }[]> = {
  Civil: [
    { step: 'Draft Plaint', detail: 'Must contain: parties, facts, cause of action, prayers, verifying affidavit. Comply with Order 4 CPR 2010.' },
    { step: 'Prepare Supporting Affidavit', detail: 'Sworn by the plaintiff. Must be commissioned by a Commissioner for Oaths.' },
    { step: 'Compile List of Witnesses', detail: 'Names, addresses and summary of expected testimony for each witness.' },
    { step: 'Compile List of Documents', detail: 'Tabulate all documentary evidence with brief description of each.' },
    { step: 'Prepare Verifying Affidavit', detail: 'Verifies the contents of the plaint. Must be signed by the client and commissioned.' },
    { step: 'Upload all PDFs to eFiling portal', detail: 'Log in to efiling.court.go.ke → File New Case → Upload each document separately with correct labels.' },
    { step: 'Pay court fees via M-PESA/KCB', detail: 'Download invoice from eFiling portal → Pay via M-PESA Paybill or KCB → Receive case number via SMS.' },
    { step: 'Await court acceptance', detail: 'Registry reviews filing within 2-3 working days. Check "My Cases" on eFiling portal for status updates.' },
    { step: 'Serve defendant via e-service', detail: 'Confirm defendant\'s email on eFiling system. Physical service may also be required depending on court direction.' },
    { step: 'File Affidavit of Service', detail: 'File proof of service as a subsequent filing on the eFiling portal (no additional fee for subsequent filings).' },
  ],
  Criminal: [
    { step: 'Obtain Charge Sheet copy', detail: 'Request certified copy from OCS or DPP office. Required for defence preparation.' },
    { step: 'Prepare Defence Statement', detail: 'Outline defence case: alibi, mitigation, or challenge to prosecution evidence.' },
    { step: 'List Defence Witnesses', detail: 'Names, contacts and what each witness will testify to.' },
    { step: 'Prepare Bail Application (if required)', detail: 'Grounds for bail, proposed sureties with ID copies and addresses.' },
    { step: 'Upload to eFiling portal', detail: 'Criminal matters — use Organisation account linked to court station. Upload each document separately.' },
    { step: 'Pay any assessed fees', detail: 'Criminal matters may have zero or minimal fees. Confirm with registry.' },
    { step: 'Await court acceptance', detail: 'Monitor "My Cases" on eFiling portal for acceptance or return notifications.' },
    { step: 'Attend plea taking', detail: 'Physical or virtual court session for client to enter plea.' },
    { step: 'File defence documents', detail: 'After plea, file witness statements, exhibits list via subsequent filing on eFiling portal.' },
    { step: 'Await judgment', detail: 'After final hearing, court delivers judgment. Check Causelist Portal for judgment date.' },
  ],
  Land: [
    { step: 'Obtain title documents', detail: 'Certified copy of title deed / land certificate from Ministry of Lands or land registry.' },
    { step: 'Draft Originating Summons or Plaint', detail: 'ELC matters filed via Originating Summons or Plaint depending on reliefs sought. Comply with ELC Practice Directions.' },
    { step: 'Prepare Supporting Affidavit', detail: 'Annexe all title documents, correspondences, and relevant photographs as exhibits.' },
    { step: 'Obtain Title Search', detail: 'Recent official search from Land Registry confirming current ownership and encumbrances.' },
    { step: 'Commission Surveyor Report (if needed)', detail: 'Required for boundary disputes or sub-division matters.' },
    { step: 'Upload all PDFs to eFiling portal', detail: 'File at Environment & Land Court station. Upload each document with correct label.' },
    { step: 'Pay court fees', detail: 'ELC fees assessed on claim value. Pay via M-PESA or KCB and receive case number.' },
    { step: 'Await court acceptance', detail: 'ELC registry reviews and accepts or returns. Check eFiling portal.' },
    { step: 'Serve respondent', detail: 'E-service via eFiling portal + physical service where directed by court.' },
    { step: 'File Affidavit of Service', detail: 'Subsequent filing on eFiling portal — no additional fee.' },
  ],
  Employment: [
    { step: 'Draft Memorandum of Claim', detail: 'ELRC-specific pleading. Must specify reliefs: unpaid salary, terminal dues, reinstatement, etc.' },
    { step: 'Attach employment documents', detail: 'Employment contract, pay slips, termination letter, NSSF/NHIF records.' },
    { step: 'Prepare witness statements', detail: 'Detailed signed witness statements for claimant and any supporting witnesses.' },
    { step: 'Upload to eFiling portal', detail: 'File at Employment & Labour Relations Court. Upload each document separately.' },
    { step: 'Pay court fees', detail: 'ELRC fees are nominal. Pay via M-PESA or KCB. Case number issued on payment.' },
    { step: 'Await court acceptance', detail: 'Monitor "My Cases" for acceptance. ELRC registry is generally quick.' },
    { step: 'Attend pre-trial conference', detail: 'Court schedules a PTC to narrow issues and set hearing dates.' },
    { step: 'File agreed issues / list of documents', detail: 'After PTC, file agreed issues and finalized document list as subsequent filing.' },
    { step: 'Attend hearing', detail: 'Witnesses testify. Each side cross-examines the other\'s witnesses.' },
    { step: 'File written submissions & await judgment', detail: 'File written submissions as subsequent filing. Judgment date given by court.' },
  ],
  Commercial: [
    { step: 'Draft Plaint or Petition', detail: 'Commercial matters at Milimani Commercial Court. Must be within court\'s pecuniary jurisdiction.' },
    { step: 'Prepare Supporting Affidavit', detail: 'Sworn by authorized officer. Annexe contracts, invoices, bank statements as exhibits.' },
    { step: 'Attach contract & financial documents', detail: 'All relevant agreements, correspondence, bank records and accountant reports.' },
    { step: 'Prepare List of Documents', detail: 'Tabulate all documentary evidence for court.' },
    { step: 'Upload to eFiling portal', detail: 'File at Milimani Commercial Court. Each document uploaded separately with correct label.' },
    { step: 'Pay court fees', detail: 'Commercial court fees based on claim value. Pay via M-PESA Paybill or KCB.' },
    { step: 'Await court acceptance', detail: 'Monitor "My Cases" on eFiling portal.' },
    { step: 'Schedule first mention', detail: 'Court allocates a mention date. Check Causelist Portal.' },
    { step: 'Serve defendant', detail: 'E-service + physical service as directed.' },
    { step: 'File Affidavit of Service', detail: 'Subsequent filing on eFiling portal.' },
  ],
  Family: [
    { step: 'Draft Petition', detail: 'Divorce/separation petition. Comply with Matrimonial Causes Rules.' },
    { step: 'Attach marriage certificate', detail: 'Certified copy from Registrar of Persons / Attorney General\'s office.' },
    { step: 'Prepare supporting affidavit', detail: 'Narrate grounds for petition. Attach evidence of matrimonial fault or separation.' },
    { step: 'List matrimonial assets', detail: 'Tabulate all jointly and separately owned assets: property, vehicles, accounts, businesses.' },
    { step: 'Prepare custody / maintenance proposal', detail: 'Detailed proposal for child custody, access schedule, and maintenance quantum.' },
    { step: 'Upload to eFiling portal', detail: 'File at Family Division, Milimani Law Courts. Upload each document separately.' },
    { step: 'Pay court fees', detail: 'Pay assessed fees via M-PESA or KCB and receive case number.' },
    { step: 'Await court acceptance', detail: 'Monitor eFiling portal for acceptance.' },
    { step: 'Attend case conference', detail: 'Court schedules case conference for preliminary directions.' },
    { step: 'Attend hearing & collect decree', detail: 'After hearing, court issues decree. Download certified copy from eFiling portal.' },
  ],
};

const DEFAULT_STEPS = PROCEDURE_STEPS['Civil'];

const FILING_DOCS: Record<string, FilingDocument[]> = {
  Civil: [
    { id: 'plaint', name: 'Plaint', required: true, uploaded: false, tip: 'Must comply with Order 4 CPR 2010. Include all prayers. Max 10MB PDF.' },
    { id: 'aff_support', name: 'Supporting Affidavit', required: true, uploaded: false, tip: 'Commissioned by a Commissioner for Oaths. Client signature required.' },
    { id: 'list_witness', name: 'List of Witnesses', required: true, uploaded: false, tip: 'Full names, addresses, and brief summary of testimony.' },
    { id: 'list_docs', name: 'List of Documents', required: true, uploaded: false, tip: 'Tabulate all exhibits with brief description.' },
    { id: 'verifying_aff', name: 'Verifying Affidavit', required: true, uploaded: false, tip: 'Signed by client. Verifies plaint contents.' },
    { id: 'cert_urgency', name: 'Certificate of Urgency', required: false, uploaded: false, tip: 'Only if seeking urgent/ex parte orders.' },
  ],
  Criminal: [
    { id: 'charge_sheet', name: 'Charge Sheet Copy', required: true, uploaded: false, tip: 'Certified copy from OCS or DPP. Must be legible.' },
    { id: 'defence_stmt', name: 'Defence Statement', required: true, uploaded: false, tip: 'Outline defence case, alibi, or challenge to prosecution.' },
    { id: 'bail_app', name: 'Bail Application', required: false, uploaded: false, tip: 'Include proposed surety details and grounds for bail.' },
    { id: 'witness_list', name: 'List of Defence Witnesses', required: true, uploaded: false, tip: 'Names, contacts, and summary of testimony.' },
  ],
  Land: [
    { id: 'plaint', name: 'Plaint / Originating Summons', required: true, uploaded: false, tip: 'ELC Practice Directions apply. Choose correct pleading type.' },
    { id: 'title_docs', name: 'Title Documents', required: true, uploaded: false, tip: 'Certified copy from Land Registry. Must be current.' },
    { id: 'aff_support', name: 'Supporting Affidavit', required: true, uploaded: false, tip: 'Annexe title docs and relevant correspondence as exhibits.' },
    { id: 'title_search', name: 'Official Title Search', required: true, uploaded: false, tip: 'Must be obtained from Land Registry. Shows current encumbrances.' },
    { id: 'survey', name: 'Surveyor Report', required: false, uploaded: false, tip: 'Required for boundary disputes. Commission from licensed surveyor.' },
  ],
  Employment: [
    { id: 'memo_claim', name: 'Memorandum of Claim', required: true, uploaded: false, tip: 'ELRC-specific form. Specify all reliefs clearly.' },
    { id: 'employment_docs', name: 'Employment Documents', required: true, uploaded: false, tip: 'Contract, payslips, termination letter, NSSF/NHIF records.' },
    { id: 'witness_stmt', name: 'Witness Statement(s)', required: true, uploaded: false, tip: 'Signed witness statements for claimant and all supporting witnesses.' },
    { id: 'list_docs', name: 'List of Documents', required: true, uploaded: false, tip: 'Tabulate all employment-related documentary evidence.' },
  ],
  default: [
    { id: 'main_doc', name: 'Main Pleading', required: true, uploaded: false, tip: 'Primary pleading document. Must be in PDF format.' },
    { id: 'aff_support', name: 'Supporting Affidavit', required: true, uploaded: false, tip: 'Commissioned by Commissioner for Oaths.' },
    { id: 'list_docs', name: 'List of Documents', required: true, uploaded: false, tip: 'Tabulate all documentary evidence.' },
    { id: 'list_witness', name: 'List of Witnesses', required: true, uploaded: false, tip: 'Full names and contact details of all witnesses.' },
  ],
};

const STATUS_CONFIG: Record<FilingStatus, { label: string; color: string; bg: string; icon: string }> = {
  draft:              { label: 'Draft',              color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '📝' },
  preparing:          { label: 'Preparing',          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '⚙️' },
  ready:              { label: 'Ready to File',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '📦' },
  filed:              { label: 'Filed on Portal',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: '📤' },
  accepted:           { label: 'Accepted',           color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
  returned:           { label: 'Returned',           color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '↩️' },
  mention_scheduled:  { label: 'Mention Scheduled',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '📅' },
  hearing_scheduled:  { label: 'Hearing Scheduled',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '⚖️' },
  judgment_delivered: { label: 'Judgment Delivered', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🏛️' },
};

const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-PESA Paybill', icon: '📱', detail: 'Paybill number on your invoice. Enter Customer Ref as Account Number.' },
  { id: 'kcb_teller', label: 'KCB Teller', icon: '🏦', detail: 'Visit any KCB branch with your invoice. Present Customer Ref Number.' },
  { id: 'kcb_mtaani', label: 'KCB Mtaani', icon: '🏪', detail: 'Pay at any KCB Mtaani agent using your invoice details.' },
  { id: 'rtgs', label: 'RTGS / EFT', icon: '💻', detail: 'For large amounts. Use banking details on your invoice. Allow 1-2 days.' },
];

const DOC_TEMPLATES = [
  { name: 'Plaint', area: 'Civil', color: '#3b82f6' },
  { name: 'Supporting Affidavit', area: 'All', color: '#8b5cf6' },
  { name: 'Verifying Affidavit', area: 'Civil', color: '#8b5cf6' },
  { name: 'Memorandum of Claim', area: 'Employment', color: '#f59e0b' },
  { name: 'Bail Application', area: 'Criminal', color: '#ef4444' },
  { name: 'Demand Letter', area: 'All', color: '#10b981' },
  { name: 'Witness Statement', area: 'All', color: '#6366f1' },
  { name: 'Certificate of Urgency', area: 'Civil', color: '#f97316' },
  { name: 'Affidavit of Service', area: 'All', color: '#14b8a6' },
  { name: 'Replying Affidavit', area: 'All', color: '#a855f7' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDocsForArea = (area: string): FilingDocument[] => {
  const base = FILING_DOCS[area] || FILING_DOCS['default'];
  return base.map(d => ({ ...d }));
};

const getStepsForArea = (area: string) =>
  PROCEDURE_STEPS[area] || DEFAULT_STEPS;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: FilingStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
      borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <span>{cfg.icon}</span>{cfg.label}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; max: number; color?: string; height?: number }> = ({
  value, max, color = '#3b82f6', height = 6,
}) => (
  <div style={{ background: 'var(--border-color)', borderRadius: 99, height, width: '100%', overflow: 'hidden' }}>
    <div style={{
      width: `${Math.min(max > 0 ? (value / max) * 100 : 0, 100)}%`,
      background: color, height: '100%', borderRadius: 99,
      transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
    }} />
  </div>
);

const TipBox: React.FC<{ text: string; type?: 'info' | 'warning' | 'success' }> = ({ text, type = 'info' }) => {
  const colors = {
    info: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)', color: '#818cf8' },
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: '#fbbf24' },
    success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', color: '#34d399' },
  };
  const c = colors[type];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <Info style={{ color: c.color, width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const EFilingAssistant: React.FC = () => {
  const { user, addAuditLog } = useAuth();
  const isClient = user?.role === 'client';

  const [filingRecords, setFilingRecords] = useState<Record<string, FilingRecord>>({});
  const [selectedMatterId, setSelectedMatterId] = useState<string>(matters[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'portal' | 'checklist' | 'procedure' | 'tracker' | 'generator'>('portal');
  const [search, setSearch] = useState('');
  const [packageReady, setPackageReady] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [expandedPortalPhase, setExpandedPortalPhase] = useState<number | null>(0);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [tipDocId, setTipDocId] = useState<string | null>(null);

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
      efilingUsername: '',
      invoiceRef: '',
      paymentMethod: '',
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
    setShowDocPreview(false);
    setTimeout(() => {
      const m = selectedMatter;
      const client = clients.find(c => c.id === m?.clientId);
      const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

      const courtHeader = `REPUBLIC OF KENYA\n${'─'.repeat(50)}\nIN THE ${(m?.court || 'HIGH COURT OF KENYA').toUpperCase()}\nAT NAIROBI\n\nCASE NO. ${m?.matterNumber || '______/2026'}\n${'─'.repeat(50)}\nBETWEEN\n\n${(m?.clientName || '[CLIENT NAME]').toUpperCase()}\n...........................................................PLAINTIFF/PETITIONER\n\nAND\n\n${(m?.opposingParty || '[OPPOSING PARTY]').toUpperCase()}\n...........................................................DEFENDANT/RESPONDENT\n${'─'.repeat(50)}\n\n`;

      const docBodies: Record<string, string> = {
        'Plaint': `${courtHeader}PLAINT\n\n1. The Plaintiff's address for service is care of ${m?.assignedAdvocate || '[ADVOCATE NAME]'}, Advocates, P.O. Box _____, Nairobi.\n\n2. The Defendant's known address is _______________________________________.\n\n3. The Plaintiff avers that: ${m?.description || '[State material facts giving rise to the cause of action]'}.\n\n4. In or about _____________, the Defendant breached/did [describe breach/act] thereby causing the Plaintiff to suffer loss and damage.\n\n5. By reason of the matters aforesaid, the Plaintiff has suffered loss and damage.\n\nPRAYERS\n\nWHEREFORE the Plaintiff prays for judgment against the Defendant for:\n(a) [Primary relief sought];\n(b) General damages;\n(c) Costs of this suit;\n(d) Interest on (a) and (b) at court rates;\n(e) Any other relief this Honourable Court may deem fit and just.\n\nDated at Nairobi this ${today}\n\n_______________________________\n${m?.assignedAdvocate || '[ADVOCATE NAME]'}\nAdvocate for Plaintiff\nP.O. Box _____, Nairobi`,
        'Supporting Affidavit': `${courtHeader}SUPPORTING AFFIDAVIT\n\nI, ${client?.contactPerson || client?.name || '[DEPONENT FULL NAME]'}, of P.O. Box _____, Nairobi, ID No. ${client?.idNumber || 'XXXXXXXX'}, do hereby make oath and state as follows:\n\n1. THAT I am the Plaintiff/Applicant in the above-mentioned matter and am duly authorised to depose to this Affidavit.\n\n2. THAT the facts herein are within my personal knowledge, information and belief, and are true and accurate.\n\n3. THAT the subject matter of this suit is: ${m?.description || '[Describe subject matter clearly]'}.\n\n4. THAT the Opposing Party, ${m?.opposingParty || '[Party name]'}, is known to me as [describe relationship/knowledge].\n\n5. THAT I annex hereto marked "[Exhibit A]" a true copy of [describe exhibit].\n\n6. THAT I make this Affidavit bona fide and in the interest of justice.\n\nSWORN at NAIROBI\nThis _____ day of ____________ 2026\n\n_______________________________\nDEPONENT\n\nBefore me:\n\n_______________________________\nCOMMISSIONER FOR OATHS / NOTARY PUBLIC`,
        'Demand Letter': `WITHOUT PREJUDICE\n\n${today}\n\nTo:\n${m?.opposingParty || '[Opposing Party Name]'}\n[Address]\n[Email]\n\nDear Sir/Madam,\n\nRE: ${m?.title || '[SUBJECT MATTER]'} — FORMAL DEMAND\n\nWe act for and on behalf of ${m?.clientName || '[Client Name]'} in the above matter.\n\nOUR CLIENT'S POSITION\n\nOur client instructs us that: ${m?.description || '[State the facts giving rise to the claim]'}.\n\nDEMAND\n\nWe hereby formally demand that you, within FOURTEEN (14) DAYS of the date of this letter:\n\n1. [Primary demand — e.g. pay the sum of KES _______ being [description]];\n2. [Secondary demand];\n3. [Any other specific demand].\n\nFAILURE TO ACT\n\nShould you fail to comply with this demand within the stipulated period, our client has instructed us to institute legal proceedings against you without further notice, and to seek costs of such proceedings from you.\n\nWe trust this will not be necessary.\n\nYours faithfully,\n\n_______________________________\n${m?.assignedAdvocate || '[ADVOCATE NAME]'}\nFor: [LAW FIRM NAME]\nAdvocates, Commissioners for Oaths & Notaries Public\nTel: [Tel] | Email: [Email]`,
        'Affidavit of Service': `${courtHeader}AFFIDAVIT OF SERVICE\n\nI, [PROCESS SERVER FULL NAME], of P.O. Box _____, Nairobi, do hereby make oath and state as follows:\n\n1. THAT I am a Process Server / Court Clerk / [other capacity] and am duly authorised to effect service of court process.\n\n2. THAT on the _____ day of ____________ 2026, I did serve the Defendant/Respondent:\n   Name: ${m?.opposingParty || '[Party Name]'}\n   with the following documents:\n   (a) Copy of Plaint;\n   (b) Summons to Enter Appearance.\n\n3. THAT service was effected at [address of service] by:\n   ☐ Personal service — served to the person named above\n   ☐ Substituted service — left with [name and description]\n   ☐ Service at place of business\n\n4. THAT at the time of service the Defendant/Respondent:\n   ☐ Acknowledged receipt\n   ☐ Declined to accept but I left the documents in their presence\n\n5. THAT I produce herewith marked "[Exhibit A]" a photograph of service.\n\nSWORN at NAIROBI\nThis _____ day of ____________ 2026\n\n_______________________________\nDEPONENT\n\nBefore me:\n\n_______________________________\nCOMMISSIONER FOR OATHS`,
      };

      const body = docBodies[template] || `${courtHeader}${template.toUpperCase()}\n\n[This document is pre-populated with matter details for ${m?.title}. Please complete the substantive content specific to this matter.]\n\nMatter No.: ${m?.matterNumber}\nPractice Area: ${m?.practiceArea}\nCourt: ${m?.court}\nClient: ${m?.clientName}\nOpposing Party: ${m?.opposingParty || 'N/A'}\n\n[Complete document body here]\n\nDated at Nairobi this ${today}\n\n_______________________________\n${m?.assignedAdvocate || '[ADVOCATE]'}\nAdvocate`;

      setGeneratedDoc(body);
      setGeneratingDoc(false);
      setShowDocPreview(true);
    }, 900);
  };

  const handlePreparePackage = () => {
    updateRecord({ status: 'filed', filingDate: new Date().toISOString().split('T')[0] });
    setPackageReady(true);
    addAuditLog('CREATE', 'eFiling', `Filing package prepared for ${selectedMatter?.matterNumber}`);
  };

  const tabs = [
    { id: 'portal',     label: 'Portal Guide',     icon: Landmark,     color: '#6366f1' },
    { id: 'checklist',  label: 'Doc Checklist',    icon: CheckSquare,  color: '#3b82f6' },
    { id: 'procedure',  label: 'Procedure',        icon: BookOpen,     color: '#8b5cf6' },
    { id: 'tracker',    label: 'Filing Tracker',   icon: ClipboardList, color: '#f59e0b' },
    { id: 'generator',  label: 'Doc Generator',    icon: FileText,     color: '#10b981' },
  ] as const;

  // ── Overall portal progress estimate
  const portalProgress = Math.min(
    Math.round((uploadedDocs / Math.max(totalDocs, 1)) * 40 +
    (record.procedureStep / Math.max(steps.length, 1)) * 35 +
    (record.courtCaseNumber ? 15 : 0) +
    (record.paymentReceipt ? 10 : 0)),
    100
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              borderRadius: 10, padding: '7px 8px', display: 'flex', alignItems: 'center',
            }}>
              <Landmark style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">eFiling Assistant</h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm ml-12">
            Kenya Judiciary eFiling portal guide — prepare, upload & track court filings
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href="https://efiling.court.go.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff' }}
          >
            <ExternalLink className="w-4 h-4" />
            Open eFiling Portal
          </a>
          <a
            href="https://judiciary.go.ke/causelist"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            <ClipboardList className="w-4 h-4" />
            Causelist Portal
          </a>
        </div>
      </div>

      {/* ── Support Banner ──────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <span className="font-semibold" style={{ color: '#818cf8' }}>🛟 Judiciary ICT Support:</span>
        <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <Phone className="w-3 h-3" /> +254 0730 181 581 &nbsp;/&nbsp; +254 0730 181 040
        </span>
        <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <Mail className="w-3 h-3" /> ictsupport@court.go.ke
        </span>
        <span className="ml-auto text-[var(--text-secondary)] flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-emerald-400" /> Portal available 24/7
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Left: Matter List ───────────────────────────────────────────── */}
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

          <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
            {visibleMatters.map(m => {
              const rec = getRecord(m.id);
              const cfg = STATUS_CONFIG[rec.status];
              const isSelected = m.id === selectedMatterId;
              const upCount = rec.documents.filter(d => d.uploaded).length;
              const totalCount = rec.documents.length;
              const prog = Math.min(totalCount > 0 ? Math.round((upCount / totalCount) * 100) : 0, 100);

              return (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMatterId(m.id); setPackageReady(false); setShowDocPreview(false); }}
                  className="w-full text-left rounded-xl p-3 transition-all border"
                  style={{
                    background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--card-bg)',
                    borderColor: isSelected ? 'rgba(99,102,241,0.4)' : 'var(--border-color)',
                  }}
                >
                  <p className="text-[var(--text-primary)] font-medium text-xs leading-tight mb-0.5 truncate">{m.title}</p>
                  <p className="text-[var(--text-secondary)] text-[10px] mb-2">{m.matterNumber} · {m.practiceArea}</p>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: cfg.color, fontSize: 10, fontWeight: 600 }}>{cfg.icon} {cfg.label}</span>
                    <span className="text-[var(--text-secondary)] text-[10px]">{upCount}/{totalCount}</span>
                  </div>
                  <ProgressBar value={upCount} max={totalCount} color={upCount === totalCount ? '#10b981' : '#6366f1'} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: Main Panel ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Matter Header */}
          <div className="rounded-xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-[var(--text-primary)] font-bold text-base">{selectedMatter?.title}</h2>
                  <StatusBadge status={record.status} />
                </div>
                <p className="text-[var(--text-secondary)] text-xs">
                  {selectedMatter?.matterNumber} &nbsp;·&nbsp; {selectedMatter?.court}
                  &nbsp;·&nbsp; <span className="font-semibold" style={{ color: '#f59e0b' }}>{selectedMatter?.practiceArea}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[var(--text-secondary)] text-xs">Filing Readiness</p>
                <p className="font-bold text-xl text-[var(--text-primary)]">
                  {portalProgress}%
                </p>
              </div>
            </div>
            <ProgressBar value={portalProgress} max={100} color={portalProgress >= 100 ? '#10b981' : '#6366f1'} height={7} />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs" style={{ color: allRequiredUploaded ? '#10b981' : '#f59e0b' }}>
                {allRequiredUploaded ? '✅ All required docs ready — proceed to portal' : `⚠ ${uploadedRequired.length}/${requiredDocs.length} required docs ready`}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{uploadedDocs}/{totalDocs} docs</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--hover-bg)' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeTab === tab.id ? 'var(--card-bg)' : 'transparent',
                    color: activeTab === tab.id ? tab.color : 'var(--text-secondary)',
                    boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ═══ TAB: Portal Guide ═══════════════════════════════════════════ */}
          {activeTab === 'portal' && (
            <div className="space-y-3">
              <div className="rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                  <Landmark className="w-4 h-4" style={{ color: '#6366f1' }} />
                  Kenya Judiciary eFiling — Step-by-Step Portal Guide
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  Follow these exact steps from the official Judiciary eFiling portal. Click any phase to expand.
                </p>

                {EFILING_PORTAL_STEPS.map((phase, phaseIdx) => {
                  const isOpen = expandedPortalPhase === phaseIdx;
                  const stepOffset = EFILING_PORTAL_STEPS.slice(0, phaseIdx).reduce((a, p) => a + p.steps.length, 0);

                  return (
                    <div
                      key={phase.phase}
                      className="rounded-xl border mb-3 overflow-hidden"
                      style={{ borderColor: isOpen ? phase.color + '50' : 'var(--border-color)' }}
                    >
                      <button
                        onClick={() => setExpandedPortalPhase(isOpen ? null : phaseIdx)}
                        className="w-full flex items-center justify-between p-4 text-left transition-all"
                        style={{ background: isOpen ? phase.color + '0d' : 'var(--hover-bg)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: phase.color + '20', color: phase.color }}
                          >
                            PHASE {phaseIdx + 1}
                          </span>
                          <span className="font-semibold text-sm text-[var(--text-primary)]">{phase.phase}</span>
                          <span className="text-xs text-[var(--text-secondary)]">{phase.steps.length} steps</span>
                        </div>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
                          : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                        }
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-0 space-y-2">
                          {phase.steps.map((step, stepIdx) => {
                            const globalIdx = stepOffset + stepIdx;
                            const key = `${phaseIdx}-${stepIdx}`;
                            const isExpanded = expandedStep === key;
                            return (
                              <div
                                key={stepIdx}
                                className="rounded-lg border overflow-hidden"
                                style={{ borderColor: 'var(--border-color)' }}
                              >
                                <button
                                  onClick={() => setExpandedStep(isExpanded ? null : key)}
                                  className="w-full flex items-center gap-3 p-3 text-left transition-all"
                                  style={{ background: isExpanded ? phase.color + '08' : 'transparent' }}
                                >
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                    style={{ background: phase.color + '20', color: phase.color }}
                                  >
                                    {globalIdx + 1}
                                  </div>
                                  <span className="text-sm text-[var(--text-primary)] flex-1 text-left">{step.label}</span>
                                  <ChevronRight
                                    className="w-3.5 h-3.5 transition-transform"
                                    style={{ color: phase.color, transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                                  />
                                </button>
                                {isExpanded && (
                                  <div className="px-4 pb-3">
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-t pt-2" style={{ borderColor: 'var(--border-color)' }}>
                                      {step.detail}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Payment Methods */}
              <div className="rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Court Fee Payment Methods
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(pm => (
                    <div
                      key={pm.id}
                      className="rounded-lg p-3 border"
                      style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{pm.icon}</span>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{pm.label}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{pm.detail}</p>
                    </div>
                  ))}
                </div>
                <TipBox
                  type="warning"
                  text="Ensure you have sufficient funds BEFORE filing. The system will not issue a case number until payment is completed. Keep your Customer Reference Number safe."
                />
              </div>

              {/* Quick Tips */}
              <div className="rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Pro Tips for Smooth Filing
                </h3>
                <div className="space-y-2">
                  {[
                    { tip: 'All documents must be in PDF format. Scan at minimum 300 DPI for legibility. Name each file clearly before uploading.', type: 'info' as const },
                    { tip: 'If filing on a weekend/public holiday or after business hours, the NEXT working day is treated as the filing date.', type: 'warning' as const },
                    { tip: 'Subsequent filings (e.g. Affidavit of Service) on an existing case are FREE — no additional court fee.', type: 'success' as const },
                    { tip: 'Check the Causelist Portal (causelist.court.go.ke) daily for hearing dates — it updates by 8:00 AM each day.', type: 'info' as const },
                    { tip: 'If the portal is down, contact ICT Support immediately: ictsupport@court.go.ke or call +254 0730 181 581.', type: 'warning' as const },
                  ].map((item, i) => (
                    <TipBox key={i} text={item.tip} type={item.type} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: Document Checklist ════════════════════════════════════ */}
          {activeTab === 'checklist' && (
            <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                  Required Filing Documents — {selectedMatter?.practiceArea} Matter
                </h3>
                <span className="text-xs text-[var(--text-secondary)]">Click to mark uploaded · Hover ⓘ for tips</span>
              </div>

              <TipBox text="Each document must be a SEPARATE PDF file, correctly labelled, under 10MB. Scanned at 300 DPI minimum." />

              <div className="space-y-2">
                {record.documents.map(doc => (
                  <div key={doc.id}>
                    <button
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
                      {doc.tip && (
                        <button
                          onClick={e => { e.stopPropagation(); setTipDocId(tipDocId === doc.id ? null : doc.id); }}
                          className="p-1 rounded-md transition-all"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {doc.uploaded && <span className="text-[10px] font-semibold" style={{ color: '#10b981' }}>✓ Ready</span>}
                      {!doc.uploaded && doc.required && <span className="text-[10px]" style={{ color: '#f59e0b' }}>Required</span>}
                    </button>
                    {tipDocId === doc.id && doc.tip && (
                      <div className="mx-2 mt-1">
                        <TipBox text={doc.tip} type="info" />
                      </div>
                    )}
                  </div>
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
                  <span className="text-sm font-bold" style={{ color: allRequiredUploaded ? '#10b981' : '#f59e0b' }}>
                    {uploadedRequired.length} / {requiredDocs.length} required
                  </span>
                </div>
                <ProgressBar value={uploadedRequired.length} max={requiredDocs.length} color={allRequiredUploaded ? '#10b981' : '#f59e0b'} />
                <p className="text-sm font-bold mt-2" style={{ color: allRequiredUploaded ? '#10b981' : '#f59e0b' }}>
                  {allRequiredUploaded
                    ? '✅ READY — All required documents prepared. Proceed to eFiling portal.'
                    : `⚠ NOT READY — ${requiredDocs.length - uploadedRequired.length} required document(s) still needed`}
                </p>
              </div>

              {/* Prepare Package */}
              <button
                onClick={handlePreparePackage}
                disabled={!allRequiredUploaded}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: allRequiredUploaded ? 'linear-gradient(135deg, #6366f1, #3b82f6)' : 'var(--hover-bg)',
                  color: allRequiredUploaded ? '#fff' : 'var(--text-secondary)',
                  cursor: allRequiredUploaded ? 'pointer' : 'not-allowed',
                  opacity: allRequiredUploaded ? 1 : 0.6,
                }}
              >
                <Package className="w-4 h-4" />
                PREPARE eFILING PACKAGE
              </button>

              {packageReady && (
                <div className="rounded-xl border p-4 space-y-3 animate-fade-in" style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.3)' }}>
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
                  <TipBox text="Now log into efiling.court.go.ke → File New Case → upload each document separately with correct labels and captions." type="success" />
                  <div className="flex gap-2 pt-1">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      <Download className="w-3.5 h-3.5" /> Download Package
                    </button>
                    <a
                      href="https://efiling.court.go.ke"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open eFiling Portal
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: Procedure Guide ════════════════════════════════════════ */}
          {activeTab === 'procedure' && (
            <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  Procedure Guide — {selectedMatter?.practiceArea} Matter
                </h3>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  {record.procedureStep} / {steps.length} Steps
                </span>
              </div>

              <ProgressBar value={record.procedureStep} max={steps.length} color="#8b5cf6" />

              <div className="space-y-2">
                {steps.map((s, i) => {
                  const done = i < record.procedureStep;
                  const current = i === record.procedureStep;
                  const key = `proc-${i}`;
                  const isExpanded = expandedStep === key;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border overflow-hidden transition-all"
                      style={{
                        background: current ? 'rgba(139,92,246,0.06)' : done ? 'transparent' : 'var(--hover-bg)',
                        borderColor: current ? 'rgba(139,92,246,0.35)' : 'var(--border-color)',
                        opacity: done ? 0.55 : 1,
                      }}
                    >
                      <button
                        onClick={() => !done && setExpandedStep(isExpanded ? null : key)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
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
                          {s.step}
                        </span>
                        {current && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                            CURRENT
                          </span>
                        )}
                        {!done && (
                          <ChevronRight
                            className="w-3.5 h-3.5 transition-transform"
                            style={{ color: 'var(--text-secondary)', transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                          />
                        )}
                      </button>
                      {isExpanded && !done && (
                        <div className="px-4 pb-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-2">{s.detail}</p>
                        </div>
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
                  Mark Step {record.procedureStep + 1} Complete
                </button>
              )}
              {record.procedureStep >= steps.length && (
                <div className="text-center py-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <p className="font-bold text-sm" style={{ color: '#10b981' }}>🎉 All procedure steps complete!</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: eFiling Tracker ════════════════════════════════════════ */}
          {activeTab === 'tracker' && (
            <div className="rounded-xl border p-5 space-y-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-yellow-400" />
                eFiling Tracker — Court Interaction Record
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'eFiling Account Username', key: 'efilingUsername', placeholder: 'Your efiling.court.go.ke username' },
                  { label: 'Court Case Number', key: 'courtCaseNumber', placeholder: 'e.g. HC/COMM/E234/2026' },
                  { label: 'Court Station', key: 'courtStation', placeholder: 'e.g. Milimani Commercial Court' },
                  { label: 'Filing Date', key: 'filingDate', placeholder: '', type: 'date' },
                  { label: 'Invoice / Customer Ref No.', key: 'invoiceRef', placeholder: 'e.g. CRN-2026-00234' },
                  { label: 'Payment Receipt No.', key: 'paymentReceipt', placeholder: 'e.g. KCB-RCT-2026-00234' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{field.label}</label>
                    <input
                      type={(field as any).type || 'text'}
                      value={(record as any)[field.key] || ''}
                      onChange={e => updateRecord({ [field.key]: e.target.value } as any)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)]"
                    />
                  </div>
                ))}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Payment Method Used</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => updateRecord({ paymentMethod: pm.id })}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={{
                        background: record.paymentMethod === pm.id ? 'rgba(16,185,129,0.12)' : 'var(--hover-bg)',
                        borderColor: record.paymentMethod === pm.id ? 'rgba(16,185,129,0.4)' : 'var(--border-color)',
                        color: record.paymentMethod === pm.id ? '#10b981' : 'var(--text-secondary)',
                      }}
                    >
                      {pm.icon} {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Notes / Registry Responses</label>
                <textarea
                  value={record.notes}
                  onChange={e => updateRecord({ notes: e.target.value })}
                  rows={3}
                  placeholder="Document any registry feedback, return reasons, or important notes here..."
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
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                {[
                  { label: 'Matter No.', value: selectedMatter?.matterNumber },
                  { label: 'Practice Area', value: selectedMatter?.practiceArea },
                  { label: 'Assigned Advocate', value: selectedMatter?.assignedAdvocate },
                  { label: 'Current Status', value: STATUS_CONFIG[record.status].label },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{item.value || '—'}</p>
                  </div>
                ))}
              </div>

              {record.status === 'returned' && (
                <TipBox
                  type="warning"
                  text="Documents returned by registry. Common reasons: incorrect labels, merged documents (should be separate), file size too large, or missing required fields. Correct and re-upload on the eFiling portal."
                />
              )}
            </div>
          )}

          {/* ═══ TAB: Document Generator ════════════════════════════════════ */}
          {activeTab === 'generator' && (
            <div className="rounded-xl border p-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-green-400" />
                Smart Document Generator
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Auto-generate Kenyan legal documents pre-filled with{' '}
                <span className="font-semibold text-[var(--text-primary)]">{selectedMatter?.title}</span> data.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-5">
                {DOC_TEMPLATES.map(t => (
                  <button
                    key={t.name}
                    onClick={() => handleGenerateDoc(t.name)}
                    className="flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-all"
                    style={{
                      background: selectedTemplate === t.name ? t.color + '12' : 'var(--hover-bg)',
                      borderColor: selectedTemplate === t.name ? t.color + '50' : 'var(--border-color)',
                    }}
                  >
                    <FileText className="w-4 h-4" style={{ color: selectedTemplate === t.name ? t.color : '#6b7280' }} />
                    <span className="text-xs font-medium text-[var(--text-primary)] leading-tight">{t.name}</span>
                    <span className="text-[9px]" style={{ color: t.color + 'cc' }}>{t.area}</span>
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedTemplate}</p>
                    <div className="flex gap-2">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
                    </div>
                  </div>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="rounded-lg p-5 text-sm leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-96 focus:outline-none"
                    style={{ background: '#fff', color: '#1a1a1a', fontSize: 11.5, lineHeight: 1.85 }}
                  >
                    {generatedDoc}
                  </div>
                  <TipBox text="Click inside the document to edit before downloading. All details are pre-filled from the matter record. Remember to commission sworn documents before uploading." type="info" />
                </div>
              )}

              {!showDocPreview && !generatingDoc && (
                <div
                  className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <FileText className="w-10 h-10 text-[var(--text-secondary)] mb-3 opacity-40" />
                  <p className="text-sm text-[var(--text-secondary)]">Select a template above to generate a document</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-60">Pre-filled with matter data from {selectedMatter?.title}</p>
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
