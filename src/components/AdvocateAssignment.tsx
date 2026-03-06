import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Scale, Check, ChevronDown, Search, UserPlus, X, Star, Briefcase, Clock, AlertTriangle } from 'lucide-react';

interface Advocate {
  id: string;
  name: string;
  avatar: string;
  title: string;
  specializations: string[];
  activeMatters: number;
  capacity: number;
  available: boolean;
  rating: number;
}

interface Assignment {
  id: string;
  clientName: string;
  matterRef: string;
  matterTitle: string;
  advocateId: string;
  advocateName: string;
  assignedDate: string;
  status: 'active' | 'pending' | 'completed';
}

const ADVOCATES: Advocate[] = [
  { id: '2', name: 'Grace Wanjiku', avatar: 'GW', title: 'Managing Partner', specializations: ['Land Law', 'Family Law', 'Employment'], activeMatters: 8, capacity: 15, available: true, rating: 4.9 },
  { id: '3', name: 'Peter Kamau', avatar: 'PK', title: 'Senior Advocate', specializations: ['Commercial Law', 'Criminal Defence', 'IP'], activeMatters: 12, capacity: 15, available: true, rating: 4.7 },
  { id: '5', name: 'Alice Muthoni', avatar: 'AM', title: 'Advocate', specializations: ['Civil Litigation', 'Constitutional Law'], activeMatters: 6, capacity: 12, available: true, rating: 4.5 },
  { id: '6', name: 'Brian Odhiambo', avatar: 'BO', title: 'Advocate', specializations: ['Tax Law', 'Commercial Law'], activeMatters: 11, capacity: 12, available: false, rating: 4.3 },
];

const ASSIGNMENTS: Assignment[] = [
  { id: 'a1', clientName: 'Safaricom PLC', matterRef: 'NLF/2024/0001', matterTitle: 'Safaricom v. Communications Authority', advocateId: '3', advocateName: 'Peter Kamau', assignedDate: '2024-01-15', status: 'active' },
  { id: 'a2', clientName: 'David Kimani', matterRef: 'NLF/2024/0002', matterTitle: 'Kimani Land Title Dispute', advocateId: '2', advocateName: 'Grace Wanjiku', assignedDate: '2024-02-01', status: 'active' },
  { id: 'a3', clientName: 'Jane Achieng Ouma', matterRef: 'NLF/2024/0004', matterTitle: 'Ouma v. TechCorp', advocateId: '2', advocateName: 'Grace Wanjiku', assignedDate: '2024-03-10', status: 'active' },
  { id: 'a4', clientName: 'Mary Njeri', matterRef: 'NLF/2026/NEW', matterTitle: 'New Case — Pending Assignment', advocateId: '', advocateName: '', assignedDate: '', status: 'pending' },
];

const CapacityBar: React.FC<{ used: number; total: number }> = ({ used, total }) => {
  const pct = Math.round((used / total) * 100);
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--hover-bg)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-[var(--text-secondary)]">{used}/{total}</span>
    </div>
  );
};

const AdvocateAssignment: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>(ASSIGNMENTS);
  const [search, setSearch] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedAdvocate, setSelectedAdvocate] = useState<string>('');

  const isAdmin = ['super_admin', 'managing_partner'].includes(user?.role || '');
  if (!isAdmin) return <div className="p-8 text-center text-[var(--text-secondary)]"><AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>Access restricted to administrators and managing partners</p></div>;

  const filtered = assignments.filter(a =>
    !search || a.clientName.toLowerCase().includes(search.toLowerCase()) ||
    a.matterTitle.toLowerCase().includes(search.toLowerCase())
  );

  const doAssign = () => {
    if (!selectedAssignment || !selectedAdvocate) return;
    const adv = ADVOCATES.find(a => a.id === selectedAdvocate);
    setAssignments(prev => prev.map(a =>
      a.id === selectedAssignment.id
        ? { ...a, advocateId: selectedAdvocate, advocateName: adv?.name || '', assignedDate: new Date().toISOString().split('T')[0], status: 'active' as const }
        : a
    ));
    setShowAssignModal(false);
    setSelectedAssignment(null);
    setSelectedAdvocate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Advocate Assignment</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Assign advocates to client matters</p>
        </div>
      </div>

      {/* Advocate Capacity Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ADVOCATES.map(adv => (
          <div key={adv.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{adv.avatar}</div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{adv.name.split(' ')[0]}</p>
                <p className="text-[10px] text-[var(--text-secondary)] truncate">{adv.title}</p>
              </div>
            </div>
            <CapacityBar used={adv.activeMatters} total={adv.capacity} />
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /><span className="text-[10px] text-[var(--text-secondary)]">{adv.rating}</span></div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${adv.available ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>{adv.available ? 'Available' : 'Full'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment List */}
      <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients or matters..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]" />
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${a.status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-[var(--border-color)] hover:bg-[var(--hover-bg)]'}`}>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Scale className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{a.matterTitle}</p>
                <p className="text-xs text-[var(--text-secondary)]">{a.clientName} · {a.matterRef}</p>
              </div>
              {a.status === 'pending' ? (
                <button onClick={() => { setSelectedAssignment(a); setShowAssignModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 text-xs font-medium hover:bg-yellow-500/25 transition-colors flex-shrink-0">
                  <UserPlus className="w-3.5 h-3.5" /> Assign
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                    {ADVOCATES.find(adv => adv.id === a.advocateId)?.avatar || '?'}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-[var(--text-primary)]">{a.advocateName}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">Since {a.assignedDate}</p>
                  </div>
                  <button onClick={() => { setSelectedAssignment(a); setShowAssignModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-md border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Assign Advocate</h3>
              <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
            </div>
            <div className="p-3 rounded-xl bg-[var(--hover-bg)] mb-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">{selectedAssignment.matterTitle}</p>
              <p className="text-xs text-[var(--text-secondary)]">{selectedAssignment.clientName} · {selectedAssignment.matterRef}</p>
            </div>
            <div className="space-y-2 mb-5">
              {ADVOCATES.map(adv => (
                <button key={adv.id} onClick={() => setSelectedAdvocate(adv.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedAdvocate === adv.id ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--border-color)] hover:bg-[var(--hover-bg)]'} ${!adv.available ? 'opacity-50' : ''}`}
                  disabled={!adv.available}>
                  <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">{adv.avatar}</div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{adv.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{adv.specializations.slice(0, 2).join(', ')}</p>
                    <CapacityBar used={adv.activeMatters} total={adv.capacity} />
                  </div>
                  {selectedAdvocate === adv.id && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                  {!adv.available && <span className="text-[10px] text-red-400 flex-shrink-0">Full</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-secondary)]">Cancel</button>
              <button onClick={doAssign} disabled={!selectedAdvocate} className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvocateAssignment;
