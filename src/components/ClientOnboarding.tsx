import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle, Circle, ChevronRight, User, Briefcase, FileText,
  CreditCard, Bell, MessageCircle, Scale, Upload, Phone, Mail,
  MapPin, Calendar, Shield, Star, ArrowRight, Check
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: string;
}

const ClientOnboarding: React.FC<{ onNavigate?: (m: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>('step2');

  const steps: OnboardingStep[] = [
    {
      id: 'step1', title: 'Account Created', completed: true,
      description: 'Your account has been successfully created and verified.',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'step2', title: 'Submit Your Case', completed: false,
      description: 'Describe your legal issue, upload documents, and tell us what happened.',
      icon: <Briefcase className="w-4 h-4" />, action: 'submit_case',
    },
    {
      id: 'step3', title: 'Choose Your Advocate', completed: false,
      description: 'Select from our qualified advocates based on their expertise and availability.',
      icon: <Scale className="w-4 h-4" />, action: 'submit_case',
    },
    {
      id: 'step4', title: 'Pay Consultation Fee', completed: false,
      description: 'Pay KES 5,000 via M-Pesa or bank transfer to confirm your case.',
      icon: <CreditCard className="w-4 h-4" />, action: 'payments',
    },
    {
      id: 'step5', title: 'Meet Your Advocate', completed: false,
      description: 'Your advocate will contact you within 24 hours to schedule a consultation.',
      icon: <Phone className="w-4 h-4" />,
    },
    {
      id: 'step6', title: 'Track Your Case', completed: false,
      description: 'Follow your case progress in real-time from your dashboard.',
      icon: <Bell className="w-4 h-4" />, action: 'matters',
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  if (dismissed) return null;

  return (
    <div className="p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Welcome, {user?.name?.split(' ')[0]}! 👋</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Complete these steps to get your case started</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--hover-bg)]">
          Dismiss
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--text-secondary)]">{completedCount} of {steps.length} steps completed</span>
          <span className="text-xs font-bold text-blue-400">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--hover-bg)] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step.id} className={`rounded-xl border transition-all ${step.completed ? 'border-green-500/20 bg-green-500/5' : expandedStep === step.id ? 'border-blue-500/40 bg-blue-500/5' : 'border-[var(--border-color)] bg-[var(--card-bg)]'}`}>
            <button
              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              className="w-full flex items-center gap-3 p-3 text-left"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? 'bg-green-500/20 text-green-400' : expandedStep === step.id ? 'bg-blue-500/20 text-blue-400' : 'bg-[var(--hover-bg)] text-[var(--text-secondary)]'}`}>
                {step.completed ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${step.completed ? 'text-green-400 line-through opacity-70' : 'text-[var(--text-primary)]'}`}>{step.title}</p>
              </div>
              {!step.completed && <ChevronRight className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${expandedStep === step.id ? 'rotate-90' : ''}`} />}
            </button>
            {expandedStep === step.id && !step.completed && (
              <div className="px-4 pb-4">
                <p className="text-xs text-[var(--text-secondary)] mb-3">{step.description}</p>
                {step.action && (
                  <button
                    onClick={() => onNavigate?.(step.action!)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                  >
                    Get Started <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-[var(--hover-bg)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--text-primary)]">Need help getting started?</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Ask Mercy AI or call +254 700 100 000</p>
        </div>
      </div>
    </div>
  );
};

export default ClientOnboarding;
