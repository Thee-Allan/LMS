import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api';
import {
  Shield, User, Mail, Phone, Clock, Plus, Edit2, Ban, CheckCircle,
  X, Eye, EyeOff, Search, Camera, Upload, ImagePlus, Trash2
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const roleColors: Record<string, string> = {
  super_admin: '#ef4444', managing_partner: '#8b5cf6', advocate: '#3b82f6',
  paralegal: '#10b981', accountant: '#f59e0b', reception: '#ec4899', client: '#06b6d4',
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin', managing_partner: 'Managing Partner', advocate: 'Advocate',
  paralegal: 'Paralegal', accountant: 'Accountant', reception: 'Reception', client: 'Client',
};

const rolePermissions: Record<string, string[]> = {
  super_admin:      ['Full system access', 'Manage users', 'All modules', 'System settings'],
  managing_partner: ['All client & matter access', 'Billing approval', 'Reports', 'User view'],
  advocate:         ['Clients', 'Matters', 'Tasks', 'Calendar', 'Documents', 'Time tracking'],
  paralegal:        ['Clients (view/create)', 'Matters (view)', 'Tasks', 'Documents', 'Time tracking'],
  accountant:       ['Billing', 'Invoices', 'Time approval', 'Financial reports'],
  reception:        ['Clients (view/create)', 'Matters (view)', 'Calendar', 'Tasks (view)'],
  client:           ['Own matters (view)', 'Own documents (view)', 'Own invoices (view)'],
};

// Roles that MUST have a photo
const PHOTO_REQUIRED_ROLES = ['super_admin', 'managing_partner', 'advocate'];
// Roles where photo is optional
const PHOTO_OPTIONAL_ROLES = ['paralegal', 'accountant', 'reception', 'client'];

interface UserRecord {
  id: string; email: string; name: string; role: UserRole;
  title: string; avatar: string; billingRate: number; phone: string;
  permissions: string[]; isActive?: boolean; is_active?: number;
}

const emptyForm = {
  name: '', email: '', password: '', role: 'advocate' as UserRole,
  title: '', phone: '', billingRate: 0, avatar: '', photoDataUrl: '',
};

// ─── Avatar Upload Component ──────────────────────────────────────────────────

interface AvatarUploadProps {
  value: string;           // base64 data URL or initials fallback
  onChange: (dataUrl: string) => void;
  roleColor: string;
  name: string;
  required: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ value, onChange, roleColor, name, required }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
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
      // Resize to max 400x400 for storage efficiency
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > max) { h = (h * max) / w; w = max; } }
        else { if (h > max) { w = (w * max) / h; h = max; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) processFile(file);
          break;
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
    <div className="col-span-2 flex flex-col items-center gap-3">
      <div
        ref={dropRef}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="relative group cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        style={{ width: 110, height: 110 }}
      >
        {/* Avatar display */}
        <div
          className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center transition-all"
          style={{
            background: isPhoto ? 'transparent' : roleColor + '25',
            border: dragging
              ? `2px dashed ${roleColor}`
              : isPhoto
              ? `3px solid ${roleColor}60`
              : `2px dashed ${roleColor}60`,
            boxShadow: isPhoto ? `0 4px 20px ${roleColor}30` : 'none',
          }}
        >
          {isPhoto ? (
            <img src={value} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold" style={{ color: roleColor }}>{initials}</span>
          )}
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          <Camera className="w-6 h-6 text-white" />
          <span className="text-white text-[10px] font-semibold">Change Photo</span>
        </div>

        {/* Remove button */}
        {isPhoto && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all"
            style={{ background: '#ef4444', border: '2px solid var(--card-bg)' }}
          >
            <X className="w-3 h-3 text-white" />
          </button>
        )}

        {/* Required badge */}
        {required && !isPhoto && (
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
            style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}
          >
            PHOTO REQUIRED
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
      />

      {/* Instructions */}
      <div className="text-center space-y-1">
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: roleColor + '15', color: roleColor, border: `1px solid ${roleColor}40` }}
          >
            <Upload className="w-3 h-3" /> Browse
          </button>
          <span className="text-xs text-[var(--text-secondary)]">or drag & drop</span>
          <span className="text-xs text-[var(--text-secondary)]">or</span>
          <span
            className="text-xs font-semibold px-2 py-1 rounded-lg"
            style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            Ctrl+V to paste
          </span>
        </div>
        <p className="text-[10px] text-[var(--text-secondary)]">
          {required ? '⚠ Photo required for this role · ' : 'Optional · '}
          JPG/PNG/WEBP · Max 5MB
        </p>
        {error && <p className="text-[10px] font-semibold" style={{ color: '#ef4444' }}>{error}</p>}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const UsersModule: React.FC = () => {
  const { user: currentUser, allUsers: ctxUsers, auditLogs, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedRole, setSelectedRole] = useState<string>('super_admin');

  const canManage = hasPermission('users.create') || currentUser?.role === 'super_admin' || currentUser?.role === 'managing_partner';

  const isPhotoRequired = PHOTO_REQUIRED_ROLES.includes(form.role);
  const photoMissing = isPhotoRequired && !form.photoDataUrl;

  const loadUsers = () => {
    usersApi.list()
      .then((rows) => setUsers(rows as UserRecord[]))
      .catch(() => setUsers(ctxUsers as UserRecord[]));
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingUser(null);
    setShowForm(true);
  };

  const openEdit = (u: UserRecord) => {
    setForm({
      name: u.name, email: u.email, password: '', role: u.role,
      title: u.title || '', phone: u.phone || '', billingRate: u.billingRate || 0,
      avatar: u.avatar || '',
      // If avatar is a data URL (photo), use it; otherwise empty
      photoDataUrl: u.avatar?.startsWith('data:image') ? u.avatar : '',
    });
    setEditingUser(u);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    // Warn if photo required but missing (don't block, just warn)
    if (isPhotoRequired && !form.photoDataUrl) {
      if (!confirm(`A photo is required for ${roleLabels[form.role]} accounts. Save anyway without a photo?`)) return;
    }
    setSaving(true);
    try {
      const avatarValue = form.photoDataUrl || form.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          name: form.name, role: form.role, title: form.title,
          billingRate: form.billingRate, phone: form.phone, isActive: true,
          avatar: avatarValue,
        });
      } else {
        if (!form.password) { alert('Password is required for new users'); setSaving(false); return; }
        await usersApi.create({
          email: form.email, name: form.name, role: form.role, title: form.title,
          avatar: avatarValue,
          billingRate: form.billingRate, phone: form.phone, password: form.password,
        });
      }
      loadUsers();
      setShowForm(false);
    } catch (e: any) {
      alert(e.message || 'Error saving user');
    }
    setSaving(false);
  };

  const handleSuspend = async (u: UserRecord) => {
    const isActive = u.isActive !== false && u.is_active !== 0;
    const action = isActive ? 'suspend' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user "${u.name}"?`)) return;
    try {
      await usersApi.update(u.id, {
        name: u.name, role: u.role, title: u.title,
        billingRate: u.billingRate, phone: u.phone, isActive: !isActive,
      });
      loadUsers();
    } catch (e: any) {
      alert(e.message || 'Error updating user');
    }
  };

  // ── Avatar renderer for cards ─────────────────────────────────────────────
  const renderCardAvatar = (u: UserRecord, size = 56) => {
    const isPhoto = u.avatar?.startsWith('data:image');
    const initials = u.name?.slice(0, 2).toUpperCase() || '??';
    return (
      <div
        className="rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 font-bold text-white"
        style={{
          width: size, height: size,
          background: isPhoto ? 'transparent' : roleColors[u.role] || '#6b7280',
          fontSize: size * 0.3,
        }}
      >
        {isPhoto
          ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
          : initials
        }
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">User Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">{users.length} users · {users.filter(u => u.isActive !== false && u.is_active !== 0).length} active</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-color)]">
        {(['users', 'roles', 'audit'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            {tab === 'audit' ? 'Audit Log' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none">
              <option value="all">All Roles</option>
              {Object.entries(roleLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>

          {/* User Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(u => {
              const isActive = u.isActive !== false && u.is_active !== 0;
              const isSelf = u.id === currentUser?.id;
              const hasPhoto = u.avatar?.startsWith('data:image');
              const needsPhoto = PHOTO_REQUIRED_ROLES.includes(u.role) && !hasPhoto;
              return (
                <div key={u.id} className={`bg-[var(--card-bg)] border rounded-xl p-5 transition-all hover:shadow-md ${!isActive ? 'opacity-60 border-red-500/30' : needsPhoto ? 'border-amber-500/40' : 'border-[var(--border-color)]'}`}>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {renderCardAvatar(u)}
                      {!isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <Ban className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      {needsPhoto && isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center" title="Photo required">
                          <Camera className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                          {u.name} {isSelf && <span className="text-xs text-blue-400">(you)</span>}
                        </h3>
                        {canManage && !isSelf && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEdit(u)} title="Edit"
                              className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-all">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleSuspend(u)} title={isActive ? 'Suspend' : 'Activate'}
                              className={`p-1.5 rounded-lg transition-all ${isActive ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-green-500/10 text-green-400'}`}>
                              {isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">{u.title}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <Phone className="w-3 h-3" /> {u.phone}
                          </div>
                        )}
                        {u.billingRate > 0 && (
                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <Clock className="w-3 h-3" /> KES {u.billingRate.toLocaleString()}/hr
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${roleColors[u.role]}20`, color: roleColors[u.role] }}>
                          {roleLabels[u.role]}
                        </span>
                        {!isActive && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-red-500/10 text-red-400">Suspended</span>}
                        {needsPhoto && isActive && (
                          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 flex items-center gap-1">
                            <Camera className="w-2.5 h-2.5" /> No Photo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {/* ── ROLES TAB ── */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide px-1">Roles</h3>
            {Object.entries(roleLabels).map(([role, label]) => (
              <button key={role} onClick={() => setSelectedRole(role)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${selectedRole === role ? 'bg-blue-600 text-white' : 'bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-blue-500/50'}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: selectedRole === role ? 'rgba(255,255,255,0.2)' : `${roleColors[role]}20` }}>
                  <Shield className="w-4 h-4" style={{ color: selectedRole === role ? 'white' : roleColors[role] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs opacity-70">{users.filter(u => u.role === role).length} users</p>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${roleColors[selectedRole]}20` }}>
                  <Shield className="w-6 h-6" style={{ color: roleColors[selectedRole] }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{roleLabels[selectedRole]}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{users.filter(u => u.role === selectedRole).length} users assigned</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Permissions</h4>
                <div className="space-y-2">
                  {rolePermissions[selectedRole]?.map((perm, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: roleColors[selectedRole] }} />
                      {perm}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Users with this role</h4>
                <div className="space-y-2">
                  {users.filter(u => u.role === selectedRole).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--hover-bg)]">
                      {renderCardAvatar(u, 32)}
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{u.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.role === selectedRole).length === 0 && (
                    <p className="text-sm text-[var(--text-secondary)] italic">No users assigned to this role</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT TAB ── */}
      {activeTab === 'audit' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--hover-bg)]">
                  {['Timestamp','User','Action','Module','Details','IP'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice().reverse().slice(0, 100).map(log => (
                  <tr key={log.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)]">
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{log.userName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        log.action === 'LOGIN'  ? 'bg-green-500/10 text-green-400' :
                        log.action === 'LOGOUT' ? 'bg-gray-500/10 text-gray-400' :
                        log.action === 'CREATE' ? 'bg-blue-500/10 text-blue-400' :
                        log.action === 'UPDATE' ? 'bg-yellow-500/10 text-yellow-400' :
                        log.action === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                        'bg-purple-500/10 text-purple-400'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{log.module}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] max-w-[220px] truncate">{log.details}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{log.ip}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">No audit logs yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                {isPhotoRequired && (
                  <p className="text-xs mt-0.5" style={{ color: photoMissing ? '#f59e0b' : '#10b981' }}>
                    {photoMissing ? '⚠ Photo required for this role' : '✓ Photo uploaded'}
                  </p>
                )}
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">

                {/* ── Photo Upload (always first) ── */}
                <AvatarUpload
                  value={form.photoDataUrl || form.avatar}
                  onChange={dataUrl => setForm({ ...form, photoDataUrl: dataUrl, avatar: dataUrl })}
                  roleColor={roleColors[form.role] || '#6b7280'}
                  name={form.name}
                  required={isPhotoRequired}
                />

                {/* Role selector (affects photo requirement) */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Role *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(roleLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Title</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Advocate"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Kamau"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {!editingUser && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com"
                      className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                {!editingUser && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Password *</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters"
                        className="w-full px-3 py-2 pr-10 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254 700 000 000"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Billing Rate (KES/hr)</label>
                  <input type="number" value={form.billingRate} onChange={e => setForm({ ...form, billingRate: Number(e.target.value) })} placeholder="0"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Role permissions preview */}
                <div className="col-span-2 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Role Permissions Preview</p>
                  <div className="flex flex-wrap gap-1">
                    {rolePermissions[form.role]?.map((p, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{p}</span>
                    ))}
                  </div>
                  {PHOTO_REQUIRED_ROLES.includes(form.role) && (
                    <p className="text-[10px] mt-2 font-semibold" style={{ color: '#f59e0b' }}>
                      📸 Photo is mandatory for {roleLabels[form.role]} accounts
                    </p>
                  )}
                  {PHOTO_OPTIONAL_ROLES.includes(form.role) && (
                    <p className="text-[10px] mt-2" style={{ color: 'var(--text-secondary)' }}>
                      📸 Photo is optional for this role
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[var(--border-color)]">
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-all">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.email}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
                {isPhotoRequired && photoMissing && !saving && (
                  <span className="text-xs opacity-75">(no photo)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
