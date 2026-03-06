import { UserRole } from '@/contexts/AuthContext';

// ─── Permission Definitions ────────────────────────────────────────────────────
export const PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*'],

  managing_partner: [
    'dashboard.view', 'clients.view', 'clients.create', 'clients.edit',
    'matters.view', 'matters.create', 'matters.edit', 'matters.assign',
    'billing.view', 'billing.create', 'billing.edit', 'billing.revenue',
    'reports.view', 'reports.financial', 'users.view', 'users.create',
    'users.edit', 'tasks.view', 'tasks.create', 'tasks.edit',
    'calendar.view', 'calendar.create', 'documents.view', 'documents.upload',
    'time.view', 'settings.view', 'messages.view', 'messages.send',
    'messages.client_grant', 'efiling.view', 'workload.view', 'notifications.view',
    'audit.view', 'conflict.check',
  ],

  advocate: [
    'dashboard.view', 'clients.view',
    'matters.view', 'matters.create', 'matters.edit',
    'billing.view', 'billing.own',           // own billing only — NO revenue
    'tasks.view', 'tasks.create', 'tasks.edit',
    'calendar.view', 'calendar.create',
    'documents.view', 'documents.upload',
    'time.view', 'time.create',
    'messages.view', 'messages.send',
    'efiling.view', 'notifications.view', 'conflict.check',
  ],

  paralegal: [
    'dashboard.view', 'clients.view',
    'matters.view', 'tasks.view', 'tasks.create', 'tasks.edit',
    'calendar.view', 'documents.view', 'documents.upload',
    'time.view', 'time.create',
    'messages.view', 'messages.send', 'notifications.view',
  ],

  accountant: [
    'dashboard.view', 'billing.view', 'billing.create', 'billing.edit',
    'billing.revenue', 'reports.view', 'reports.financial',
    'time.view', 'notifications.view',
  ],

  reception: [
    'dashboard.view', 'clients.view', 'clients.create',
    'matters.view', 'calendar.view', 'calendar.create',
    'messages.view', 'messages.send', 'notifications.view',
  ],

  client: [
    'dashboard.view', 'matters.view.own', 'billing.view.own',
    'documents.view.own', 'messages.view.own', 'messages.send.own',
    'calendar.view.own', 'notifications.view',
  ],
};

// ─── Role helpers ──────────────────────────────────────────────────────────────
export const canSeeRevenue = (role: UserRole) =>
  ['super_admin', 'managing_partner', 'accountant'].includes(role);

export const canSeeAllBilling = (role: UserRole) =>
  ['super_admin', 'managing_partner', 'accountant'].includes(role);

export const canSeeAllMatters = (role: UserRole) =>
  ['super_admin', 'managing_partner'].includes(role);

export const canManageUsers = (role: UserRole) =>
  ['super_admin', 'managing_partner'].includes(role);

export const canGrantClientMessaging = (role: UserRole) =>
  ['super_admin', 'managing_partner'].includes(role);

export const canMessageClient = (role: UserRole) =>
  ['super_admin', 'managing_partner', 'advocate'].includes(role);

export const isStaff = (role: UserRole) =>
  ['super_admin', 'managing_partner', 'advocate', 'paralegal', 'accountant', 'reception'].includes(role);

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  managing_partner: 'Managing Partner',
  advocate: 'Advocate',
  paralegal: 'Paralegal',
  accountant: 'Accountant',
  reception: 'Reception',
  client: 'Client',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: '#ef4444',
  managing_partner: '#8b5cf6',
  advocate: '#3b82f6',
  paralegal: '#10b981',
  accountant: '#f59e0b',
  reception: '#ec4899',
  client: '#06b6d4',
};
