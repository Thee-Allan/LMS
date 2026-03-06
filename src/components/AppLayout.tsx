import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { LandingPage } from './LandingPage';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import ClientsModule from './ClientsModule';
import MattersModule from './MattersModule';
import TasksModule from './TasksModule';
import CalendarModule from './CalendarModule';
import DocumentsModule from './DocumentsModule';
import BillingModule from './BillingModule';
import TimeTrackingModule from './TimeTrackingModule';
import ReportsModule from './ReportsModule';
import UsersModule from './UsersModule';
import SettingsModule from './SettingsModule';
import MercyChat from './MercyChat';
import EFilingAssistant from './EFilingAssistant';
import ClientCaseSubmission from './ClientCaseSubmission';
import WorkloadDashboard from './WorkloadDashboard';
import PaymentsModule from './PaymentsModule';
import '@/styles/theme.css';

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mercyOpen, setMercyOpen] = useState(false);

  if (!isAuthenticated) {
    if (showLogin) return <LoginPage onBack={() => setShowLogin(false)} />;
    return <LandingPage onEnterApp={() => setShowLogin(true)} />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard setActiveModule={setActiveModule} />;
      case 'clients': return <ClientsModule />;
      case 'matters': return <MattersModule />;
      case 'efiling': return <EFilingAssistant />;
      case 'submit_case': return <ClientCaseSubmission />;
      case 'workload': return <WorkloadDashboard />;
      case 'payments': return <PaymentsModule />;
      case 'tasks': return <TasksModule />;
      case 'calendar': return <CalendarModule />;
      case 'documents': return <DocumentsModule />;
      case 'time': return <TimeTrackingModule />;
      case 'billing': return <BillingModule />;
      case 'reports': return <ReportsModule />;
      case 'users': return <UsersModule />;
      case 'settings': return <SettingsModule />;
      default: return <Dashboard setActiveModule={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          onMercyOpen={() => setMercyOpen(true)}
          setActiveModule={setActiveModule}
        />
        <main className="p-4 lg:p-6 animate-fade-in">
          {renderModule()}
        </main>
      </div>
      <MercyChat isOpen={mercyOpen} onClose={() => setMercyOpen(false)} />
    </div>
  );
};

export default AppLayout;
