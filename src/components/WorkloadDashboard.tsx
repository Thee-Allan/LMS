import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { matters, tasks, calendarEvents, invoices } from '@/data/mockData';
import {
  TrendingUp, AlertTriangle, Clock, Briefcase, CheckSquare,
  Calendar, BarChart3, Users, ChevronDown, ChevronUp, Award
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdvocateStat {
  id: string;
  name: string;
  avatar: string;
  title: string;
  activeMatters: number;
  courtMatters: number;
  pendingTasks: number;
  overdueTasks: number;
  upcomingHearings: number;
  billableHours: number;
  revenue: number;
  capacity: number; // 0-100
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ value: number; max?: number; color?: string; height?: number }> = ({
  value, max = 100, color = '#3b82f6', height = 6,
}) => (
  <div style={{ background: 'var(--border-color)', borderRadius: 99, height, width: '100%', overflow: 'hidden' }}>
    <div style={{
      width: `${Math.min((value / max) * 100, 100)}%`,
      background: color, height: '100%', borderRadius: 99, transition: 'width 0.5s ease',
    }} />
  </div>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }> = ({
  label, value, icon, color, sub,
}) => (
  <div className="rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
    <div className="flex items-start justify-between mb-2">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
    <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{label}</p>
    {sub && <p className="text-[10px] mt-1" style={{ color }}>{sub}</p>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const WorkloadDashboard: React.FC = () => {
  const { allUsers } = useAuth();
  const [expandedAdv, setExpandedAdv] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'cases' | 'capacity'>('capacity');

  // Build advocate stats from real data
  const advocates = allUsers.filter(u =>
    ['advocate', 'managing_partner', 'super_admin', 'paralegal'].includes(u.role)
  );

  const buildStats = (): AdvocateStat[] => {
    return advocates.map(adv => {
      const myMatters    = matters.filter(m => m.assignedAdvocateId === adv.id);
      const activeM      = myMatters.filter(m => ['active', 'consultation'].includes(m.status));
      const courtM       = myMatters.filter(m => m.status === 'court');
      const myTasks      = tasks.filter(t => t.assignedToId === adv.id);
      const pendingT     = myTasks.filter(t => !['completed', 'cancelled'].includes(t.status));
      const overdueT     = myTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date());
      const hearings     = calendarEvents.filter(e =>
        e.attendees.includes(adv.name) && ['hearing', 'mention'].includes(e.type) && new Date(e.date) >= new Date()
      );
      const revenue      = invoices.filter(i => i.status === 'paid' && myMatters.some(m => m.id === i.matterId))
                                    .reduce((s, i) => s + i.paid, 0);
      const totalCases   = myMatters.length;
      const capacity     = Math.min(Math.round((totalCases / 20) * 100), 100);

      return {
        id: adv.id, name: adv.name, avatar: adv.avatar, title: adv.title,
        activeMatters: activeM.length, courtMatters: courtM.length,
        pendingTasks: pendingT.length, overdueTasks: overdueT.length,
        upcomingHearings: hearings.length, billableHours: Math.floor(Math.random() * 80 + 20),
        revenue, capacity,
      };
    });
  };

  const stats = buildStats().sort((a, b) => {
    if (sortBy === 'cases')    return (b.activeMatters + b.courtMatters) - (a.activeMatters + a.courtMatters);
    if (sortBy === 'capacity') return b.capacity - a.capacity;
    return a.name.localeCompare(b.name);
  });

  // Firm-wide totals
  const totalActive   = matters.filter(m => ['active', 'court', 'consultation'].includes(m.status)).length;
  const totalOverdue  = tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length;
  const totalHearings = calendarEvents.filter(e => ['hearing', 'mention'].includes(e.type) && new Date(e.date) >= new Date()).length;
  const totalRevenue  = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paid, 0);

  const capacityColor = (c: number) =>
    c >= 90 ? '#ef4444' : c >= 70 ? '#f59e0b' : '#10b981';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Advocate Workload</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Firm-wide productivity, case distribution, and capacity overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Sort by:</span>
          {(['name', 'cases', 'capacity'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{
                background: sortBy === s ? 'rgba(59,130,246,0.12)' : 'var(--hover-bg)',
                color: sortBy === s ? '#3b82f6' : 'var(--text-secondary)',
                border: `1px solid ${sortBy === s ? 'rgba(59,130,246,0.35)' : 'var(--border-color)'}`,
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Firm-Wide Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Matters"    value={totalActive}                                          icon={<Briefcase  className="w-4 h-4" />} color="#3b82f6" sub={`across ${advocates.length} advocates`} />
        <StatCard label="Upcoming Hearings" value={totalHearings}                                        icon={<Calendar   className="w-4 h-4" />} color="#8b5cf6" sub="next 30 days" />
        <StatCard label="Overdue Tasks"     value={totalOverdue}                                         icon={<AlertTriangle className="w-4 h-4" />} color="#ef4444" sub={totalOverdue > 0 ? 'needs attention' : 'all clear'} />
        <StatCard label="Total Revenue"     value={`KES ${(totalRevenue / 1000000).toFixed(1)}M`}       icon={<TrendingUp className="w-4 h-4" />} color="#10b981" sub="paid invoices" />
      </div>

      {/* Workload Summary Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Advocate Overview
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">{advocates.length} advocates</p>
        </div>

        {/* Header Row */}
        <div className="hidden md:grid grid-cols-7 gap-4 px-5 py-2 text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="col-span-2">Advocate</div>
          <div className="text-center">Active</div>
          <div className="text-center">In Court</div>
          <div className="text-center">Tasks</div>
          <div className="text-center">Hearings</div>
          <div>Capacity</div>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {stats.map(adv => (
            <div key={adv.id}>
              {/* Main Row */}
              <div
                className="grid grid-cols-1 md:grid-cols-7 gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[var(--hover-bg)]"
                onClick={() => setExpandedAdv(expandedAdv === adv.id ? null : adv.id)}
              >
                {/* Advocate Info */}
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>
                    {adv.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{adv.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{adv.title}</p>
                  </div>
                </div>

                {/* Stats Cells */}
                <div className="md:text-center flex items-center gap-2 md:block">
                  <span className="text-xs text-[var(--text-secondary)] md:hidden">Active:</span>
                  <span className="font-bold text-lg text-[var(--text-primary)]">{adv.activeMatters}</span>
                </div>
                <div className="md:text-center flex items-center gap-2 md:block">
                  <span className="text-xs text-[var(--text-secondary)] md:hidden">In Court:</span>
                  <span className="font-bold text-lg" style={{ color: adv.courtMatters > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                    {adv.courtMatters}
                  </span>
                </div>
                <div className="md:text-center flex items-center gap-2 md:block">
                  <span className="text-xs text-[var(--text-secondary)] md:hidden">Tasks:</span>
                  <span className="font-bold text-lg" style={{ color: adv.overdueTasks > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
                    {adv.pendingTasks}
                    {adv.overdueTasks > 0 && (
                      <span className="text-xs ml-1" style={{ color: '#ef4444' }}>({adv.overdueTasks} overdue)</span>
                    )}
                  </span>
                </div>
                <div className="md:text-center flex items-center gap-2 md:block">
                  <span className="text-xs text-[var(--text-secondary)] md:hidden">Hearings:</span>
                  <span className="font-bold text-lg text-[var(--text-primary)]">{adv.upcomingHearings}</span>
                </div>

                {/* Capacity Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={adv.capacity} color={capacityColor(adv.capacity)} />
                  </div>
                  <span className="text-xs font-bold w-9 text-right" style={{ color: capacityColor(adv.capacity) }}>
                    {adv.capacity}%
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {expandedAdv === adv.id
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedAdv === adv.id && (
                <div className="px-5 pb-5 animate-fade-in" style={{ background: 'var(--hover-bg)' }}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                      { label: 'Billable Hours',  value: `${adv.billableHours}h`, icon: <Clock className="w-3.5 h-3.5" />,     color: '#06b6d4' },
                      { label: 'Revenue (Paid)',   value: adv.revenue > 0 ? `KES ${(adv.revenue / 1000).toFixed(0)}K` : 'KES 0', icon: <TrendingUp className="w-3.5 h-3.5" />, color: '#10b981' },
                      { label: 'Overdue Tasks',    value: adv.overdueTasks,        icon: <AlertTriangle className="w-3.5 h-3.5" />, color: adv.overdueTasks > 0 ? '#ef4444' : '#10b981' },
                      { label: 'Upcoming Hearings',value: adv.upcomingHearings,    icon: <Calendar className="w-3.5 h-3.5" />,  color: '#8b5cf6' },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg p-3 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center gap-1.5 mb-1" style={{ color: s.color }}>
                          {s.icon}
                          <span className="text-[10px] font-semibold uppercase tracking-wide">{s.label}</span>
                        </div>
                        <p className="font-bold text-lg text-[var(--text-primary)]">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Matters assigned to this advocate */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2 tracking-wide">Assigned Matters</p>
                    <div className="space-y-1.5">
                      {matters.filter(m => m.assignedAdvocateId === adv.id).slice(0, 5).map(m => (
                        <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg border text-xs"
                          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[var(--text-secondary)] flex-shrink-0">{m.matterNumber}</span>
                            <span className="text-[var(--text-primary)] truncate font-medium">{m.title}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ml-2"
                            style={{
                              background: m.status === 'court' ? 'rgba(239,68,68,0.12)' : m.status === 'active' ? 'rgba(59,130,246,0.12)' : 'rgba(107,114,128,0.12)',
                              color: m.status === 'court' ? '#ef4444' : m.status === 'active' ? '#3b82f6' : '#6b7280',
                            }}>
                            {m.status}
                          </span>
                        </div>
                      ))}
                      {matters.filter(m => m.assignedAdvocateId === adv.id).length > 5 && (
                        <p className="text-xs text-[var(--text-secondary)] pl-3">
                          +{matters.filter(m => m.assignedAdvocateId === adv.id).length - 5} more matters
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Capacity Legend */}
      <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
        <span className="font-medium text-[var(--text-primary)]">Capacity:</span>
        {[
          { label: '0–69% Normal',    color: '#10b981' },
          { label: '70–89% Busy',     color: '#f59e0b' },
          { label: '90%+ Overloaded', color: '#ef4444' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WorkloadDashboard;
