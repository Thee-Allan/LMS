import React, { useState } from 'react';
import { matters, clients, invoices, timeEntries, tasks } from '@/data/mockData';
import { BarChart3, TrendingUp, Users, Briefcase, Download, FileText } from 'lucide-react';
import { downloadReportPDF } from '@/lib/pdfGenerator';

const ReportsModule: React.FC = () => {
  const [activeReport, setActiveReport] = useState('overview');

  const mattersByArea = ['Commercial', 'Land', 'Criminal', 'Employment', 'Family', 'IP'].map(area => ({
    area, count: matters.filter(m => m.practiceArea === area).length,
    value: matters.filter(m => m.practiceArea === area).reduce((s, m) => s + m.value, 0),
  }));

  const mattersByStatus = ['consultation', 'active', 'court', 'settled', 'closed'].map(status => ({
    status, count: matters.filter(m => m.status === status).length,
  }));

  const revenueByMonth = [
    { month: 'Jan', revenue: 1530000, collected: 1350000 },
    { month: 'Feb', revenue: 1830000, collected: 1180000 },
  ];

  const advocatePerformance = [
    { name: 'Grace Wanjiku', matters: matters.filter(m => m.assignedAdvocateId === '2').length, hours: timeEntries.filter(t => t.userId === '2').reduce((s, t) => s + t.hours, 0), revenue: timeEntries.filter(t => t.userId === '2' && t.billable).reduce((s, t) => s + t.hours * t.rate, 0) },
    { name: 'Peter Kamau', matters: matters.filter(m => m.assignedAdvocateId === '3').length, hours: timeEntries.filter(t => t.userId === '3').reduce((s, t) => s + t.hours, 0), revenue: timeEntries.filter(t => t.userId === '3' && t.billable).reduce((s, t) => s + t.hours * t.rate, 0) },
  ];

  const maxMatterCount = Math.max(...mattersByArea.map(m => m.count), 1);
  const maxStatusCount = Math.max(...mattersByStatus.map(m => m.count), 1);

  const reports = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'matters', label: 'Matters', icon: Briefcase },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'advocates', label: 'Advocates', icon: Users },
  ];

  const exportReport = async () => {
    const reportTitles: Record<string,string> = { overview: 'Overview Report', matters: 'Matters Report', revenue: 'Revenue Report', advocates: 'Advocates Report' };
    const sections = activeReport === 'matters'
      ? [{ heading: 'Matters by Practice Area', rows: mattersByArea.map(m => [`${m.area}`, `${m.count} matters  |  KES ${m.value.toLocaleString()}`] as [string,string]) }]
      : activeReport === 'revenue'
      ? [{ heading: 'Monthly Revenue', rows: revenueByMonth.map(r => [`${r.month}`, `Revenue: KES ${r.revenue.toLocaleString()}  |  Collected: KES ${r.collected.toLocaleString()}`] as [string,string]) }]
      : activeReport === 'advocates'
      ? [{ heading: 'Advocate Performance', rows: advocatePerformance.map(a => [a.name, `${a.matters} matters  |  ${a.hours}h  |  KES ${a.revenue.toLocaleString()}`] as [string,string]) }]
      : [
          { heading: 'Key Metrics', rows: [['Total Matters', String(matters.length)], ['Active Clients', String(clients.filter(c=>c.status==='active').length)], ['Total Invoiced', 'KES ' + (invoices.reduce((s,i)=>s+i.amount,0)/1000000).toFixed(1)+'M'], ['Collected', 'KES ' + (invoices.reduce((s,i)=>s+i.paid,0)/1000000).toFixed(1)+'M']] as [string,string][] }
        ];
    await downloadReportPDF({ title: reportTitles[activeReport] || activeReport, sections });
  };

  const statusColors: Record<string, string> = { consultation: '#6b7280', active: '#3b82f6', court: '#ef4444', settled: '#10b981', closed: '#8b5cf6' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports & Analytics</h1>
          <p className="text-sm text-[var(--text-secondary)]">Firm performance insights</p>
        </div>
        <button onClick={exportReport} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
          <FileText className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {reports.map(r => {
          const Icon = r.icon;
          return (
            <button key={r.id} onClick={() => setActiveReport(r.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeReport === r.id ? 'bg-blue-600 text-white' : 'bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'}`}>
              <Icon className="w-4 h-4" /> {r.label}
            </button>
          );
        })}
      </div>

      {activeReport === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Key Metrics</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Matters', value: matters.length, color: '#3b82f6' },
                { label: 'Active Clients', value: clients.filter(c => c.status === 'active').length, color: '#10b981' },
                { label: 'Total Invoiced', value: `KES ${(invoices.reduce((s, i) => s + i.amount, 0) / 1000000).toFixed(1)}M`, color: '#8b5cf6' },
                { label: 'Collected', value: `KES ${(invoices.reduce((s, i) => s + i.paid, 0) / 1000000).toFixed(1)}M`, color: '#f59e0b' },
                { label: 'Pending Tasks', value: tasks.filter(t => t.status !== 'completed').length, color: '#ef4444' },
                { label: 'Total Hours', value: `${timeEntries.reduce((s, t) => s + t.hours, 0).toFixed(1)}h`, color: '#06b6d4' },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-sm text-[var(--text-secondary)]">{m.label}</span>
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Matter Status Distribution</h3>
            <div className="space-y-3">
              {mattersByStatus.map(s => (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[var(--text-secondary)] capitalize">{s.status}</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{s.count}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[var(--hover-bg)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(s.count / maxStatusCount) * 100}%`, backgroundColor: statusColors[s.status] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'matters' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Matters by Practice Area</h3>
          <div className="space-y-4">
            {mattersByArea.map(m => (
              <div key={m.area}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--text-secondary)]">{m.area}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--text-secondary)]">KES {(m.value / 1000000).toFixed(1)}M</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{m.count} matters</span>
                  </div>
                </div>
                <div className="w-full h-4 rounded-full bg-[var(--hover-bg)] overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${(m.count / maxMatterCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeReport === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Monthly Revenue</h3>
            <div className="space-y-4">
              {revenueByMonth.map(r => (
                <div key={r.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{r.month} 2026</span>
                    <span className="text-sm text-[var(--text-secondary)]">KES {(r.revenue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[var(--hover-bg)] overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${(r.collected / r.revenue) * 100}%` }} />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">Collected: KES {(r.collected / 1000).toFixed(0)}K ({((r.collected / r.revenue) * 100).toFixed(0)}%)</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Invoice Aging</h3>
            <div className="space-y-3">
              {[
                { label: 'Current', count: invoices.filter(i => i.status === 'sent').length, amount: invoices.filter(i => i.status === 'sent').reduce((s, i) => s + (i.amount - i.paid), 0), color: '#3b82f6' },
                { label: 'Partial', count: invoices.filter(i => i.status === 'partial').length, amount: invoices.filter(i => i.status === 'partial').reduce((s, i) => s + (i.amount - i.paid), 0), color: '#f59e0b' },
                { label: 'Overdue', count: invoices.filter(i => i.status === 'overdue').length, amount: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.amount - i.paid), 0), color: '#ef4444' },
                { label: 'Paid', count: invoices.filter(i => i.status === 'paid').length, amount: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.paid, 0), color: '#10b981' },
              ].map(a => (
                <div key={a.label} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${a.color}08` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="text-sm text-[var(--text-primary)]">{a.label}</span>
                    <span className="text-xs text-[var(--text-secondary)]">({a.count})</span>
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">KES {(a.amount / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'advocates' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Advocate</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Matters</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Hours</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Revenue</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Avg/Matter</th>
              </tr>
            </thead>
            <tbody>
              {advocatePerformance.map(a => (
                <tr key={a.name} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)]">
                  <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">{a.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-primary)] text-right">{a.matters}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-primary)] text-right">{a.hours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)] text-right">KES {a.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)] text-right">KES {a.matters > 0 ? (a.revenue / a.matters).toLocaleString() : '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsModule;
