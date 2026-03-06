import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Search, Download, Filter, User, Clock, AlertTriangle, CheckCircle, Eye, Edit, Trash2, LogIn, LogOut, FileText, DollarSign, MessageCircle, Settings } from 'lucide-react';

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ip: string;
  severity: 'info' | 'warning' | 'critical';
}

const AUDIT_LOG: AuditEntry[] = [
  { id:'au1', userId:'1', userName:'James Mwangi', userRole:'super_admin', action:'LOGIN', module:'Auth', details:'Successful login from Chrome/Windows', timestamp:'2026-03-06T09:00:00', ip:'192.168.1.1', severity:'info' },
  { id:'au2', userId:'3', userName:'Peter Kamau', userRole:'advocate', action:'VIEW', module:'Billing', details:'Attempted to access company revenue report', timestamp:'2026-03-06T09:15:00', ip:'192.168.1.3', severity:'warning' },
  { id:'au3', userId:'1', userName:'James Mwangi', userRole:'super_admin', action:'CREATE', module:'Matters', details:'New matter NLF/2026/0010 created for client Mary Njeri', timestamp:'2026-03-06T09:30:00', ip:'192.168.1.1', severity:'info' },
  { id:'au4', userId:'2', userName:'Grace Wanjiku', userRole:'managing_partner', action:'ASSIGN', module:'Matters', details:'Assigned advocate Peter Kamau to NLF/2024/0001', timestamp:'2026-03-06T09:45:00', ip:'192.168.1.2', severity:'info' },
  { id:'au5', userId:'3', userName:'Peter Kamau', userRole:'advocate', action:'UPLOAD', module:'Documents', details:'Uploaded Supporting Affidavit.pdf to NLF/2024/0001', timestamp:'2026-03-06T10:00:00', ip:'192.168.1.3', severity:'info' },
  { id:'au6', userId:'4', userName:'Mary Njeri', userRole:'client', action:'LOGIN', module:'Auth', details:'Client login from mobile device', timestamp:'2026-03-06T10:15:00', ip:'197.248.1.45', severity:'info' },
  { id:'au7', userId:'1', userName:'James Mwangi', userRole:'super_admin', action:'DELETE', module:'Users', details:'Deleted inactive user account ID:99', timestamp:'2026-03-06T10:30:00', ip:'192.168.1.1', severity:'critical' },
  { id:'au8', userId:'2', userName:'Grace Wanjiku', userRole:'managing_partner', action:'EDIT', module:'Billing', details:'Updated invoice NLF-2024-003 amount from 50,000 to 65,000', timestamp:'2026-03-06T10:45:00', ip:'192.168.1.2', severity:'warning' },
  { id:'au9', userId:'3', userName:'Peter Kamau', userRole:'advocate', action:'MESSAGE', module:'Messaging', details:'Sent message to client David Kimani re: hearing date', timestamp:'2026-03-06T11:00:00', ip:'192.168.1.3', severity:'info' },
  { id:'au10', userId:'1', userName:'James Mwangi', userRole:'super_admin', action:'SETTINGS', module:'Settings', details:'Updated firm notification preferences', timestamp:'2026-03-06T11:15:00', ip:'192.168.1.1', severity:'info' },
  { id:'au11', userId:'4', userName:'Mary Njeri', userRole:'client', action:'PAYMENT', module:'Billing', details:'Payment of KES 5,000 consultation fee via M-Pesa', timestamp:'2026-03-06T11:30:00', ip:'197.248.1.45', severity:'info' },
  { id:'au12', userId:'2', userName:'Grace Wanjiku', userRole:'managing_partner', action:'LOGOUT', module:'Auth', details:'Session ended', timestamp:'2026-03-06T12:00:00', ip:'192.168.1.2', severity:'info' },
];

const actionIcon: Record<string, React.ReactNode> = {
  LOGIN: <LogIn className="w-3.5 h-3.5" />,
  LOGOUT: <LogOut className="w-3.5 h-3.5" />,
  VIEW: <Eye className="w-3.5 h-3.5" />,
  CREATE: <FileText className="w-3.5 h-3.5" />,
  EDIT: <Edit className="w-3.5 h-3.5" />,
  DELETE: <Trash2 className="w-3.5 h-3.5" />,
  ASSIGN: <User className="w-3.5 h-3.5" />,
  UPLOAD: <FileText className="w-3.5 h-3.5" />,
  MESSAGE: <MessageCircle className="w-3.5 h-3.5" />,
  PAYMENT: <DollarSign className="w-3.5 h-3.5" />,
  SETTINGS: <Settings className="w-3.5 h-3.5" />,
};

const severityConfig = {
  info: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: <CheckCircle className="w-3 h-3" /> },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <AlertTriangle className="w-3 h-3" /> },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertTriangle className="w-3 h-3" /> },
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#ef4444', managing_partner: '#8b5cf6',
  advocate: '#3b82f6', paralegal: '#10b981', client: '#06b6d4',
};

const AuditTrail: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const isAdmin = ['super_admin', 'managing_partner'].includes(user?.role || '');
  if (!isAdmin) return (
    <div className="p-8 text-center text-[var(--text-secondary)]">
      <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p>Audit trail is restricted to administrators</p>
    </div>
  );

  const modules = ['all', ...Array.from(new Set(AUDIT_LOG.map(a => a.module)))];

  const filtered = AUDIT_LOG.filter(a => {
    const matchSearch = !search || a.userName.toLowerCase().includes(search.toLowerCase()) || a.details.toLowerCase().includes(search.toLowerCase()) || a.action.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchModule = moduleFilter === 'all' || a.module === moduleFilter;
    return matchSearch && matchSeverity && matchModule;
  });

  const stats = {
    total: AUDIT_LOG.length,
    warnings: AUDIT_LOG.filter(a => a.severity === 'warning').length,
    critical: AUDIT_LOG.filter(a => a.severity === 'critical').length,
    today: AUDIT_LOG.filter(a => a.timestamp.startsWith('2026-03-06')).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Audit Trail</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Complete activity log — who did what and when</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats.total, color: '#6b7280' },
          { label: 'Today', value: stats.today, color: '#3b82f6' },
          { label: 'Warnings', value: stats.warnings, color: '#f59e0b' },
          { label: 'Critical', value: stats.critical, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, action, details..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]" />
        </div>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]">
          <option value="all">All Severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]">
          {modules.map(m => <option key={m} value={m} className="capitalize">{m === 'all' ? 'All Modules' : m}</option>)}
        </select>
      </div>

      {/* Log Table */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
        <div className="divide-y divide-[var(--border-color)]">
          {filtered.map(entry => {
            const sev = severityConfig[entry.severity];
            return (
              <div key={entry.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors ${entry.severity === 'critical' ? 'bg-red-500/3' : ''}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: sev.bg, color: sev.color }}>
                  {actionIcon[entry.action] || <Eye className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{entry.userName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${ROLE_COLORS[entry.userRole]}15`, color: ROLE_COLORS[entry.userRole] }}>{entry.userRole.replace('_', ' ')}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--hover-bg)] text-[var(--text-secondary)]">{entry.action}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--border-color)] text-[var(--text-secondary)]">{entry.module}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: sev.bg, color: sev.color }}>{sev.icon}{entry.severity}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{entry.details}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(entry.timestamp).toLocaleString('en-KE')}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">IP: {entry.ip}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--text-secondary)]">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No audit entries found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
