import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Clock, Calendar, Bell, Check, Plus, X, ChevronRight, Scale, FileText } from 'lucide-react';

interface Deadline {
  id: string;
  title: string;
  matter: string;
  matterRef: string;
  type: 'hearing' | 'filing' | 'reply' | 'mention' | 'submission' | 'appeal' | 'payment';
  dueDate: string;
  daysLeft: number;
  assignedTo: string;
  assignedRole: string;
  notifyRoles: string[];
  status: 'pending' | 'done' | 'overdue';
  remindersSent: string[];
}

const DEADLINES: Deadline[] = [
  { id:'d1', title:'Court Hearing — Mention', matter:'Mwangi vs KPLC', matterRef:'NLF/2024/0001', type:'hearing', dueDate:'2026-03-07', daysLeft:1, assignedTo:'Peter Kamau', assignedRole:'advocate', notifyRoles:['super_admin','managing_partner','advocate'], status:'pending', remindersSent:['7d','3d','1d'] },
  { id:'d2', title:'Reply to Defence Due', matter:'Safaricom v. Communications Authority', matterRef:'NLF/2024/0003', type:'reply', dueDate:'2026-03-09', daysLeft:3, assignedTo:'Peter Kamau', assignedRole:'advocate', notifyRoles:['super_admin','managing_partner','advocate'], status:'pending', remindersSent:['7d','3d'] },
  { id:'d3', title:'eFiling Submission Deadline', matter:'Kimani Land Title Dispute', matterRef:'NLF/2024/0002', type:'filing', dueDate:'2026-03-12', daysLeft:6, assignedTo:'Grace Wanjiku', assignedRole:'managing_partner', notifyRoles:['super_admin','managing_partner','advocate'], status:'pending', remindersSent:['7d'] },
  { id:'d4', title:'Court Hearing — Full Hearing', matter:'Republic vs Kamau', matterRef:'NLF/2024/0005', type:'hearing', dueDate:'2026-03-14', daysLeft:8, assignedTo:'Peter Kamau', assignedRole:'advocate', notifyRoles:['super_admin','managing_partner','advocate'], status:'pending', remindersSent:[] },
  { id:'d5', title:'Written Submissions Due', matter:'Ouma v. TechCorp', matterRef:'NLF/2024/0004', type:'submission', dueDate:'2026-03-18', daysLeft:12, assignedTo:'Grace Wanjiku', assignedRole:'managing_partner', notifyRoles:['super_admin','managing_partner','advocate'], status:'pending', remindersSent:[] },
  { id:'d6', title:'Invoice Payment Overdue', matter:'Njoroge Family Estate', matterRef:'NLF/2024/0006', type:'payment', dueDate:'2026-02-28', daysLeft:-6, assignedTo:'James Mwangi', assignedRole:'super_admin', notifyRoles:['super_admin','managing_partner','accountant'], status:'overdue', remindersSent:['7d','3d','1d','0d'] },
];

const typeColors: Record<string, string> = {
  hearing: '#3b82f6', filing: '#8b5cf6', reply: '#ef4444',
  mention: '#06b6d4', submission: '#f59e0b', appeal: '#ec4899', payment: '#10b981',
};

const typeIcons: Record<string, React.ReactNode> = {
  hearing: <Scale className="w-3.5 h-3.5" />,
  filing: <FileText className="w-3.5 h-3.5" />,
  reply: <AlertTriangle className="w-3.5 h-3.5" />,
  mention: <Calendar className="w-3.5 h-3.5" />,
  submission: <FileText className="w-3.5 h-3.5" />,
  appeal: <Scale className="w-3.5 h-3.5" />,
  payment: <Clock className="w-3.5 h-3.5" />,
};

