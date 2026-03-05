import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { User, Bell, Shield, Palette, Save, Check } from 'lucide-react';

const SettingsModule: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    deadlines: true, hearings: true, tasks: true, invoices: true, system: true, email: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-blue-600 text-white' : 'bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Profile Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Full Name</label>
              <input type="text" defaultValue={user?.name} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
              <input type="email" defaultValue={user?.email} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone</label>
              <input type="text" defaultValue={user?.phone} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title</label>
              <input type="text" defaultValue={user?.title} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Billing Rate (KES/hr)</label>
              <input type="number" defaultValue={user?.billingRate} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Role</label>
              <input type="text" value={user?.role?.replace('_', ' ') || ''} disabled className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--hover-bg)] text-[var(--text-secondary)] text-sm capitalize" />
            </div>
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Notification Preferences</h3>
          {[
            { key: 'deadlines', label: 'Deadline Reminders', desc: 'Get notified about upcoming deadlines' },
            { key: 'hearings', label: 'Hearing Alerts', desc: 'Notifications for court hearings and mentions' },
            { key: 'tasks', label: 'Task Assignments', desc: 'When tasks are assigned to you' },
            { key: 'invoices', label: 'Invoice Due Dates', desc: 'Reminders for invoice payments' },
            { key: 'system', label: 'System Updates', desc: 'General system notifications' },
            { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between py-3 border-b border-[var(--border-color)] last:border-0">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{n.label}</p>
                <p className="text-xs text-[var(--text-secondary)]">{n.desc}</p>
              </div>
              <button onClick={() => setNotifPrefs(prev => ({ ...prev, [n.key]: !(prev as any)[n.key] }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${(notifPrefs as any)[n.key] ? 'bg-blue-600' : 'bg-gray-400'}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${(notifPrefs as any)[n.key] ? 'translate-x-5.5 left-[1px]' : 'left-[2px]'}`}
                  style={{ transform: (notifPrefs as any)[n.key] ? 'translateX(22px)' : 'translateX(0)' }} />
              </button>
            </div>
          ))}
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Preferences</>}
          </button>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Appearance</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Light', bg: '#ffffff', text: '#1a1a2e' },
              { id: 'dark', label: 'Dark', bg: '#0f1729', text: '#e2e8f0' },
              { id: 'system', label: 'System', bg: 'linear-gradient(135deg, #ffffff 50%, #0f1729 50%)', text: '#6b7280' },
            ].map(t => (
              <button key={t.id} onClick={() => setTheme(t.id as any)}
                className={`p-4 rounded-xl border-2 transition-all ${theme === t.id ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-[var(--border-color)]'}`}>
                <div className="w-full h-16 rounded-lg mb-2" style={{ background: t.bg }} />
                <p className="text-sm font-medium text-[var(--text-primary)]">{t.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Security</h3>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Current Password</label>
            <input type="password" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">New Password</label>
            <input type="password" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Confirm New Password</label>
            <input type="password" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm" />
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
            {saved ? <><Check className="w-4 h-4" /> Updated!</> : <><Save className="w-4 h-4" /> Update Password</>}
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsModule;
