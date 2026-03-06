import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, AlertTriangle, CheckCircle, X, Scale, Users, ChevronDown } from 'lucide-react';

interface ConflictRecord {
  clientName: string;
  opposingParty: string;
  matterRef: string;
  matterTitle: string;
  advocate: string;
  status: string;
}

const CONFLICT_DB: ConflictRecord[] = [
  { clientName:'Safaricom PLC', opposingParty:'Communications Authority of Kenya', matterRef:'NLF/2024/0001', matterTitle:'Safaricom v. Communications Authority', advocate:'Peter Kamau', status:'active' },
  { clientName:'David Kimani', opposingParty:'John Njoroge', matterRef:'NLF/2024/0002', matterTitle:'Kimani Land Title Dispute', advocate:'Grace Wanjiku', status:'active' },
  { clientName:'Republic', opposingParty:'Samuel Kamau', matterRef:'NLF/2024/0005', matterTitle:'Republic vs Kamau', advocate:'Peter Kamau', status:'active' },
  { clientName:'Jane Achieng Ouma', opposingParty:'TechCorp Kenya Ltd', matterRef:'NLF/2024/0004', matterTitle:'Ouma v. TechCorp', advocate:'Grace Wanjiku', status:'active' },
  { clientName:'TechCorp Kenya Ltd', opposingParty:'Former employee', matterRef:'NLF/2023/0012', matterTitle:'TechCorp Employment Dispute', advocate:'Peter Kamau', status:'closed' },
];

const ConflictChecker: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: 'clear' | 'conflict' | 'indirect'; records: ConflictRecord[] } | null>(null);
  const [checking, setChecking] = useState(false);

  const check = () => {
    if (!query.trim()) return;
    setChecking(true);
    setTimeout(() => {
      const q = query.toLowerCase();
      const direct = CONFLICT_DB.filter(r =>
        r.clientName.toLowerCase().includes(q) || r.opposingParty.toLowerCase().includes(q)
      );
      const indirect = CONFLICT_DB.filter(r =>
        !direct.includes(r) && (
          r.matterTitle.toLowerCase().includes(q) || r.advocate.toLowerCase().includes(q)
        )
      );
      if (direct.length > 0) setResults({ type: 'conflict', records: direct });
      else if (indirect.length > 0) setResults({ type: 'indirect', records: indirect });
      else setResults({ type: 'clear', records: [] });
      setChecking(false);
    }, 800);
  };

  const isAdmin = ['super_admin', 'managing_partner', 'advocate'].includes(user?.role || '');
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Conflict Checker</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Check if the firm already represents an opposing party before taking a new case</p>
      </div>

      <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
        <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">Search client or opposing party name</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="e.g. TechCorp Kenya, John Njoroge..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)]" />
          </div>
          <button onClick={check} disabled={checking || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors">
            {checking ? 'Checking...' : 'Check'}
          </button>
        </div>
      </div>

      {results && (
        <div className={`p-6 rounded-2xl border ${results.type === 'conflict' ? 'border-red-500/40 bg-red-500/5' : results.type === 'indirect' ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-green-500/40 bg-green-500/5'}`}>
          <div className="flex items-center gap-3 mb-4">
            {results.type === 'conflict' && <><AlertTriangle className="w-6 h-6 text-red-400" /><div><p className="font-bold text-red-400">Conflict Detected</p><p className="text-xs text-[var(--text-secondary)]">The firm already represents a party related to this name</p></div></>}
            {results.type === 'indirect' && <><AlertTriangle className="w-6 h-6 text-yellow-400" /><div><p className="font-bold text-yellow-400">Possible Indirect Conflict</p><p className="text-xs text-[var(--text-secondary)]">Related records found — review carefully</p></div></>}
            {results.type === 'clear' && <><CheckCircle className="w-6 h-6 text-green-400" /><div><p className="font-bold text-green-400">No Conflict Found</p><p className="text-xs text-[var(--text-secondary)]">No existing matters found for "{query}"</p></div></>}
          </div>
          {results.records.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] mb-2">
              <Scale className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{r.matterTitle}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{r.matterRef} · {r.status}</p>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs text-[var(--text-secondary)]">Client: <span className="text-blue-400">{r.clientName}</span></span>
                  <span className="text-xs text-[var(--text-secondary)]">vs <span className="text-red-400">{r.opposingParty}</span></span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Advocate: {r.advocate}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
        <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">All Active Parties in the System</p>
        <div className="space-y-2">
          {CONFLICT_DB.filter(r => r.status === 'active').map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-[var(--text-secondary)] py-1.5 border-b border-[var(--border-color)] last:border-0">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-blue-400">{r.clientName}</span>
              <span>vs</span>
              <span className="text-red-400">{r.opposingParty}</span>
              <span className="ml-auto opacity-60">{r.matterRef}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConflictChecker;
