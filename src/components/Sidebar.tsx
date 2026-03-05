import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, Calendar, FileText,
  Clock, Receipt, BarChart3, Settings, Shield, Scale, ChevronLeft,
  ChevronRight, LogOut, X
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, hasPermission, hasAnyPermission, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view' },
    { id: 'clients', label: 'Clients', icon: Users, perm: 'clients.view' },
    { id: 'matters', label: 'Matters/Cases', icon: Briefcase, perm: 'matters.view' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, perm: 'tasks.view' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, perm: 'calendar.view' },
    { id: 'documents', label: 'Documents', icon: FileText, perm: 'documents.view' },
    { id: 'time', label: 'Time Tracking', icon: Clock, perm: 'time.view' },
    { id: 'billing', label: 'Billing', icon: Receipt, perm: 'billing.view' },
    { id: 'reports', label: 'Reports', icon: BarChart3, perm: 'reports.view' },
    { id: 'users', label: 'Users', icon: Shield, perm: 'users.view' },
    { id: 'settings', label: 'Settings', icon: Settings, perm: 'settings.view' },
  ].filter(item => hasPermission(item.perm));

  const handleNav = (id: string) => {
    setActiveModule(id);
    setMobileOpen(false);
  };

  const roleColors: Record<string, string> = {
    super_admin: '#ef4444',
    managing_partner: '#8b5cf6',
    advocate: '#3b82f6',
    paralegal: '#10b981',
    accountant: '#f59e0b',
    reception: '#ec4899',
    client: '#06b6d4',
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 flex flex-col
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-20' : 'w-64'}
        bg-[var(--sidebar-bg)] border-r border-[var(--border-color)]`}
      >
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-[var(--border-color)]`}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)' }}>
                <Scale className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">NANYUKI</h1>
                <p className="text-[10px] text-[var(--text-secondary)] tracking-wider">LAW FIRM</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)' }}>
              <Scale className="w-5 h-5 text-gray-900" />
            </div>
          )}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                  } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={`p-4 border-t border-[var(--border-color)] ${collapsed ? 'px-2' : ''}`}>
          {!collapsed && user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: roleColors[user.role] || '#6b7280' }}>
                {user.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{user.title}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={logout}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm ${collapsed ? 'w-full justify-center' : 'flex-1'}`}
              title="Logout">
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Logout</span>}
            </button>
            <button onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-all">
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