const urgencyConfig = (days: number) => {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', ring: 'ring-red-500/30' };
  if (days === 0) return { label: 'Due today', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', ring: 'ring-red-500/30' };
  if (days === 1) return { label: 'Tomorrow', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', ring: 'ring-yellow-500/30' };
  if (days <= 3) return { label: `${days}d left`, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', ring: 'ring-yellow-500/20' };
  if (days <= 7) return { label: `${days}d left`, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', ring: 'ring-blue-500/20' };
  return { label: `${days}d left`, color: '#6b7280', bg: 'rgba(107,114,128,0.08)', ring: '' };
};

const DeadlineIntelligence: React.FC = () => {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<Deadline[]>(DEADLINES);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'week'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ title: '', matter: '', type: 'hearing', dueDate: '' });

  const isAdmin = ['super_admin', 'managing_partner'].includes(user?.role || '');

  const myDeadlines = deadlines.filter(d =>
    d.notifyRoles.includes(user?.role || '') || user?.role === 'super_admin'
  );

  const filtered = myDeadlines.filter(d => {
    if (filter === 'overdue') return d.daysLeft < 0;
    if (filter === 'today') return d.daysLeft === 0;
    if (filter === 'week') return d.daysLeft >= 0 && d.daysLeft <= 7;
    return true;
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  const markDone = (id: string) => setDeadlines(prev => prev.map(d => d.id === id ? { ...d, status: 'done' } : d));

  const stats = {
    overdue: myDeadlines.filter(d => d.daysLeft < 0 && d.status !== 'done').length,
    today: myDeadlines.filter(d => d.daysLeft === 0 && d.status !== 'done').length,
    thisWeek: myDeadlines.filter(d => d.daysLeft > 0 && d.daysLeft <= 7 && d.status !== 'done').length,
    upcoming: myDeadlines.filter(d => d.daysLeft > 7 && d.status !== 'done').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Deadline Intelligence</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Automated court & filing reminders</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Deadline
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overdue', value: stats.overdue, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertTriangle className="w-5 h-5" /> },
          { label: 'Due Today', value: stats.today, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock className="w-5 h-5" /> },
          { label: 'This Week', value: stats.thisWeek, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Calendar className="w-5 h-5" /> },
          { label: 'Upcoming', value: stats.upcoming, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <Bell className="w-5 h-5" /> },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'overdue', 'today', 'week'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            {f === 'week' ? 'This Week' : f}
          </button>
        ))}
      </div>

      {/* Deadline List */}
      <div className="space-y-3">
        {filtered.map(d => {
          const urg = urgencyConfig(d.daysLeft);
          const isDone = d.status === 'done';
          return (
            <div key={d.id} className={`p-4 rounded-xl border bg-[var(--card-bg)] transition-all ${isDone ? 'opacity-50' : `ring-1 ${urg.ring} border-[var(--border-color)]`}`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${typeColors[d.type]}20`, color: typeColors[d.type] }}>
                  {typeIcons[d.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold text-[var(--text-primary)] ${isDone ? 'line-through' : ''}`}>{d.title}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize" style={{ background: urg.bg, color: urg.color }}>{urg.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: `${typeColors[d.type]}15`, color: typeColors[d.type] }}>{d.type}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{d.matter} · <span className="opacity-70">{d.matterRef}</span></p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(d.dueDate).toLocaleDateString('en-KE', { weekday:'short', day:'numeric', month:'short' })}</span>
                    <span className="text-[11px] text-[var(--text-secondary)]">→ {d.assignedTo}</span>
                  </div>
                  {d.remindersSent.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Bell className="w-3 h-3 text-[var(--text-secondary)]" />
                      <span className="text-[10px] text-[var(--text-secondary)]">Reminders sent: {d.remindersSent.join(', ')}</span>
                    </div>
                  )}
                </div>
                {!isDone && (
                  <button onClick={() => markDone(d.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex-shrink-0">
                    <Check className="w-3 h-3" /> Done
                  </button>
                )}
                {isDone && <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Done</span>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No deadlines in this view</p>
          </div>
        )}
      </div>

      {/* Add Deadline Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-md border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add Deadline</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
            </div>
            <div className="space-y-3">
              <input value={newDeadline.title} onChange={e => setNewDeadline(p => ({ ...p, title: e.target.value }))}
                placeholder="Deadline title" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]" />
              <input value={newDeadline.matter} onChange={e => setNewDeadline(p => ({ ...p, matter: e.target.value }))}
                placeholder="Matter name" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]" />
              <select value={newDeadline.type} onChange={e => setNewDeadline(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]">
                {['hearing','filing','reply','mention','submission','appeal','payment'].map(t => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
              <input type="date" value={newDeadline.dueDate} onChange={e => setNewDeadline(p => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-secondary)]">Cancel</button>
              <button onClick={() => {
                if (!newDeadline.title || !newDeadline.dueDate) return;
                const due = new Date(newDeadline.dueDate);
                const today = new Date();
                const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                setDeadlines(prev => [...prev, {
                  id: `d${Date.now()}`, title: newDeadline.title, matter: newDeadline.matter,
                  matterRef: 'NLF/2026/NEW', type: newDeadline.type as Deadline['type'],
                  dueDate: newDeadline.dueDate, daysLeft: days,
                  assignedTo: user?.name || '', assignedRole: user?.role || '',
                  notifyRoles: ['super_admin','managing_partner','advocate'],
                  status: days < 0 ? 'overdue' : 'pending', remindersSent: [],
                }]);
                setShowAdd(false);
                setNewDeadline({ title: '', matter: '', type: 'hearing', dueDate: '' });
              }} className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadlineIntelligence;
