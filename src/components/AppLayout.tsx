import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { LoginPage } from './LoginPage';
import { LandingPage } from './LandingPage';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
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
import MessagingModule from './MessagingModule';
import NotificationBell from './NotificationBell';
import DeadlineIntelligence from './DeadlineIntelligence';
import DocumentVault from './DocumentVault';
import ConflictChecker from './ConflictChecker';
import ClientOnboarding from './ClientOnboarding';
import CourtFeeEstimator from './CourtFeeEstimator';
import AdvocateAssignment from './AdvocateAssignment';
import AuditTrail from './AuditTrail';
import '@/styles/theme.css';

const AppLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mercyOpen, setMercyOpen] = useState(false);
  // Issue 15: Onboarding for first-time users
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'client') {
      const seen = localStorage.getItem(`nlf_onboarded_${user.id}`);
      if (!seen) setShowOnboarding(true);
    }
  }, [isAuthenticated, user]);

  const handleOnboardingDone = () => {
    if (user) localStorage.setItem(`nlf_onboarded_${user.id}`, '1');
    setShowOnboarding(false);
  };

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
      case 'messages': return <MessagingModule />;
      case 'tasks': return <TasksModule />;
      case 'calendar': return <CalendarModule />;
      case 'documents': return <DocumentsModule />;
      case 'time': return <TimeTrackingModule />;
      case 'billing': return <BillingModule />;
      case 'reports': return <ReportsModule />;
      case 'users': return <UsersModule />;
      case 'settings': return <SettingsModule />;
      case 'deadlines': return <DeadlineIntelligence />;
      case 'vault': return <DocumentVault />;
      case 'conflict': return <ConflictChecker />;
      case 'onboarding': return <ClientOnboarding onNavigate={setActiveModule} />;
      case 'fees': return <CourtFeeEstimator />;
      case 'assignments': return <AdvocateAssignment />;
      case 'audit': return <AuditTrail />;
      default: return <Dashboard setActiveModule={setActiveModule} />;
    }
  };

  return (
    <DataProvider>
      <div className="min-h-screen bg-[var(--page-bg)]">
        {/* Issue 15: First-time client onboarding modal */}
        {showOnboarding && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
                <span className="text-2xl">⚖️</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Welcome to Nanyuki Law Firm</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">
                Your client portal is ready. Here's a quick guide to get started:
              </p>
              <div className="space-y-3 mb-6">
                {[
                  { icon: '📋', title: 'Submit a Case', desc: 'Click "Submit a Case" to start your legal matter with our team.' },
                  { icon: '⚖️', title: 'Track Progress', desc: 'View real-time status updates on all your matters in "My Cases".' },
                  { icon: '💬', title: 'Message Your Advocate', desc: 'Send documents and communicate directly via "Messages".' },
                  { icon: '💳', title: 'View Invoices', desc: 'Pay outstanding invoices via M-Pesa or bank transfer in "Payments".' },
                ].map(step => (
                  <div key={step.title} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--hover-bg)]">
                    <span className="text-xl flex-shrink-0">{step.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleOnboardingDone}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-sm hover:opacity-90 transition-all">
                Get Started →
              </button>
            </div>
          </div>
        )}

        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pb-16 lg:pb-0`}>
          <Header
            onMenuClick={() => setMobileMenuOpen(true)}
            onMercyOpen={() => setMercyOpen(true)}
            setActiveModule={setActiveModule}
          />
          <main className="p-4 lg:p-6 animate-fade-in">
            {renderModule()}
          </main>
        </div>
        {/* Issue 9: Mobile bottom tab bar */}
        <MobileBottomNav activeModule={activeModule} setActiveModule={setActiveModule} />
        <MercyChat isOpen={mercyOpen} onClose={() => setMercyOpen(false)} />
      </div>
    </DataProvider>
  );
};

export default AppLayout;
