import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X, Check, CheckCheck, AlertTriangle, Calendar, MessageCircle, FileText, DollarSign, Clock, Scale } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'hearing' | 'deadline' | 'message' | 'document' | 'payment' | 'case_update' | 'task' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
  urgent: boolean;
  link?: string;
  roles: string[]; // which roles can see this notification
}

const SEED_NOTIFICATIONS: Notification[] = [
  { id:'n1', type:'hearing', title:'Hearing Tomorrow', body:'Mwangi vs KPLC — Milimani Court, 9:00 AM', time:'2h ago', read:false, urgent:true, roles:['super_admin','managing_partner','advocate'] },
  { id:'n2', type:'deadline', title:'Filing Deadline Today', body:'Reply to defence due — Safaricom v. Communications Authority', time:'3h ago', read:false, urgent:true, roles:['super_admin','managing_partner','advocate'] },
  { id:'n3', type:'message', title:'New Message', body:'David Kimani sent a message about his land case', time:'4h ago', read:false, urgent:false, roles:['super_admin','managing_partner','advocate'] },
  { id:'n4', type:'payment', title:'Invoice Overdue', body:'Invoice #NLF-2024-006 — KES 45,000 overdue by 15 days', time:'1d ago', read:false, urgent:true, roles:['super_admin','managing_partner','accountant'] },
  { id:'n5', type:'case_update', title:'Case Status Updated', body:'Your matter NLF/2024/0002 has been moved to In Court', time:'2d ago', read:true, urgent:false, roles:['client'] },
  { id:'n6', type:'document', title:'New Document Uploaded', body:'Advocate uploaded Plaint for your review', time:'2d ago', read:true, urgent:false, roles:['client'] },
  { id:'n7', type:'task', title:'Task Overdue', body:'Prepare witness list for Ouma v. TechCorp is 2 days overdue', time:'3d ago', read:true, urgent:false, roles:['super_admin','managing_partner','advocate'] },
  { id:'n8', type:'hearing', title:'Hearing in 3 Days', body:'Republic vs Kamau — Kiambu Law Court, 10:30 AM', time:'3d ago', read:true, urgent:false, roles:['super_admin','managing_partner','advocate'] },
  { id:'n9', type:'system', title:'New Client Registered', body:'Mary Njeri has submitted a new case — Criminal Defence', time:'4d ago', read:true, urgent:false, roles:['super_admin','managing_partner'] },
  { id:'n10', type:'payment', title:'Payment Received', body:'KES 75,000 received from Safaricom PLC — Invoice #NLF-2024-001', time:'5d ago', read:true, urgent:false, roles:['super_admin','managing_partner','accountant'] },
];

const typeIcon: Record<string, React.ReactNode> = {
  hearing: <Calendar className="w-4 h-4 text-blue-400" />,
  deadline: <AlertTriangle className="w-4 h-4 text-red-400" />,
  message: <MessageCircle className="w-4 h-4 text-green-400" />,
  document: <FileText className="w-4 h-4 text-purple-400" />,
  payment: <DollarSign className="w-4 h-4 text-yellow-400" />,
  case_update: <Scale className="w-4 h-4 text-cyan-400" />,
  task: <Clock className="w-4 h-4 text-orange-400" />,
  system: <Bell className="w-4 h-4 text-gray-400" />,
};

const typeBg: Record<string, string> = {
  hearing: 'rgba(59,130,246,0.12)',
  deadline: 'rgba(239,68,68,0.12)',
  message: 'rgba(16,185,129,0.12)',
  document: 'rgba(139,92,246,0.12)',
  payment: 'rgba(245,158,11,0.12)',
  case_update: 'rgba(6,182,212,0.12)',
  task: 'rgba(249,115,22,0.12)',
  system: 'rgba(107,114,128,0.12)',
};

interface NotificationBellProps {
  onNavigate?: (module: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const filtered = SEED_NOTIFICATIONS.filter(n =>
      n.roles.includes(user.role) || n.roles.includes('*')
    );
    setNotifications(filtered);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;
  const urgent = notifications.filter(n => n.urgent && !n.read).length;

  const displayed = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'urgent') return n.urgent;
    return true;
  });

  const markAll = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markOne = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg transition-colors hover:bg-[var(--hover-bg)]"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {urgent > 0 && unread === 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-400" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 max-h-[520px] rounded-2xl shadow-2xl border border-[var(--border-color)] bg-[var(--card-bg)] z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h3>
              {unread > 0 && <p className="text-[11px] text-[var(--text-secondary)]">{unread} unread</p>}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAll} className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-[var(--hover-bg)]">
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 px-4 py-2 border-b border-[var(--border-color)]">
            {(['all', 'unread', 'urgent'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[11px] px-3 py-1 rounded-full capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              displayed.map(n => (
                <div key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border-color)] transition-colors hover:bg-[var(--hover-bg)] cursor-pointer ${!n.read ? 'bg-blue-500/5' : ''}`}
                  onClick={() => markOne(n.id)}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: typeBg[n.type] }}>
                    {typeIcon[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold truncate ${!n.read ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{n.title}</p>
                      {n.urgent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold flex-shrink-0">URGENT</span>}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] opacity-60 mt-1">{n.time}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                    <button onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                      className="p-0.5 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[var(--border-color)] text-center">
            <button className="text-[11px] text-blue-400 hover:text-blue-300">View all notifications</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
