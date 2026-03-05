import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { matters, clients, invoices, tasks, calendarEvents, timeEntries } from '@/data/mockData';
import {
  Briefcase, Users, Receipt, Clock, TrendingUp, AlertTriangle, Calendar,
  CheckSquare, ArrowUpRight, ArrowDownRight, FileText, Scale
} from 'lucide-react';

interface DashboardProps {
  setActiveModule: (m: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveModule }) => {
  const { user, hasPermission } = useAuth();

  const activeMatterCount = matters.filter(m => ['active', 'court', 'consultation'].includes(m.status)).length;
  const totalClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paid, 0);
  const outstandingAmount = invoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.amount - i.paid), 0);
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const upcomingEvents = calendarEvents.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
  const recentTasks = tasks.filter(t => t.status !== 'completed').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const billableHours = timeEntries.filter(t => t.billable).reduce((s, t) => s + t.hours, 0);

  const stats = [
    { label: 'Active Matters', value: activeMatterCount, icon: Briefcase, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', change: '+3', up: true, perm: 'matters.view' },
    { label: 'Active Clients', value: totalClients, icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.1)', change: '+5', up: true, perm: 'clients.view' },
    { label: 'Revenue (KES)', value: `${(totalRevenue / 1000000).toFixed(1)}M`, icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', change: '+12%', up: true, perm: 'billing.view' },
    { label: 'Outstanding', value: `${(outstandingAmount / 1000000).toFixed(1)}M`, icon: Receipt, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', change: '-8%', up: false, perm: 'billing.view' },
    { label: 'Pending Tasks', value: pendingTasks, icon: CheckSquare, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', change: `${urgentTasks} urgent`, up: false, perm: 'tasks.view' },
    { label: 'Billable Hours', value: `${billableHours}h`, icon: Clock, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', change: 'This week', up: true, perm: 'time.view' },
  ].filter(s => hasPermission(s.perm));

  const statusColors: Record<string, string> = {
    consultation: '#6b7280', active: '#3b82f6', court: '#ef4444', settled: '#10b981', closed: '#8b5cf6', archived: '#9ca3af',
  };

  const priorityColors: Record<string, string> = {
    low: '#10b981', medium: '#3b82f6', high: '#f59e0b', urgent: '#ef4444',
  };

  const eventTypeColors: Record<string, string> = {
    hearing: '#ef4444', mention: '#f59e0b', deadline: '#dc2626', meeting: '#3b82f6', filing: '#8b5cf6',
  };

  const mattersByStatus = ['consultation', 'active', 'court', 'settled', 'closed'].map(s => ({
    status: s, count: matters.filter(m => m.status === s).length,
    color: statusColors[s],
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Here's what's happening at Nanyuki Law Firm today
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => {
                if (stat.label.includes('Matter')) setActiveModule('matters');
                else if (stat.label.includes('Client')) setActiveModule('clients');
                else if (stat.label.includes('Revenue') || stat.label.includes('Outstanding')) setActiveModule('billing');
                else if (stat.label.includes('Task')) setActiveModule('tasks');
                else if (stat.label.includes('Hour')) setActiveModule('time');
              }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.up ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                    <span className={`text-xs ${stat.up ? 'text-green-500' : 'text-red-500'}`}>{stat.change}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: stat.bg }}>
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matter Pipeline */}
        {hasPermission('matters.view') && (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Matter Pipeline</h3>
              <button onClick={() => setActiveModule('matters')} className="text-xs text-blue-400 hover:text-blue-300">View All</button>
            </div>
            <div className="space-y-3">
              {mattersByStatus.map(s => (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm text-[var(--text-secondary)] capitalize flex-1">{s.status}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{s.count}</span>
                  <div className="w-24 h-2 rounded-full bg-[var(--hover-bg)] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(s.count / matters.length) * 100}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {hasPermission('calendar.view') && (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Upcoming Events</h3>
              <button onClick={() => setActiveModule('calendar')} className="text-xs text-blue-400 hover:text-blue-300">View All</button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map(e => (
                <div key={e.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                  onClick={() => setActiveModule('calendar')}>
                  <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: eventTypeColors[e.type] || '#6b7280' }}>
                    <span>{new Date(e.date).getDate()}</span>
                    <span className="text-[8px] uppercase">{new Date(e.date).toLocaleString('en', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{e.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{e.time} - {e.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tasks */}
        {hasPermission('tasks.view') && (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Pending Tasks</h3>
              <button onClick={() => setActiveModule('tasks')} className="text-xs text-blue-400 hover:text-blue-300">View All</button>
            </div>
            <div className="space-y-3">
              {recentTasks.map(t => (
                <div key={t.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                  onClick={() => setActiveModule('tasks')}>
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: priorityColors[t.priority] }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text-secondary)]">{t.assignedTo}</span>
                      <span className="text-xs text-[var(--text-secondary)]">Due: {new Date(t.dueDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full`}
                    style={{ backgroundColor: `${priorityColors[t.priority]}20`, color: priorityColors[t.priority] }}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Invoices */}
        {hasPermission('billing.view') && (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Overdue Invoices</h3>
              </div>
              <button onClick={() => setActiveModule('billing')} className="text-xs text-blue-400 hover:text-blue-300">View All</button>
            </div>
            {overdueInvoices.length > 0 ? (
              <div className="space-y-3">
                {overdueInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{inv.invoiceNumber}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{inv.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-400">KES {(inv.amount - inv.paid).toLocaleString()}</p>
                      <p className="text-xs text-red-400">Due: {new Date(inv.dueDate).toLocaleDateString('en-KE')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">No overdue invoices</p>
            )}
          </div>
        )}

        {/* Recent Matters */}
        {hasPermission('matters.view') && (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Matters</h3>
              <button onClick={() => setActiveModule('matters')} className="text-xs text-blue-400 hover:text-blue-300">View All</button>
            </div>
            <div className="space-y-3">
              {matters.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                  onClick={() => setActiveModule('matters')}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: statusColors[m.status] }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{m.matterNumber}</p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{m.title}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full capitalize flex-shrink-0"
                    style={{ backgroundColor: `${statusColors[m.status]}20`, color: statusColors[m.status] }}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
