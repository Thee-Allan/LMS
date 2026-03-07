import React from 'react';
import { LayoutDashboard, Scale, MessageCircle, Receipt, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MobileBottomNavProps {
  activeModule: string;
  setActiveModule: (m: string) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeModule, setActiveModule }) => {
  const { user } = useAuth();
  const isClient = user?.role === 'client';

  const tabs = isClient
    ? [
        { id: 'dashboard', label: 'Home',     icon: LayoutDashboard },
        { id: 'matters',   label: 'Cases',    icon: Scale           },
        { id: 'submit_case',label: 'New Case', icon: Plus            },
        { id: 'messages',  label: 'Messages', icon: MessageCircle   },
        { id: 'billing',   label: 'Payments', icon: Receipt         },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'matters',   label: 'Matters',   icon: Scale           },
        { id: 'tasks',     label: 'Tasks',     icon: Plus            },
        { id: 'messages',  label: 'Messages',  icon: MessageCircle   },
        { id: 'billing',   label: 'Billing',   icon: Receipt         },
      ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--sidebar-bg)] border-t border-[var(--border-color)] flex items-center justify-around px-2 h-16 safe-area-bottom">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeModule === tab.id;
        const isNew = tab.id === 'submit_case' || tab.id === 'tasks';
        return (
          <button
            key={tab.id}
            onClick={() => setActiveModule(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all ${
              isActive ? 'text-blue-400' : 'text-[var(--text-secondary)]'
            }`}
          >
            {isNew ? (
              <div className={`w-11 h-11 rounded-full flex items-center justify-center -mt-5 shadow-lg transition-all ${
                isActive
                  ? 'bg-blue-600 shadow-blue-600/40'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-500'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-black'}`} />
              </div>
            ) : (
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
            )}
            {!isNew && (
              <span className={`text-[10px] font-medium ${isActive ? 'text-blue-400' : ''}`}>
                {tab.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
