import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import {
  Search, Bell, Sun, Moon, Menu, X, ChevronDown, User, Settings, LogOut,
  MessageCircle
} from 'lucide-react';
import { notifications as defaultNotifications, clients, matters, documents, invoices } from '@/data/mockData';

interface HeaderProps {
  onMenuClick: () => void;
  onMercyOpen: () => void;
  setActiveModule: (m: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onMercyOpen, setActiveModule }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState(defaultNotifications);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const results: any[] = [];
    clients.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .slice(0, 3).forEach(c => results.push({ type: 'Client', name: c.name, sub: c.email, module: 'clients' }));
    matters.filter(m => m.title.toLowerCase().includes(q) || m.matterNumber.toLowerCase().includes(q))
      .slice(0, 3).forEach(m => results.push({ type: 'Matter', name: m.matterNumber, sub: m.title, module: 'matters' }));
    documents.filter(d => d.name.toLowerCase().includes(q))
      .slice(0, 3).forEach(d => results.push({ type: 'Document', name: d.name, sub: d.matterNumber || 'General', module: 'documents' }));
    invoices.filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.clientName.toLowerCase().includes(q))
      .slice(0, 3).forEach(i => results.push({ type: 'Invoice', name: i.invoiceNumber, sub: i.clientName, module: 'billing' }));
    setSearchResults(results);
  }, [searchQuery]);

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  const roleColors: Record<string, string> = {
    super_admin: '#ef4444', managing_partner: '#8b5cf6', advocate: '#3b82f6',
    paralegal: '#10b981', accountant: '#f59e0b', reception: '#ec4899', client: '#06b6d4',
  };

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin', managing_partner: 'Managing Partner', advocate: 'Advocate',
    paralegal: 'Paralegal', accountant: 'Accountant', reception: 'Reception', client: 'Client',
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 bg-[var(--header-bg)] border-b border-[var(--border-color)] backdrop-blur-xl">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]">
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div ref={searchRef} className="relative">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300
            ${searchOpen ? 'w-72 md:w-96 border-blue-500 bg-[var(--input-bg)]' : 'w-10 md:w-72 border-[var(--border-color)] bg-[var(--hover-bg)]'}`}>
            <Search className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0 cursor-pointer" onClick={() => setSearchOpen(true)} />
            <input
              type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search clients, matters, documents..."
              className={`bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] ${searchOpen ? 'w-full' : 'hidden md:block w-full'}`}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-72 md:w-96 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden">
              {searchResults.map((r, i) => (
                <button key={i} onClick={() => { setActiveModule(r.module); setSearchOpen(false); setSearchQuery(''); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors text-left border-b border-[var(--border-color)] last:border-0">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">{r.type}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{r.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{r.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Mercy AI */}
        <button onClick={onMercyOpen} title="Ask Mercy AI"
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-blue-400 transition-colors relative">
          <MessageCircle className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[var(--header-bg)]" />
        </button>

        {/* Theme Toggle */}
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-yellow-400 transition-colors" title="Toggle theme">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--header-bg)]">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.slice(0, 6).map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] cursor-pointer transition-colors ${!n.read ? 'bg-blue-500/5' : ''}`}
                    onClick={() => { setNotifOpen(false); }}>
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: roleColors[user?.role || ''] || '#6b7280' }}>
              {user?.avatar}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">{user?.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">{roleLabels[user?.role || '']}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] hidden md:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-color)]">
                <p className="text-sm font-medium text-[var(--text-primary)]">{user?.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{user?.email}</p>
              </div>
              <button onClick={() => { setActiveModule('settings'); setProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
                <User className="w-4 h-4" /> Profile
              </button>
              <button onClick={() => { setActiveModule('settings'); setProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="border-t border-[var(--border-color)]">
                <button onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 transition-colors text-sm">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
