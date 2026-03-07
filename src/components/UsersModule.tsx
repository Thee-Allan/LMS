import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api';
import { Shield, User, Mail, Phone, Clock, Plus, Edit2, Ban, CheckCircle, X, Eye, EyeOff, Search, Upload, FileText, Trash2 } from 'lucide-react';
import { downloadStaffPDF, getDocSlotsForRole } from '@/lib/pdfGenerator';

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

interface UserRecord {
  id: string; email: string; name: string; role: UserRole;
  title: string; avatar: string; billingRate: number; phone: string;
  permissions: string[]; isActive?: boolean; is_active?: number;
}

const emptyForm = {
  name: '', email: '', password: '', role: 'advocate' as UserRole,
  title: '', phone: '', billingRate: 0, avatar: '',
};

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
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null);
  const [userDocs, setUserDocs] = useState<Record<string, { slot: string; fileName: string; dataUrl: string }[]>>({});
  const docFileInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingDocSlot, setPendingDocSlot] = useState<{ userId: string; slot: string } | null>(null);

  const canManage = hasPermission('users.create') || currentUser?.role === 'super_admin' || currentUser?.role === 'managing_partner';

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
    setForm({ name: u.name, email: u.email, password: '', role: u.role, title: u.title || '', phone: u.phone || '', billingRate: u.billingRate || 0, avatar: u.avatar || '' });
    setEditingUser(u);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          name: form.name, role: form.role, title: form.title,
          billingRate: form.billingRate, phone: form.phone, isActive: true,
        });
      } else {
        if (!form.password) { alert('Password is required for new users'); setSaving(false); return; }
        await usersApi.create({
          email: form.email, name: form.name, role: form.role, title: form.title,
          avatar: form.avatar || form.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
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

  const handleUploadDoc = (userId: string, slot: string, file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string || '';
      setUserDocs(prev => {
        const existing = prev[userId] || [];
        const filtered = existing.filter(d => d.slot !== slot);
        return { ...prev, [userId]: [...filtered, { slot, fileName: file.name, dataUrl }] };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (userId: string, slot: string) => {
    setUserDocs(prev => ({ ...prev, [userId]: (prev[userId] || []).filter(d => d.slot !== slot) }));
  };

  const handleDownloadDoc = (doc: { slot: string; fileName: string; dataUrl: string }) => {
    const a = document.createElement('a'); a.href = doc.dataUrl; a.download = doc.fileName; a.click();
  };

  const handleDownloadStaffPDF = async (u: UserRecord) => {
    await downloadStaffPDF({ name: u.name, role: u.role, title: u.title || '', email: u.email, phone: u.phone || '', billingRate: u.billingRate || 0, permissions: u.permissions || [] });
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
          {/* Filters */}
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
              return (
                <div key={u.id} className={`bg-[var(--card-bg)] border rounded-xl p-5 transition-all hover:shadow-md ${!isActive ? 'opacity-60 border-red-500/30' : 'border-[var(--border-color)]'}`}>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                        style={{ backgroundColor: roleColors[u.role] || '#6b7280' }}>
                        {u.avatar || u.name?.slice(0, 2).toUpperCase()}
                      </div>
                      {!isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <Ban className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">{u.name} {isSelf && <span className="text-xs text-blue-400">(you)</span>}</h3>
                        {canManage && !isSelf && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setViewingUser(u)} title="Documents & Profile"
                              className="p-1.5 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-all">
                              <FileText className="w-3.5 h-3.5" />
                            </button>
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
          {/* Role List */}
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

          {/* Role Details */}
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
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: roleColors[u.role] }}>
                        {u.avatar || u.name?.slice(0,2).toUpperCase()}
                      </div>
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
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Kamau"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {!editingUser && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com"
                      className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                {!editingUser && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Password *</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 characters"
                        className="w-full px-3 py-2 pr-10 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Role *</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(roleLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Title</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Senior Advocate"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+254 700 000 000"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase">Billing Rate (KES/hr)</label>
                  <input type="number" value={form.billingRate} onChange={e => setForm({...form, billingRate: Number(e.target.value)})} placeholder="0"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Role preview */}
                <div className="col-span-2 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)]">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Role Permissions Preview</p>
                  <div className="flex flex-wrap gap-1">
                    {rolePermissions[form.role]?.map((p, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[var(--border-color)]">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.email}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
                {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Documents & Profile Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingUser(null)}>
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{viewingUser.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{viewingUser.role.replace(/_/g,' ')} · {viewingUser.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadStaffPDF(viewingUser)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium">
                  <FileText className="w-3.5 h-3.5" /> Staff Profile PDF
                </button>
                <button onClick={() => setViewingUser(null)} className="text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3">Required Documents by Role</p>
              <div className="space-y-2">
                {getDocSlotsForRole(viewingUser.role).map(slot => {
                  const uploaded = (userDocs[viewingUser.id] || []).find(d => d.slot === slot);
                  return (
                    <div key={slot} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--hover-bg)]">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className={`w-4 h-4 flex-shrink-0 ${uploaded ? 'text-green-400' : 'text-[var(--text-secondary)]'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)]">{slot}</p>
                          {uploaded && <p className="text-[10px] text-green-400 truncate">{uploaded.fileName}</p>}
                          {!uploaded && <p className="text-[10px] text-amber-400">Not uploaded</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {uploaded && (
                          <>
                            <button onClick={() => handleDownloadDoc(uploaded)}
                              className="p-1 rounded hover:bg-[var(--card-bg)] text-green-400" title="Download">
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleRemoveDoc(viewingUser.id, slot)}
                              className="p-1 rounded hover:bg-red-500/10 text-red-400" title="Remove">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setPendingDocSlot({ userId: viewingUser.id, slot }); docFileInputRef.current?.click(); }}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-medium">
                          <Upload className="w-3 h-3" /> {uploaded ? 'Replace' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <input ref={docFileInputRef} type="file" className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f && pendingDocSlot) handleUploadDoc(pendingDocSlot.userId, pendingDocSlot.slot, f);
                  e.target.value = '';
                }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
