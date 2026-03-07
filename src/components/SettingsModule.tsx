import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { User, Bell, Shield, Palette, Save, Check, Camera, Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';

// ─── Profile Photo Uploader ───────────────────────────────────────────────────

interface ProfilePhotoProps {
  value: string;
  onChange: (dataUrl: string) => void;
  name: string;
  roleColor?: string;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ value, onChange, name, roleColor = '#3b82f6' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const isPhoto = value?.startsWith('data:image');
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const processFile = (file: File) => {
    setError('');
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 400;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w === 0 || h === 0) { onChange(result); return; }
        if (w > max || h > max) {
          if (w > h) { h = Math.round((h * max) / w); w = max; }
          else { w = Math.round((w * max) / h); h = max; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { onChange(result); return; }
        ctx.drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => onChange(result);
      img.src = result;
    };
    reader.onerror = () => setError('Failed to read file. Please try again.');
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) { processFile(file); break; }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  return (
    <div
      className="rounded-2xl border p-6 space-y-4"
      style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Camera className="w-4 h-4" style={{ color: roleColor }} />
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Profile Photo</h4>
        {!isPhoto && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
            ⚠ No photo set
          </span>
        )}
        {isPhoto && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            ✓ Photo set
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div
          className="relative flex-shrink-0 cursor-pointer group"
          style={{ width: 100, height: 100 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div
            className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center transition-all"
            style={{
              background: isPhoto ? 'transparent' : roleColor + '20',
              border: dragging
                ? `2px dashed ${roleColor}`
                : isPhoto
                ? `3px solid ${roleColor}60`
                : `2px dashed ${roleColor}50`,
              boxShadow: isPhoto ? `0 4px 24px ${roleColor}25` : 'none',
            }}
          >
            {isPhoto
              ? <img src={value} alt={name} className="w-full h-full object-cover" />
              : <span className="text-3xl font-bold" style={{ color: roleColor }}>{initials}</span>
            }
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <Camera className="w-6 h-6 text-white" />
            <span className="text-white text-[10px] font-semibold">Change</span>
          </div>

          {/* Remove button */}
          {isPhoto && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(''); }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: '#ef4444', border: '2px solid var(--card-bg)' }}
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
          {isPhoto && (
            <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#10b981', border: '2px solid var(--card-bg)' }}>
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Upload actions */}
        <div className="flex-1 space-y-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-full justify-center transition-all"
            style={{ background: roleColor + '15', color: roleColor, border: `1px solid ${roleColor}40` }}
          >
            <Upload className="w-4 h-4" />
            {isPhoto ? 'Change Photo' : 'Upload Photo'}
          </button>
          <div className="text-center space-y-1">
            <p className="text-xs text-[var(--text-secondary)]">
              Or drag & drop here
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Or press <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--border-color)', color: 'var(--text-secondary)' }}>Ctrl+V</kbd> to paste from clipboard
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] opacity-60">JPG · PNG · WEBP · Max 5MB</p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#ef4444' }}>
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) processFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

// ─── Role colours (match UsersModule) ────────────────────────────────────────

const roleColors: Record<string, string> = {
  super_admin: '#ef4444', managing_partner: '#8b5cf6', advocate: '#3b82f6',
  paralegal: '#10b981', accountant: '#f59e0b', reception: '#ec4899', client: '#06b6d4',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const SettingsModule: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>(
    user?.avatar?.startsWith('data:image') ? user.avatar : ''
  );
  const [notifPrefs, setNotifPrefs] = useState({
    deadlines: true, hearings: true, tasks: true, invoices: true, system: true, email: false,
  });

  const roleColor = roleColors[user?.role || ''] || '#3b82f6';
  const hasPhoto = !!photoDataUrl;

  const handleSave = () => {
    // In a real app: call usersApi.update with photoDataUrl
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: User    },
    { id: 'notifications', label: 'Notifications', icon: Bell    },
    { id: 'appearance',    label: 'Appearance',    icon: Palette },
    { id: 'security',      label: 'Security',      icon: Shield  },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      {/* Tab buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
              {t.id === 'profile' && !hasPhoto && (
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="No photo set" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-5 max-w-2xl">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Profile Information</h3>

          {/* No-photo warning banner */}
          {!hasPhoto && (
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} />
              <p className="text-xs text-[var(--text-secondary)]">
                <span className="font-semibold" style={{ color: '#f59e0b' }}>Your profile has no photo.</span>{' '}
                Adding one helps colleagues and clients identify you easily.
              </p>
            </div>
          )}

          {/* Photo uploader */}
          <ProfilePhoto
            value={photoDataUrl}
            onChange={setPhotoDataUrl}
            name={user?.name || ''}
            roleColor={roleColor}
          />

          {/* Other fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Full Name</label>
              <input
                type="text"
                defaultValue={user?.name}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
              <input
                type="email"
                defaultValue={user?.email}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone</label>
              <input
                type="text"
                defaultValue={user?.phone}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title</label>
              <input
                type="text"
                defaultValue={user?.title}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Billing Rate (KES/hr)</label>
              <input
                type="number"
                defaultValue={user?.billingRate}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Role</label>
              <input
                type="text"
                value={user?.role?.replace(/_/g, ' ') || ''}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--hover-bg)] text-[var(--text-secondary)] text-sm capitalize"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all"
            style={{ background: saved ? '#10b981' : '#2563eb' }}
          >
            {saved
              ? <><Check className="w-4 h-4" /> Saved!</>
              : <><Save className="w-4 h-4" /> Save Changes</>
            }
          </button>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Notification Preferences</h3>
          {[
            { key: 'deadlines', label: 'Deadline Reminders',  desc: 'Get notified about upcoming deadlines' },
            { key: 'hearings',  label: 'Hearing Alerts',      desc: 'Notifications for court hearings and mentions' },
            { key: 'tasks',     label: 'Task Assignments',    desc: 'When tasks are assigned to you' },
            { key: 'invoices',  label: 'Invoice Due Dates',   desc: 'Reminders for invoice payments' },
            { key: 'system',    label: 'System Updates',      desc: 'General system notifications' },
            { key: 'email',     label: 'Email Notifications', desc: 'Receive notifications via email' },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between py-3 border-b border-[var(--border-color)] last:border-0">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{n.label}</p>
                <p className="text-xs text-[var(--text-secondary)]">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifPrefs(prev => ({ ...prev, [n.key]: !(prev as any)[n.key] }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${(notifPrefs as any)[n.key] ? 'bg-blue-600' : 'bg-gray-400'}`}
              >
                <div
                  className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform"
                  style={{ transform: (notifPrefs as any)[n.key] ? 'translateX(22px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          ))}
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Preferences</>}
          </button>
        </div>
      )}

      {/* ── APPEARANCE TAB ── */}
      {activeTab === 'appearance' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Appearance</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'light',  label: 'Light',  bg: '#ffffff',                                       text: '#1a1a2e' },
              { id: 'dark',   label: 'Dark',   bg: '#0f1729',                                       text: '#e2e8f0' },
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

      {/* ── SECURITY TAB ── */}
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
